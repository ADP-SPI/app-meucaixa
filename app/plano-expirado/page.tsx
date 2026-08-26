'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PlanoExpiradoPage() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <h1 className="text-3xl font-bold text-red-600 mb-4">⏰ ACESSO EXPIRADO</h1>
        
        <p className="text-gray-700 mb-6 text-lg">
          Seu período de teste expirou. Renove seu plano para continuar usando o Meu Caixa.
        </p>

        <div className="space-y-3">
          <Link
            href="/planos"
            className="block w-full bg-green-600 text-white p-4 rounded font-bold hover:bg-green-700"
          >
            🔄 RENOVAR PLANO AGORA
          </Link>

          <button
            onClick={handleLogout}
            className="w-full bg-gray-400 text-white p-4 rounded font-bold hover:bg-gray-500"
          >
            Sair / Trocar Usuário
          </button>
        </div>

        <p className="text-xs text-gray-600 mt-6">
          Dúvidas? Entre em contato pelo WhatsApp
        </p>
      </div>
    </div>
  );
}
