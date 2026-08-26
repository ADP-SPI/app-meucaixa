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
  const [modalAberto, setModalAberto] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [dataVencimento, setDataVencimento] = useState('');

  const planos = [
    { id: 1, nome: 'Básico', preco: 29.90, usuarios: 1, itens: 50, mesas: 10, tipo: 'empresa', descricao: '1 acesso, 50 itens, 10 mesas' },
    { id: 2, nome: 'Pro', preco: 49.90, usuarios: 3, itens: 100, mesas: 30, tipo: 'empresa', descricao: '3 acessos, 100 itens, 30 mesas' },
    { id: 3, nome: 'Enterprise', preco: 79.90, usuarios: 999, itens: 999, mesas: 999, tipo: 'empresa', descricao: 'Ilimitado' },
    { id: 4, nome: 'Individual', preco: 9.90, usuarios: 1, itens: 50, mesas: 0, tipo: 'pessoal', descricao: '1 acesso, Caixa e Relatórios' },
    { id: 5, nome: 'Casal', preco: 29.90, usuarios: 2, itens: 50, mesas: 0, tipo: 'pessoal', descricao: '2 acessos, Caixa e Relatórios' },
  ];

  const handleSelecionarPlano = (plano: any) => {
    setPlanoSelecionado(plano);
    setModalAberto(true);
    setErro('');
    setNomeEmpresa('');
    setNomeUsuario('');
    setEmail('');
    setWhatsapp('');
    setSenha('');
  };

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

      // 3. Criar assinatura com 15 dias
      const vencimento = new Date();
      vencimento.setDate(vencimento.getDate() + 15);
      
      const { error: erroAssinatura } = await supabase
        .from('assinaturas')
        .insert([{
          conta_id: conta.id,
          plano_id: planoSelecionado.id,
          status: 'teste_ativo',
          tipo_assinatura: 'teste',
          data_vencimento: vencimento.toISOString()
        }]);

      if (erroAssinatura) {
        setErro('Erro ao criar assinatura');
        setCarregando(false);
        return;
      }

      // 4. Salvar em localStorage
      localStorage.setItem('usuario_id', usuario.id.toString());
      localStorage.setItem('conta_id', conta.id.toString());
      localStorage.setItem('usuario_nome', usuario.nome);
      localStorage.setItem('tipo_usuario', 'proprietario');
      localStorage.setItem('empresa_nome', nomeEmpresa);
      localStorage.setItem('tipo_plano', planoSelecionado.tipo);

      // 5. Mostrar modal de sucesso
      setDataVencimento(vencimento.toLocaleDateString('pt-BR'));
      setModalAberto(false);
      setSuccessModal(true);
      
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

        {/* HEADER */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Escolha o Seu Plano</h1>
          <p className="text-2xl font-bold text-red-600 mb-4">⏰ 15 dias de teste grátis</p>
          <p className="text-gray-600 mb-8">Formas de Pagamento: Cartão de Crédito ou Pix</p>
        </div>

        {/* PLANOS EMPRESARIAIS */}
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">PLANOS EMPRESARIAIS</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {planos.filter(p => p.tipo === 'empresa').map((plano) => (
            <div key={plano.id} className="border-2 border-gray-200 bg-white rounded-lg p-6 hover:border-green-600 transition">
              <h3 className="text-2xl font-bold mb-2">{plano.nome}</h3>
              <p className="text-gray-600 mb-4">{plano.descricao}</p>
              <div className="text-3xl font-bold text-green-600 mb-6">
                R$ {plano.preco.toFixed(2)}<span className="text-sm">/mês</span>
              </div>
              <ul className="space-y-2 text-gray-700 mb-6">
                <li>✓ {plano.usuarios} acesso{plano.usuarios > 1 ? 's' : ''}</li>
                <li>✓ {plano.itens} itens cardápio</li>
                <li>✓ {plano.mesas} mesas/comandas</li>
              </ul>
              <button
                onClick={() => handleSelecionarPlano(plano)}
                className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700"
              >
                Selecionar
              </button>
            </div>
          ))}
        </div>

        {/* DIVISÓRIA */}
        <div className="flex items-center gap-4 my-12">
          <div className="flex-1 h-px bg-gray-300"></div>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* PLANOS PESSOAIS */}
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">PLANOS PARA USO PESSOAL</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-2xl mx-auto">
          {planos.filter(p => p.tipo === 'pessoal').map((plano) => (
            <div key={plano.id} className="border-2 border-gray-200 bg-white rounded-lg p-6 hover:border-green-600 transition">
              <h3 className="text-2xl font-bold mb-4">{plano.nome}</h3>
              
              {plano.id === 4 ? (
                <div className="mb-6">
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-red-600">9,90</span>
                    <span className="text-red-600 font-bold"> 🏷️ NO PRIMEIRO MÊS</span>
                  </div>
                  <p className="text-sm font-bold text-red-600 mb-4">PROMOÇÃO POR TEMPO LIMITADO</p>
                  <p className="text-green-600 text-sm mb-4">Depois: R$ 19,90/mês</p>
                </div>
              ) : (
                <div className="mb-6">
                  <p className="text-3xl font-bold text-green-600">R$ {plano.preco.toFixed(2)}<span className="text-sm">/mês</span></p>
                </div>
              )}

              <p className="text-gray-600 mb-4">{plano.descricao}</p>
              <ul className="space-y-2 text-gray-700 mb-6">
                <li>✓ {plano.usuarios} acesso{plano.usuarios > 1 ? 's' : ''}</li>
                <li>✓ Caixa + Relatórios</li>
              </ul>
              <button
                onClick={() => handleSelecionarPlano(plano)}
                className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700"
              >
                Selecionar
              </button>
            </div>
          ))}
        </div>

        {/* MODAL CADASTRO */}
        {modalAberto && planoSelecionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full max-h-screen overflow-y-auto">
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

              <div className="space-y-2">
                <button
                  onClick={handleCadastro}
                  disabled={carregando}
                  className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700 disabled:bg-gray-400"
                >
                  {carregando ? 'Processando...' : '✓ CONTRATAR PLANO'}
                </button>

                <button
                  onClick={() => {
                    setModalAberto(false);
                    setPlanoSelecionado(null);
                  }}
                  className="w-full bg-gray-400 text-white p-3 rounded font-bold hover:bg-gray-500"
                >
                  ✕ CANCELAR
                </button>
              </div>

              <p className="text-center text-xs text-gray-600 mt-4">
                Já tem conta? <Link href="/login" className="text-blue-600 hover:underline">Faça login</Link>
              </p>
            </div>
          </div>
        )}

        {/* MODAL SUCESSO */}
        {successModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
              <h3 className="text-2xl font-bold text-green-600 mb-4">✅ TESTE ATIVADO!</h3>
              
              <div className="bg-green-50 p-6 rounded-lg mb-6">
                <p className="text-gray-600 mb-2">Seu teste grátis vence em:</p>
                <p className="text-3xl font-bold text-green-600 mb-4">📅 {dataVencimento}</p>
                <p className="text-sm text-gray-600">(15 dias de teste grátis)</p>
              </div>

              <p className="text-gray-700 mb-6 font-semibold">
                Aproveite seu sistema! Teste todas as funcionalidades e veja como funciona.
              </p>

              <button
                onClick={() => {
                  setSuccessModal(false);
                  router.push('/login');
                }}
                className="w-full bg-green-600 text-white p-4 rounded font-bold hover:bg-green-700 mb-2"
              >
                🚀 COMEÇAR AGORA
              </button>

              <p className="text-xs text-gray-600">
                Clique acima para fazer login e começar a usar seu sistema
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
