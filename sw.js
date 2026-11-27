const cachePrefix = 'gcc-demo:' + self.registration.scope + ':';
const cacheName = cachePrefix + '1';
const assets = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(assets)));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(cachePrefix) && key !== cacheName).map(key => caches.delete(key))
  )));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.registration.scope)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() =>
      caches.open(cacheName).then(cache => cache.match('./index.html'))
    ));
  } else {
    event.respondWith(caches.open(cacheName).then(async cache =>
      (await cache.match(event.request)) || fetch(event.request)
    ));
  }
});

