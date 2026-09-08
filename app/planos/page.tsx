'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rbocrgnmsadkbfoqbzpe.supabase.co',
  'sb_publishable_CXx1yNZ2C03bTuNpeDUNsQ_k4JHv9Vm'
);

const formatarPreco = (valor: number) => {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

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
    { id: 4, nome: 'Individual', preco: 19.90, usuarios: 1, itens: 50, mesas: 0, tipo: 'pessoal', descricao: 'Acesso ao Caixa, Lançamentos e Relatórios' },
    { id: 5, nome: 'Casal', preco: 29.90, usuarios: 2, itens: 50, mesas: 0, tipo: 'pessoal', descricao: 'Acesso ao Caixa, Lançamentos e Relatórios' },
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

    setCarregando(true);

    try {
      const { data: contaExistente } = await supabase
        .from('contas')
        .select('id')
        .eq('email', email)
        .single();

      if (contaExistente) {
        setErro('Email já cadastrado');
        setCarregando(false);
        return;
      }

      const { data: novaConta, error: erroContaError } = await supabase
        .from('contas')
        .insert([{
          nome: nomeEmpresa,
          email: email,
          whatsapp: whatsapp,
          plano_id: planoSelecionado.id,
          status_assinatura: 'ativa',
          ativo: true
        }])
        .select();

      if (erroContaError || !novaConta || novaConta.length === 0) {
        setErro('Erro ao criar conta');
        setCarregando(false);
        return;
      }

      const contaId = novaConta[0].id;

      const dataInicio = new Date();
      const dataVenc = new Date(dataInicio);
      dataVenc.setDate(dataVenc.getDate() + 15);

      const { error: erroAssinatura } = await supabase
        .from('assinaturas')
        .insert([{
          conta_id: contaId,
          plano_id: planoSelecionado.id,
          status: 'teste_ativo',
          tipo_assinatura: 'teste',
          data_inicio: dataInicio.toISOString(),
          data_vencimento: dataVenc.toISOString()
        }]);

      if (erroAssinatura) {
        setErro('Erro ao criar assinatura');
        setCarregando(false);
        return;
      }

      const deviceId = `device_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;

      const { data: novoUsuario, error: erroUsuario } = await supabase
        .from('usuarios')
        .insert([{
          conta_id: contaId,
          email: email,
          senha_hash: senha,
          nome: nomeUsuario,
          tipo: 'proprietario',
          ativo: true,
          device_id: deviceId
        }])
        .select();

      if (erroUsuario || !novoUsuario || novoUsuario.length === 0) {
        setErro('Erro ao criar usuário');
        setCarregando(false);
        return;
      }

      setDataVencimento(dataVenc.toLocaleDateString('pt-BR'));
      setSuccessModal(true);
      setModalAberto(false);

      setTimeout(() => {
        localStorage.setItem('usuario_id', novoUsuario[0].id.toString());
        localStorage.setItem('conta_id', contaId.toString());
        localStorage.setItem('usuario_nome', nomeUsuario);
        localStorage.setItem('tipo_usuario', 'proprietario');
        localStorage.setItem('empresa_nome', nomeEmpresa);
        localStorage.setItem('tipo_plano', planoSelecionado.tipo);
        localStorage.setItem('device_id', deviceId);
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      setErro('Erro inesperado');
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline font-bold mb-8 inline-block">
          ← Voltar para Home
        </Link>

        <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">Escolha seu Plano</h1>
        <p className="text-center text-gray-600 mb-12">Selecione o plano ideal para sua necessidade</p>

        {/* PLANOS EMPRESARIAIS */}
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">PLANOS PARA EMPRESAS</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
          {planos.filter(p => p.tipo === 'empresa').map((plano) => (
            <div key={plano.id} className="border-2 border-gray-200 bg-white rounded-lg p-6 hover:border-green-600 transition shadow-lg">
              <h3 className="text-2xl font-bold mb-4">{plano.nome}</h3>
              <div className="mb-6">
                <p className="text-3xl font-bold text-green-600">{formatarPreco(plano.preco)}<span className="text-lg">/mês</span></p>
              </div>
              <p className="text-gray-600 mb-4">{plano.descricao}</p>
              <ul className="space-y-2 text-gray-700 mb-6">
                <li>✓ {plano.usuarios} acesso{plano.usuarios > 1 ? 's' : ''}</li>
                <li>✓ {plano.itens} itens cardápio</li>
                <li>✓ {plano.mesas} mesas/comandas</li>
              </ul>
              <button
                onClick={() => handleSelecionarPlano(plano)}
                className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700 transition"
              >
                Selecionar
              </button>
            </div>
          ))}
        </div>

        {/* PLANOS PESSOAIS */}
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">PLANOS PARA USO PESSOAL</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-2xl mx-auto">
          {planos.filter(p => p.tipo === 'pessoal').map((plano) => (
            <div key={plano.id} className="border-2 border-gray-200 bg-white rounded-lg p-6 hover:border-green-600 transition shadow-lg">
              <h3 className="text-2xl font-bold mb-4">{plano.nome}</h3>
              <div className="mb-6">
                <p className="text-3xl font-bold text-green-600">{formatarPreco(plano.preco)}<span className="text-lg">/mês</span></p>
              </div>
              <p className="text-gray-600 mb-6">{plano.descricao}</p>
              <button
                onClick={() => handleSelecionarPlano(plano)}
                className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700 transition"
              >
                Selecionar
              </button>
            </div>
          ))}
        </div>

        {/* MODAL CADASTRO */}
        {modalAberto && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6">Cadastro - {planoSelecionado?.nome}</h2>

              {erro && <p className="text-red-600 font-bold mb-4">{erro}</p>}

              <input
                type="text"
                placeholder="Nome da Empresa"
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
                className="w-full p-3 mb-4 border border-gray-300 rounded"
              />
              <input
                type="text"
                placeholder="Seu Nome"
                value={nomeUsuario}
                onChange={(e) => setNomeUsuario(e.target.value)}
                className="w-full p-3 mb-4 border border-gray-300 rounded"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 mb-4 border border-gray-300 rounded"
              />
              <input
                type="text"
                placeholder="WhatsApp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full p-3 mb-4 border border-gray-300 rounded"
              />
              <input
                type="password"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full p-3 mb-6 border border-gray-300 rounded"
              />

              <button
                onClick={handleCadastro}
                disabled={carregando}
                className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700 disabled:bg-gray-400"
              >
                {carregando ? 'Criando...' : 'Criar Conta'}
              </button>
              <button
                onClick={() => setModalAberto(false)}
                className="w-full mt-3 bg-gray-300 text-gray-800 p-3 rounded font-bold hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* MODAL SUCESSO */}
        {successModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
              <h2 className="text-2xl font-bold text-green-600 mb-4">✓ Conta Criada!</h2>
              <p className="text-gray-700 mb-4">Seu teste de 15 dias começou!</p>
              <p className="text-sm text-gray-600">Vence em: {dataVencimento}</p>
              <p className="text-sm text-gray-600 mt-2">Redirecionando...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
