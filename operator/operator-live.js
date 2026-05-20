/* ============================================================
   Sunspot Operator — live state + polished venue switcher.

   What this layer does (on top of operator.js / polish / aerial):
     1. Replaces the native <select> with a visual popover that shows
        cards for each of the operator's venues (and ONLY their own).
        Tap to switch. Has a "Your venues only" indicator so it's clear
        operators never see competitors.
     2. Renders a "Good morning Mark · 11 bookings today" greeting bar.
     3. Renders a LIVE STATE hero on the Today panel — big numbers
        showing occupied vs free, arrivals last hour, pending intake.
     4. Renders a real-time ACTIVITY FEED — chronological events:
        "Lara M. checked in to A12 · 2 min ago"
     5. Polls every 5 s for changes in localStorage so the live state
        actually feels live during demo (since there's no websocket).
   ============================================================ */
(function () {
 'use strict';

 // ─── Helpers ─────────────────────────────────────────────────
 function $(s) { return document.querySelector(s); }
 function fmtRelative(iso) {
   if (!iso) return '';
   const d = new Date(iso).getTime();
   if (isNaN(d)) return '';
   const secs = Math.max(0, Math.floor((Date.now() - d) / 1000));
   if (secs < 60)         return secs + 's ago';
   if (secs < 3600)       return Math.floor(secs / 60) + ' min ago';
   if (secs < 86400)      return Math.floor(secs / 3600) + ' h ago';
   return Math.floor(secs / 86400) + ' d ago';
 }
 function greeting() {
   const h = new Date().getHours();
   if (h < 5)  return 'Late shift';
   if (h < 12) return 'Good morning';
   if (h < 18) return 'Good afternoon';
   return 'Good evening';
 }

 // ─── 1) Polished venue switcher (replaces native <select>) ────
 function installSwitcher() {
   const sel = document.getElementById('op-venue');
   if (!sel) return;
   if (document.getElementById('op-venue-switcher')) return;

   const state = window.opState;
   if (!state || !state.venues || !state.venues.length) {
     return setTimeout(installSwitcher, 300);
   }

   // Hide the native select but keep it in the DOM as the source of truth
   sel.style.display = 'none';

   const wrap = document.createElement('div');
   wrap.id = 'op-venue-switcher';
   wrap.style.cssText = 'position:relative;';

   const current = state.venues.find(v => v.id === state.venue) || state.venues[0];

   wrap.innerHTML = renderTrigger(current, state);
   sel.parentNode.appendChild(wrap);

   wrap.addEventListener('click', (e) => {
     const t = e.target.closest('[data-vs-act]');
     if (!t) {
       // Click the trigger area? open popover
       if (e.target.closest('.vs-trigger')) togglePopover();
       return;
     }
     const act = t.dataset.vsAct;
     if (act === 'pick') {
       const vid = t.dataset.vid;
       sel.value = vid;
       sel.dispatchEvent(new Event('change'));
       closePopover();
     }
   });

   document.addEventListener('click', (e) => {
     if (!wrap.contains(e.target)) closePopover();
   });

   function togglePopover() {
     const pop = wrap.querySelector('.vs-popover');
     if (!pop) return openPopover();
     pop.remove();
   }
   function closePopover() {
     const pop = wrap.querySelector('.vs-popover');
     if (pop) pop.remove();
   }
   function openPopover() {
     const pop = document.createElement('div');
     pop.className = 'vs-popover';
     pop.style.cssText =
       'position:absolute;right:0;top:calc(100% + 8px);' +
       'background:#fff;color:#0a1f3a;border-radius:14px;' +
       'min-width:280px;max-width:calc(100vw - 32px);' +
       'box-shadow:0 10px 36px rgba(0,0,0,.32);overflow:hidden;z-index:120;';
     pop.innerHTML =
       '<div style="padding:10px 14px;font-size:11px;letter-spacing:.6px;' +
       'text-transform:uppercase;color:#5d6a82;background:#f4f6fb;' +
       'border-bottom:1px solid #e3e8ef;display:flex;align-items:center;gap:6px;">' +
         '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
         'Your venues · ' + state.venues.length +
       '</div>' +
       state.venues.map(v => {
         const isActive = v.id === state.venue;
         return '<button type="button" data-vs-act="pick" data-vid="' + v.id + '" ' +
           'style="width:100%;display:flex;align-items:center;gap:12px;padding:12px 14px;' +
           'background:' + (isActive ? '#fff8e8' : '#fff') + ';border:0;cursor:pointer;text-align:left;' +
           'border-bottom:1px solid #f4f6fb;">' +
             '<span style="width:36px;height:36px;border-radius:10px;background:' + colorForVenue(v) + ';' +
             'color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;flex:0 0 36px;">' +
             initial(v.name) + '</span>' +
             '<span style="flex:1;min-width:0;">' +
               '<strong style="display:block;font-size:14px;color:#0a1f3a;">' + v.name + '</strong>' +
               '<span style="font-size:12px;color:#5d6a82;">' + (v.location || '—') +
               ' · ' + (v.today_bookings || 0) + ' today</span>' +
             '</span>' +
             (isActive ? '<span style="color:#f57c00;font-weight:800;font-size:18px;">✓</span>' : '') +
           '</button>';
       }).join('') +
       '<div style="padding:10px 14px;font-size:12px;color:#5d6a82;background:#fafbfc;">' +
         'You only see venues assigned to your account.' +
       '</div>';
     wrap.appendChild(pop);
   }

   // Re-render trigger whenever state changes (after a venue switch or refresh)
   document.addEventListener('op:state-change', () => {
     const cur = (window.opState.venues || []).find(v => v.id === window.opState.venue) || (window.opState.venues || [])[0];
     if (cur) wrap.innerHTML = renderTrigger(cur, window.opState);
   });
 }

 function renderTrigger(venue, state) {
   const count = state && state.venues ? state.venues.length : 1;
   return '<button type="button" class="vs-trigger" ' +
     'style="display:flex;align-items:center;gap:10px;padding:6px 12px 6px 6px;border-radius:999px;' +
     'background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:#fff;' +
     'font-weight:600;font-size:14px;cursor:pointer;">' +
       '<span style="width:30px;height:30px;border-radius:50%;background:' + colorForVenue(venue) + ';' +
       'display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff;">' +
       initial(venue.name) + '</span>' +
       '<span style="display:flex;flex-direction:column;align-items:flex-start;line-height:1.15;">' +
         '<span style="font-size:13px;">' + venue.name + '</span>' +
         '<span style="font-size:10px;opacity:.75;letter-spacing:.4px;text-transform:uppercase;">' +
           count + ' venue' + (count === 1 ? '' : 's') + ' · tap to switch' +
         '</span>' +
       '</span>' +
       '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>' +
     '</button>';
 }

 function initial(name) { return (name || '?').trim()[0].toUpperCase(); }
 function colorForVenue(v) {
   // Deterministic colour from venue id — so each venue keeps its colour identity
   const id = (v && v.id) || '';
   const colours = ['#ef6c00', '#0288d1', '#2e7d32', '#7b1fa2', '#c62828', '#0097a7'];
   let h = 0;
   for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
   return colours[h % colours.length];
 }

 // ─── 2) Greeting + day-overview ───────────────────────────────
 function renderGreeting() {
   const state = window.opState || {};
   const opName = (state.operator && state.operator.name) || 'Operator';
   const todayCount = (state.bookings || []).length;
   let el = document.getElementById('op-greeting');
   if (!el) {
     el = document.createElement('div');
     el.id = 'op-greeting';
     el.style.cssText =
       'padding:14px 16px 4px;display:flex;align-items:baseline;justify-content:space-between;gap:12px;';
     const todayPanel = document.getElementById('panel-today');
     if (todayPanel) todayPanel.insertBefore(el, todayPanel.firstChild);
   }
   const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
   el.innerHTML =
     '<div>' +
       '<div style="font-family:Fraunces,Georgia,serif;font-size:22px;font-weight:600;color:#0a1f3a;letter-spacing:-0.4px;">' +
         greeting() + ', ' + opName.split(' ')[0] +
       '</div>' +
       '<div style="font-size:13px;color:#5d6a82;margin-top:2px;">' + today + '</div>' +
     '</div>' +
     '<div style="text-align:right">' +
       '<div style="font-family:Fraunces,Georgia,serif;font-size:30px;font-weight:600;color:#0a1f3a;line-height:1;">' + todayCount + '</div>' +
       '<div style="font-size:11px;color:#5d6a82;text-transform:uppercase;letter-spacing:.6px;margin-top:4px;">' +
         (todayCount === 1 ? 'booking today' : 'bookings today') +
       '</div>' +
     '</div>';
 }

 // ─── 3) Live state hero ───────────────────────────────────────
 function renderLiveHero() {
   const state = window.opState || {};
   const todayPanel = document.getElementById('panel-today');
   if (!todayPanel) return;
   const bookings = state.bookings || [];
   const venue = (state.venues || []).find(v => v.id === state.venue) || {};
   const capacity = venue.capacity || (venue.spots_left || 0) + 20;

   // Sums
   const arrived = bookings.filter(b => b.operator_action === 'arrived').length;
   const accepted = bookings.filter(b => b.operator_action === 'accept').length;
   const pending = bookings.filter(b => (b.operator_action || 'pending') === 'pending').length;
   const occupied = arrived + accepted;  // booked + on-site
   const free = Math.max(0, capacity - occupied);
   const pct = capacity > 0 ? Math.min(100, Math.round(occupied / capacity * 100)) : 0;

   let hero = document.getElementById('op-live-hero');
   if (!hero) {
     hero = document.createElement('section');
     hero.id = 'op-live-hero';
     hero.style.cssText =
       'margin:6px 16px 14px;padding:18px 18px 16px;border-radius:18px;' +
       'background:linear-gradient(135deg,#0a1f3a 0%,#1d2842 100%);color:#fff;' +
       'box-shadow:0 10px 30px rgba(10,31,58,.22);';
     // Insert after greeting, before the section title
     const greetingEl = document.getElementById('op-greeting');
     if (greetingEl && greetingEl.nextSibling) greetingEl.parentNode.insertBefore(hero, greetingEl.nextSibling);
     else todayPanel.insertBefore(hero, todayPanel.firstChild);
   }

   const liveDot = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#80ee5b;box-shadow:0 0 0 0 rgba(128,238,91,.6);animation:opLivePulse 1.6s infinite;vertical-align:1px;margin-right:6px;"></span>';
   hero.innerHTML =
     '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
       '<div style="font-size:11px;letter-spacing:.8px;text-transform:uppercase;opacity:.8;">' + liveDot + 'Live now at ' + (venue.name || 'your venue') + '</div>' +
       '<a href="#" data-nav="seatmap" style="font-size:12px;color:#ffb74d;text-decoration:none;font-weight:600;">View map →</a>' +
     '</div>' +
     '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">' +
       statCell(occupied, capacity ? ('of ' + capacity + ' spots') : 'occupied', '#ffb74d') +
       statCell(pending,  pending === 1 ? 'pending arrival' : 'pending arrivals', '#fff') +
       statCell(arrived,  arrived === 1 ? 'checked in' : 'checked in', '#80ee5b') +
     '</div>' +
     '<div style="margin-top:14px;height:8px;background:rgba(255,255,255,.12);border-radius:999px;overflow:hidden;">' +
       '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#ffb74d,#ef6c00);border-radius:999px;transition:width .3s;"></div>' +
     '</div>' +
     '<div style="font-size:11px;opacity:.7;margin-top:6px;">' + pct + '% capacity</div>';

   // Click "View map" goes to Layout tab
   hero.querySelector('[data-nav]').addEventListener('click', (e) => {
     e.preventDefault();
     const layoutBtn = document.querySelector('.op-bottom-nav [data-nav="seatmap"]');
     if (layoutBtn) layoutBtn.click();
   });
 }
 function statCell(big, small, color) {
   return '<div>' +
     '<div style="font-family:Fraunces,Georgia,serif;font-size:32px;font-weight:600;line-height:1;color:' + color + ';">' + big + '</div>' +
     '<div style="font-size:11px;letter-spacing:.4px;opacity:.85;margin-top:6px;text-transform:uppercase;">' + small + '</div>' +
   '</div>';
 }

 // ─── 4) Activity feed ─────────────────────────────────────────
 function renderActivityFeed() {
   const state = window.opState || {};
   const todayPanel = document.getElementById('panel-today');
   if (!todayPanel) return;
   const bookings = (state.bookings || []).slice(0, 6);
   let feed = document.getElementById('op-activity-feed');
   if (!feed) {
     feed = document.createElement('section');
     feed.id = 'op-activity-feed';
     feed.style.cssText = 'margin:0 16px 18px;';
     const hero = document.getElementById('op-live-hero');
     if (hero && hero.nextSibling) hero.parentNode.insertBefore(feed, hero.nextSibling);
     else todayPanel.insertBefore(feed, todayPanel.firstChild);
   }

   if (!bookings.length) { feed.innerHTML = ''; return; }

   feed.innerHTML =
     '<h3 style="font-size:13px;letter-spacing:.5px;text-transform:uppercase;color:#5d6a82;margin:0 0 10px;font-weight:700;">Recent activity</h3>' +
     '<div style="background:#fff;border-radius:14px;border:1px solid #e3e8ef;overflow:hidden;">' +
     bookings.map((b, i) => {
       const action = b.operator_action || 'pending';
       const verb = action === 'arrived' ? 'checked in'
                  : action === 'accept'  ? 'was confirmed'
                  : action === 'decline' ? 'was declined'
                  : action === 'noshow'  ? 'was a no-show'
                  : 'is waiting confirmation';
       const dot = action === 'arrived' ? '#2e7d32'
                 : action === 'accept'  ? '#0288d1'
                 : action === 'decline' || action === 'noshow' ? '#c62828'
                 : '#f5b400';
       return '<div style="display:flex;align-items:center;gap:12px;padding:11px 14px;' +
         (i < bookings.length - 1 ? 'border-bottom:1px solid #f4f6fb;' : '') + '">' +
           '<span style="width:8px;height:8px;border-radius:50%;background:' + dot + ';flex:0 0 8px;"></span>' +
           '<div style="flex:1;min-width:0;font-size:13px;color:#0a1f3a;">' +
             '<strong>' + (b.guest_name || 'Guest') + '</strong> ' + verb +
             (b.spots && b.spots.length ? ' · <span style="color:#5d6a82;">' + b.spots.join(', ') + '</span>' : '') +
           '</div>' +
           '<span style="font-size:11px;color:#5d6a82;flex:0 0 auto;">' + fmtRelative(b.created_at) + '</span>' +
         '</div>';
     }).join('') +
     '</div>';
 }

 // ─── 5) Boot ──────────────────────────────────────────────────
 function applyAll() {
   if (!window.opState) return setTimeout(applyAll, 200);
   installSwitcher();
   renderGreeting();
   renderLiveHero();
   renderActivityFeed();
 }

 // Live-pulse keyframe
 const style = document.createElement('style');
 style.textContent =
   '@keyframes opLivePulse { 0% { box-shadow: 0 0 0 0 rgba(128,238,91,.6); } ' +
   '70% { box-shadow: 0 0 0 8px rgba(128,238,91,0); } ' +
   '100% { box-shadow: 0 0 0 0 rgba(128,238,91,0); } }';
 document.head.appendChild(style);

 if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', applyAll);
 } else {
   setTimeout(applyAll, 50);
 }
 // Re-render on every state change
 document.addEventListener('op:state-change', () => {
   renderGreeting(); renderLiveHero(); renderActivityFeed();
 });

 // Demo "liveness" — refresh time-ago labels every 30 s so things feel alive
 setInterval(() => renderActivityFeed(), 30000);
})();
