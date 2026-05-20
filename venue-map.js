/* ============================================================
   Sunspot — Venue Map (the spatial primitive)

   ONE component, three modes:
     - 'edit'  → operator drops sunbeds/cabanas/VIPs anywhere
                 on the aerial view, drags to reposition, taps to remove.
     - 'book'  → customer sees the same layout, taps available spots
                 to add them to their selection.
     - 'view'  → read-only, used in cards / previews / operator stats.

   Tiles: Esri World Imagery — high-res aerial, no API key required.
   Persistence: localStorage.sunspot_layouts[venueId] for the demo.
                When window.SUNSPOT_API_BASE is set, GET / PUT
                /sunspot/v1/venues/{id}/layout instead.

   No build step. Loads Leaflet from CDN if it isn't there yet.
   ============================================================ */
(function (global) {
 'use strict';

 const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
 const LEAFLET_JS  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
 const ESRI_TILES  = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
 const ESRI_ATTR   = 'Tiles © Esri, Maxar, Earthstar Geographics';
 const STORAGE_KEY = 'sunspot_layouts';

 // Visual style per spot type
 const SPOT_STYLE = {
   sunbed: { color: '#ff9800', label: 'Sunbed', radius: 7 },
   cabana: { color: '#0288d1', label: 'Cabana', radius: 9 },
   vip:    { color: '#7b1fa2', label: 'VIP',    radius: 11 },
 };

 // ─── Loader ───────────────────────────────────────────────────
 let leafletReady = null;
 function loadLeaflet() {
   if (global.L) return Promise.resolve(global.L);
   if (leafletReady) return leafletReady;
   leafletReady = new Promise((resolve, reject) => {
     // CSS
     if (!document.querySelector('link[href*="leaflet"]')) {
       const link = document.createElement('link');
       link.rel = 'stylesheet';
       link.href = LEAFLET_CSS;
       document.head.appendChild(link);
     }
     // JS
     const s = document.createElement('script');
     s.src = LEAFLET_JS;
     s.async = true;
     s.onload  = () => resolve(global.L);
     s.onerror = () => reject(new Error('Failed to load Leaflet'));
     document.head.appendChild(s);
   });
   return leafletReady;
 }

 // ─── Storage layer ────────────────────────────────────────────
 // Each venue's layout is an array of { id, type, lat, lng }.
 // We keep this in one object keyed by venue id so the whole site
 // shares the same source of truth across pages.
 function loadAllLayouts() {
   try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
   catch (e) { return {}; }
 }
 function saveAllLayouts(all) {
   try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); }
   catch (e) { /* quota full or private mode — silently degrade */ }
 }
 function loadLayout(venueId) {
   const all = loadAllLayouts();
   return Array.isArray(all[venueId]) ? all[venueId] : null;
 }
 function saveLayout(venueId, spots) {
   const all = loadAllLayouts();
   all[venueId] = spots;
   saveAllLayouts(all);
 }

 // Generate a deterministic starter layout for a venue that has nothing
 // saved yet — a small grid offset from the venue's centre, so the
 // operator sees SOMETHING instead of a blank aerial.
 function seedLayout(venue) {
   const { lat, lng } = venue.coords || {};
   if (!lat || !lng) return [];
   const spots = [];
   // 6 cols × 4 rows of sunbeds, each cell ~3 m
   const dLat = 0.000027;  // ~3 m
   const dLng = 0.000033;  // ~3 m (latitude-adjusted approx)
   let i = 1;
   for (let r = 0; r < 4; r++) {
     for (let c = 0; c < 6; c++) {
       spots.push({
         id: 'A' + i,
         type: 'sunbed',
         lat: lat + (r - 1.5) * dLat,
         lng: lng + (c - 2.5) * dLng,
       });
       i++;
     }
   }
   // 2 cabanas at the back
   for (let c = 0; c < 2; c++) {
     spots.push({
       id: 'C' + (c + 1),
       type: 'cabana',
       lat: lat + 2.2 * dLat,
       lng: lng + (c - 0.5) * dLng * 2,
     });
   }
   // 1 VIP gazebo at the front
   spots.push({ id: 'V1', type: 'vip', lat: lat - 2.2 * dLat, lng: lng });
   return spots;
 }

 // ─── The main component ───────────────────────────────────────
 /**
  * createVenueMap(opts)
  *   - container: HTMLElement | id string
  *   - venue:     { id, name, coords:{lat,lng}, ... }
  *   - mode:      'edit' | 'book' | 'view'
  *   - taken:     [spotId] — optional, marked unavailable in 'book' mode
  *   - onChange:  (spots) => void   (edit mode, after every add/remove)
  *   - onSelect:  (spot)  => void   (book mode, when user taps a spot)
  *   - selected:  Set<spotId>       (book mode, currently in cart)
  *
  * Returns: { refresh(), destroy(), getSpots() }
  */
 async function createVenueMap(opts) {
   const container = typeof opts.container === 'string'
     ? document.getElementById(opts.container)
     : opts.container;
   if (!container) throw new Error('venue-map: container not found');
   if (!opts.venue || !opts.venue.coords) throw new Error('venue-map: venue.coords required');

   const venue = opts.venue;
   const mode  = opts.mode || 'view';
   const taken = new Set(opts.taken || []);
   const selected = opts.selected || new Set();

   const L = await loadLeaflet();

   container.innerHTML = '';
   container.classList.add('vm-host');
   container.style.position = container.style.position || 'relative';

   const mapDiv = document.createElement('div');
   mapDiv.className = 'vm-map';
   mapDiv.style.cssText = 'width:100%;height:100%;min-height:340px;border-radius:12px;overflow:hidden;';
   container.appendChild(mapDiv);

   const map = L.map(mapDiv, {
     zoomControl: true,
     attributionControl: true,
   }).setView([venue.coords.lat, venue.coords.lng], 19);

   L.tileLayer(ESRI_TILES, {
     attribution: ESRI_ATTR,
     maxZoom: 21,
     maxNativeZoom: 19,
   }).addTo(map);

   // Load layout: saved → seeded
   let spots = loadLayout(venue.id);
   if (!spots) {
     spots = seedLayout(venue);
     if (mode === 'edit') saveLayout(venue.id, spots);
   }

   // ─── Marker rendering ───
   const markersLayer = L.layerGroup().addTo(map);

   function spotIcon(spot) {
     const style = SPOT_STYLE[spot.type] || SPOT_STYLE.sunbed;
     const isTaken    = taken.has(spot.id);
     const isSelected = selected.has(spot.id);
     const bg = isTaken    ? '#9e9e9e'
              : isSelected ? '#2e7d32'
              : style.color;
     const ring = isSelected ? '#fff' : 'rgba(255,255,255,.85)';
     const r = style.radius;
     return L.divIcon({
       className: 'vm-spot',
       iconSize: [r * 2 + 4, r * 2 + 4],
       iconAnchor: [r + 2, r + 2],
       html:
         '<div style="' +
           'width:' + (r * 2) + 'px;height:' + (r * 2) + 'px;' +
           'border-radius:50%;background:' + bg + ';' +
           'box-shadow:0 0 0 2px ' + ring + ', 0 1px 3px rgba(0,0,0,.4);' +
           'cursor:pointer;' +
         '"></div>',
     });
   }

   function drawSpots() {
     markersLayer.clearLayers();
     spots.forEach(spot => {
       const marker = L.marker([spot.lat, spot.lng], {
         icon: spotIcon(spot),
         draggable: mode === 'edit',
         title: spot.id + ' — ' + (SPOT_STYLE[spot.type] || {}).label,
       }).addTo(markersLayer);

       marker.on('click', () => handleSpotClick(spot, marker));
       if (mode === 'edit') {
         marker.on('dragend', () => {
           const ll = marker.getLatLng();
           spot.lat = ll.lat;
           spot.lng = ll.lng;
           saveLayout(venue.id, spots);
           if (opts.onChange) opts.onChange(spots);
         });
       }
     });
   }

   // ─── Click behaviour per mode ───
   function handleSpotClick(spot, marker) {
     if (mode === 'edit') {
       // Tap to remove (after confirm)
       if (confirm('Remove spot ' + spot.id + '?')) {
         spots = spots.filter(s => s.id !== spot.id);
         saveLayout(venue.id, spots);
         drawSpots();
         if (opts.onChange) opts.onChange(spots);
       }
     } else if (mode === 'book') {
       if (taken.has(spot.id)) return;
       if (opts.onSelect) opts.onSelect(spot);
     }
   }

   // Edit-mode: add new spot on map click
   if (mode === 'edit') {
     map.on('click', e => {
       const type = (document.getElementById('vm-add-type') || {}).value || 'sunbed';
       const prefix = { sunbed: 'A', cabana: 'C', vip: 'V' }[type];
       // Next id within type
       const used = spots.filter(s => s.id.startsWith(prefix)).map(s => parseInt(s.id.slice(1), 10));
       const next = used.length ? Math.max.apply(null, used) + 1 : 1;
       const spot = { id: prefix + next, type, lat: e.latlng.lat, lng: e.latlng.lng };
       spots.push(spot);
       saveLayout(venue.id, spots);
       drawSpots();
       if (opts.onChange) opts.onChange(spots);
     });

     // Toolbar floating in the top-right of the map
     const toolbar = document.createElement('div');
     toolbar.className = 'vm-toolbar';
     toolbar.innerHTML =
       '<label style="font-size:13px;font-weight:600;color:#0a1f3a;">Add:' +
         '<select id="vm-add-type" style="margin-left:8px;padding:4px 8px;border-radius:6px;border:1px solid #d0d7e2;">' +
           '<option value="sunbed">Sunbed</option>' +
           '<option value="cabana">Cabana</option>' +
           '<option value="vip">VIP gazebo</option>' +
         '</select>' +
       '</label>' +
       '<button type="button" class="vm-clear" style="margin-left:10px;padding:4px 10px;border-radius:6px;border:1px solid #c62828;background:#fff;color:#c62828;font-size:13px;cursor:pointer;">Clear all</button>' +
       '<div style="margin-top:6px;font-size:12px;color:#50575e;">Tap empty map to add · drag to move · tap spot to remove</div>';
     toolbar.style.cssText =
       'position:absolute;top:10px;right:10px;z-index:500;' +
       'background:rgba(255,255,255,.95);padding:10px 12px;border-radius:10px;' +
       'box-shadow:0 2px 12px rgba(10,31,58,.18);max-width:260px;';
     container.appendChild(toolbar);
     toolbar.querySelector('.vm-clear').addEventListener('click', () => {
       if (!confirm('Clear ALL spots from this venue?')) return;
       spots = [];
       saveLayout(venue.id, spots);
       drawSpots();
       if (opts.onChange) opts.onChange(spots);
     });
   }

   drawSpots();

   return {
     map:      map,   // exposed so callers can invalidateSize() on tab change
     refresh:  () => { spots = loadLayout(venue.id) || spots; drawSpots(); },
     destroy:  () => { map.remove(); container.classList.remove('vm-host'); },
     getSpots: () => spots.slice(),
     setSelected: (newSet) => { selected.clear(); newSet.forEach(s => selected.add(s)); drawSpots(); },
     setTaken: (newSet) => { taken.clear(); newSet.forEach(s => taken.add(s)); drawSpots(); },
   };
 }

 // ─── Browse map: all venues plotted on Malta ───
 async function createBrowseMap(opts) {
   const container = typeof opts.container === 'string'
     ? document.getElementById(opts.container) : opts.container;
   if (!container) throw new Error('venue-map: container not found');
   const venues = opts.venues || [];
   const L = await loadLeaflet();

   container.innerHTML = '';
   container.style.position = container.style.position || 'relative';
   const mapDiv = document.createElement('div');
   mapDiv.style.cssText = 'width:100%;height:100%;min-height:380px;border-radius:12px;overflow:hidden;';
   container.appendChild(mapDiv);

   // Centre on Malta
   const map = L.map(mapDiv).setView([35.9375, 14.3754], 11);
   L.tileLayer(ESRI_TILES, { attribution: ESRI_ATTR, maxZoom: 19 }).addTo(map);

   const bounds = [];
   venues.forEach(v => {
     if (!v.coords || !v.coords.lat) return;
     bounds.push([v.coords.lat, v.coords.lng]);
     const m = L.marker([v.coords.lat, v.coords.lng], {
       icon: L.divIcon({
         className: 'vm-pin',
         iconSize: [28, 28],
         iconAnchor: [14, 28],
         html:
           '<div style="' +
             'width:24px;height:24px;border-radius:50% 50% 50% 0;' +
             'transform:rotate(-45deg);' +
             'background:#ff9800;border:2px solid #fff;' +
             'box-shadow:0 2px 6px rgba(0,0,0,.4);' +
           '"></div>',
       }),
     }).addTo(map);
     const popup =
       '<div style="font-family:inherit;min-width:180px;">' +
         '<strong style="display:block;color:#0a1f3a;font-size:14px;">' + v.name + '</strong>' +
         '<span style="color:#50575e;font-size:12px;">' + (v.location || '') + '</span>' +
         (v.hasBookableSunbeds
           ? '<div style="margin-top:6px;"><a href="booking.html?club=' + v.id + '" style="color:#ff9800;font-weight:600;text-decoration:none;">Reserve →</a></div>'
           : '<div style="margin-top:6px;"><a href="club.html?club=' + v.id + '" style="color:#0288d1;font-weight:600;text-decoration:none;">View →</a></div>'
         ) +
       '</div>';
     m.bindPopup(popup);
   });
   if (bounds.length) map.fitBounds(bounds, { padding: [40, 40] });

   return { destroy: () => map.remove() };
 }

 // Public API
 global.SunspotMap = {
   create:       createVenueMap,
   browse:       createBrowseMap,
   loadLayout:   loadLayout,
   saveLayout:   saveLayout,
   seedLayout:   seedLayout,
   SPOT_STYLE:   SPOT_STYLE,
 };
})(window);
