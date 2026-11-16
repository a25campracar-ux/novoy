const V = 'pf-v40', FILES = ['./', 'index.html', 'core.js', 'v2/alta.css', 'v2/hoy.css', 'v2/hoy.js', 'v2/app.js', 'clasica.html', 'style.css', 'catalog.js', 'setup.js', 'shot.js', 'acct.js', 'app.js', 'seed.js', 'manifest.webmanifest', 'icons/icon-192.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== V).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => { // red primero, caché si no hay conexión
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(V).then((x) => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
