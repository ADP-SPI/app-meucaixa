'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// ✅ UMA ÚNICA instância global do Supabase
const supabase = createClient(
  'https://rbocrgnmsadkbfoqbzpe.supabase.co',
  'sb_publishable_CXx1yNZ2C03bTuNpeDUNsQ_k4JHv9Vm'
);

// Gera device_id único pra cada dispositivo
const gerarDeviceId = () => {
  if (typeof window === 'undefined') return 'server_' + Date.now();
  
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  // Detecta se foi desconectado por novo login
  const [logadoOutro, setLogadoOutro] = useState(false);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setLogadoOutro(params.get('logado_outro_dispositivo') === 'true');
  }, []); 

  if (logadoOutro) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-blue-600 mb-4">⚠️ Nova Sessão Iniciada</h1>
          <p className="text-gray-700 mb-6">
            Você foi desconectado porque fez login em outro dispositivo.
          </p>
         
         <button
           onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
           }}
           className="inline-block bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700"
      >
      ✓ Fazer Login Novamente
</button>   

        </div>
      </div>
    );
  }

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
      
      console.log('✅ Usuário autenticado:', usuarios);
      console.log('🔍 Agora vou buscar a conta...');
      
      // Buscar nome da empresa
      console.log('🔍 Buscando conta com ID:', usuarios.conta_id);
      const { data: conta, error: eroConta } = await supabase
        .from('contas')
        .select('nome, whatsapp')
        .eq('id', usuarios.conta_id)
        .single();
      
      console.log('Conta encontrada:', conta);
      console.log('Erro ao buscar conta:', eroConta);
      
      if (eroConta) {
        console.error('❌ Erro ao buscar conta:', eroConta);
        throw new Error('Erro ao buscar dados da empresa');
      }
      
      // Salvar dados básicos
      localStorage.setItem('usuario_id', usuarios.id.toString());
      localStorage.setItem('conta_id', usuarios.conta_id.toString());
      localStorage.setItem('usuario_nome', usuarios.nome);
      localStorage.setItem('tipo_usuario', usuarios.tipo);
      localStorage.setItem('empresa_nome', conta?.nome || '');
      console.log('✅ Empresa salva, agora vou gerar device_id...');

      // Gera device_id
      console.log('⏳ Gerando device_id...');
      const deviceId = 'device_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      console.log('✅ Device_id gerado:', deviceId);      
      localStorage.setItem('device_id', deviceId);
      console.log('✅ Device_id salvo no localStorage');
      console.log('Salvando device_id:', deviceId, 'Usuario:', usuarios.id);

      // Atualiza device_id no Supabase
        console.log('Antes de update - usuarios.id:', usuarios.id, 'tipo:', typeof usuarios.id);
      console.log('Device ID a salvar:', deviceId);
      
      const { data: updateData, error: erroDevice } = await supabase
        .from('usuarios')
        .update({ device_id: deviceId })
        .eq('id', parseInt(usuarios.id))
        .select();
      
      console.log('Update retornou:', updateData);
      console.log('Erro ao salvar device_id:', erroDevice);

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
