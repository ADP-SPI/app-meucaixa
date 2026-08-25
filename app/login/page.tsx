'use client';

// Se veio de logout, limpa tudo
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  if (params.get('logout') === 'true') {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
  }
}

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rbocrgnmsadkbfoqbzpe.supabase.co',
  'sb_publishable_CXx1yNZ2C03bTuNpeDUNsQ_k4JHv9Vm'
);

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [modo, setModo] = useState('login');
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [nomeUsuario, setNomeUsuario] = useState('');

  const fazerLogin = async () => {
    setErro('');
    setCarregando(true);

    try {
      const { data: usuarios, error: erroUsuario } = await supabase
        .from('usuarios')
        .select('id, conta_id, senha_hash, nome, tipo')
        .eq('email', email)
        .single();

      if (erroUsuario || !usuarios) {
        setErro('Email ou senha incorretos');
        setCarregando(false);
        return;
      }

      if (usuarios.senha_hash !== senha) {
        setErro('Email ou senha incorretos');
        setCarregando(false);
        return;
      }
      localStorage.setItem('usuario_id', usuarios.id.toString());
      localStorage.setItem('conta_id', usuarios.conta_id.toString());
      localStorage.setItem('usuario_nome', usuarios.nome);
      localStorage.setItem('tipo_usuario', usuarios.tipo);
      
     
     // Buscar nome da empresa
      const { data: contaData, error: erroContaData } = await supabase
        .from('contas')
        .select('nome')
        .eq('id', usuarios.conta_id)
        .single();

      console.log('contaData:', contaData);
      console.log('erroContaData:', erroContaData);

      if (contaData?.nome) {
        localStorage.setItem('empresa_nome', contaData.nome);
        document.cookie = `empresa_nome=${contaData.nome}; path=/`;
      }    
  
      document.cookie = `usuario_id=${usuarios.id}; path=/`;
      document.cookie = `conta_id=${usuarios.conta_id}; path=/`;
      document.cookie = `usuario_nome=${usuarios.nome}; path=/`;
      document.cookie = `tipo_usuario=${usuarios.tipo}; path=/`;
      
      router.push('/dashboard');
    } catch (err) {
     
      setErro('Erro ao conectar. Tente novamente.');
      console.error(err);
    }

    setCarregando(false);
  };

  const fazerCadastro = async () => {
    setErro('');
    setCarregando(true);

    try {
      if (!nomeEmpresa.trim() || !nomeUsuario.trim() || !email.trim() || !senha.trim()) {
        setErro('Preencha todos os campos');
        setCarregando(false);
        return;
      }

      const { data: conta, error: erroConta } = await supabase
        .from('contas')
        .insert([{ nome: nomeEmpresa, email: email }])
        .select()
        .single();

      if (erroConta) {
        setErro('Email de empresa já cadastrado');
        setCarregando(false);
        return;
      }

      if (!conta) {
        setErro('Erro ao criar conta');
        setCarregando(false);
        return;
      }

      const { data: usuario, error: erroUsuario } = await supabase
        .from('usuarios')
        .insert([
          {
            conta_id: conta.id,
            email: email,
            senha_hash: senha,
            nome: nomeUsuario,
            tipo: 'proprietario'
          }
        ])
        .select()
        .single();

      if (erroUsuario || !usuario) {
        setErro('Erro ao criar usuário');
        setCarregando(false);
        return;
      }

      localStorage.setItem('usuario_id', usuario.id.toString());
      localStorage.setItem('conta_id', usuario.conta_id.toString());
      localStorage.setItem('usuario_nome', usuario.nome);
      localStorage.setItem('tipo_usuario', 'proprietario');

      document.cookie = `usuario_id=${usuario.id}; path=/`;
      document.cookie = `conta_id=${usuario.conta_id}; path=/`;
      document.cookie = `usuario_nome=${usuario.nome}; path=/`;
      document.cookie = `tipo_usuario=proprietario; path=/`;

      router.push('/dashboard');
    } catch (err) {
      setErro('Erro ao cadastrar. Tente novamente.');
      console.error(err);
    }

    setCarregando(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modo === 'login') {
      fazerLogin();
    } else {
      fazerCadastro();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center items-center">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Meu Caixa</h1>
            <p className="text-gray-600 mt-2">Gestão simples do seu negócio</p>
          </div>

          {erro && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === 'cadastro' && (
              <>
                <div>
                  <label className="block text-sm font-bold mb-2">Nome da Empresa</label>
                  <input
                    type="text"
                    value={nomeEmpresa}
                    onChange={(e) => setNomeEmpresa(e.target.value)}
                    placeholder="Ex: Barbearia João"
                    className="w-full border border-gray-300 p-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Seu Nome</label>
                  <input
                    type="text"
                    value={nomeUsuario}
                    onChange={(e) => setNomeUsuario(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full border border-gray-300 p-2 rounded"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full border border-gray-300 p-2 rounded"
              />
            </div>

            <div>
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
              {carregando ? 'Processando...' : modo === 'login' ? 'ENTRAR' : 'CADASTRAR'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-3">
              {modo === 'login' ? 'Não tem conta?' : 'Já tem conta?'}
            </p>
            <button
              onClick={() => {
                setModo(modo === 'login' ? 'cadastro' : 'login');
                setErro('');
              }}
              className="text-blue-600 hover:underline font-bold"
            >
              {modo === 'login' ? 'CADASTRAR' : 'ENTRAR'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
