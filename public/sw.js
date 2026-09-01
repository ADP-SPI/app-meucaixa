const CACHE_NAME = 'meucaixa-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => 
      Promise.all(names.map((name) => caches.delete(name)))
    )
  );
  self.clients.claim();
});

// Verifica versão a cada 60 segundos (simplificado)
let lastVersion = null;
setInterval(async () => {
  try {
    const res = await fetch('/api/manifest?t=' + Date.now());
    const data = await res.json();
    
    if (lastVersion === null) {
      lastVersion = data.version;
      return;
    }
    
    if (data.version !== lastVersion) {
      lastVersion = data.version;
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({type: 'UPDATE', version: data.version});
      });
    }
  } catch(e) {
    console.error('Check version error:', e);
  }
}, 60000);

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname.includes('/rest/v1/') || url.pathname.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  if (url.pathname.includes('/login') || url.pathname.includes('/dashboard') || 
      url.pathname.includes('/caixa') || url.pathname.includes('/relatorios')) {
    event.respondWith(fetch(event.request).catch(() => new Response('offline', {status: 503})));
    return;
  }
  
  if (url.pathname === '/' || url.pathname === '') {
    event.respondWith(fetch(event.request).catch(() => new Response('offline', {status: 503})));
    return;
  }
  
  event.respondWith(
    fetch(event.request).then(res => {
      if (res.ok) {
        caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
      }
      return res;
    }).catch(() => caches.match(event.request))
  );
});
