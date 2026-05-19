/* ============================================================
   Sunspot — service worker
   Minimal offline-first shell. Caches the core HTML + assets on
   first install, serves them from cache on subsequent visits.
   ============================================================ */
const CACHE = 'sunspot-shell-v1';
const SHELL = [
  '/sunspot-mt/',
  '/sunspot-mt/index.html',
  '/sunspot-mt/styles.css',
  '/sunspot-mt/features.js',
  '/sunspot-mt/audiences.js',
  '/sunspot-mt/icons.js',
  '/sunspot-mt/gate.js',
  '/sunspot-mt/clubs-data.js',
  '/sunspot-mt/experiences-data.js',
  '/sunspot-mt/app.html',
  '/sunspot-mt/manifest.webmanifest',
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

// Cache-first for same-origin requests; network with cache fallback for everything else.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Don't cache cross-origin photo CDNs — let the browser handle them
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        // Only cache successful basic responses
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return resp;
      }).catch(() => {
        // Final fallback: app shell
        if (req.mode === 'navigate') return caches.match('/sunspot-mt/index.html');
      });
    })
  );
});
