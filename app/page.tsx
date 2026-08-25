'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState('');
  const [validando, setValidando] = useState(true);

  useEffect(() => {
    validarSessao();
  }, []);

  const validarSessao = () => {
    const usuarioId = localStorage.getItem('usuario_id');
    const contaId = localStorage.getItem('conta_id');
    const nomeUsuario = localStorage.getItem('usuario_nome');
    const tipoUsuario = localStorage.getItem('tipo_usuario');

    // Se falta algum dado, limpa tudo e vai pro login
    if (!usuarioId || !contaId || !nomeUsuario) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/login');
      return;
    }

    setNomeUsuario(nomeUsuario);
    setTipoUsuario(tipoUsuario || '');
    setValidando(false);
  };

  const handleLogout = () => {
    // Limpar tudo
    localStorage.removeItem('usuario_id');
    localStorage.removeItem('conta_id');
    localStorage.removeItem('usuario_nome');
    localStorage.removeItem('tipo_usuario');
    sessionStorage.clear();

    // Limpar cookies
    document.cookie = 'usuario_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    document.cookie = 'conta_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    document.cookie = 'usuario_nome=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    document.cookie = 'tipo_usuario=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';

    // Redirecionar com reload forçado
     window.location.href = '/login?logout=true';
  };

  if (validando) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Validando sessão...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-6xl">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Logado como:</p>
            <p className="text-lg font-bold text-gray-900">{nomeUsuario}</p>
            {tipoUsuario === 'proprietario' && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-1 inline-block">
                👤 Proprietário
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="text-blue-600 hover:underline font-bold"
          >
            Sair / Trocar Usuário
          </button>
        </div>

        <div className="text-center py-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Meu Caixa</h1>
          <p className="text-gray-600 mt-2">Gestão simples do seu negócio</p>
        </div>

        <div className="space-y-3">
          <a href="/agenda" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
            📅 AGENDA
          </a>
          <a href="/caixa" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
            💰 CAIXA
          </a>
          <a href="/fiados" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
            📝 FIADOS
          </a>
          <a href="/comanda" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
            🍽️ COMANDA
          </a>
          <a href="/cardapio" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
            📋 CARDÁPIO
          </a>
          <a href="/relatorios" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
            📊 RELATÓRIOS
          </a>
          {tipoUsuario === 'proprietario' && (
            <a href="/usuarios" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
              👥 GERENCIAR USUÁRIOS
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
