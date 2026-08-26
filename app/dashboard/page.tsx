'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
const [nomeUsuario, setNomeUsuario] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState('');
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [contaId, setContaId] = useState('');

useEffect(() => {
    // Validar sessão IMEDIATAMENTE
    const usuarioId = localStorage.getItem('usuario_id');
    const contaId = localStorage.getItem('conta_id');
    const nome = localStorage.getItem('usuario_nome');
    const tipo = localStorage.getItem('tipo_usuario');
    const empresa = localStorage.getItem('empresa_nome');

    if (!usuarioId || !contaId || !nome) {
      localStorage.clear();
      sessionStorage.clear();
      router.push('/login');
      return;
    }

    setNomeUsuario(nome);
    setTipoUsuario(tipo || '');
    setNomeEmpresa(empresa || '');
    const cId = localStorage.getItem('conta_id');
    setContaId(cId || '');
 }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-6xl">
    <div className="mb-6 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Empresa:</p>
            <p className="text-lg font-bold text-gray-900">{nomeEmpresa}</p>
            <p className="text-sm text-gray-600 mt-2">Logado como:</p>
            <p className="text-sm font-bold text-gray-900">{nomeUsuario}</p>        
        </div>
          <button
            onClick={() => {
              localStorage.clear();
              sessionStorage.clear();
              router.push('/login');
            }}
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
             {contaId === '4' && (
            <a href="/admin" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
              🔧 ADMIN
            </a>
          )}
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
