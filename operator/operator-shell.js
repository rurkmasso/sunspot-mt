/* ============================================================
   Sunspot Operator — responsive shell.

   Mobile (≤719 px):
     Current layout, unchanged. Top bar with venue switcher,
     bottom nav with Today / Layout / Scan / Stats.

   Tablet (720-1099 px):
     Icon-rail sidebar on the left (60 px wide), labels on hover.
     Top bar hidden, bottom nav hidden, content gets the full
     remaining width. Today panel sits in a 1-column grid that's
     just wider and breathier.

   Laptop (≥1100 px):
     Full sidebar with labels (220 px). Top bar hidden, bottom
     nav hidden. Today panel becomes a 2-column workspace —
     bookings on the left, live hero + activity feed on the right.
     Layout panel uses the full width with bigger canvas.
   ============================================================ */
(function () {
 'use strict';

 // Inject the responsive sidebar + media-query CSS once
 function inject() {
   if (document.getElementById('op-shell-css')) return;

   // ─── CSS ───
   const css = document.createElement('style');
   css.id = 'op-shell-css';
   css.textContent = `
     /* === Sidebar (hidden on phone) === */
     #op-sidebar {
       display: none;
       position: fixed;
       left: 0; top: 0; bottom: 0;
       background: var(--ink);
       color: #fff;
       z-index: 40;
       padding: 18px 12px;
       flex-direction: column;
       gap: 6px;
       box-shadow: 2px 0 18px rgba(10,31,58,.18);
     }
     #op-sidebar .sb-brand {
       display: flex; align-items: center; gap: 10px;
       padding: 4px 8px 18px;
       border-bottom: 1px solid rgba(255,255,255,.10);
       margin-bottom: 12px;
     }
     #op-sidebar .sb-brand-mark {
       width: 36px; height: 36px; border-radius: 50%;
       background: linear-gradient(135deg, #ffb74d, #f57c00);
       display: flex; align-items: center; justify-content: center;
       flex: 0 0 36px;
       box-shadow: 0 2px 8px rgba(245,124,0,.40);
     }
     #op-sidebar .sb-brand-mark::after {
       content: ''; width: 14px; height: 14px; border-radius: 50%;
       background: #fff5e1;
     }
     #op-sidebar .sb-brand-text {
       display: flex; flex-direction: column; line-height: 1.15;
       overflow: hidden;
     }
     #op-sidebar .sb-brand-text strong { font-size: 16px; font-weight: 800; letter-spacing: -.3px; white-space: nowrap; }
     #op-sidebar .sb-brand-text small { font-size: 11px; opacity: .7; letter-spacing: .5px; text-transform: uppercase; white-space: nowrap; }

     /* Venue switcher slot — operator-live.js mounts the switcher anywhere
        with id #op-venue-switcher-mount; on desktop we relocate it here. */
     #op-sidebar .sb-venue-slot {
       padding: 8px;
       margin-bottom: 10px;
       border-radius: 12px;
       background: rgba(255,255,255,.06);
     }
     #op-sidebar .sb-venue-slot .vs-trigger {
       background: rgba(255,255,255,.10) !important;
       border-color: rgba(255,255,255,.18) !important;
       width: 100%;
       justify-content: flex-start !important;
     }

     #op-sidebar .sb-nav {
       display: flex; flex-direction: column; gap: 2px;
       margin-top: 8px;
     }
     #op-sidebar .sb-nav button {
       all: unset;
       display: flex; align-items: center; gap: 12px;
       padding: 12px 10px;
       border-radius: 10px;
       font-size: 14px; font-weight: 600;
       cursor: pointer;
       color: rgba(255,255,255,.75);
       transition: background .15s, color .15s;
     }
     #op-sidebar .sb-nav button:hover {
       background: rgba(255,255,255,.06);
       color: #fff;
     }
     #op-sidebar .sb-nav button.active {
       background: linear-gradient(135deg, #ff9800, #ef6c00);
       color: #fff;
       box-shadow: 0 4px 14px rgba(232,108,0,.32);
     }
     #op-sidebar .sb-nav svg { flex: 0 0 20px; width: 20px; height: 20px; }
     #op-sidebar .sb-nav .label { flex: 1; }

     #op-sidebar .sb-bottom {
       margin-top: auto;
       padding-top: 14px;
       border-top: 1px solid rgba(255,255,255,.10);
       font-size: 11px;
       color: rgba(255,255,255,.55);
       padding-left: 8px;
       line-height: 1.5;
     }
     #op-sidebar .sb-bottom strong { color: rgba(255,255,255,.8); }

     /* === Tablet (720-1099): icon-rail sidebar === */
     @media (min-width: 720px) {
       .op-topbar { display: none !important; }
       .op-tabs   { display: none !important; }
       .op-bottom-nav { display: none !important; }
       body { padding-left: 60px; padding-bottom: 24px !important; }
       #op-sidebar {
         display: flex;
         width: 60px;
         padding: 16px 6px;
       }
       #op-sidebar .sb-brand-text,
       #op-sidebar .sb-nav .label,
       #op-sidebar .sb-bottom,
       #op-sidebar .sb-venue-slot { display: none; }
       #op-sidebar .sb-brand { justify-content: center; padding: 4px 0 14px; }
       #op-sidebar .sb-nav button { justify-content: center; padding: 12px 4px; }
     }

     /* === Laptop (≥1100): full sidebar + single centred column === */
     @media (min-width: 1100px) {
       body { padding-left: 240px; }
       #op-sidebar {
         width: 240px;
         padding: 20px 14px;
       }
       #op-sidebar .sb-brand-text,
       #op-sidebar .sb-nav .label,
       #op-sidebar .sb-bottom,
       #op-sidebar .sb-venue-slot { display: block; }
       #op-sidebar .sb-brand { justify-content: flex-start; padding: 4px 8px 18px; }
       #op-sidebar .sb-nav button { justify-content: flex-start; padding: 12px 14px; }

       /* Single centred column — wider than mobile, no awkward grid gaps.
          The live hero already shows the headline numbers; activity feed
          and bookings stack below it the same way they do on phone. */
       .op-panel { max-width: 840px; margin: 0 auto; padding: 24px 24px 40px; }
       .op-stats { display: grid !important; }
       #op-venue-aerial { max-width: 1100px; margin: 0 auto; padding: 0; }
     }

     /* Tablet: 1-col but breathier */
     @media (min-width: 720px) and (max-width: 1099px) {
       .op-panel { max-width: 920px; margin: 0 auto; padding: 24px 24px 32px; }
       .op-stats { display: grid !important; }
     }

     /* Tablet+: walk-in FAB sits clear of the sidebar */
     @media (min-width: 720px) {
       #op-walk-in-fab { bottom: 24px !important; right: 24px !important; }
       #op-toast-host  { bottom: 24px !important; }
     }

     /* Layout panel: bigger canvas at tablet/laptop. The floor-plan editor
        is aspect-ratio:16/10 so just widen the container. */
     @media (min-width: 720px) {
       #op-venue-aerial { padding: 0 8px; }
     }
   `;
   document.head.appendChild(css);

   // ─── HTML ───
   const sb = document.createElement('aside');
   sb.id = 'op-sidebar';
   sb.innerHTML =
     '<div class="sb-brand">' +
       '<div class="sb-brand-mark"></div>' +
       '<div class="sb-brand-text"><strong>Sunspot</strong><small>Operator</small></div>' +
     '</div>' +
     '<div class="sb-venue-slot" id="sb-venue-slot"></div>' +
     '<nav class="sb-nav">' +
       sbBtn('today',   'Today',  'M3 12 12 3l9 9M5 10v10h14V10') +
       sbBtn('seatmap', 'Layout', 'M3 3h18v18H3zM3 9h18M9 3v18') +
       sbBtn('stats',   'Stats',  'M3 21h18M7 17V9m5 8V5m5 12V13') +
       '<button type="button" data-nav-action="scan">' +
         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3M7 12h10"/></svg>' +
         '<span class="label">Scan QR</span>' +
       '</button>' +
     '</nav>' +
     '<div class="sb-bottom">' +
       '<strong>You are signed in</strong> as <span id="sb-op-name">AX Resorts Group</span>. ' +
       'You only see venues assigned to your account.' +
     '</div>';
   document.body.appendChild(sb);

   // ─── Wire sidebar nav to existing panels ───
   sb.querySelectorAll('[data-panel]').forEach(btn => {
     btn.addEventListener('click', () => {
       const name = btn.dataset.panel;
       // Reuse operator.js's tab plumbing
       const tabBtn = document.querySelector('.op-tab[data-panel="' + name + '"]')
                  || document.querySelector('.op-bottom-nav [data-nav="' + name + '"]');
       if (tabBtn) tabBtn.click();
       // Update active state in the sidebar
       sb.querySelectorAll('[data-panel]').forEach(b => b.classList.toggle('active', b === btn));
     });
   });
   sb.querySelector('[data-nav-action="scan"]').addEventListener('click', () => {
     const scanBtn = document.getElementById('op-scan-btn');
     if (scanBtn) scanBtn.click();
   });
   // Reflect the initially-active panel
   const initiallyActive = document.querySelector('.op-panel.active');
   if (initiallyActive) {
     const id = initiallyActive.id.replace(/^panel-/, '');
     const m = sb.querySelector('[data-panel="' + id + '"]');
     if (m) m.classList.add('active');
   }

   // ─── Re-home the venue switcher into the sidebar on desktop ───
   // operator-live.js mounts #op-venue-switcher next to the original <select>.
   // We move it into the sidebar slot when width allows, and back to the top
   // bar on mobile.
   function relocate() {
     const sw = document.getElementById('op-venue-switcher');
     const slot = document.getElementById('sb-venue-slot');
     const topbar = document.querySelector('.op-topbar');
     if (!sw || !slot || !topbar) { return; }
     if (window.matchMedia('(min-width: 720px)').matches) {
       if (sw.parentNode !== slot) slot.appendChild(sw);
     } else {
       if (sw.parentNode !== topbar) topbar.appendChild(sw);
     }
   }
   // Run a few times — the switcher is async-mounted by operator-live.js
   relocate();
   const relocateInterval = setInterval(relocate, 300);
   setTimeout(() => clearInterval(relocateInterval), 4000);
   window.addEventListener('resize', relocate);

   // Reflect operator name in sidebar footer when state lands
   document.addEventListener('op:state-change', () => {
     const name = ((window.opState || {}).operator || {}).name;
     const nameEl = document.getElementById('sb-op-name');
     if (name && nameEl) nameEl.textContent = name;
   });
 }

 function sbBtn(panel, label, iconPath) {
   return '<button type="button" data-panel="' + panel + '">' +
     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + iconPath + '"/></svg>' +
     '<span class="label">' + label + '</span>' +
   '</button>';
 }

 if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', inject);
 } else {
   inject();
 }
})();
