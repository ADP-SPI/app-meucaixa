'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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

export default function Admin() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [novoVencimento, setNovoVencimento] = useState('');
  const [novoPlano, setNovoPlano] = useState<number | null>(null);
  const [planos, setPlanos] = useState<any[]>([]);

  useEffect(() => {
    const usuarioId = localStorage.getItem('usuario_id');
    const contaId = localStorage.getItem('conta_id');

    if (contaId !== '4') {
      alert('❌ Acesso negado');
      router.push('/dashboard');
      return;
    }

    carregarClientes();
    carregarPlanos();
  }, [router]);

  const carregarPlanos = async () => {
    try {
      const { data: planosData } = await supabase
        .from('planos')
        .select('*')
        .order('nome');

      setPlanos(planosData || []);
    } catch (err) {
      console.error('Erro ao carregar planos:', err);
    }
  };

  const carregarClientes = async () => {
    try {
      const { data: contas, error: erroContas } = await supabase
        .from('contas')
        .select('*')
        .order('created_at', { ascending: false });

      if (erroContas) throw erroContas;

      const { data: assinaturas } = await supabase
        .from('assinaturas')
        .select('*');

      const { data: planos } = await supabase
        .from('planos')
        .select('*');

      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('conta_id');

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
    if (status === 'cancelado') return 'bg-gray-100 text-gray-800';
    if (status === 'teste_ativo') return 'bg-yellow-100 text-yellow-800';

    if (status === 'ativo') {
      const hoje = new Date();
      const venc = new Date(vencimento);
      const diasRestantes = Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

      if (diasRestantes <= 5) return 'bg-orange-100 text-orange-800';
      return 'bg-green-100 text-green-800';
    }

    return 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string, vencimento: string) => {
    if (status === 'pendente') return 'Pendente';
    if (status === 'cancelado') return 'Cancelado';
    if (status === 'teste_ativo') return 'Em Teste';

    if (status === 'ativo') {
      const hoje = new Date();
      const venc = new Date(vencimento);
      const diasRestantes = Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

      if (diasRestantes <= 5) return `⚠️ Vence em ${diasRestantes}d`;
      return '✅ Ativo';
    }

    return status;
  };

  const atualizarVencimento = async () => {
    if (!clienteEditando) return;

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
      alert('Erro ao atualizar vencimento');
    }
  };

  const atualizarPlano = async () => {
    if (!clienteEditando || novoPlano === null) return;

    try {
      const { error } = await supabase
        .from('contas')
        .update({ plano_id: novoPlano })
        .eq('id', clienteEditando.id);

      if (error) throw error;

      alert('✅ Plano alterado com sucesso!');
      setModalAberto(false);
      setClienteEditando(null);
      setNovoPlano(null);
      carregarClientes();
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao atualizar plano');
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

        <div className="space-x-2 mb-6">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-4 py-2 rounded ${filtro === 'todos' ? 'bg-blue-600 text-white' : 'bg-white'}`}
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
            className={`px-4 py-2 rounded ${filtro === 'teste' ? 'bg-yellow-600 text-white' : 'bg-white'}`}
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
                        setNovoPlano(cliente.plano_id);
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
                <label className="block text-sm font-bold mb-2">Tipo de Plano</label>
                <select
                  value={novoPlano || ''}
                  onChange={(e) => setNovoPlano(parseInt(e.target.value))}
                  className="w-full border border-gray-300 p-2 rounded"
                >
                  <option value="">Selecione um plano</option>
                  {planos.map(plano => (
                    <option key={plano.id} value={plano.id}>{plano.nome}</option>
                  ))}
                </select>
              </div>

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
                  onClick={atualizarPlano}
                  className="w-full bg-purple-600 text-white p-3 rounded font-bold hover:bg-purple-700"
                >
                  💾 ATUALIZAR PLANO
                </button>
                <button
                  onClick={atualizarVencimento}
                  className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700"
                >
                  ✓ ATUALIZAR VENCIMENTO
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
