/* ============================================================
   Sunspot — header enhancements.

   Bolts onto the canonical <header class="site-header"> that
   header_unify.py renders. Adds:

     1. Sticky shrink-on-scroll — header gets shorter + adds a
        subtle shadow once you scroll past the hero
     2. Mobile drawer — hamburger button on phone replaces the
        inline nav; tap to open a slide-in panel from the right
     3. Language switcher dropdown (EN / MT / IT) on the right
        side of the nav, reads + writes localStorage
     4. Live "Today on the coast" mini-pill — small live signal
        next to the brand on the homepage only

   No HTML change required — runs on every page after DOM ready.
   ============================================================ */
(function () {
 'use strict';

 const LANGS = [
   { code: 'en', label: 'English', short: 'EN' },
   { code: 'mt', label: 'Malti',   short: 'MT' },
   { code: 'it', label: 'Italiano', short: 'IT' },
 ];

 function boot() {
   const header = document.querySelector('header.site-header');
   if (!header) return;
   if (header.dataset.enhanced) return;
   header.dataset.enhanced = '1';

   injectStyles();
   makeSticky(header);
   installLangSwitcher(header);
   installMobileDrawer(header);
   if (/index\.html$/.test(location.pathname) || location.pathname === '/' || location.pathname.endsWith('/sunspot-mt/')) {
     installLivePill(header);
   }
 }

 // ─── 1) Sticky + shrink on scroll ─
 function makeSticky(header) {
   header.style.position = 'sticky';
   header.style.top = '0';
   header.style.zIndex = '50';
   header.style.background = '#fff';
   header.style.borderBottom = '1px solid var(--line, #e3e8ef)';
   header.style.transition = 'box-shadow .15s, padding .2s';

   const onScroll = () => {
     const scrolled = window.scrollY > 16;
     header.classList.toggle('ss-header-scrolled', scrolled);
     header.style.boxShadow = scrolled
       ? '0 4px 14px rgba(10,31,58,.06)'
       : 'none';
   };
   window.addEventListener('scroll', onScroll, { passive: true });
   onScroll();
 }

 // ─── 2) Mobile drawer ─
 function installMobileDrawer(header) {
   const container = header.querySelector('.container');
   const nav = header.querySelector('nav');
   if (!container || !nav) return;

   // Build the hamburger button (mobile only, hidden via CSS at >=720)
   const ham = document.createElement('button');
   ham.type = 'button';
   ham.className = 'ss-ham';
   ham.setAttribute('aria-label', 'Open menu');
   ham.innerHTML =
     '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
       '<path d="M3 6h18M3 12h18M3 18h18"/>' +
     '</svg>';
   container.appendChild(ham);

   // Build a drawer that mirrors the nav links + lang switcher
   const drawer = document.createElement('div');
   drawer.className = 'ss-drawer';
   drawer.setAttribute('role', 'dialog');
   drawer.setAttribute('aria-modal', 'true');
   const sunMark =
     '<svg viewBox="0 0 40 40" width="28" height="28" aria-hidden="true">' +
       '<g stroke="#ff9800" stroke-width="2" stroke-linecap="round" opacity="0.6">' +
         '<line x1="20" y1="2" x2="20" y2="6"/><line x1="20" y1="34" x2="20" y2="38"/>' +
         '<line x1="2" y1="20" x2="6" y2="20"/><line x1="34" y1="20" x2="38" y2="20"/>' +
         '<line x1="7" y1="7" x2="10" y2="10"/><line x1="30" y1="30" x2="33" y2="33"/>' +
         '<line x1="33" y1="7" x2="30" y2="10"/><line x1="10" y1="30" x2="7" y2="33"/>' +
       '</g>' +
       '<circle cx="20" cy="20" r="11" fill="#ff9800"/>' +
       '<circle cx="20" cy="20" r="9" fill="#ffb74d"/>' +
       '<circle cx="24" cy="16" r="3" fill="#fff5e1"/>' +
     '</svg>';
   drawer.innerHTML =
     '<div class="ss-drawer-back" aria-hidden="true"></div>' +
     '<aside class="ss-drawer-panel">' +
       '<header class="ss-drawer-head">' +
         '<span class="ss-drawer-brand">' + sunMark +
           '<span class="ss-drawer-wordmark">Sunspot</span>' +
         '</span>' +
         '<button type="button" class="ss-drawer-close" aria-label="Close menu">' +
           '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>' +
         '</button>' +
       '</header>' +
       '<nav class="ss-drawer-nav">' +
         nav.innerHTML.replace(/<button[^>]*>.*?<\/button>/g, '').replace(/<a /g, '<a class="ss-drawer-link" ') +
       '</nav>' +
       '<div class="ss-drawer-cta-row">' +
         '<a href="signin.html" class="ss-drawer-cta">Sign in</a>' +
       '</div>' +
       '<div class="ss-drawer-foot">Sunspot &middot; Built in Valletta<br>' +
         '<a href="mailto:hello@sunspot.mt">hello@sunspot.mt</a>' +
       '</div>' +
     '</aside>';
   document.body.appendChild(drawer);

   function open() {
     drawer.classList.add('is-open');
     document.body.style.overflow = 'hidden';
     ham.setAttribute('aria-expanded', 'true');
   }
   function close() {
     drawer.classList.remove('is-open');
     document.body.style.overflow = '';
     ham.setAttribute('aria-expanded', 'false');
   }
   ham.addEventListener('click', open);
   drawer.querySelector('.ss-drawer-back').addEventListener('click', close);
   drawer.querySelector('.ss-drawer-close').addEventListener('click', close);
   drawer.querySelectorAll('.ss-drawer-link').forEach(a => a.addEventListener('click', close));
   document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
 }

 // ─── 3) Language switcher — segmented pill (3-way toggle) ─
 // Three buttons in a single pill: EN | MT | IT. Active state slides
 // smoothly between them. Fixed total width so the header never reflows
 // when language changes. Same control re-used in the mobile drawer.
 function installLangSwitcher(header) {
   const nav = header.querySelector('nav');
   if (!nav) return;
   if (nav.querySelector('.ss-lang-seg')) return;
   const wrap = buildLangSegment();
   const signIn = nav.querySelector('.btn-ghost, a[href="signin.html"]');
   if (signIn) nav.insertBefore(wrap, signIn);
   else        nav.appendChild(wrap);
 }
 function buildLangSegment() {
   const current = getLang();
   const wrap = document.createElement('div');
   wrap.className = 'ss-lang-seg';
   wrap.setAttribute('role', 'group');
   wrap.setAttribute('aria-label', 'Language');
   wrap.innerHTML = LANGS.map(l =>
     '<button type="button" data-lang="' + l.code + '"' +
       (l.code === current ? ' class="is-on" aria-pressed="true"' : ' aria-pressed="false"') +
       ' aria-label="' + l.label + '">' + l.short + '</button>'
   ).join('');
   wrap.querySelectorAll('[data-lang]').forEach(btn => {
     btn.addEventListener('click', () => {
       const code = btn.dataset.lang;
       setLang(code);
       const url = new URL(location.href);
       url.searchParams.set('lang', code);
       location.href = url.toString();
     });
   });
   return wrap;
 }
 function getLang() {
   try {
     const p = new URLSearchParams(location.search).get('lang');
     if (p && /^(en|mt|it)$/.test(p)) return p;
     const stored = JSON.parse(localStorage.getItem('sunspot_prefs') || '{}').lang;
     if (stored && /^(en|mt|it)$/.test(stored)) return stored;
   } catch (e) {}
   return 'en';
 }
 function setLang(code) {
   try {
     const prefs = JSON.parse(localStorage.getItem('sunspot_prefs') || '{}');
     prefs.lang = code;
     localStorage.setItem('sunspot_prefs', JSON.stringify(prefs));
   } catch (e) {}
 }

 // ─── 4) Live mini-pill (homepage only) ─
 function installLivePill(header) {
   const brand = header.querySelector('.brand');
   if (!brand) return;
   const pill = document.createElement('span');
   pill.className = 'ss-live-pill';
   pill.innerHTML =
     '<span class="dot"></span>' +
     '<span class="txt">Live in Malta</span>';
   brand.parentNode.insertBefore(pill, brand.nextSibling);
 }

 // ─── CSS injection ─
 function injectStyles() {
   if (document.getElementById('ss-header-css')) return;
   const css = document.createElement('style');
   css.id = 'ss-header-css';
   css.textContent = `
     header.site-header { transition: box-shadow .15s, background .15s; }
     header.site-header.ss-header-scrolled { backdrop-filter: saturate(140%) blur(8px); background: rgba(255,255,255,.92); }
     header.site-header > .container { position: relative; }

     /* Hamburger — phone only */
     .ss-ham {
       display: none;
       background: transparent; border: 0; padding: 8px 10px;
       color: #0a1f3a; cursor: pointer;
       border-radius: 8px;
     }
     .ss-ham:hover { background: #fdf6e8; }
     @media (max-width: 880px) {
       .ss-ham { display: inline-flex; align-items: center; }
       header.site-header nav {
         display: none !important;
       }
     }

     /* Drawer */
     .ss-drawer { position: fixed; inset: 0; z-index: 120; pointer-events: none; }
     .ss-drawer.is-open { pointer-events: auto; }
     .ss-drawer-back {
       position: absolute; inset: 0;
       background:
         radial-gradient(circle at 70% 30%, rgba(245,124,0,.18), transparent 55%),
         rgba(10,31,58,.48);
       opacity: 0; transition: opacity .3s ease;
       backdrop-filter: blur(2px);
       -webkit-backdrop-filter: blur(2px);
     }
     .ss-drawer.is-open .ss-drawer-back { opacity: 1; }
     .ss-drawer-panel {
       position: absolute; top: 0; right: 0; bottom: 0;
       width: min(340px, 88vw);
       background: linear-gradient(180deg,#ffffff 0%,#fafaf6 100%);
       border-left: 1px solid #e8e3d8;
       box-shadow: -24px 0 60px rgba(10,31,58,.18);
       display: flex; flex-direction: column;
       transform: translateX(100%);
       transition: transform .32s cubic-bezier(.2,.8,.2,1);
       overflow-y: auto;
       padding: 0;
     }
     .ss-drawer.is-open .ss-drawer-panel { transform: translateX(0); }
     /* Sun-flare ornament at the top of the drawer */
     .ss-drawer-panel::before {
       content: ""; position: absolute; top: -60px; left: -60px;
       width: 220px; height: 220px;
       background: radial-gradient(circle, rgba(255,183,77,.32) 0%, transparent 60%);
       pointer-events: none;
     }
     .ss-drawer-link {
       padding: 14px 18px; display: flex; align-items: center; justify-content: space-between;
       color: #0a1f3a;
       font: 500 16px/1.3 'Fraunces','Iowan Old Style',Georgia,serif;
       letter-spacing: -.01em;
       text-decoration: none;
       border-radius: 0;
       border-bottom: 1px solid #f2eee3;
       transition: color .15s ease, background .15s ease;
     }
     .ss-drawer-link::after {
       content: "→";
       color: #c8c0aa; font-family: 'Inter',sans-serif;
       font-size: 14px; font-weight: 500;
       transition: transform .15s ease, color .15s ease;
     }
     .ss-drawer-link:hover, .ss-drawer-link:focus-visible {
       background: rgba(255,183,77,.06);
       color: #f57c00;
       outline: none;
     }
     .ss-drawer-link:hover::after, .ss-drawer-link:focus-visible::after {
       color: #f57c00; transform: translateX(3px);
     }
     .ss-drawer-link.active { color: #f57c00; background: rgba(255,183,77,.08); }

     /* Drawer header */
     .ss-drawer-head {
       position: relative; z-index: 1;
       display: flex; align-items: center; justify-content: space-between;
       padding: 20px 22px 18px;
       border-bottom: 1px solid #f0e8d6;
     }
     .ss-drawer-brand {
       display: inline-flex; align-items: center; gap: 10px;
       font: 600 18px/1 'Fraunces','Iowan Old Style',Georgia,serif;
       letter-spacing: -.012em; color: #0a1f3a;
     }
     .ss-drawer-wordmark { display: inline-block; }
     .ss-drawer-close {
       display: inline-flex; align-items: center; justify-content: center;
       background: none; border: 0; cursor: pointer; padding: 8px;
       color: #5d6a82; border-radius: 999px;
       transition: color .15s ease, background .15s ease;
     }
     .ss-drawer-close:hover { color: #0a1f3a; background: #f5ecd9; }

     /* Drawer nav list */
     .ss-drawer-nav {
       padding: 8px 0;
       position: relative; z-index: 1;
       display: flex; flex-direction: column;
     }

     /* Drawer footer + CTA */
     .ss-drawer-cta-row {
       padding: 16px 20px 12px;
       border-top: 1px solid #f0e8d6;
       position: relative; z-index: 1;
     }
     .ss-drawer-cta {
       display: block; text-align: center;
       padding: 13px 18px;
       background: linear-gradient(135deg, #ffb74d, #f57c00);
       color: #fff; border-radius: 999px;
       font: 600 14px/1 'Inter', sans-serif; letter-spacing: .01em;
       text-decoration: none;
       box-shadow: 0 6px 16px rgba(245,124,0,.28);
       transition: transform .15s ease, box-shadow .15s ease, filter .15s ease;
     }
     .ss-drawer-cta:hover {
       transform: translateY(-1px);
       box-shadow: 0 10px 22px rgba(245,124,0,.32);
       filter: brightness(1.04);
     }
     .ss-drawer-foot {
       padding: 14px 22px 22px;
       font: 400 12px/1.55 'Inter', sans-serif;
       color: #8a7048;
       position: relative; z-index: 1;
     }
     .ss-drawer-foot a { color: #f57c00; font-weight: 600; text-decoration: none; }

     /* Language switcher — segmented pill (3-way EN/MT/IT) */
     .ss-lang-seg {
       display: inline-flex; align-items: center;
       margin-left: 8px;
       padding: 2px;
       background: #fafaf6;
       border: 1px solid #e3e8ef;
       border-radius: 999px;
       gap: 2px;
     }
     .ss-lang-seg button {
       background: transparent; border: 0; cursor: pointer;
       padding: 5px 10px;
       font: 700 11px/1 inherit; letter-spacing: .14em;
       color: #5d6a82;
       border-radius: 999px;
       transition: background .18s ease, color .18s ease;
       min-width: 32px; text-align: center;
     }
     .ss-lang-seg button:hover { color: #0a1f3a; }
     .ss-lang-seg button.is-on,
     .ss-lang-seg button[aria-pressed="true"] {
       background: #fff;
       color: #0a1f3a;
       box-shadow: 0 1px 3px rgba(10,31,58,.08);
     }
     /* Legacy dropdown version — keep as fallback if any page still renders it */
     .ss-lang-pick { display: none; }

     /* Live pill (homepage only) */
     .ss-live-pill {
       display: none; align-items: center; gap: 6px;
       margin-left: 12px; padding: 4px 10px;
       background: #fdf6e8; border: 1px solid rgba(192,134,59,.25);
       border-radius: 999px;
       font-size: 11px; font-weight: 700; color: #c0563b;
       letter-spacing: .3px;
     }
     .ss-live-pill .dot {
       width: 6px; height: 6px; border-radius: 50%;
       background: #2e7d32; box-shadow: 0 0 0 3px rgba(46,125,50,.18);
       animation: ssLiveBlink 1.8s infinite;
     }
     @media (min-width: 900px) { .ss-live-pill { display: inline-flex; } }
     @keyframes ssLiveBlink { 50% { opacity: .5; } }
   `;
   document.head.appendChild(css);
 }

 if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', boot);
 } else {
   setTimeout(boot, 0);
 }
})();
