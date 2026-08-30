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
  const url = new URL(event.request.url);
  
  // Nunca cacheia requisições autenticadas
  if (event.request.headers.get('authorization') || 
      url.pathname.includes('/login') ||
      url.pathname.includes('/dashboard') ||
      url.pathname.includes('/caixa') ||
      url.pathname.includes('/relatorios')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Nunca cacheia API calls
  if (url.pathname.includes('/rest/v1/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Nunca cacheia a home
  if (url.pathname === '/') {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Para arquivos estáticos: cache-first
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((response) => {
        if (response.status === 200) {
          const cache = caches.open(CACHE_NAME);
          cache.then((c) => c.put(event.request, response.clone()));
        }
        return response;
      });
    })
  );
});
