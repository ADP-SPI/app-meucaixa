const CACHE_VERSION = 'meucaixa-v1-' + Date.now();
const STATIC_CACHE = 'meucaixa-static-v1';
let currentVersion = null;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && !cacheName.includes('meucaixa-v1-')) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Verifica versão a cada 30 segundos
setInterval(async () => {
  try {
    const response = await fetch('/api/manifest');
    const data = await response.json();
    
    if (currentVersion && data.version !== currentVersion) {
  console.log('🔔 Service Worker: NOVA VERSÃO DETECTADA!', data.version);
  console.log('🔔 Versão atual:', currentVersion);
  console.log('🔔 Tentando enviar mensagem...');
  
  self.clients.matchAll().then((clients) => {
    console.log('🔔 Clientes encontrados:', clients.length);
    clients.forEach((client) => {
      console.log('🔔 Enviando mensagem pra cliente:', client.url);
      client.postMessage({
        type: 'NEW_VERSION_AVAILABLE',
        version: data.version
      });
    });
  });
}
    currentVersion = data.version;
  } catch (err) {
    console.error('Erro ao verificar versão:', err);
  }
}, 30000);

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Nunca cacheia API calls
  if (url.pathname.includes('/rest/v1/') || 
      url.pathname.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Nunca cacheia páginas autenticadas
  if (url.pathname.includes('/login') ||
      url.pathname.includes('/dashboard') ||
      url.pathname.includes('/caixa') ||
      url.pathname.includes('/relatorios')) {
    event.respondWith(fetch(event.request).catch(() => {
      return new Response('Offline', { status: 503 });
    }));
    return;
  }

  // Nunca cacheia a home
  if (url.pathname === '/' || url.pathname === '') {
    event.respondWith(fetch(event.request).catch(() => {
      return new Response('Offline', { status: 503 });
    }));
    return;
  }

  // Para arquivos estáticos: network-first
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response.ok) {
        const responseClone = response.clone();
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(event.request, responseClone);
        });
      }
      return response;
    }).catch(() => {
      return caches.match(event.request);
    })
  );
});
