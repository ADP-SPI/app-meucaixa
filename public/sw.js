self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => client.navigate(client.url));
  });
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.map((name) => caches.delete(name))))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request).catch(() => {
    return new Response('offline', { status: 503 });
  }));
});
