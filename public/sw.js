const CACHE_NAME = 'meucaixa-v1';
let currentVersion = null;

// Busca versão do servidor
async function getServerVersion() {
  try {
    const response = await fetch('/api/version');
    const data = await response.json();
    return data.version;
  } catch {
    return null;
  }
}

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
  
    // Nunca cacheia a home (sempre fetch fresh)
  if (url.pathname === '/' || url.pathname === '') {
    event.respondWith(
      fetch(event.request).then((response) => {
        return response;
      }).catch(() => {
        return new Response('Offline', { status: 503 });
      })
    );
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

// Verifica nova versão a cada 30 segundos
setInterval(async () => {
  const serverVersion = await getServerVersion();
  if (currentVersion && serverVersion && currentVersion !== serverVersion) {
    // Nova versão disponível - avisa aos clientes
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'NEW_VERSION_AVAILABLE',
          version: serverVersion
        });
      });
    });
  }
  currentVersion = serverVersion;
}, 30000);
