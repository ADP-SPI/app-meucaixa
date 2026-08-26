const CACHE_NAME = 'meucaixa-v1';
const STATIC_ASSETS = [
  '/',
  '/login',
  '/planos',
  '/offline.html'
];

const DYNAMIC_ROUTES = [
  '/dashboard',
  '/caixa',
  '/comanda',
  '/fiados',
  '/relatorios',
  '/agenda',
  '/cardapio',
  '/usuarios',
  '/admin',
  '/plano-expirado'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event
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

// Fetch event
self.addEventListener('fetch', (event) => {
  const { pathname } = new URL(event.request.url);

  // NUNCA cachear rotas dinâmicas
  if (DYNAMIC_ROUTES.some(route => pathname.startsWith(route))) {
    event.respondWith(
      fetch(event.request)
        .then(response => response)
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // CACHEAR tudo mais (estático)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    })
  );
});
