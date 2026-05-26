/* ============================================================
   Sunspot — service worker
   Minimal offline-first shell. Caches the core HTML + assets on
   first install, serves them from cache on subsequent visits.
   ============================================================ */
// Bump the CACHE version when the shell changes so the activate
// handler purges the previous cache and serves the new bundle.
const CACHE = 'sunspot-shell-v6';
const SHELL = [
  // Pages — high-traffic only; everything else is fetched on demand
  '/sunspot-mt/',
  '/sunspot-mt/index.html',
  '/sunspot-mt/experiences.html',
  '/sunspot-mt/guides.html',
  '/sunspot-mt/visiting.html',
  '/sunspot-mt/faq.html',
  '/sunspot-mt/about.html',
  '/sunspot-mt/brand.html',
  '/sunspot-mt/sitemap.html',
  '/sunspot-mt/app.html',
  '/sunspot-mt/404.html',
  // Critical scripts + styles
  '/sunspot-mt/styles.css',
  '/sunspot-mt/features.js',
  '/sunspot-mt/audiences.js',
  '/sunspot-mt/icons.js',
  '/sunspot-mt/gate.js',
  '/sunspot-mt/clubs-data.js',
  '/sunspot-mt/experiences-data.js',
  '/sunspot-mt/header-enhance.js',
  '/sunspot-mt/cookie-consent.js',
  // Brand kit — small SVG, cheap to cache, big perceived-speed win
  '/sunspot-mt/assets/brand/mark.svg',
  '/sunspot-mt/assets/brand/mark-mono.svg',
  '/sunspot-mt/assets/brand/wordmark.svg',
  '/sunspot-mt/assets/brand/lockup.svg',
  '/sunspot-mt/assets/brand/lockup-mono-light.svg',
  '/sunspot-mt/favicon-32.png',
  '/sunspot-mt/favicon-192.png',
  '/sunspot-mt/apple-touch-icon.png',
  '/sunspot-mt/og-cover.png',
  // PWA
  '/sunspot-mt/manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL.map(url => new Request(url, { cache: 'reload' }))))
      .catch(() => {}) // don't fail install if some assets aren't reachable
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Strategy per request type:
//
//   HTML navigation  → network-first with a 2.5s timeout, then cache.
//                       Keeps content fresh but never strands the user.
//   CSS / JS / fonts → stale-while-revalidate. Instant from cache, then
//                       update in the background for next time.
//   SVG / PNG (brand) → cache-first. Brand assets rarely change.
//   Cross-origin     → bypass — the browser HTTP cache + LCP preload
//                       already do the right thing for the photo CDN.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  const dest = req.destination; // 'document','script','style','image','font',…

  // HTML navigation — network-first, cache fallback
  if (req.mode === 'navigate' || dest === 'document') {
    e.respondWith(networkFirst(req));
    return;
  }
  // Brand SVG + favicons + OG — cache-first
  if (dest === 'image' && /assets\/brand\/|\/favicon-|\/apple-touch-icon\.png$|\/og-cover\.png$/.test(url.pathname)) {
    e.respondWith(cacheFirst(req));
    return;
  }
  // Everything else (CSS, JS, JSON, font, image) — stale-while-revalidate
  e.respondWith(staleWhileRevalidate(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const fresh = await fetch(req, { signal: controller.signal });
    clearTimeout(timer);
    if (fresh && fresh.status === 200) cache.put(req, fresh.clone());
    return fresh;
  } catch (err) {
    const cached = await cache.match(req);
    if (cached) return cached;
    return cache.match('/sunspot-mt/index.html') || cache.match('/sunspot-mt/');
  }
}
async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  const fresh = await fetch(req).catch(() => null);
  if (fresh && fresh.status === 200 && fresh.type === 'basic') cache.put(req, fresh.clone());
  return fresh || new Response('', { status: 504 });
}
async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  const networked = fetch(req).then(resp => {
    if (resp && resp.status === 200 && resp.type === 'basic') cache.put(req, resp.clone());
    return resp;
  }).catch(() => cached);
  return cached || networked;
}

// ─── Web push handlers (operator notifications) ─────────────
// Payload sent by the BE looks like { title, body, url }. If parsing
// fails we still show a generic notification so the operator never
// misses one.
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (_) {
    try { data = { title: 'Sunspot', body: e.data ? e.data.text() : 'New activity' }; } catch (__) {}
  }
  const title = data.title || 'Sunspot';
  const opts = {
    body:    data.body || '',
    icon:    '/sunspot-mt/icons/icon-192.png',
    badge:   '/sunspot-mt/icons/badge.png',
    tag:     data.tag || 'sunspot-default',
    renotify:true,
    data:    { url: data.url || '/sunspot-mt/operator/' },
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

// Tapping a notification opens (or focuses) the operator app
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || '/sunspot-mt/operator/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.indexOf(target) !== -1 && 'focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
