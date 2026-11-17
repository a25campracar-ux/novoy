const V = 'pf-v45', FILES = ['./', 'index.html', 'alta.html', 'legal.html', 'core.js', 'acct.js', 'setup.js', 'catalog.js', 'shot.js', 'v2/alta.css', 'v2/hoy.css', 'v2/reglas.js', 'v2/horario.js', 'v2/calendario.js', 'v2/estado.js', 'v2/importar.js', 'v2/alta.js', 'v2/hoy.js', 'v2/lista.js', 'v2/ajustes.js', 'v2/cuenta.js', 'v2/app.js', 'v2/pantalla-hoy.js', 'v2/pantalla-faltas.js', 'v2/pantalla-ajustes.js', 'manifest.webmanifest', 'icons/icon-192.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== V).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => { // red primero, caché si no hay conexión
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(V).then((x) => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
