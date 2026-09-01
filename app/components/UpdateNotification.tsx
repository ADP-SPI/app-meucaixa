'use client';

import { useEffect, useState } from 'react';

export default function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [newVersion, setNewVersion] = useState('');

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Escuta mensagens do Service Worker
      navigator.serviceWorker.onmessage = (event) => {
        if (event.data.type === 'NEW_VERSION_AVAILABLE') {
          console.log('✨ Nova versão disponível:', event.data.version);
          setNewVersion(event.data.version);
          setShowUpdate(true);
        }
      };

      // Se já tem um controller ativo, escuta dele também
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.onmessage = (event) => {
          if (event.data.type === 'NEW_VERSION_AVAILABLE') {
            console.log('✨ Nova versão disponível:', event.data.version);
            setNewVersion(event.data.version);
            setShowUpdate(true);
          }
        };
      }
    }

    return () => {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.onmessage = null;
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.onmessage = null;
        }
      }
    };
  }, []);

  const handleUpdate = async () => {
    // Limpa TUDO
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }

    // Limpa localStorage (exceto usuario_id para manter logado)
    const usuarioId = localStorage.getItem('usuario_id');
    localStorage.clear();
    if (usuarioId) {
      localStorage.setItem('usuario_id', usuarioId);
    }

    // Recarrega
    window.location.reload();
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-4 flex justify-between items-center z-50 shadow-lg">
      <p className="text-sm md:text-base">✨ Nova versão disponível!</p>
      <button
        onClick={handleUpdate}
        className="ml-4 bg-white text-blue-600 px-4 py-2 rounded font-bold hover:bg-gray-100 text-sm md:text-base whitespace-nowrap"
      >
        Atualizar
      </button>
    </div>
  );
}
