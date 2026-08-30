'use client';

import { useEffect, useState } from 'react';

export default function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'NEW_VERSION_AVAILABLE') {
          setShowUpdate(true);
        }
      });
    }
  }, []);

  if (!showUpdate) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-4 flex justify-between items-center z-50">
      <p>✨ Nova versão disponível!</p>
      <button
        onClick={() => {
          // Limpa cache e recarrega
          if ('caches' in window) {
            caches.keys().then((cacheNames) => {
              Promise.all(
                cacheNames.map((cacheName) => caches.delete(cacheName))
              ).then(() => {
                window.location.reload();
              });
            });
          } else {
            window.location.reload();
          }
        }}
        className="bg-white text-blue-600 px-4 py-2 rounded font-bold hover:bg-gray-100"
      >
        Atualizar
      </button>
    </div>
  );
}
