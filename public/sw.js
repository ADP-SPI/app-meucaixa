const CACHE_NAME = 'meucaixa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Nunca cachear a home
  if (event.request.url.endsWith('/') || event.request.url.includes('appmeucaixa.com.br/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response('Offline');
      })
    );
    return;
  }

  // Para outros recursos, usar cache
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((response) => {
        return (
          response ||
          fetch(event.request).then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }
            const responseToCache = response.clone();
            cache.add(event.request).catch(() => {});
            return responseToCache;
          })
        );
      });
    }).catch(() => {
      return new Response('Offline');
    })
  );
});
