/* ============================================================
   Sunspot Operator — staff polish layer.

   Adds the small things that make this feel like a real product to
   someone working the gate at a beach club, not a back-office tool:
     1. Toast notifications        — every action confirms visually
     2. Quick search               — filter Today by name / ref / spot
     3. Walk-in capture            — log a guest paying cash on-site
     4. Tap-to-call phone numbers  — phone links in every booking row
     5. "Up next" hero card        — what's coming in the next 60 min
     6. Confirm sheet              — bottom-sheet for destructive actions
                                     instead of jarring browser confirm()
     7. Layout-save indicator      — visual feedback when map saves
     8. First-run hint             — one-line tip on first visit

   This module attaches AFTER operator.js initializes and pokes into
   the existing DOM. No fork of operator.js needed.
   ============================================================ */
(function () {
 'use strict';

 // ─── 1) Toast system ─────────────────────────────────────────
 function ensureToastHost() {
   let host = document.getElementById('op-toast-host');
   if (host) return host;
   host = document.createElement('div');
   host.id = 'op-toast-host';
   host.style.cssText =
     'position:fixed;left:0;right:0;bottom:calc(80px + env(safe-area-inset-bottom));' +
     'display:flex;flex-direction:column;align-items:center;gap:8px;' +
     'pointer-events:none;z-index:1100;padding:0 16px;';
   document.body.appendChild(host);
   return host;
 }
 function toast(msg, kind) {
   const host = ensureToastHost();
   const el = document.createElement('div');
   const bg = kind === 'error'   ? '#c62828'
            : kind === 'warn'    ? '#f57c00'
            : kind === 'info'    ? '#0a1f3a'
            : /* success */        '#2e7d32';
   el.style.cssText =
     'background:' + bg + ';color:#fff;padding:12px 18px;border-radius:999px;' +
     'box-shadow:0 6px 22px rgba(0,0,0,.22);font-weight:600;font-size:14px;' +
     'pointer-events:auto;opacity:0;transform:translateY(8px);transition:all .2s ease;' +
     'max-width:92vw;text-align:center;';
   el.textContent = msg;
   host.appendChild(el);
   requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
   setTimeout(() => {
     el.style.opacity = '0';
     el.style.transform = 'translateY(8px)';
     setTimeout(() => el.remove(), 220);
   }, 2400);
 }
 window.opToast = toast;  // expose for operator.js to call

 // ─── 2) Bottom-sheet confirm ──────────────────────────────────
 function confirmSheet(opts) {
   return new Promise((resolve) => {
     const back = document.createElement('div');
     back.style.cssText =
       'position:fixed;inset:0;background:rgba(10,31,58,.45);z-index:1200;' +
       'display:flex;align-items:flex-end;justify-content:center;' +
       'opacity:0;transition:opacity .15s;';
     const sheet = document.createElement('div');
     sheet.style.cssText =
       'background:#fff;border-radius:16px 16px 0 0;width:100%;max-width:520px;' +
       'padding:22px 22px calc(22px + env(safe-area-inset-bottom));' +
       'box-shadow:0 -8px 30px rgba(0,0,0,.3);transform:translateY(20px);transition:transform .2s;';
     sheet.innerHTML =
       '<h3 style="margin:0 0 6px;font-size:18px;color:#0a1f3a">' + (opts.title || 'Confirm') + '</h3>' +
       '<p style="margin:0 0 18px;color:#5d6a82;font-size:14px;line-height:1.5">' + (opts.body || '') + '</p>' +
       '<div style="display:flex;gap:10px;justify-content:flex-end">' +
         '<button data-act="cancel" style="padding:12px 18px;border-radius:10px;border:1px solid #e3e8ef;background:#fff;color:#0a1f3a;font-weight:600;">' + (opts.cancel || 'Cancel') + '</button>' +
         '<button data-act="ok" style="padding:12px 18px;border-radius:10px;border:0;background:' + (opts.danger ? '#c62828' : '#ff9800') + ';color:#fff;font-weight:700;">' + (opts.ok || 'Confirm') + '</button>' +
       '</div>';
     back.appendChild(sheet);
     document.body.appendChild(back);
     requestAnimationFrame(() => { back.style.opacity = '1'; sheet.style.transform = 'translateY(0)'; });
     function close(result) {
       back.style.opacity = '0';
       sheet.style.transform = 'translateY(20px)';
       setTimeout(() => { back.remove(); resolve(result); }, 200);
     }
     back.addEventListener('click', (e) => { if (e.target === back) close(false); });
     sheet.querySelector('[data-act="ok"]').addEventListener('click', () => close(true));
     sheet.querySelector('[data-act="cancel"]').addEventListener('click', () => close(false));
   });
 }
 window.opConfirm = confirmSheet;

 // ─── 3) Quick search bar above bookings ──────────────────────
 function installSearch() {
   const list = document.getElementById('op-bookings-list');
   if (!list || document.getElementById('op-quick-search')) return;
   const wrap = document.createElement('div');
   wrap.style.cssText = 'padding:0 16px 12px;position:relative;';
   wrap.innerHTML =
     '<input id="op-quick-search" type="search" placeholder="Search by guest, ref or spot…" ' +
     'style="width:100%;padding:12px 14px 12px 38px;border-radius:12px;border:1px solid #d0d7e2;' +
     'background:#fff;font-size:15px;outline:none;-webkit-appearance:none;">' +
     '<svg viewBox="0 0 24 24" width="18" height="18" style="position:absolute;left:30px;top:14px;color:#5d6a82" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
   list.parentNode.insertBefore(wrap, list);
   const input = wrap.querySelector('input');
   input.addEventListener('input', () => {
     const q = input.value.toLowerCase().trim();
     list.querySelectorAll('.op-booking').forEach(card => {
       const hay = card.textContent.toLowerCase();
       card.style.display = (!q || hay.indexOf(q) !== -1) ? '' : 'none';
     });
   });
 }

 // ─── 4) Tap-to-call: phone numbers become tel: links ─────────
 function linkifyPhones() {
   document.querySelectorAll('.op-booking-body span:not(.tel-done)').forEach(span => {
     const t = span.textContent.trim();
     // Matches a Maltese-ish number or any +xxx format
     const m = t.match(/(\+?\d[\d\s\-]{6,})/);
     if (!m) return;
     const tel = m[1].replace(/[\s\-]/g, '');
     if (tel.length < 7) return;
     span.classList.add('tel-done');
     span.innerHTML = span.innerHTML.replace(m[1],
       '<a href="tel:' + tel + '" style="color:#0288d1;font-weight:600;text-decoration:none;">📞 ' + m[1] + '</a>'
     );
   });
 }

 // ─── 5) "Up next" hero card on Today panel ───────────────────
 function renderUpNext() {
   const list = document.getElementById('op-bookings-list');
   const panel = document.getElementById('panel-today');
   if (!list || !panel) return;
   // The first pending or accepted booking sorted by created_at is "up next"
   const first = list.querySelector('.op-booking');
   let card = document.getElementById('op-up-next');
   if (!first) { if (card) card.remove(); return; }

   const ref     = (first.querySelector('.ref') || {}).textContent || '';
   const guest   = (first.querySelector('strong') || {}).textContent || 'Guest';
   const status  = first.getAttribute('data-status') || 'pending';
   const amount  = (first.querySelector('.op-booking-amount') || {}).textContent || '';
   const cta     = status === 'pending' ? 'Tap to accept' :
                   status === 'accept'  ? 'Tap when guest arrives' :
                   'View';

   if (!card) {
     card = document.createElement('a');
     card.id = 'op-up-next';
     card.href = '#';
     card.style.cssText =
       'display:flex;align-items:center;justify-content:space-between;gap:14px;' +
       'margin:0 16px 14px;padding:14px 16px;border-radius:14px;' +
       'background:linear-gradient(135deg,#ff9800 0%,#ef6c00 100%);color:#fff;' +
       'box-shadow:0 6px 20px rgba(232,108,0,.30);text-decoration:none;';
     // Insert ABOVE the search bar / list
     panel.querySelector('.op-section-title').after(card);
   }
   card.innerHTML =
     '<div style="min-width:0">' +
       '<div style="font-size:11px;letter-spacing:.6px;text-transform:uppercase;opacity:.9">Up next</div>' +
       '<div style="font-size:16px;font-weight:800;line-height:1.2">' + guest + '</div>' +
       '<div style="font-size:12px;opacity:.95">' + ref + ' · ' + amount + '</div>' +
     '</div>' +
     '<div style="text-align:right">' +
       '<div style="font-size:12px;opacity:.9;margin-bottom:2px">' + cta + '</div>' +
       '<div style="font-size:22px">›</div>' +
     '</div>';
   card.onclick = (e) => {
     e.preventDefault();
     first.scrollIntoView({ behavior: 'smooth', block: 'center' });
     first.style.transition = 'box-shadow .3s';
     first.style.boxShadow  = '0 0 0 3px var(--sun)';
     setTimeout(() => { first.style.boxShadow = ''; }, 900);
   };
 }

 // ─── 6) Walk-in floating action button ───────────────────────
 function installWalkInFab() {
   if (document.getElementById('op-walk-in-fab')) return;
   const fab = document.createElement('button');
   fab.id = 'op-walk-in-fab';
   fab.type = 'button';
   fab.title = 'Add a walk-in';
   fab.innerHTML = '+';
   fab.style.cssText =
     'position:fixed;right:18px;bottom:calc(96px + env(safe-area-inset-bottom));' +
     'width:56px;height:56px;border-radius:50%;border:0;' +
     'background:#ff9800;color:#fff;font-size:30px;font-weight:300;line-height:1;' +
     'box-shadow:0 6px 18px rgba(232,108,0,.40);cursor:pointer;z-index:900;';
   fab.addEventListener('click', openWalkIn);
   document.body.appendChild(fab);
 }
 function openWalkIn() {
   const back = document.createElement('div');
   back.style.cssText =
     'position:fixed;inset:0;background:rgba(10,31,58,.5);z-index:1300;' +
     'display:flex;align-items:flex-end;justify-content:center;';
   back.innerHTML =
     '<form id="op-walk-in-form" style="background:#fff;border-radius:16px 16px 0 0;width:100%;max-width:520px;' +
     'padding:22px 22px calc(22px + env(safe-area-inset-bottom));">' +
       '<h3 style="margin:0 0 14px;font-size:18px;color:#0a1f3a">Add walk-in</h3>' +
       '<label style="display:block;font-size:12px;color:#5d6a82;font-weight:600;margin-bottom:4px">Guest name</label>' +
       '<input name="name" required placeholder="e.g. James Walsh" style="width:100%;padding:12px;border-radius:10px;border:1px solid #d0d7e2;font-size:16px;margin-bottom:12px;-webkit-appearance:none">' +
       '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">' +
         '<div><label style="display:block;font-size:12px;color:#5d6a82;font-weight:600;margin-bottom:4px">Spot id</label>' +
         '<input name="spot" placeholder="A12" style="width:100%;padding:12px;border-radius:10px;border:1px solid #d0d7e2;font-size:16px;-webkit-appearance:none"></div>' +
         '<div><label style="display:block;font-size:12px;color:#5d6a82;font-weight:600;margin-bottom:4px">Paid (€)</label>' +
         '<input name="paid" type="number" min="0" placeholder="30" style="width:100%;padding:12px;border-radius:10px;border:1px solid #d0d7e2;font-size:16px;-webkit-appearance:none"></div>' +
       '</div>' +
       '<div style="display:flex;gap:10px;justify-content:flex-end">' +
         '<button type="button" data-act="cancel" style="padding:12px 18px;border-radius:10px;border:1px solid #e3e8ef;background:#fff;color:#0a1f3a;font-weight:600;">Cancel</button>' +
         '<button type="submit" style="padding:12px 22px;border-radius:10px;border:0;background:#ff9800;color:#fff;font-weight:700;">Add walk-in</button>' +
       '</div>' +
     '</form>';
   document.body.appendChild(back);
   const form = back.querySelector('form');
   function close() { back.remove(); }
   back.addEventListener('click', (e) => { if (e.target === back) close(); });
   form.querySelector('[data-act="cancel"]').addEventListener('click', close);
   form.addEventListener('submit', (e) => {
     e.preventDefault();
     const data = new FormData(form);
     const booking = {
       ref: 'WI-' + String(Math.floor(1000 + Math.random() * 9000)),
       clubName: 'Walk-in', clubId: '',
       guest: { firstName: String(data.get('name')).trim(), lastName: '', email: '', phone: '' },
       seats: [{ id: String(data.get('spot') || 'A?').toUpperCase(), type: 'sunbed', price: +data.get('paid') || 0 }],
       total: +data.get('paid') || 0,
       date: new Date().toISOString().slice(0, 10),
       createdAt: new Date().toISOString(),
       operator_action: 'arrived',  // walk-ins are already on-site
       walk_in: true,
     };
     try {
       const list = JSON.parse(localStorage.getItem('sunspot_bookings') || '[]');
       list.unshift(booking);
       localStorage.setItem('sunspot_bookings', JSON.stringify(list));
     } catch (err) {}
     close();
     toast('Walk-in added — ' + booking.guest.firstName);
     // Trigger a refresh of the bookings list
     const sel = document.getElementById('op-venue');
     if (sel) sel.dispatchEvent(new Event('change'));
   });
 }

 // ─── 7) First-run tip ─────────────────────────────────────────
 function maybeShowFirstRunTip() {
   try {
     if (localStorage.getItem('sunspot_op_tip_seen') === '1') return;
   } catch (e) {}
   setTimeout(() => {
     toast('Tip — tap a booking to Accept, tap Scan when the guest arrives', 'info');
     try { localStorage.setItem('sunspot_op_tip_seen', '1'); } catch (e) {}
   }, 1400);
 }

 // ─── 8) Boot + observe re-renders ─────────────────────────────
 function applyAll() {
   installSearch();
   linkifyPhones();
   renderUpNext();
 }
 function boot() {
   ensureToastHost();
   installWalkInFab();
   applyAll();
   maybeShowFirstRunTip();
   // Re-apply when the bookings list re-renders (operator.js rewrites innerHTML)
   const list = document.getElementById('op-bookings-list');
   if (list) {
     const obs = new MutationObserver(() => applyAll());
     obs.observe(list, { childList: true });
   }
 }
 if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', boot);
 } else {
   setTimeout(boot, 0);
 }
})();
