'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rbocrgnmsadkbfoqbzpe.supabase.co',
  'sb_publishable_CXx1yNZ2C03bTuNpeDUNsQ_k4JHv9Vm'
);

export default function PlanosPage() {
  const router = useRouter();
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [senha, setSenha] = useState('');
  const [planoSelecionado, setPlanoSelecionado] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const planos = [
    { id: 1, nome: 'Básico', preco: 29.90, usuarios: 1, itens: 50, mesas: 10, tipo: 'empresa', descricao: '1 acesso, 50 itens, 10 mesas' },
    { id: 2, nome: 'Pro', preco: 49.90, usuarios: 3, itens: 100, mesas: 30, tipo: 'empresa', descricao: '3 acessos, 100 itens, 30 mesas' },
    { id: 3, nome: 'Enterprise', preco: 79.90, usuarios: 999, itens: 999, mesas: 999, tipo: 'empresa', descricao: 'Ilimitado' },
    { id: 4, nome: 'Individual', preco: 9.90, usuarios: 1, itens: 50, mesas: 0, tipo: 'pessoal', descricao: '1 acesso, Caixa e Relatórios' },
    { id: 5, nome: 'Casal', preco: 29.90, usuarios: 2, itens: 50, mesas: 0, tipo: 'pessoal', descricao: '2 acessos, Caixa e Relatórios' },
  ];

  const handleCadastro = async () => {
    if (!nomeEmpresa.trim() || !nomeUsuario.trim() || !email.trim() || !whatsapp.trim() || !senha.trim()) {
      setErro('Preencha todos os campos');
      return;
    }

    if (!planoSelecionado) {
      setErro('Selecione um plano');
      return;
    }

    setCarregando(true);
    setErro('');
    setSucesso('');

    try {
      // 1. Criar conta
      const { data: conta, error: erroConta } = await supabase
        .from('contas')
        .insert([{
          nome: nomeEmpresa,
          email: email,
          whatsapp: whatsapp,
          plano_id: planoSelecionado.id,
          status_assinatura: 'pendente',
          ativo: true
        }])
        .select()
        .single();

      if (erroConta || !conta) {
        setErro('Email ou empresa já cadastrada');
        setCarregando(false);
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
          tipo: 'proprietario',
          ativo: true
        }])
        .select()
        .single();

      if (erroUsuario || !usuario) {
        setErro('Erro ao criar usuário');
        setCarregando(false);
        return;
      }

      // 3. Criar assinatura
      const dataVencimento = new Date();
      dataVencimento.setDate(dataVencimento.getDate() + (planoSelecionado.tipo === 'pessoal' ? 15 : 15));
      
      const tipoAssinatura = planoSelecionado.tipo === 'pessoal' ? 'teste' : 'teste';

      const { error: erroAssinatura } = await supabase
        .from('assinaturas')
        .insert([{
          conta_id: conta.id,
          plano_id: planoSelecionado.id,
          status: tipoAssinatura === 'teste' ? 'teste_ativo' : 'pendente',
          tipo_assinatura: tipoAssinatura,
          data_vencimento: dataVencimento.toISOString()
        }]);

      if (erroAssinatura) {
        setErro('Erro ao criar assinatura');
        setCarregando(false);
        return;
      }

      // 4. Salvar em localStorage e redirecionar
      localStorage.setItem('usuario_id', usuario.id.toString());
      localStorage.setItem('conta_id', conta.id.toString());
      localStorage.setItem('usuario_nome', usuario.nome);
      localStorage.setItem('tipo_usuario', 'proprietario');
      localStorage.setItem('empresa_nome', nomeEmpresa);
      localStorage.setItem('tipo_plano', planoSelecionado.tipo);

      if (planoSelecionado.tipo === 'pessoal') {
        alert(`✅ Teste de 15 dias ativado!\n\nAcesso: Caixa + Relatórios`);
      } else {
        alert(`✅ Teste de 15 dias ativado!\n\nAcesso liberado para: ${dataVencimento.toLocaleDateString('pt-BR')}`);
      }

      router.push('/login');
    } catch (err) {
      console.error('Erro:', err);
      setErro('Erro ao processar cadastro');
    }

    setCarregando(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Escolha o Plano Ideal</h1>
          <p className="text-gray-600">15 dias de teste grátis. Sem cartão de crédito.</p>
        </div>

        {/* PLANOS EMPRESARIAIS */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">PLANOS EMPRESARIAIS</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {planos.filter(p => p.tipo === 'empresa').map((plano) => (
              <div
                key={plano.id}
                onClick={() => setPlanoSelecionado(plano)}
                className={`border-2 rounded-lg p-6 cursor-pointer transition ${
                  planoSelecionado?.id === plano.id
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-green-600'
                }`}
              >
                <h3 className="text-2xl font-bold mb-2">{plano.nome}</h3>
                <p className="text-gray-600 mb-4">{plano.descricao}</p>
                <div className="text-3xl font-bold text-green-600 mb-6">
                  R$ {plano.preco.toFixed(2)}<span className="text-sm text-gray-600">/mês</span>
                </div>
                <ul className="space-y-2 text-gray-700 mb-6">
                  <li>✓ {plano.usuarios} acesso{plano.usuarios > 1 ? 's' : ''}</li>
                  <li>✓ {plano.itens} itens cardápio</li>
                  <li>✓ {plano.mesas} mesas/comandas</li>
                </ul>
                <button
                  onClick={() => setPlanoSelecionado(plano)}
                  className="w-full bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700"
                >
                  {planoSelecionado?.id === plano.id ? '✓ Selecionado' : 'Selecionar'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* DIVISÓRIA */}
        <div className="flex items-center gap-4 my-12">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-gray-600 font-semibold">PLANOS PARA USO PESSOAL</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* PLANOS PESSOAIS */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {planos.filter(p => p.tipo === 'pessoal').map((plano) => (
              <div
                key={plano.id}
                onClick={() => setPlanoSelecionado(plano)}
                className={`border-2 rounded-lg p-6 cursor-pointer transition ${
                  planoSelecionado?.id === plano.id
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-green-600'
                }`}
              >
                <h3 className="text-2xl font-bold mb-4">{plano.nome}</h3>
                
                {plano.id === 4 ? (
                  // Individual com preço promocional
                  <div className="mb-6">
                    <p className="text-red-600 font-bold">R$ 9,90 🏷️ NO PRIMEIRO MÊS</p>
                    <p className="text-sm font-bold text-red-600 mb-2">PROMOÇÃO POR TEMPO LIMITADO</p>
                    <p className="text-gray-600 text-sm mb-4">Depois: R$ 19,90/mês</p>
                    <p className="text-xs text-green-600 font-bold">Teste: 15 dias grátis</p>
                  </div>
                ) : (
                  // Casal preço normal
                  <div className="mb-6">
                    <p className="text-3xl font-bold text-green-600">R$ {plano.preco.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">/mês</p>
                    <p className="text-xs text-green-600 font-bold mt-2">Teste: 15 dias grátis</p>
                  </div>
                )}

                <p className="text-gray-600 mb-4">{plano.descricao}</p>
                <ul className="space-y-2 text-gray-700 mb-6">
                  <li>✓ {plano.usuarios} acesso{plano.usuarios > 1 ? 's' : ''}</li>
                  <li>✓ Caixa + Relatórios</li>
                </ul>
                <button
                  onClick={() => setPlanoSelecionado(plano)}
                  className="w-full bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700"
                >
                  {planoSelecionado?.id === plano.id ? '✓ Selecionado' : 'Selecionar'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FORMULÁRIO CADASTRO */}
        {planoSelecionado && (
          <div className="bg-white p-8 rounded-lg shadow-md mb-8">
            <h3 className="text-xl font-bold mb-6">Cadastro - Plano {planoSelecionado.nome}</h3>

            {erro && (
              <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
                {erro}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold mb-2">Nome da Empresa/Negócio</label>
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
                <label className="block text-sm font-bold mb-2">WhatsApp</label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ex: (44) 99999-9999"
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

            <button
              onClick={handleCadastro}
              disabled={carregando}
              className="w-full bg-green-600 text-white p-4 rounded font-bold hover:bg-green-700 disabled:bg-gray-400"
            >
              {carregando ? 'Processando...' : '✓ CONTRATAR PLANO'}
            </button>

            <p className="text-center text-xs text-gray-600 mt-4">
              Já tem conta? <Link href="/login" className="text-blue-600 hover:underline">Faça login</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
