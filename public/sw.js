const CACHE_NAME = 'meucaixa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Nunca cacheia API calls
  if (event.request.url.includes('/rest/v1/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Nunca cacheia a home
  if (new URL(event.request.url).pathname === '/') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Para tudo mais: tenta network, se falhar usa cache
  event.respondWith(
    fetch(event.request)
      .then(response => response)
      .catch(() => caches.match(event.request))
  );
});
