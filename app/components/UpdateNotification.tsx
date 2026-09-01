'use client';
import { useEffect, useState } from 'react';

export default function UpdateNotification() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (e) => {
        if (e.data.type === 'UPDATE') {
          console.log('✨ Atualização disponível:', e.data.version);
          setShow(true);
        }
      });
    }
  }, []);

  const handleClick = async () => {
    const names = await caches.keys();
    await Promise.all(names.map(n => caches.delete(n)));
    window.location.reload();
  };

  return show ? (
    <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-3 flex justify-between z-50">
      <p>✨ Nova versão disponível!</p>
      <button onClick={handleClick} className="bg-white text-blue-600 px-4 py-1 rounded font-bold">
        Atualizar
      </button>
    </div>
  ) : null;
}
