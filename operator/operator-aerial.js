/* ============================================================
   Sunspot Operator — Layout panel.

   Replaced the satellite/aerial view with a clean blueprint floor-
   plan editor (../floorplan-editor.js). Satellite was the wrong
   tool for placing sunbeds — useless for pool decks, rooftops,
   indoor lidos. The blueprint shows a top-down canvas with an
   optional pool shape and grid; operators drop sunbeds anywhere
   and drag them around. They can also upload a photo of their
   actual venue layout as a background.

   File kept under the old name so operator/index.html's <script>
   tag doesn't have to change.
   ============================================================ */
(function () {
 'use strict';

 function boot() {
   if (!window.SunspotPlan || !window.SUNSPOT_CLUBS) {
     return setTimeout(boot, 100);
   }

   const mountEl = document.getElementById('op-venue-aerial');
   const countEl = document.getElementById('op-layout-count');
   if (!mountEl) return;

   let api = null;

   function venueFor(opVenueId) {
     return window.SUNSPOT_CLUBS.find(c => c.id === opVenueId)
         || { id: opVenueId, name: opVenueId, category: 'pool-club' };
   }
   function setCount(n) {
     if (countEl) countEl.textContent = n + (n === 1 ? ' spot placed' : ' spots placed');
   }

   function mountForVenue(opVenueId) {
     const venue = venueFor(opVenueId);
     if (api) { api.destroy(); api = null; }
     try {
       api = window.SunspotPlan.create({
         container: mountEl,
         venue:     venue,
         mode:      'edit',
         onChange:  (spots) => setCount(spots.length),
       });
       setCount(api.getSpots().length);
     } catch (err) {
       console.warn('floorplan-editor failed', err);
       mountEl.innerHTML = '<div style="padding:24px;color:#fff;font-size:14px;">Editor failed to load.</div>';
     }
   }

   const venueSel = document.getElementById('op-venue');
   const initialId = (venueSel && venueSel.value) || 'bonita-beach-club';
   mountForVenue(initialId);
   if (venueSel) {
     venueSel.addEventListener('change', () => mountForVenue(venueSel.value));
   }
 }

 if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', boot);
 } else {
   boot();
 }
})();
