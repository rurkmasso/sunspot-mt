/* ============================================================
   Sunspot — Floor Plan Editor.

   A clean, blueprint-style canvas for placing sunbeds, cabanas
   and VIP gazebos. Replaces the satellite for the operator's
   Layout editor and for the customer's booking view.

   Why not satellite: satellite is useless for indoor pools,
   rooftops and lidos — you can't see the pool deck through the
   building's roof, and even on beaches the sunbed grid is too
   small to place accurately at street zoom.

   Coordinate system: x and y are 0–1 (fraction of canvas), so
   the same layout renders the same shape at any container size.
   Operator can optionally upload a real venue photo or drawing
   as the background — sunbeds stay pinned to relative positions.

   API:
     window.SunspotPlan.create({
       container, venue,
       mode: 'edit' | 'book' | 'view',
       taken, selected, onChange, onSelect,
     }) → { destroy, getSpots, setSelected, setTaken }
   ============================================================ */
(function (global) {
 'use strict';

 const STORAGE_KEY = 'sunspot_layouts_v2';
 const BG_KEY      = 'sunspot_bg_images';

 const SPOT_STYLE = {
   sunbed: { color: '#ff9800', label: 'Sunbed', symbol: 'sunbed' },
   cabana: { color: '#0288d1', label: 'Cabana', symbol: 'cabana' },
   vip:    { color: '#7b1fa2', label: 'VIP',    symbol: 'vip' },
 };

 // SVG glyph per type — proportional, no emoji
 function spotSvg(type, taken, selected) {
   const color = taken ? '#9e9e9e'
               : selected ? '#2e7d32'
               : (SPOT_STYLE[type] || SPOT_STYLE.sunbed).color;
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
   // sunbed: stylised bed
   return '<svg viewBox="0 0 32 16" width="100%" height="100%">' +
     '<rect x="2" y="3" width="28" height="9" rx="3" fill="' + color + '" stroke="#fff" stroke-width="2"/>' +
     '<line x1="11" y1="3" x2="11" y2="12" stroke="#fff" stroke-width="1.5"/>' +
   '</svg>';
 }

 // ─── Storage ─────────────────────────────────────────────────
 function loadAll() {
   try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
   catch (e) { return {}; }
 }
 function saveAll(all) {
   try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); } catch (e) {}
 }
 function loadLayout(vid) {
   const a = loadAll();
   return Array.isArray(a[vid]) ? a[vid] : null;
 }
 function saveLayout(vid, spots) {
   const a = loadAll(); a[vid] = spots; saveAll(a);
 }
 function loadBg(vid) {
   try { return JSON.parse(localStorage.getItem(BG_KEY) || '{}')[vid] || ''; }
   catch (e) { return ''; }
 }
 function saveBg(vid, dataUrl) {
   try {
     const m = JSON.parse(localStorage.getItem(BG_KEY) || '{}');
     m[vid] = dataUrl;
     localStorage.setItem(BG_KEY, JSON.stringify(m));
   } catch (e) {}
 }

 // ─── Seed layout — gentle grid, centred, leaves room around the edges ─
 function seedLayout(venue) {
   const cat = (venue && venue.category) || 'beach-club';
   const rows = cat === 'rooftop' ? 3 : 4;
   const cols = cat === 'rooftop' ? 5 : 6;
   const padX = 0.12, padY = 0.18;
   const dx = (1 - padX * 2) / (cols - 1);
   const dy = (1 - padY * 2) / (rows - 1);
   const spots = [];
   let i = 1;
   for (let r = 0; r < rows; r++) {
     for (let c = 0; c < cols; c++) {
       spots.push({
         id: 'A' + i, type: 'sunbed',
         x: padX + c * dx, y: padY + r * dy,
       });
       i++;
     }
   }
   // Cabanas in a row near the top
   for (let c = 0; c < 3; c++) {
     spots.push({ id: 'C' + (c + 1), type: 'cabana', x: 0.25 + c * 0.25, y: 0.06 });
   }
   // VIP centred at front
   spots.push({ id: 'V1', type: 'vip', x: 0.5, y: 0.92 });
   return spots;
 }

 // ─── Core component ──────────────────────────────────────────
 function create(opts) {
   const container = typeof opts.container === 'string'
     ? document.getElementById(opts.container) : opts.container;
   if (!container) throw new Error('floorplan-editor: container not found');
   const venue = opts.venue;
   if (!venue) throw new Error('floorplan-editor: venue required');
   const mode = opts.mode || 'view';
   const taken = new Set(opts.taken || []);
   const selected = opts.selected || new Set();

   container.innerHTML = '';
   container.classList.add('sp-host');
   container.style.position = container.style.position || 'relative';

   // Build the canvas wrapper
   const wrap = document.createElement('div');
   wrap.className = 'sp-canvas-wrap';
   wrap.style.cssText =
     'position:relative;width:100%;aspect-ratio:16/10;' +
     'border-radius:14px;overflow:hidden;background:#cfe8f5;' +
     'box-shadow:inset 0 0 0 1px rgba(10,31,58,.08);';
   container.appendChild(wrap);

   // Background layers (in z order): solid water → uploaded image → grid → pool shape
   const bgImg = document.createElement('div');
   bgImg.className = 'sp-bg-image';
   bgImg.style.cssText = 'position:absolute;inset:0;background-size:cover;background-position:center;opacity:1;';
   wrap.appendChild(bgImg);

   const poolShape = document.createElement('div');
   poolShape.className = 'sp-pool';
   poolShape.style.cssText =
     'position:absolute;left:8%;top:14%;right:8%;bottom:14%;' +
     'border-radius:16px;background:linear-gradient(180deg,rgba(2,136,209,.18),rgba(2,136,209,.30));' +
     'border:2px solid rgba(255,255,255,.85);' +
     'box-shadow:inset 0 0 0 1px rgba(2,136,209,.4), 0 1px 4px rgba(0,0,0,.06);';
   wrap.appendChild(poolShape);

   const grid = document.createElement('div');
   grid.className = 'sp-grid';
   grid.style.cssText =
     'position:absolute;inset:0;pointer-events:none;opacity:.30;' +
     'background-image:' +
       'linear-gradient(rgba(10,31,58,.18) 1px, transparent 1px),' +
       'linear-gradient(90deg, rgba(10,31,58,.18) 1px, transparent 1px);' +
     'background-size:5% 5%;';
   wrap.appendChild(grid);

   const spotsLayer = document.createElement('div');
   spotsLayer.className = 'sp-spots';
   spotsLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
   wrap.appendChild(spotsLayer);

   // Apply saved bg image if any
   const savedBg = loadBg(venue.id);
   if (savedBg) {
     bgImg.style.backgroundImage = 'url(' + savedBg + ')';
     poolShape.style.opacity = '0';   // photo is the truth, don't overlay shape
     grid.style.opacity = '0';
   }

   // Load layout (or seed)
   let spots = loadLayout(venue.id);
   if (!spots || !spots.length) {
     spots = seedLayout(venue);
     if (mode === 'edit') saveLayout(venue.id, spots);
   }

   // ─── Render spots ───
   function drawSpots() {
     spotsLayer.innerHTML = '';
     spots.forEach(s => {
       const isT = taken.has(s.id);
       const isS = selected.has(s.id);
       const el = document.createElement('button');
       el.type = 'button';
       el.className = 'sp-spot sp-spot-' + s.type + (isT ? ' is-taken' : '') + (isS ? ' is-selected' : '');
       const sizePct = s.type === 'sunbed' ? 7 : (s.type === 'cabana' ? 9 : 10);
       el.style.cssText =
         'position:absolute;' +
         'left:' + (s.x * 100).toFixed(2) + '%;' +
         'top:'  + (s.y * 100).toFixed(2) + '%;' +
         'width:' + sizePct + '%;' +
         'aspect-ratio:' + (s.type === 'sunbed' ? '2 / 1' : '1 / 1') + ';' +
         'transform:translate(-50%,-50%);' +
         'background:transparent;border:0;padding:0;cursor:' + (mode === 'view' ? 'default' : 'pointer') + ';' +
         'pointer-events:auto;' +
         (isS ? 'filter:drop-shadow(0 0 4px rgba(46,125,50,.9));' : '') +
         'transition:transform .12s;';
       el.title = s.id + ' — ' + (SPOT_STYLE[s.type] || {}).label;
       el.innerHTML = spotSvg(s.type, isT, isS);
       el.dataset.id = s.id;
       el.addEventListener('click', () => onSpotClick(s, el));
       if (mode === 'edit') attachDrag(el, s);
       spotsLayer.appendChild(el);
     });
     if (countEl) countEl.textContent = spots.length + ' spot' + (spots.length === 1 ? '' : 's');
   }

   // ─── Click handler ───
   async function onSpotClick(spot) {
     if (mode === 'edit') {
       const ok = window.opConfirm
         ? await window.opConfirm({ title: 'Remove ' + spot.id + '?', body: 'You can place it again by tapping the canvas.', ok: 'Remove', cancel: 'Keep', danger: true })
         : confirm('Remove ' + spot.id + '?');
       if (!ok) return;
       spots = spots.filter(s => s.id !== spot.id);
       saveLayout(venue.id, spots);
       drawSpots();
       if (opts.onChange) opts.onChange(spots);
       if (window.opToast) window.opToast('Removed ' + spot.id, 'warn');
     } else if (mode === 'book') {
       if (taken.has(spot.id)) return;
       if (opts.onSelect) opts.onSelect(spot);
     }
   }

   // ─── Drag-to-move (operator only) ───
   function attachDrag(el, spot) {
     let dragging = false, startX = 0, startY = 0, moved = false;
     function onDown(e) {
       const p = pointer(e);
       startX = p.x; startY = p.y; dragging = true; moved = false;
       el.style.transition = 'none';
       e.preventDefault();
     }
     function onMove(e) {
       if (!dragging) return;
       const p = pointer(e);
       const dx = p.x - startX, dy = p.y - startY;
       if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
       const rect = wrap.getBoundingClientRect();
       spot.x = Math.min(0.98, Math.max(0.02, p.x / rect.width));
       spot.y = Math.min(0.98, Math.max(0.02, p.y / rect.height));
       el.style.left = (spot.x * 100).toFixed(2) + '%';
       el.style.top  = (spot.y * 100).toFixed(2) + '%';
     }
     function onUp() {
       if (!dragging) return;
       dragging = false;
       el.style.transition = '';
       if (moved) {
         saveLayout(venue.id, spots);
         if (opts.onChange) opts.onChange(spots);
       }
     }
     function pointer(e) {
       const rect = wrap.getBoundingClientRect();
       const t = e.touches ? e.touches[0] : e;
       return { x: (t.clientX - rect.left), y: (t.clientY - rect.top) };
     }
     el.addEventListener('mousedown', onDown);
     el.addEventListener('touchstart', onDown, { passive: false });
     window.addEventListener('mousemove', onMove);
     window.addEventListener('touchmove', onMove, { passive: false });
     window.addEventListener('mouseup', onUp);
     window.addEventListener('touchend', onUp);
     // Suppress the click that follows a real drag
     el.addEventListener('click', (e) => { if (moved) { e.stopImmediatePropagation(); moved = false; } }, true);
   }

   // ─── Edit-mode: tap empty canvas to add ───
   let countEl = null;
   if (mode === 'edit') {
     wrap.addEventListener('click', (e) => {
       if (e.target.closest('.sp-spot')) return;
       const rect = wrap.getBoundingClientRect();
       const x = (e.clientX - rect.left) / rect.width;
       const y = (e.clientY - rect.top)  / rect.height;
       const type = (toolbar.querySelector('[data-add-type]') || {}).dataset.addType || 'sunbed';
       const prefix = { sunbed: 'A', cabana: 'C', vip: 'V' }[type];
       const used = spots.filter(s => s.id.startsWith(prefix)).map(s => +s.id.slice(1) || 0);
       const next = used.length ? Math.max.apply(null, used) + 1 : 1;
       const spot = { id: prefix + next, type, x, y };
       spots.push(spot);
       saveLayout(venue.id, spots);
       drawSpots();
       if (opts.onChange) opts.onChange(spots);
       if (window.opToast) window.opToast('Added ' + spot.id);
     });

     // Toolbar above the canvas
     var toolbar = document.createElement('div');
     toolbar.className = 'sp-toolbar';
     toolbar.style.cssText =
       'display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;' +
       'padding:10px 0 12px;';
     toolbar.innerHTML =
       '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
         typeButton('sunbed', 'Sunbed', true) +
         typeButton('cabana', 'Cabana') +
         typeButton('vip',    'VIP gazebo') +
       '</div>' +
       '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">' +
         '<span id="sp-count" style="font-size:13px;color:var(--muted,#5d6a82);font-weight:600;">' + spots.length + ' spots</span>' +
         '<label class="sp-bg-btn" style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border:1px solid #d0d7e2;border-radius:8px;background:#fff;font-size:13px;font-weight:600;color:#0a1f3a;cursor:pointer;">' +
           'Photo background' +
           '<input type="file" accept="image/*" style="display:none" id="sp-bg-input">' +
         '</label>' +
         (savedBg ? '<button type="button" id="sp-bg-clear" style="padding:6px 10px;border:1px solid #d0d7e2;border-radius:8px;background:#fff;font-size:13px;color:#c62828;font-weight:600;cursor:pointer;">Remove photo</button>' : '') +
         '<button type="button" class="sp-clear" style="padding:6px 12px;border:1px solid #c62828;border-radius:8px;background:#fff;color:#c62828;font-size:13px;font-weight:600;cursor:pointer;">Clear all</button>' +
       '</div>';
     container.insertBefore(toolbar, wrap);
     countEl = toolbar.querySelector('#sp-count');

     // Toolbar wiring
     toolbar.querySelectorAll('[data-add-type]').forEach(btn => {
       btn.addEventListener('click', () => {
         toolbar.querySelectorAll('[data-add-type]').forEach(b => {
           b.style.background = '#fff'; b.style.color = '#0a1f3a';
         });
         btn.style.background = '#0a1f3a'; btn.style.color = '#fff';
         toolbar.querySelectorAll('[data-add-type]').forEach(b => { delete b.dataset.active; });
         btn.dataset.active = '1';
       });
     });
     // Bg upload
     const bgInput = toolbar.querySelector('#sp-bg-input');
     bgInput.addEventListener('change', (e) => {
       const file = e.target.files && e.target.files[0];
       if (!file) return;
       const reader = new FileReader();
       reader.onload = () => {
         saveBg(venue.id, reader.result);
         bgImg.style.backgroundImage = 'url(' + reader.result + ')';
         poolShape.style.opacity = '0';
         grid.style.opacity = '0';
         if (window.opToast) window.opToast('Background uploaded');
       };
       reader.readAsDataURL(file);
     });
     const bgClear = toolbar.querySelector('#sp-bg-clear');
     if (bgClear) bgClear.addEventListener('click', () => {
       saveBg(venue.id, '');
       bgImg.style.backgroundImage = '';
       poolShape.style.opacity = '1';
       grid.style.opacity = '.30';
       bgClear.remove();
       if (window.opToast) window.opToast('Photo removed', 'warn');
     });
     // Clear all
     toolbar.querySelector('.sp-clear').addEventListener('click', async () => {
       const ok = window.opConfirm
         ? await window.opConfirm({ title: 'Clear all spots?', body: 'Removes every sunbed/cabana/VIP from this venue. You can rebuild.', ok: 'Clear', cancel: 'Keep', danger: true })
         : confirm('Clear all?');
       if (!ok) return;
       spots = [];
       saveLayout(venue.id, spots);
       drawSpots();
       if (opts.onChange) opts.onChange(spots);
       if (window.opToast) window.opToast('Layout cleared', 'warn');
     });
   }

   function typeButton(type, label, active) {
     return '<button type="button" data-add-type="' + type + '" ' +
       (active ? 'data-active="1" style="background:#0a1f3a;color:#fff;' : 'style="background:#fff;color:#0a1f3a;') +
       'padding:8px 14px;border:1px solid #0a1f3a;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">' +
       '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + (SPOT_STYLE[type] || {}).color + ';margin-right:6px;vertical-align:1px;"></span>' +
       label + '</button>';
   }

   drawSpots();

   return {
     destroy:  () => { container.innerHTML = ''; container.classList.remove('sp-host'); },
     getSpots: () => spots.slice(),
     setSelected: (newSet) => { selected.clear(); newSet.forEach(s => selected.add(s)); drawSpots(); },
     setTaken:    (newSet) => { taken.clear();    newSet.forEach(s => taken.add(s));    drawSpots(); },
   };
 }

 global.SunspotPlan = { create, loadLayout, saveLayout };
})(window);
