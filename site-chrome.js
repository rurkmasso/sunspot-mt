/* ============================================================
   Sunspot — site-chrome bootstrap.

   Fetches editable site furniture (nav, footer, press, trust badges)
   from /wp-json/sunspot/v1/site-chrome and exposes it as
   `window.SUNSPOT_CHROME`. Header and footer modules read CHROME
   first; if it isn't there (offline, demo mode, REST 404) their
   hardcoded defaults render instead — nothing ever breaks.

   Caches the response in localStorage for 10 minutes so navigation
   is instant and we don't hit WP on every page load.
   ============================================================ */
(function () {
 'use strict';

 const API   = window.SUNSPOT_API_BASE || null;
 const KEY   = 'sunspot_chrome_cache';
 const TTL_MS = 10 * 60 * 1000;

 // 1. Hydrate from localStorage immediately so the first render
 //    doesn't have to wait for the network.
 try {
   const cached = JSON.parse(localStorage.getItem(KEY) || 'null');
   if (cached && cached.ts && (Date.now() - cached.ts) < TTL_MS && cached.data) {
     window.SUNSPOT_CHROME = cached.data;
   }
 } catch (e) {}

 // 2. Background-refresh from REST (no-await) so updates land for
 //    the next page load. Demo / offline → silently skip.
 if (API) {
   fetch(API.replace(/\/$/, '') + '/sunspot/v1/site-chrome', { credentials: 'omit' })
     .then(r => r.ok ? r.json() : null)
     .then(data => {
       if (!data || typeof data !== 'object') return;
       window.SUNSPOT_CHROME = data;
       try { localStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), data })); } catch (e) {}
       // Tell modules that already rendered they can re-render with fresh data
       document.dispatchEvent(new CustomEvent('sunspot:chrome-updated', { detail: data }));
     })
     .catch(() => {});
 }
})();
