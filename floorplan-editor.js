/* ============================================================
   Sunspot — Floor Plan Designer.

   Operator builds the whole venue layout from scratch:
     - AREAS — pool, deck, sand, bar, entrance (the static structure)
              Drag to move, corner-drag to resize, tap to select.
     - SPOTS — sunbed, cabana, VIP (the bookable units)
              Tap canvas to drop one of the active type.

   Coordinates are 0–1 fractions of the canvas so the same layout
   renders identically at every container size. Customer's booking
   view uses the same component in 'book' mode → operator places,
   customer sees the same blueprint.

   Storage: localStorage.sunspot_layouts_v3[venueId] = {areas, spots}
   Back-compat: if old (v2) data exists it's migrated on first read.

   API:
     window.SunspotPlan.create({
       container, venue,
       mode: 'edit' | 'book' | 'view',
       taken, selected, onChange, onSelect,
     })
   ============================================================ */
(function (global) {
 'use strict';

 const KEY_V3 = 'sunspot_layouts_v3';
 const KEY_V2 = 'sunspot_layouts_v2';   // legacy spots-only
 const BG_KEY = 'sunspot_bg_images';

 // Area styles
 const AREA = {
   pool:     { label: 'Pool',     fill: 'rgba(2,136,209,.30)',  stroke: '#0288d1', radius: 16 },
   deck:     { label: 'Deck',     fill: 'rgba(245,232,200,.85)', stroke: '#c9a875', radius: 6  },
   sand:     { label: 'Sand',     fill: 'rgba(255,224,178,.85)', stroke: '#cda36a', radius: 12 },
   bar:      { label: 'Bar',      fill: 'rgba(46,125,50,.20)',   stroke: '#2e7d32', radius: 6  },
   entrance: { label: 'Entrance', fill: 'rgba(120,144,156,.20)', stroke: '#546e7a', radius: 6  },
 };

 const SPOT = {
   sunbed: { color: '#ff9800', label: 'Sunbed', wPct: 7, ratio: '2 / 1' },
   cabana: { color: '#0288d1', label: 'Cabana', wPct: 9, ratio: '1 / 1' },
   vip:    { color: '#7b1fa2', label: 'VIP',    wPct: 10, ratio: '1 / 1' },
 };

 // ─── Storage ─────────────────────────────────────────────────
 function loadV3() {
   try { return JSON.parse(localStorage.getItem(KEY_V3) || '{}'); } catch (e) { return {}; }
 }
 function saveV3(all) {
   try { localStorage.setItem(KEY_V3, JSON.stringify(all)); } catch (e) {}
 }
 function loadLayout(vid) {
   const all = loadV3();
   if (all[vid]) return all[vid];
   // Migrate from v2 if present
   try {
     const v2 = JSON.parse(localStorage.getItem(KEY_V2) || '{}');
     if (Array.isArray(v2[vid]) && v2[vid].length) {
       const migrated = { areas: [], spots: v2[vid] };
       all[vid] = migrated; saveV3(all);
       return migrated;
     }
   } catch (e) {}
   return null;
 }
 function saveLayout(vid, layout) {
   const all = loadV3();
   all[vid] = layout;
   saveV3(all);
 }
 function loadBg(vid) {
   try { return JSON.parse(localStorage.getItem(BG_KEY) || '{}')[vid] || ''; } catch (e) { return ''; }
 }
 function saveBg(vid, dataUrl) {
   try {
     const m = JSON.parse(localStorage.getItem(BG_KEY) || '{}');
     if (dataUrl) m[vid] = dataUrl; else delete m[vid];
     localStorage.setItem(BG_KEY, JSON.stringify(m));
   } catch (e) {}
 }

 // ─── Seed: minimal starting layout per category ─────────────
 function seedLayout(venue) {
   const cat = (venue && venue.category) || 'beach-club';
   const areas = [];
   if (cat === 'pool-club' || cat === 'rooftop' || cat === 'lido') {
     areas.push({ id: 'pool-1', kind: 'pool', x: 0.18, y: 0.30, w: 0.64, h: 0.40 });
     areas.push({ id: 'bar-1',  kind: 'bar',  x: 0.05, y: 0.05, w: 0.30, h: 0.10 });
   } else if (cat === 'sandy-beach' || cat === 'beach-club') {
     areas.push({ id: 'sand-1', kind: 'sand', x: 0.05, y: 0.40, w: 0.90, h: 0.50 });
     areas.push({ id: 'bar-1',  kind: 'bar',  x: 0.05, y: 0.05, w: 0.30, h: 0.10 });
   } else if (cat === 'floating') {
     areas.push({ id: 'deck-1', kind: 'deck', x: 0.06, y: 0.10, w: 0.88, h: 0.80 });
   } else {
     areas.push({ id: 'deck-1', kind: 'deck', x: 0.12, y: 0.20, w: 0.76, h: 0.60 });
   }
   return { areas, spots: [] };
 }

 // ─── SVG glyph per spot type ────────────────────────────────
 function spotSvg(type, taken, selected) {
   const color = taken ? '#9e9e9e' : selected ? '#2e7d32' : (SPOT[type] || SPOT.sunbed).color;
   if (type === 'cabana') {
     return '<svg viewBox="0 0 32 32" width="100%" height="100%">' +
       '<rect x="3" y="10" width="26" height="14" rx="2" fill="' + color + '" stroke="#fff" stroke-width="2"/>' +
       '<polygon points="2,12 16,2 30,12" fill="' + color + '" stroke="#fff" stroke-width="2"/>' +
     '</svg>';
   }
   if (type === 'vip') {
     return '<svg viewBox="0 0 32 32" width="100%" height="100%">' +
       '<circle cx="16" cy="16" r="12" fill="' + color + '" stroke="#fff" stroke-width="2"/>' +
       '<polygon points="16,7 18.5,13.5 25,14 20,18 21.5,25 16,21 10.5,25 12,18 7,14 13.5,13.5" fill="#fff"/>' +
     '</svg>';
   }
   return '<svg viewBox="0 0 32 16" width="100%" height="100%">' +
     '<rect x="2" y="3" width="28" height="9" rx="3" fill="' + color + '" stroke="#fff" stroke-width="2"/>' +
     '<line x1="11" y1="3" x2="11" y2="12" stroke="#fff" stroke-width="1.5"/>' +
   '</svg>';
 }

 // ─── Component ───────────────────────────────────────────────
 function create(opts) {
   const container = typeof opts.container === 'string'
     ? document.getElementById(opts.container) : opts.container;
   if (!container) throw new Error('floorplan: container not found');
   const venue = opts.venue; if (!venue) throw new Error('floorplan: venue required');
   const mode = opts.mode || 'view';
   const taken = new Set(opts.taken || []);
   const selected = opts.selected || new Set();

   container.innerHTML = '';
   container.classList.add('sp-host');
   container.style.position = container.style.position || 'relative';

   // Canvas
   const wrap = document.createElement('div');
   wrap.className = 'sp-canvas-wrap';
   wrap.style.cssText =
     'position:relative;width:100%;aspect-ratio:16/10;border-radius:14px;overflow:hidden;' +
     'background:#e9eef5;box-shadow:inset 0 0 0 1px rgba(10,31,58,.10);';
   container.appendChild(wrap);

   const bgImg = document.createElement('div');
   bgImg.className = 'sp-bg-image';
   bgImg.style.cssText = 'position:absolute;inset:0;background-size:cover;background-position:center;';
   wrap.appendChild(bgImg);

   const grid = document.createElement('div');
   grid.className = 'sp-grid';
   grid.style.cssText =
     'position:absolute;inset:0;pointer-events:none;opacity:.22;' +
     'background-image:' +
       'linear-gradient(rgba(10,31,58,.18) 1px, transparent 1px),' +
       'linear-gradient(90deg, rgba(10,31,58,.18) 1px, transparent 1px);' +
     'background-size:5% 5%;';
   wrap.appendChild(grid);

   const areasLayer = document.createElement('div');
   areasLayer.style.cssText = 'position:absolute;inset:0;';
   wrap.appendChild(areasLayer);

   const spotsLayer = document.createElement('div');
   spotsLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
   wrap.appendChild(spotsLayer);

   const savedBg = loadBg(venue.id);
   if (savedBg) {
     bgImg.style.backgroundImage = 'url(' + savedBg + ')';
     grid.style.opacity = '0';
   }

   // Load / seed
   let layout = loadLayout(venue.id);
   if (!layout) { layout = seedLayout(venue); if (mode === 'edit') saveLayout(venue.id, layout); }
   layout.areas = layout.areas || [];
   layout.spots = layout.spots || [];

   // Tool state (edit mode only)
   let activeTool = 'sunbed';   // 'sunbed'|'cabana'|'vip'|'select'
   let selectedAreaId = null;

   // ─── Render ───
   function drawAreas() {
     areasLayer.innerHTML = '';
     layout.areas.forEach(a => {
       const cfg = AREA[a.kind] || AREA.deck;
       const el = document.createElement('div');
       el.className = 'sp-area sp-area-' + a.kind;
       el.dataset.id = a.id;
       el.style.cssText =
         'position:absolute;' +
         'left:'   + (a.x * 100).toFixed(2) + '%;' +
         'top:'    + (a.y * 100).toFixed(2) + '%;' +
         'width:'  + (a.w * 100).toFixed(2) + '%;' +
         'height:' + (a.h * 100).toFixed(2) + '%;' +
         'background:' + cfg.fill + ';' +
         'border:2px solid ' + cfg.stroke + ';' +
         'border-radius:' + cfg.radius + 'px;' +
         'box-sizing:border-box;' +
         'cursor:' + (mode === 'edit' ? 'move' : 'default') + ';' +
         (a.id === selectedAreaId ? 'box-shadow:0 0 0 3px rgba(255,152,0,.55);z-index:5;' : '');

       // Label on hover/select
       const label = document.createElement('div');
       label.style.cssText =
         'position:absolute;top:4px;left:6px;padding:1px 8px;border-radius:999px;' +
         'background:' + cfg.stroke + ';color:#fff;font-size:10px;font-weight:700;' +
         'letter-spacing:.5px;text-transform:uppercase;pointer-events:none;';
       label.textContent = cfg.label;
       el.appendChild(label);

       if (mode === 'edit') {
         attachAreaInteractions(el, a);
         if (a.id === selectedAreaId) addResizeHandles(el, a);
       }
       areasLayer.appendChild(el);
     });
   }

   function drawSpots() {
     spotsLayer.innerHTML = '';
     layout.spots.forEach(s => {
       const isT = taken.has(s.id);
       const isS = selected.has(s.id);
       const cfg = SPOT[s.type] || SPOT.sunbed;
       const el = document.createElement('button');
       el.type = 'button';
       el.className = 'sp-spot sp-spot-' + s.type;
       el.dataset.id = s.id;
       el.style.cssText =
         'position:absolute;' +
         'left:' + (s.x * 100).toFixed(2) + '%;' +
         'top:'  + (s.y * 100).toFixed(2) + '%;' +
         'width:' + cfg.wPct + '%;' +
         'aspect-ratio:' + cfg.ratio + ';' +
         'transform:translate(-50%,-50%);' +
         'background:transparent;border:0;padding:0;cursor:' + (mode === 'view' ? 'default' : 'pointer') + ';' +
         'pointer-events:auto;transition:transform .12s;' +
         (isS ? 'filter:drop-shadow(0 0 4px rgba(46,125,50,.9));' : '');
       el.title = s.id + ' — ' + cfg.label;
       el.innerHTML = spotSvg(s.type, isT, isS);
       el.addEventListener('click', (e) => { e.stopPropagation(); onSpotClick(s); });
       if (mode === 'edit') attachSpotDrag(el, s);
       spotsLayer.appendChild(el);
     });
     if (countEl) {
       const c = layout.spots.length;
       countEl.textContent = c + ' spot' + (c === 1 ? '' : 's');
     }
   }

   // ─── Tap canvas (edit): drops a spot OR de-selects area ─
   function onCanvasClick(e) {
     if (mode !== 'edit') return;
     // Click came through an area or spot? handled there
     if (e.target.closest('.sp-area') || e.target.closest('.sp-spot') || e.target.closest('.sp-handle')) return;
     selectedAreaId = null;
     drawAreas();
     if (activeTool !== 'select' && SPOT[activeTool]) {
       const rect = wrap.getBoundingClientRect();
       const x = (e.clientX - rect.left) / rect.width;
       const y = (e.clientY - rect.top)  / rect.height;
       const prefix = { sunbed: 'A', cabana: 'C', vip: 'V' }[activeTool];
       const used = layout.spots.filter(s => s.id.startsWith(prefix)).map(s => +s.id.slice(1) || 0);
       const next = used.length ? Math.max.apply(null, used) + 1 : 1;
       layout.spots.push({ id: prefix + next, type: activeTool, x, y });
       saveLayout(venue.id, layout);
       drawSpots();
       if (window.opToast) window.opToast('Added ' + prefix + next);
       if (opts.onChange) opts.onChange(layout);
     }
   }
   wrap.addEventListener('click', onCanvasClick);

   // ─── Spot interactions ─
   async function onSpotClick(spot) {
     if (mode === 'edit') {
       const ok = window.opConfirm
         ? await window.opConfirm({ title: 'Remove ' + spot.id + '?', body: 'Tap the canvas again to place a new one.', ok: 'Remove', cancel: 'Keep', danger: true })
         : confirm('Remove ' + spot.id + '?');
       if (!ok) return;
       layout.spots = layout.spots.filter(s => s.id !== spot.id);
       saveLayout(venue.id, layout);
       drawSpots();
       if (opts.onChange) opts.onChange(layout);
       if (window.opToast) window.opToast('Removed ' + spot.id, 'warn');
     } else if (mode === 'book') {
       if (taken.has(spot.id)) return;
       if (opts.onSelect) opts.onSelect(spot);
     }
   }
   function attachSpotDrag(el, spot) {
     let dragging = false, moved = false;
     function down(e) { dragging = true; moved = false; e.preventDefault(); }
     function move(e) {
       if (!dragging) return;
       const rect = wrap.getBoundingClientRect();
       const t = e.touches ? e.touches[0] : e;
       const x = Math.min(0.99, Math.max(0.01, (t.clientX - rect.left) / rect.width));
       const y = Math.min(0.99, Math.max(0.01, (t.clientY - rect.top)  / rect.height));
       if (Math.abs(x - spot.x) > 0.005 || Math.abs(y - spot.y) > 0.005) moved = true;
       spot.x = x; spot.y = y;
       el.style.left = (x * 100).toFixed(2) + '%';
       el.style.top  = (y * 100).toFixed(2) + '%';
     }
     function up() { if (!dragging) return; dragging = false; if (moved) { saveLayout(venue.id, layout); if (opts.onChange) opts.onChange(layout); } }
     el.addEventListener('mousedown', down);
     el.addEventListener('touchstart', down, { passive: false });
     window.addEventListener('mousemove', move);
     window.addEventListener('touchmove', move, { passive: false });
     window.addEventListener('mouseup', up);
     window.addEventListener('touchend', up);
     el.addEventListener('click', (e) => { if (moved) { e.stopImmediatePropagation(); moved = false; } }, true);
   }

   // ─── Area interactions: move + select + delete ─
   function attachAreaInteractions(el, area) {
     let dragging = false, sx = 0, sy = 0, origX = area.x, origY = area.y, moved = false;
     function down(e) {
       if (e.target.classList.contains('sp-handle')) return;
       const t = e.touches ? e.touches[0] : e;
       const rect = wrap.getBoundingClientRect();
       sx = t.clientX; sy = t.clientY;
       origX = area.x; origY = area.y;
       dragging = true; moved = false;
       selectedAreaId = area.id;
       drawAreas();
       e.stopPropagation();
     }
     function move(e) {
       if (!dragging) return;
       const t = e.touches ? e.touches[0] : e;
       const rect = wrap.getBoundingClientRect();
       const dx = (t.clientX - sx) / rect.width;
       const dy = (t.clientY - sy) / rect.height;
       if (Math.abs(dx) > 0.003 || Math.abs(dy) > 0.003) moved = true;
       area.x = Math.min(1 - area.w, Math.max(0, origX + dx));
       area.y = Math.min(1 - area.h, Math.max(0, origY + dy));
       el.style.left = (area.x * 100).toFixed(2) + '%';
       el.style.top  = (area.y * 100).toFixed(2) + '%';
     }
     function up() { if (!dragging) return; dragging = false; if (moved) { saveLayout(venue.id, layout); if (opts.onChange) opts.onChange(layout); drawAreas(); } }
     el.addEventListener('mousedown', down);
     el.addEventListener('touchstart', down, { passive: false });
     window.addEventListener('mousemove', move);
     window.addEventListener('touchmove', move, { passive: false });
     window.addEventListener('mouseup', up);
     window.addEventListener('touchend', up);
   }

   function addResizeHandles(el, area) {
     // 4 corner handles (br is most-used, the rest let them resize from any corner)
     ['br', 'tr', 'bl', 'tl'].forEach(pos => {
       const h = document.createElement('div');
       h.className = 'sp-handle sp-handle-' + pos;
       const positions = {
         br: 'right:-6px;bottom:-6px;cursor:nwse-resize;',
         tr: 'right:-6px;top:-6px;cursor:nesw-resize;',
         bl: 'left:-6px;bottom:-6px;cursor:nesw-resize;',
         tl: 'left:-6px;top:-6px;cursor:nwse-resize;',
       };
       h.style.cssText =
         'position:absolute;width:14px;height:14px;border-radius:50%;' +
         'background:#fff;border:2px solid #ff9800;box-shadow:0 1px 3px rgba(0,0,0,.3);z-index:6;' +
         positions[pos];
       attachResize(h, area, pos);
       el.appendChild(h);
     });
     // Delete pill
     const del = document.createElement('button');
     del.type = 'button';
     del.textContent = '× Delete area';
     del.style.cssText =
       'position:absolute;top:-14px;right:6px;transform:translateY(-100%);' +
       'background:#c62828;color:#fff;border:0;padding:5px 11px;border-radius:999px;' +
       'font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25);z-index:7;';
     del.addEventListener('click', async (e) => {
       e.stopPropagation();
       const ok = window.opConfirm
         ? await window.opConfirm({ title: 'Delete this area?', body: 'Sunbeds inside it will stay where they are.', ok: 'Delete', cancel: 'Keep', danger: true })
         : confirm('Delete this area?');
       if (!ok) return;
       layout.areas = layout.areas.filter(x => x.id !== area.id);
       selectedAreaId = null;
       saveLayout(venue.id, layout);
       drawAreas();
       if (opts.onChange) opts.onChange(layout);
       if (window.opToast) window.opToast('Area deleted', 'warn');
     });
     el.appendChild(del);
   }

   function attachResize(handle, area, pos) {
     let sx = 0, sy = 0, ox = area.x, oy = area.y, ow = area.w, oh = area.h, active = false, moved = false;
     function down(e) {
       e.stopPropagation();
       const t = e.touches ? e.touches[0] : e;
       sx = t.clientX; sy = t.clientY;
       ox = area.x; oy = area.y; ow = area.w; oh = area.h;
       active = true; moved = false;
     }
     function move(e) {
       if (!active) return;
       const t = e.touches ? e.touches[0] : e;
       const rect = wrap.getBoundingClientRect();
       const dx = (t.clientX - sx) / rect.width;
       const dy = (t.clientY - sy) / rect.height;
       if (Math.abs(dx) + Math.abs(dy) > 0.005) moved = true;
       let x = ox, y = oy, w = ow, h = oh;
       if (pos.indexOf('r') >= 0) w = Math.max(0.05, ow + dx);
       if (pos.indexOf('l') >= 0) { x = Math.max(0, ox + dx); w = Math.max(0.05, ow - dx); }
       if (pos.indexOf('b') >= 0) h = Math.max(0.05, oh + dy);
       if (pos.indexOf('t') >= 0) { y = Math.max(0, oy + dy); h = Math.max(0.05, oh - dy); }
       w = Math.min(w, 1 - x); h = Math.min(h, 1 - y);
       area.x = x; area.y = y; area.w = w; area.h = h;
       const aEl = areasLayer.querySelector('[data-id="' + area.id + '"]');
       if (aEl) {
         aEl.style.left   = (area.x * 100).toFixed(2) + '%';
         aEl.style.top    = (area.y * 100).toFixed(2) + '%';
         aEl.style.width  = (area.w * 100).toFixed(2) + '%';
         aEl.style.height = (area.h * 100).toFixed(2) + '%';
       }
     }
     function up() { if (!active) return; active = false; if (moved) { saveLayout(venue.id, layout); if (opts.onChange) opts.onChange(layout); } }
     handle.addEventListener('mousedown', down);
     handle.addEventListener('touchstart', down, { passive: false });
     window.addEventListener('mousemove', move);
     window.addEventListener('touchmove', move, { passive: false });
     window.addEventListener('mouseup', up);
     window.addEventListener('touchend', up);
   }

   // ─── Toolbar ───
   let countEl = null;
   if (mode === 'edit') {
     const tb = document.createElement('div');
     tb.className = 'sp-toolbar';
     tb.style.cssText = 'display:flex;flex-direction:column;gap:10px;padding:10px 0 12px;';
     tb.innerHTML =
       '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">' +
         '<span style="font-size:11px;letter-spacing:.6px;text-transform:uppercase;color:#5d6a82;font-weight:700;margin-right:4px;">Add area</span>' +
         areaButton('pool', 'Pool') +
         areaButton('deck', 'Deck') +
         areaButton('sand', 'Sand') +
         areaButton('bar',  'Bar') +
         areaButton('entrance', 'Entrance') +
       '</div>' +
       '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">' +
         '<span style="font-size:11px;letter-spacing:.6px;text-transform:uppercase;color:#5d6a82;font-weight:700;margin-right:4px;">Place spot</span>' +
         spotButton('sunbed', 'Sunbed', true) +
         spotButton('cabana', 'Cabana') +
         spotButton('vip',    'VIP gazebo') +
       '</div>' +
       '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:space-between;border-top:1px dashed #e3e8ef;padding-top:10px;">' +
         '<span id="sp-count" style="font-size:13px;color:#5d6a82;font-weight:600;">' + layout.spots.length + ' spots</span>' +
         '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
           '<label class="sp-bg-btn" style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border:1px solid #d0d7e2;border-radius:8px;background:#fff;font-size:13px;font-weight:600;color:#0a1f3a;cursor:pointer;">' +
             'Photo background' +
             '<input type="file" accept="image/*" style="display:none" id="sp-bg-input">' +
           '</label>' +
           (savedBg ? '<button type="button" id="sp-bg-clear" style="padding:6px 10px;border:1px solid #d0d7e2;border-radius:8px;background:#fff;font-size:13px;color:#c62828;font-weight:600;cursor:pointer;">Remove photo</button>' : '') +
           '<button type="button" class="sp-clear" style="padding:6px 12px;border:1px solid #c62828;border-radius:8px;background:#fff;color:#c62828;font-size:13px;font-weight:600;cursor:pointer;">Clear all</button>' +
         '</div>' +
       '</div>';
     container.insertBefore(tb, wrap);
     countEl = tb.querySelector('#sp-count');

     // Spot tool selection (highlights the active button)
     tb.querySelectorAll('[data-tool]').forEach(btn => {
       btn.addEventListener('click', () => {
         activeTool = btn.dataset.tool;
         tb.querySelectorAll('[data-tool]').forEach(b => {
           const on = b === btn;
           b.style.background = on ? '#0a1f3a' : '#fff';
           b.style.color      = on ? '#fff'    : '#0a1f3a';
         });
       });
     });

     // Add-area buttons drop a default-sized area in the centre
     tb.querySelectorAll('[data-add-area]').forEach(btn => {
       btn.addEventListener('click', () => {
         const kind = btn.dataset.addArea;
         const used = layout.areas.filter(a => a.kind === kind).length;
         const id = kind + '-' + (used + 1);
         const w = kind === 'pool' ? 0.4 : (kind === 'sand' || kind === 'deck' ? 0.5 : 0.18);
         const h = kind === 'pool' ? 0.25 : (kind === 'sand' || kind === 'deck' ? 0.35 : 0.10);
         const area = { id, kind, x: (1 - w) / 2, y: (1 - h) / 2, w, h };
         layout.areas.push(area);
         selectedAreaId = id;
         saveLayout(venue.id, layout);
         drawAreas();
         if (opts.onChange) opts.onChange(layout);
         if (window.opToast) window.opToast('Added ' + AREA[kind].label.toLowerCase());
       });
     });

     // Background upload
     const bgInput = tb.querySelector('#sp-bg-input');
     bgInput.addEventListener('change', (e) => {
       const file = e.target.files && e.target.files[0];
       if (!file) return;
       const reader = new FileReader();
       reader.onload = () => {
         saveBg(venue.id, reader.result);
         bgImg.style.backgroundImage = 'url(' + reader.result + ')';
         grid.style.opacity = '0';
         if (window.opToast) window.opToast('Background uploaded');
       };
       reader.readAsDataURL(file);
     });
     const bgClear = tb.querySelector('#sp-bg-clear');
     if (bgClear) bgClear.addEventListener('click', () => {
       saveBg(venue.id, '');
       bgImg.style.backgroundImage = '';
       grid.style.opacity = '.22';
       bgClear.remove();
       if (window.opToast) window.opToast('Photo removed', 'warn');
     });
     // Clear all
     tb.querySelector('.sp-clear').addEventListener('click', async () => {
       const ok = window.opConfirm
         ? await window.opConfirm({ title: 'Clear EVERYTHING?', body: 'Removes all areas and spots from this venue.', ok: 'Clear', cancel: 'Keep', danger: true })
         : confirm('Clear all?');
       if (!ok) return;
       layout = { areas: [], spots: [] };
       selectedAreaId = null;
       saveLayout(venue.id, layout);
       drawAreas(); drawSpots();
       if (opts.onChange) opts.onChange(layout);
       if (window.opToast) window.opToast('Layout cleared', 'warn');
     });
   }

   function areaButton(kind, label) {
     const cfg = AREA[kind];
     return '<button type="button" data-add-area="' + kind + '" ' +
       'style="padding:7px 12px;border:1px solid ' + cfg.stroke + ';border-radius:8px;background:#fff;color:#0a1f3a;' +
       'font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px;">' +
       '<span style="width:10px;height:10px;border-radius:3px;background:' + cfg.fill + ';border:1px solid ' + cfg.stroke + ';"></span>' +
       label +
       '</button>';
   }
   function spotButton(type, label, active) {
     const cfg = SPOT[type];
     return '<button type="button" data-tool="' + type + '" ' +
       (active ? 'style="background:#0a1f3a;color:#fff;' : 'style="background:#fff;color:#0a1f3a;') +
       'padding:7px 12px;border:1px solid #0a1f3a;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:5px;">' +
       '<span style="width:10px;height:10px;border-radius:50%;background:' + cfg.color + ';"></span>' +
       label + '</button>';
   }

   drawAreas();
   drawSpots();

   return {
     destroy:  () => { container.innerHTML = ''; container.classList.remove('sp-host'); },
     getSpots: () => layout.spots.slice(),
     getLayout: () => JSON.parse(JSON.stringify(layout)),
     setSelected: (newSet) => { selected.clear(); newSet.forEach(s => selected.add(s)); drawSpots(); },
     setTaken:    (newSet) => { taken.clear();    newSet.forEach(s => taken.add(s));    drawSpots(); },
   };
 }

 global.SunspotPlan = { create, loadLayout, saveLayout };
})(window);
