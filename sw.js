/* ============================================================
   Sunspot — service worker
   Minimal offline-first shell. Caches the core HTML + assets on
   first install, serves them from cache on subsequent visits.
   ============================================================ */
const CACHE = 'sunspot-shell-v4';
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
