/* ============================================================
   Sunspot — Booking aerial glue.

   Connects the venue-map (aerial view) to the right-hand sidebar:
     - Pulls the club from window.SUNSPOT_CLUBS via the URL ?club=
     - Mounts a 'book' mode map on #venue-aerial
     - On spot click, adds to the selection list + price total
     - On checkout, stashes the same `sunspot_pending` payload that
       seatmap.js used so checkout.html keeps working unchanged
     - Pricing rules: sunbed = club.sunbedFrom, cabana = cabanaFrom,
       vip = vipFrom (fallbacks 20 / 100 / 250).
   ============================================================ */
(function () {
 'use strict';

 // Run after clubs-data + venue-map are present
 function boot() {
   if (!window.SUNSPOT_CLUBS || !window.SunspotMap) {
     return setTimeout(boot, 80);
   }

   const params = new URLSearchParams(window.location.search);
   const clubId = params.get('club') || 'azure-bay';
   const club = window.SUNSPOT_CLUBS.find(c => c.id === clubId)
             || window.SUNSPOT_CLUBS[0];
   if (!club || !club.coords) return;

   // The aerial supersedes the SVG seatmap, but seatmap.js still binds to a
   // bunch of elements (subtotal, checkout-btn, etc.) which we reuse.
   // We hide the SVG host and own the spot lifecycle ourselves.
   const aerialHost = document.getElementById('venue-aerial');
   const svgHost = document.getElementById('svg-host');
   if (svgHost) svgHost.style.display = 'none';

   const subtotalEl = document.getElementById('subtotal');
   const feeEl      = document.getElementById('service-fee');
   const totalEl    = document.getElementById('total');
   const listEl     = document.getElementById('selection-list');
   const emptyEl    = document.getElementById('empty-state');
   const checkoutBtn= document.getElementById('checkout-btn');
   const clubName   = document.getElementById('club-name');
   const clubSub    = document.getElementById('club-subtitle');

   const today      = new Date();
   const dateParam  = params.get('date');
   const date       = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
                    ? new Date(dateParam + 'T00:00:00') : today;
   const dateLabel  = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
   const dateISO    = date.toISOString().slice(0, 10);
   const guests     = Math.max(1, Math.min(20, parseInt(params.get('guests'), 10) || 2));

   if (clubName) clubName.textContent = club.name;
   if (clubSub)  clubSub.textContent  = club.location + ' · ' + dateLabel;

   // Pricing
   const PRICE = {
     sunbed: club.sunbedFrom || 20,
     cabana: club.cabanaFrom || 100,
     vip:    club.vipFrom    || 250,
   };
   const LABEL = { sunbed: 'Sunbed', cabana: 'Cabana', vip: 'VIP gazebo' };

   const selected = new Map();   // spotId -> spot

   function reprice() {
     const subtotal = Array.from(selected.values())
       .reduce((s, sp) => s + (PRICE[sp.type] || 0), 0);
     const fee = Math.round(subtotal * 0.08);
     subtotalEl.textContent = '€' + subtotal;
     feeEl.textContent      = '€' + fee;
     totalEl.textContent    = '€' + (subtotal + fee);
     checkoutBtn.disabled = selected.size === 0;
     checkoutBtn.textContent = selected.size === 0
       ? 'Select spots to continue'
       : 'Continue to checkout — €' + (subtotal + fee);
   }

   function renderList() {
     if (selected.size === 0) {
       listEl.innerHTML = '';
       listEl.appendChild(emptyEl);
       emptyEl.style.display = '';
       return;
     }
     emptyEl.style.display = 'none';
     listEl.innerHTML = '';
     selected.forEach(sp => {
       const li = document.createElement('li');
       li.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);';
       li.innerHTML =
         '<span><strong>' + (LABEL[sp.type] || sp.type) + ' ' + sp.id + '</strong></span>' +
         '<span style="display:flex;gap:10px;align-items:center;">' +
           '<span>€' + (PRICE[sp.type] || 0) + '</span>' +
           '<button type="button" data-rm="' + sp.id + '" aria-label="Remove ' + sp.id + '" style="background:none;border:none;color:#c62828;font-size:18px;cursor:pointer;line-height:1;">×</button>' +
         '</span>';
       listEl.appendChild(li);
     });
     listEl.querySelectorAll('[data-rm]').forEach(btn => {
       btn.addEventListener('click', () => {
         selected.delete(btn.getAttribute('data-rm'));
         renderList();
         reprice();
         mapApi.setSelected(new Set(selected.keys()));
       });
     });
   }

   // Use the blueprint floor-plan editor (same module as the operator's
   // Layout tab). Operator places spots → customer sees the exact same
   // blueprint with the exact same spots. No satellite involved — beds,
   // cabanas and VIPs are rendered against a clean pool-deck canvas.
   let mapApi;
   function buildBookView() {
     try {
       mapApi = window.SunspotPlan.create({
         container: aerialHost,
         venue:    club,
         mode:     'book',
         selected: new Set(),
         onSelect: (spot) => {
           if (selected.has(spot.id)) selected.delete(spot.id);
           else selected.set(spot.id, spot);
           renderList(); reprice();
           mapApi.setSelected(new Set(selected.keys()));
         },
       });
       reprice(); renderList();
     } catch (err) {
       console.warn('floorplan-editor failed, falling back to SVG seatmap', err);
       if (svgHost) svgHost.style.display = '';
       if (aerialHost) aerialHost.style.display = 'none';
     }
   }
   // Floor-plan editor loads as a separate script — wait for it.
   if (window.SunspotPlan) buildBookView();
   else {
     let tries = 0;
     const t = setInterval(() => {
       if (window.SunspotPlan) { clearInterval(t); buildBookView(); }
       else if (++tries > 40) { clearInterval(t); /* give up */ }
     }, 100);
   }

   // Checkout hand-off (mirrors seatmap.js so checkout.html keeps working)
   checkoutBtn.addEventListener('click', () => {
     if (selected.size === 0) return;
     const seats = Array.from(selected.values()).map(s => ({
       id: s.id, type: s.type, price: PRICE[s.type] || 0,
     }));
     const subtotal = seats.reduce((a, b) => a + b.price, 0);
     const fee      = Math.round(subtotal * 0.08);
     const photo    = (club.photos && club.photos[0]) || '';
     const pending  = {
       clubId:       club.id,
       clubName:     club.name,
       clubLocation: club.location,
       photo:        photo,
       date:         dateLabel,
       dateISO:      dateISO,
       guests:       guests,
       seats:        seats,
       subtotal:     subtotal,
       fee:          fee,
       total:        subtotal + fee,
     };
     try { localStorage.setItem('sunspot_pending', JSON.stringify(pending)); }
     catch (e) { alert('Could not save your selection — please try again.'); return; }
     window.location.href = 'checkout.html';
   });
 }

 if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', boot);
 } else {
   boot();
 }
})();
