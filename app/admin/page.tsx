'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rbocrgnmsadkbfoqbzpe.supabase.co',
  'sb_publishable_CXx1yNZ2C03bTuNpeDUNsQ_k4JHv9Vm'
);

interface Cliente {
  id: number;
  nome: string;
  email: string;
  plano_id: number;
  plano_nome: string;
  status_assinatura: string;
  data_vencimento: string;
  usuarios_count: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<string>('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [novoVencimento, setNovoVencimento] = useState('');

  useEffect(() => {
    // Verificar se é admin (você)
    const usuarioId = localStorage.getItem('usuario_id');
    const contaId = localStorage.getItem('conta_id');

    // Apenas o admin (conta_id: 4) pode acessar
    if (contaId !== '4') {
      alert('❌ Acesso negado');
      router.push('/dashboard');
      return;
    }

    carregarClientes();
  }, [router]);

  const carregarClientes = async () => {
    try {
      // Buscar todas as contas
      const { data: contas, error: erroContas } = await supabase
        .from('contas')
        .select('*')
        .order('created_at', { ascending: false });

      if (erroContas) throw erroContas;

      // Buscar assinaturas
      const { data: assinaturas } = await supabase
        .from('assinaturas')
        .select('*');

      // Buscar planos
      const { data: planos } = await supabase
        .from('planos')
        .select('*');

      // Buscar usuários por conta
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('conta_id');

      // Montar lista de clientes com dados combinados
      const clientesProcessados: Cliente[] = contas?.map((conta: any) => {
        const assinatura = assinaturas?.find((a: any) => a.conta_id === conta.id);
        const plano = planos?.find((p: any) => p.id === conta.plano_id);
        const usuariosCount = usuarios?.filter((u: any) => u.conta_id === conta.id).length || 0;

        return {
          id: conta.id,
          nome: conta.nome,
          email: conta.email,
          plano_id: conta.plano_id,
          plano_nome: plano?.nome || 'Sem plano',
          status_assinatura: assinatura?.status || 'sem_assinatura',
          data_vencimento: assinatura?.data_vencimento || '',
          usuarios_count: usuariosCount
        };
      }) || [];

      setClientes(clientesProcessados);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
    }
    setCarregando(false);
  };

  const getStatusColor = (status: string, vencimento: string) => {
    if (status === 'pendente') return 'bg-red-100 text-red-800';
    if (status === 'teste_ativo') {
      const dias = Math.ceil((new Date(vencimento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (dias <= 3) return 'bg-yellow-100 text-yellow-800';
      return 'bg-blue-100 text-blue-800';
    }
    if (status === 'ativo') return 'bg-green-100 text-green-800';
    if (status === 'cancelado') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string, vencimento: string) => {
    if (status === 'pendente') return '🔴 PENDENTE PAGAMENTO';
    if (status === 'teste_ativo') {
      const dias = Math.ceil((new Date(vencimento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (dias <= 3) return `🟡 VENCENDO (${dias}d)`;
      return '🔵 TESTE ATIVO';
    }
    if (status === 'ativo') return '🟢 ATIVO';
    if (status === 'cancelado') return '⚫ CANCELADO';
    return status;
  };

  const atualizarVencimento = async () => {
    if (!clienteEditando || !novoVencimento) return;

    try {
      const { error } = await supabase
        .from('assinaturas')
        .update({ data_vencimento: novoVencimento })
        .eq('conta_id', clienteEditando.id);

      if (error) throw error;

      setModalAberto(false);
      setClienteEditando(null);
      setNovoVencimento('');
      carregarClientes();
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao atualizar');
    }
  };

  const ativarCliente = async (clienteId: number) => {
    try {
      const { error } = await supabase
        .from('assinaturas')
        .update({ status: 'ativo' })
        .eq('conta_id', clienteId);

      if (error) throw error;
      carregarClientes();
    } catch (err) {
      alert('Erro ao ativar');
    }
  };

  const cancelarCliente = async (clienteId: number) => {
    if (!confirm('Tem certeza que deseja cancelar?')) return;

    try {
      const { error } = await supabase
        .from('assinaturas')
        .update({ status: 'cancelado' })
        .eq('conta_id', clienteId);

      if (error) throw error;
      carregarClientes();
    } catch (err) {
      alert('Erro ao cancelar');
    }
  };

  const clientesFiltrados = clientes.filter((c) => {
    if (filtro === 'pendente') return c.status_assinatura === 'pendente';
    if (filtro === 'teste') return c.status_assinatura === 'teste_ativo';
    if (filtro === 'ativo') return c.status_assinatura === 'ativo';
    return true;
  });

  if (carregando) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Carregando...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar
        </Link>

        <h1 className="text-3xl font-bold mb-6">🔧 PAINEL ADMINISTRATIVO</h1>

        {/* ESTATÍSTICAS */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-600">Total de Clientes</p>
            <p className="text-2xl font-bold">{clientes.length}</p>
          </div>
          <div className="bg-red-100 p-4 rounded shadow">
            <p className="text-sm text-red-800">Pendentes</p>
            <p className="text-2xl font-bold">{clientes.filter(c => c.status_assinatura === 'pendente').length}</p>
          </div>
          <div className="bg-blue-100 p-4 rounded shadow">
            <p className="text-sm text-blue-800">Em Teste</p>
            <p className="text-2xl font-bold">{clientes.filter(c => c.status_assinatura === 'teste_ativo').length}</p>
          </div>
          <div className="bg-green-100 p-4 rounded shadow">
            <p className="text-sm text-green-800">Ativos</p>
            <p className="text-2xl font-bold">{clientes.filter(c => c.status_assinatura === 'ativo').length}</p>
          </div>
        </div>

        {/* FILTROS */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-4 py-2 rounded ${filtro === 'todos' ? 'bg-gray-900 text-white' : 'bg-white'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltro('pendente')}
            className={`px-4 py-2 rounded ${filtro === 'pendente' ? 'bg-red-600 text-white' : 'bg-white'}`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFiltro('teste')}
            className={`px-4 py-2 rounded ${filtro === 'teste' ? 'bg-blue-600 text-white' : 'bg-white'}`}
          >
            Em Teste
          </button>
          <button
            onClick={() => setFiltro('ativo')}
            className={`px-4 py-2 rounded ${filtro === 'ativo' ? 'bg-green-600 text-white' : 'bg-white'}`}
          >
            Ativos
          </button>
        </div>

        {/* TABELA */}
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-4 text-left">Empresa</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Plano</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Vencimento</th>
                <th className="p-4 text-left">Usuários</th>
                <th className="p-4 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-bold">{cliente.nome}</td>
                  <td className="p-4 text-sm">{cliente.email}</td>
                  <td className="p-4 text-sm">{cliente.plano_nome}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded text-sm font-bold ${getStatusColor(cliente.status_assinatura, cliente.data_vencimento)}`}>
                      {getStatusLabel(cliente.status_assinatura, cliente.data_vencimento)}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    {cliente.data_vencimento ? new Date(cliente.data_vencimento).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="p-4 text-sm text-center font-bold">{cliente.usuarios_count}</td>
                  <td className="p-4 space-x-2">
                    {cliente.status_assinatura === 'pendente' && (
                      <button
                        onClick={() => ativarCliente(cliente.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Ativar
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setClienteEditando(cliente);
                        setNovoVencimento(cliente.data_vencimento);
                        setModalAberto(true);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => cancelarCliente(cliente.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Cancelar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL EDITAR */}
        {modalAberto && clienteEditando && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Editar {clienteEditando.nome}</h3>

              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Data de Vencimento</label>
                <input
                  type="date"
                  value={novoVencimento}
                  onChange={(e) => setNovoVencimento(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>

              <div className="space-y-2">
                <button
                  onClick={atualizarVencimento}
                  className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700"
                >
                  ✓ SALVAR
                </button>
                <button
                  onClick={() => setModalAberto(false)}
                  className="w-full bg-gray-400 text-white p-3 rounded font-bold hover:bg-gray-500"
                >
                  ✕ CANCELAR
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
