/* ============================================================
   Sunspot Operator — brand polish + warm greeting.

   1) Brand polish CSS
      - Fraunces display type for headings + big numbers
      - Limestone background tone instead of cold grey
      - Booking cards: warm card surface, Fraunces ref
      - Live hero: signature sun gradient instead of pure navy
      - Sidebar: real Sunspot brand mark (sun-ray SVG)
      - Sun-ray ornament between sections

   2) Greeting upgrade
      - Time-of-day welcome with first name
      - Live clock — updates every minute (operators want to know
        the time at a glance, they're working a shift)
      - Friendly micro-copy that changes by hour
   ============================================================ */
(function () {
 'use strict';

 // ─── Brand polish CSS ─────────────────────────────────────────
 function injectCss() {
   if (document.getElementById('op-brand-css')) return;
   const css = document.createElement('style');
   css.id = 'op-brand-css';
   css.textContent = `
     :root {
       --sun:        #ff9800;
       --sun-deep:   #ef6c00;
       --honey:      #e89d3a;
       --terracotta: #c0563b;
       --limestone:  #fdf6e8;       /* warm card / panel surface */
       --limestone-2: #f8edd6;
       --balcony:    #2f6e5b;
       --ink:        #0a1f3a;
       --ink-soft:   #1d2842;
       --grad-sun:   linear-gradient(135deg, #ffb74d 0%, #f57c00 60%, #c0563b 100%);
       --grad-warm-ink: linear-gradient(135deg, #0a1f3a 0%, #1d2842 55%, #3b2a1a 100%);
       --font-display: 'Fraunces', 'Iowan Old Style', Georgia, serif;
       --font-body:    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
     }

     /* Warm background (limestone) instead of cold grey */
     body { background: #faf6ee !important; font-family: var(--font-body) !important; }

     /* === Display type === */
     h1, h2, h3, .op-greeting-h, .op-stat-big, .num, .money, .booking-total {
       font-family: var(--font-display);
       font-weight: 600;
       letter-spacing: -0.015em;
     }

     /* === Sidebar — better brand mark + warmer dark === */
     #op-sidebar {
       background: var(--grad-warm-ink) !important;
     }
     #op-sidebar .sb-brand-mark {
       background: transparent !important;
       box-shadow: none !important;
       position: relative;
     }
     #op-sidebar .sb-brand-mark::after { content: none !important; }
     #op-sidebar .sb-brand-mark {
       background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><g stroke='%23ffb74d' stroke-width='2' stroke-linecap='round' opacity='0.7'><line x1='20' y1='2' x2='20' y2='6'/><line x1='20' y1='34' x2='20' y2='38'/><line x1='2' y1='20' x2='6' y2='20'/><line x1='34' y1='20' x2='38' y2='20'/><line x1='7' y1='7' x2='10' y2='10'/><line x1='30' y1='30' x2='33' y2='33'/><line x1='33' y1='7' x2='30' y2='10'/><line x1='10' y1='30' x2='7' y2='33'/></g><circle cx='20' cy='20' r='11' fill='%23ff9800'/><circle cx='20' cy='20' r='9' fill='%23ffb74d'/><circle cx='24' cy='16' r='3' fill='%23fff5e1'/></svg>") !important;
       background-size: contain !important;
       background-repeat: no-repeat !important;
       background-position: center !important;
       animation: opBrandPulse 3.6s ease-in-out infinite;
     }
     @keyframes opBrandPulse {
       0%, 100% { transform: scale(1); }
       50%      { transform: scale(1.06); }
     }
     #op-sidebar .sb-brand-text strong { font-family: var(--font-display); font-size: 18px; }

     /* === Top bar (mobile) — warm gradient instead of flat navy === */
     .op-topbar {
       background: var(--grad-warm-ink) !important;
     }

     /* === Live hero — signature sun-gradient framing === */
     #op-live-hero {
       background: linear-gradient(135deg, #0a1f3a 0%, #1d2842 60%) !important;
       position: relative;
       overflow: hidden;
     }
     #op-live-hero::before {
       /* Subtle radial sun-flare in the top-right corner */
       content: '';
       position: absolute;
       top: -40%; right: -10%;
       width: 320px; height: 320px;
       background: radial-gradient(circle, rgba(255,183,77,.22) 0%, transparent 65%);
       pointer-events: none;
     }
     #op-live-hero > * { position: relative; }

     /* === Booking cards — warmer surface, premium === */
     .op-booking {
       background: #fff !important;
       border: 1px solid rgba(192, 134, 59, .15) !important;
       box-shadow: 0 1px 2px rgba(10,31,58,.04), 0 6px 18px rgba(232,157,58,.07) !important;
       border-radius: 14px !important;
       padding: 14px 16px !important;
       margin: 0 16px 10px !important;
     }
     .op-booking-head strong { font-family: var(--font-display); font-size: 16px; }
     .op-booking .ref {
       font-family: var(--font-display) !important;
       font-weight: 600;
       letter-spacing: -0.01em;
       color: var(--ink) !important;
       font-size: 13px !important;
     }
     .op-booking-amount {
       font-family: var(--font-display) !important;
       font-size: 22px !important;
       font-weight: 600 !important;
       color: var(--ink) !important;
     }
     .op-booking-tag {
       text-transform: lowercase !important;
       letter-spacing: .2px !important;
     }
     .op-booking-actions button {
       border-radius: 999px !important;
       font-weight: 700 !important;
       padding: 9px 16px !important;
     }
     .op-booking-actions .accept {
       background: var(--grad-sun) !important;
       color: #fff !important;
       border: 0 !important;
       box-shadow: 0 3px 10px rgba(232,108,0,.30) !important;
     }
     .op-booking-actions .decline {
       background: #fff !important;
       color: #c62828 !important;
       border: 1px solid rgba(198,40,40,.30) !important;
     }

     /* === Filter chips — warm pill style === */
     .op-chip {
       background: #fff !important;
       border: 1px solid rgba(192, 134, 59, .25) !important;
       color: var(--ink) !important;
       border-radius: 999px !important;
       font-weight: 600 !important;
     }
     .op-chip.active {
       background: var(--ink) !important;
       color: #fff !important;
       border-color: var(--ink) !important;
     }
     .op-chip .count {
       background: rgba(255,255,255,.18);
       color: inherit;
       padding: 1px 7px;
       border-radius: 999px;
       margin-left: 4px;
       font-size: 11px;
       font-weight: 700;
     }

     /* === Stats strip — premium numbers === */
     .op-stats {
       background: #fff !important;
       border: 1px solid rgba(192, 134, 59, .15) !important;
       border-radius: 16px !important;
       padding: 16px 18px !important;
       box-shadow: 0 1px 3px rgba(10,31,58,.04);
     }
     .op-stats .num {
       font-family: var(--font-display) !important;
       font-size: 28px !important;
       font-weight: 600 !important;
     }
     .op-stats .label {
       letter-spacing: .6px;
       text-transform: uppercase;
       color: var(--muted) !important;
       font-size: 10px !important;
       font-weight: 700 !important;
     }

     /* === Section sub-headings (Bookings queue, Recent activity) === */
     #panel-today > h3, #op-activity-feed h3 {
       font-family: var(--font-body) !important;
       letter-spacing: .8px !important;
       text-transform: uppercase !important;
       font-size: 11px !important;
       color: #8a7048 !important;
     }
     #op-activity-feed > div {
       border: 1px solid rgba(192, 134, 59, .15) !important;
       box-shadow: 0 1px 2px rgba(10,31,58,.04);
     }

     /* === Sun-ray ornament between sections === */
     .op-ornament {
       display: flex; align-items: center; justify-content: center; gap: 14px;
       margin: 18px 16px; opacity: .55;
     }
     .op-ornament::before, .op-ornament::after {
       content: ''; flex: 0 1 60px; height: 1px;
       background: linear-gradient(90deg, transparent, rgba(192,134,59,.5), transparent);
     }
     .op-ornament span {
       width: 14px; height: 14px;
       background: var(--grad-sun);
       mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><circle cx='12' cy='12' r='5'/><g stroke='black' stroke-width='1.6' stroke-linecap='round'><line x1='12' y1='1' x2='12' y2='4'/><line x1='12' y1='20' x2='12' y2='23'/><line x1='1' y1='12' x2='4' y2='12'/><line x1='20' y1='12' x2='23' y2='12'/><line x1='4' y1='4' x2='6' y2='6'/><line x1='18' y1='18' x2='20' y2='20'/><line x1='20' y1='4' x2='18' y2='6'/><line x1='6' y1='18' x2='4' y2='20'/></g></svg>") center / contain no-repeat;
       -webkit-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><circle cx='12' cy='12' r='5'/><g stroke='black' stroke-width='1.6' stroke-linecap='round'><line x1='12' y1='1' x2='12' y2='4'/><line x1='12' y1='20' x2='12' y2='23'/><line x1='1' y1='12' x2='4' y2='12'/><line x1='20' y1='12' x2='23' y2='12'/><line x1='4' y1='4' x2='6' y2='6'/><line x1='18' y1='18' x2='20' y2='20'/><line x1='20' y1='4' x2='18' y2='6'/><line x1='6' y1='18' x2='4' y2='20'/></g></svg>") center / contain no-repeat;
     }

     /* === Walk-in FAB on brand === */
     #op-walk-in-fab {
       background: var(--grad-sun) !important;
       box-shadow: 0 6px 20px rgba(232,108,0,.45), 0 0 30px rgba(255,183,77,.30) !important;
     }
   `;
   document.head.appendChild(css);
 }

 // ─── Time-aware greeting with live clock ──────────────────────
 function renderGreeting() {
   if (!window.opState) return;
   const state = window.opState;
   const opName = (state.operator && state.operator.name) || 'Operator';
   const first = opName.split(' ')[0];
   const todayCount = (state.bookings || []).length;
   const now = new Date();
   const h = now.getHours();
   const greet = h < 5  ? 'Late shift'
               : h < 12 ? 'Good morning'
               : h < 18 ? 'Good afternoon'
               : h < 22 ? 'Good evening'
               : 'Working late';
   const subtext = h < 12 ? "Let's get the morning crew sorted."
                 : h < 18 ? "Hope the day's going well."
                 : h < 22 ? "Sunset shift — enjoy it."
                 : "Late one tonight.";
   const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
   const date = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

   let el = document.getElementById('op-greeting');
   if (!el) {
     el = document.createElement('div');
     el.id = 'op-greeting';
     el.style.cssText =
       'padding:16px 16px 8px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;';
     const todayPanel = document.getElementById('panel-today');
     if (todayPanel) todayPanel.insertBefore(el, todayPanel.firstChild);
   }
   el.innerHTML =
     '<div style="min-width:0">' +
       '<div class="op-greeting-h" style="font-size:24px;color:#0a1f3a;line-height:1.1;">' +
         greet + ', <span style="color:#ef6c00">' + first + '</span>' +
       '</div>' +
       '<div style="font-size:13px;color:#5d6a82;margin-top:4px;">' + subtext + '</div>' +
     '</div>' +
     '<div style="text-align:right;background:#fff;border:1px solid rgba(192,134,59,.18);' +
     'border-radius:14px;padding:8px 14px;box-shadow:0 1px 3px rgba(10,31,58,.05);">' +
       '<div id="op-live-clock" class="op-greeting-h" style="font-size:26px;color:#0a1f3a;line-height:1;font-variant-numeric:tabular-nums;">' + time + '</div>' +
       '<div style="font-size:11px;color:#8a7048;text-transform:uppercase;letter-spacing:.6px;font-weight:700;margin-top:4px;">' + date + '</div>' +
     '</div>';

   // Mini stat under the greeting — booking count summary
   const todayCountEl = document.getElementById('op-greeting-count');
   if (!todayCountEl && el.parentNode) {
     const c = document.createElement('div');
     c.id = 'op-greeting-count';
     c.style.cssText = 'padding:0 16px 12px;font-size:13px;color:#5d6a82;';
     c.innerHTML = '<strong style="color:#0a1f3a;">' + todayCount + '</strong> ' +
       (todayCount === 1 ? 'booking' : 'bookings') + ' today · sun rises at 05:52, sets at 20:14';
     el.parentNode.insertBefore(c, el.nextSibling);
   } else if (todayCountEl) {
     todayCountEl.innerHTML = '<strong style="color:#0a1f3a;">' + todayCount + '</strong> ' +
       (todayCount === 1 ? 'booking' : 'bookings') + ' today · sun rises at 05:52, sets at 20:14';
   }
 }

 // Update the clock every 30 s without re-running the whole greeting
 function tickClock() {
   const clockEl = document.getElementById('op-live-clock');
   if (!clockEl) return;
   const t = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
   if (clockEl.textContent !== t) clockEl.textContent = t;
 }

 // ─── Boot ────────────────────────────────────────────────────
 function boot() {
   injectCss();
   const t = setInterval(() => {
     if (window.opState) {
       clearInterval(t);
       renderGreeting();
       setInterval(tickClock, 15000);
     }
   }, 200);
 }
 // Override the simpler greeting that operator-live.js writes
 document.addEventListener('op:state-change', renderGreeting);

 if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', boot);
 } else {
   boot();
 }
})();
