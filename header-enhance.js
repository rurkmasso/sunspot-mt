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
   drawer.innerHTML =
     '<div class="ss-drawer-back" aria-hidden="true"></div>' +
     '<aside class="ss-drawer-panel">' +
       '<header style="display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #f0e8d6;">' +
         '<span style="font-family:Fraunces,Georgia,serif;font-size:18px;color:#0a1f3a;font-weight:600;">Menu</span>' +
         '<button type="button" class="ss-drawer-close" aria-label="Close menu" style="background:none;border:0;color:#5d6a82;cursor:pointer;font-size:24px;line-height:1;padding:4px 8px;">×</button>' +
       '</header>' +
       '<nav style="padding:14px 8px;display:flex;flex-direction:column;">' +
         nav.innerHTML.replace(/<button[^>]*>.*?<\/button>/g, '').replace(/<a /g, '<a class="ss-drawer-link" ') +
       '</nav>' +
       '<div style="padding:18px 20px;border-top:1px solid #f0e8d6;display:flex;gap:8px;flex-wrap:wrap;">' +
         '<a href="signin.html" class="ss-drawer-cta" style="flex:1;text-align:center;padding:12px;background:linear-gradient(135deg,#ffb74d,#f57c00);color:#fff;border-radius:999px;font-weight:700;text-decoration:none;font-size:14px;box-shadow:0 3px 10px rgba(232,108,0,.28);">Sign in</a>' +
       '</div>' +
       '<div style="padding:16px 20px;font-size:12px;color:#8a7048;line-height:1.5;">Sunspot · Built in Valletta · <a href="mailto:hello@sunspot.mt" style="color:#ef6c00;font-weight:600;text-decoration:none;">hello@sunspot.mt</a></div>' +
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
       position: absolute; inset: 0; background: rgba(10,31,58,.45);
       opacity: 0; transition: opacity .25s;
     }
     .ss-drawer.is-open .ss-drawer-back { opacity: 1; }
     .ss-drawer-panel {
       position: absolute; top: 0; right: 0; bottom: 0;
       width: min(320px, 84vw); background: #fff;
       box-shadow: -10px 0 30px rgba(10,31,58,.18);
       display: flex; flex-direction: column;
       transform: translateX(100%); transition: transform .28s cubic-bezier(.2,.8,.2,1);
       overflow-y: auto;
     }
     .ss-drawer.is-open .ss-drawer-panel { transform: translateX(0); }
     .ss-drawer-link {
       padding: 12px 14px; display: block; color: #0a1f3a;
       font-weight: 600; font-size: 15px;
       border-radius: 10px; text-decoration: none;
     }
     .ss-drawer-link:hover { background: #fdf6e8; color: #ef6c00; }
     .ss-drawer-link.active { background: #fdf6e8; color: #ef6c00; }

     /* Language switcher */
     .ss-lang-pick { position: relative; display: inline-block; margin-left: 8px; }
     .ss-lang-pick > button {
       display: inline-flex; align-items: center; gap: 5px;
       background: transparent; border: 1px solid #e3e8ef;
       padding: 6px 10px; border-radius: 8px;
       color: #0a1f3a; font-family: inherit; font-size: 12px; font-weight: 700;
       letter-spacing: .4px; cursor: pointer;
       transition: border-color .15s, background .15s;
     }
     .ss-lang-pick > button:hover { border-color: #e89d3a; background: #fdf6e8; }
     .ss-lang-pick > ul {
       position: absolute; top: calc(100% + 6px); right: 0;
       min-width: 160px; background: #fff;
       border: 1px solid #e3e8ef; border-radius: 12px;
       box-shadow: 0 8px 24px rgba(10,31,58,.10);
       list-style: none; padding: 6px; margin: 0;
       display: none;
     }
     .ss-lang-pick.is-open > ul { display: block; }
     .ss-lang-pick > ul li button {
       width: 100%; text-align: left; background: transparent; border: 0;
       padding: 9px 12px; border-radius: 8px; cursor: pointer;
       font-family: inherit; font-size: 13px; color: #0a1f3a;
       display: flex; align-items: center; gap: 10px;
     }
     .ss-lang-pick > ul li button:hover { background: #fdf6e8; }
     .ss-lang-pick > ul li button[aria-current="true"] { color: #ef6c00; font-weight: 700; }
     .ss-lang-pick .code {
       background: #fdf6e8; color: #8a7048; font-weight: 800;
       font-size: 10px; letter-spacing: .6px; padding: 2px 6px; border-radius: 4px;
     }

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
