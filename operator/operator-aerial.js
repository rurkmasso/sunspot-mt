/* ============================================================
   Sunspot Operator — Layout panel aerial.

   Operator drops sunbeds/cabanas/VIPs anywhere on the satellite
   view of their venue. The placement persists to
   localStorage.sunspot_layouts[venueId] which is the same key the
   customer booking page reads. Operator places → customer sees → books.
   ============================================================ */
(function () {
 'use strict';

 function boot() {
   if (!window.SunspotMap || !window.SUNSPOT_CLUBS) {
     return setTimeout(boot, 100);
   }

   const mountEl = document.getElementById('op-venue-aerial');
   const countEl = document.getElementById('op-layout-count');
   if (!mountEl) return;

   let mapApi = null;
   let currentVenueId = null;

   function venueFor(opVenueId) {
     // Operator demo venue ids match clubs-data ids (aqualuna, noma, ...)
     return window.SUNSPOT_CLUBS.find(c => c.id === opVenueId)
         || window.SUNSPOT_CLUBS[0];
   }

   function setCount(n) {
     if (countEl) countEl.textContent = n + (n === 1 ? ' spot placed' : ' spots placed');
   }

   function mountForVenue(opVenueId) {
     const venue = venueFor(opVenueId);
     if (!venue || !venue.coords) {
       mountEl.innerHTML =
         '<div style="padding:24px;color:#fff;font-size:14px;">' +
           'No coordinates on file for this venue yet. Add them via WP admin or set window.SUNSPOT_API_BASE.' +
         '</div>';
       return;
     }
     if (mapApi) { mapApi.destroy(); mapApi = null; }
     currentVenueId = venue.id;

     window.SunspotMap.create({
       container: mountEl,
       venue: venue,
       mode: 'edit',
       onChange: (spots) => setCount(spots.length),
     }).then(api => {
       mapApi = api;
       setCount(api.getSpots().length);
     }).catch(err => {
       console.warn('Operator aerial failed', err);
       mountEl.innerHTML =
         '<div style="padding:24px;color:#fff;font-size:14px;">' +
           'Map failed to load. Showing the grid fallback below.' +
         '</div>';
       const fallback = document.getElementById('op-grid-fallback');
       if (fallback) fallback.style.display = '';
     });
   }

   // Initial mount with whichever venue the operator app picked
   const venueSel = document.getElementById('op-venue');
   const initialId = (venueSel && venueSel.value) || 'aqualuna';
   mountForVenue(initialId);

   // Re-mount when operator switches venue
   if (venueSel) {
     venueSel.addEventListener('change', () => mountForVenue(venueSel.value));
   }

   // Re-mount when the Layout tab becomes visible — Leaflet needs a
   // visible parent to size itself correctly. invalidateSize on visibility.
   const layoutTab = document.querySelector('[data-panel="seatmap"], [data-nav="seatmap"]');
   if (layoutTab) {
     layoutTab.addEventListener('click', () => {
       setTimeout(() => {
         if (mapApi && mapApi.map) {
           try { mapApi.map.invalidateSize(); } catch (e) {}
         }
       }, 200);
     });
   }
 }

 if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', boot);
 } else {
   boot();
 }
})();
