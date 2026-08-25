'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rbocrgnmsadkbfoqbzpe.supabase.co',
  'sb_publishable_CXx1yNZ2C03bTuNpeDUNsQ_k4JHv9Vm'
);

export default function Planos() {
  const router = useRouter();
  const [planos, setPlanos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [email, setEmail] = useState('');
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [planoSelecionado, setPlanoSelecionado] = useState<any>(null);
  const [tipoAssinatura, setTipoAssinatura] = useState('');
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarPlanos();
  }, []);

  const carregarPlanos = async () => {
    try {
      const { data } = await supabase
        .from('planos')
        .select('*')
        .order('id', { ascending: true });

      setPlanos(data || []);
    } catch (err) {
      console.error('Erro ao carregar planos:', err);
    }
    setCarregando(false);
  };

  const selecionarPlano = (plano: any, tipo: string) => {
    setPlanoSelecionado(plano);
    setTipoAssinatura(tipo);
    setErro('');
  };

  const confirmarAssinatura = async () => {
    if (!planoSelecionado || !tipoAssinatura) return;
    if (!email.trim() || !nomeEmpresa.trim() || !nomeUsuario.trim() || !senha.trim()) {
      setErro('Preencha todos os campos');
      return;
    }

    setProcessando(true);
    setErro('');

    try {
      // 1. Criar conta
      const { data: conta, error: erroConta } = await supabase
        .from('contas')
        .insert([{
          nome: nomeEmpresa,
          email: email,
          plano_id: planoSelecionado.id,
          status_assinatura: tipoAssinatura === 'teste' ? 'teste_ativo' : 'pendente_pagamento'
        }])
        .select()
        .single();

      if (erroConta || !conta) {
        setErro('Email de empresa já cadastrado');
        setProcessando(false);
        return;
      }

      // 2. Criar usuário
      const { data: usuario, error: erroUsuario } = await supabase
        .from('usuarios')
        .insert([{
          conta_id: conta.id,
          email: email,
          senha_hash: senha,
          nome: nomeUsuario,
          tipo: 'proprietario'
        }])
        .select()
        .single();

      if (erroUsuario || !usuario) {
        setErro('Erro ao criar usuário');
        setProcessando(false);
        return;
      }

      // 3. Criar assinatura
      const dataVencimento = tipoAssinatura === 'teste' 
          ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);


      const { error: erroAssinatura } = await supabase
        .from('assinaturas')
        .insert([{
          conta_id: conta.id,
          plano_id: planoSelecionado.id,
          status: tipoAssinatura === 'teste' ? 'teste_ativo' : 'pendente',
          tipo_assinatura: tipoAssinatura,
          data_vencimento: dataVencimento
        }]);

      if (erroAssinatura) {
        setErro('Erro ao criar assinatura');
        setProcessando(false);
        return;
      }

      // 4. Salvar em localStorage e redirecionar
      localStorage.setItem('usuario_id', usuario.id.toString());
      localStorage.setItem('conta_id', conta.id.toString());
      localStorage.setItem('usuario_nome', usuario.nome);

      if (tipoAssinatura === 'teste') {
        alert(`✅ Teste de 15 dias ativado!\n\nAcesso liberado para: ${dataVencimento?.toLocaleDateString('pt-BR')}`);
      } else {
        alert(`✅ Assinatura criada!\n\nAguarde o email com instruções de pagamento.\nPlano: ${planoSelecionado.nome}\nValor: R$ ${planoSelecionado.preco_mensal.toFixed(2)}/mês`);
      }
       localStorage.setItem('tipo_usuario', 'proprietario');
       localStorage.setItem('empresa_nome', nomeEmpresa);

    router.push('/login');
    } catch (err) {
      setErro('Erro ao processar assinatura');
      console.error(err);
    }

    setProcessando(false);
  };

  if (carregando) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Carregando planos...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-6xl">
        {!planoSelecionado ? (
          <>
            {/* HEADER */}
            <div className="text-center py-8 mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Meu Caixa</h1>
            </div>

            {/* BOTÃO LOGIN */}
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-3">Já tem uma conta?</p>
              <a 
                href="/login" 
                className="inline-block border-2 border-black bg-white text-black px-6 py-3 rounded font-bold hover:bg-gray-50 transition"
              >
                Faça login aqui
              </a>
            </div>

            {/* SUBTÍTULO */}
            <div className="text-center mb-8">
              <p className="text-gray-600 text-lg">Escolha seu plano e comece agora</p>
            </div>

            {/* PLANOS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {planos.map((plano) => (
                <div key={plano.id} className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-200 hover:border-green-600 transition">
                  <h2 className="text-2xl font-bold mb-2">{plano.nome}</h2>
                  <p className="text-gray-600 text-sm mb-4">{plano.descricao}</p>

                  <div className="bg-green-100 p-4 rounded-lg mb-6 text-center">
                    <p className="text-3xl font-bold text-green-600">R$ {plano.preco_mensal.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">/mês</p>
                  </div>

                  <ul className="space-y-2 mb-6 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>{plano.max_usuarios} {plano.max_usuarios === 1 ? 'acesso' : 'acessos'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>{plano.max_itens} itens no cardápio</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>{plano.max_mesas} mesas/clientes</span>
                    </li>
                  </ul>

                  <div className="space-y-2">
                    <button
                      onClick={() => selecionarPlano(plano, 'teste')}
                      className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700"
                    >
                      Teste 15 dias grátis
                    </button>
                    <button
                      onClick={() => selecionarPlano(plano, 'pago')}
                      className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700"
                    >
                      Comprar agora
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4">
                {tipoAssinatura === 'teste' ? '🎉 Teste Grátis' : '💳 Comprar Agora'}
              </h2>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600">Plano selecionado:</p>
                <p className="text-2xl font-bold text-blue-600">{planoSelecionado.nome}</p>
                {tipoAssinatura === 'teste' ? (
                  <p className="text-sm text-green-600 mt-2">15 dias de teste gratuito</p>
                ) : (
                  <p className="text-sm text-gray-600 mt-2">R$ {planoSelecionado.preco_mensal.toFixed(2)}/mês</p>
                )}
              </div>

              {erro && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
                  {erro}
                </div>
              )}

              <div className="space-y-4 mb-6">
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
              </div>

              <div className="space-y-3">
                <button
                  onClick={confirmarAssinatura}
                  disabled={processando}
                  className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700 disabled:bg-gray-400"
                >
                  {processando ? 'Processando...' : tipoAssinatura === 'teste' ? 'Iniciar teste grátis' : 'Confirmar compra'}
                </button>

                <button
                  onClick={() => {
                    setPlanoSelecionado(null);
                    setTipoAssinatura('');
                    setEmail('');
                    setNomeEmpresa('');
                    setNomeUsuario('');
                    setSenha('');
                  }}
                  className="w-full bg-gray-400 text-white p-3 rounded font-bold hover:bg-gray-500"
                >
                  Voltar
                </button>
              </div>

              {tipoAssinatura === 'pago' && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-700">
                  <p className="font-bold mb-2">📧 Próximos passos:</p>
                  <p>1. Você receberá um email com instruções de pagamento</p>
                  <p>2. Faça o pagamento via PIX ou cartão</p>
                  <p>3. Seu acesso será ativado imediatamente após confirmação</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
