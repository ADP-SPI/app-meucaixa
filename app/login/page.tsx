'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rbocrgnmsadkbfoqbzpe.supabase.co',
  'sb_publishable_CXx1yNZ2C03bTuNpeDUNsQ_k4JHv9Vm'
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      const { data: usuarios, error: erroLogin } = await supabase
        .from('usuarios')
        .select('id, conta_id, email, nome, tipo')
        .eq('email', email)
        .eq('senha_hash', senha)
        .single();

      if (erroLogin || !usuarios) {
        setErro('Email ou senha incorretos');
        setCarregando(false);
        return;
      }

      // Buscar nome da empresa
      const { data: conta } = await supabase
        .from('contas')
        .select('nome, whatsapp')
        .eq('id', usuarios.conta_id)
        .single();

      localStorage.setItem('usuario_id', usuarios.id.toString());
      localStorage.setItem('conta_id', usuarios.conta_id.toString());
      localStorage.setItem('usuario_nome', usuarios.nome);
      localStorage.setItem('tipo_usuario', usuarios.tipo);
      localStorage.setItem('empresa_nome', conta?.nome || '');

      router.push('/dashboard');
    } catch (err) {
      console.error('Erro:', err);
      setErro('Erro ao fazer login');
    }

    setCarregando(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Meu Caixa</h1>

        <form onSubmit={handleLogin}>
          {erro && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
              {erro}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold mb-2">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700 disabled:bg-gray-400"
          >
            {carregando ? 'Entrando...' : '✓ ENTRAR'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">
          Não tem conta? <Link href="/planos" className="text-blue-600 hover:underline">Contrate um plano aqui</Link>
        </p>
      </div>
    </div>
  );
}
