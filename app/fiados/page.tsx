'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Fiados() {
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [contaId, setContaId] = useState<number | null>(null);
  const [clienteSelecionado, setClienteSelecionado] = useState<string>('');
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [mostrandoModal, setMostrandoModal] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState('PIX');

  useEffect(() => {
    const conta = localStorage.getItem('conta_id');
    if (conta) {
      setContaId(parseInt(conta));
      carregarTransacoes(parseInt(conta));
    }
  }, []);

  const carregarTransacoes = async (cId: number) => {
    try {
      const { data } = await supabase
        .from('transacoes')
        .select('*')
        .eq('conta_id', cId)
        .eq('formapagamento', 'FIADO')
        .eq('tipo', 'receita')
        .order('created_at', { ascending: false });

      setTransacoes(data || []);
    } catch (err) {
      console.error('Erro:', err);
    }
    setCarregando(false);
  };

  // Lista de clientes únicos
  const clientes = [...new Set(transacoes.map(t => t.descricao))].sort();

  // Filtra transações pelo cliente selecionado
  const transacoesFiltradas = clienteSelecionado 
    ? transacoes.filter(t => t.descricao === clienteSelecionado)
    : transacoes;

  // Calcula total das notas selecionadas
  const totalSelecionado = selecionadas
    .reduce((sum, id) => {
      const nota = transacoes.find(t => t.id === id);
      return sum + (nota ? nota.valor : 0);
    }, 0)
    .toFixed(2);

  // Total fiado geral
  const totalFiado = transacoesFiltradas
    .reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0)
    .toFixed(2);

  const confirmarPagamento = async () => {
    if (selecionadas.length === 0 || !contaId) return;

    try {
      // Deleta as notas selecionadas
      for (const id of selecionadas) {
        const nota = transacoes.find(t => t.id === id);
        if (nota) {
          await supabase
            .from('transacoes')
            .delete()
            .eq('id', id);

          // Insere como receita com a forma de pagamento escolhida
          await supabase
            .from('transacoes')
            .insert([{
              conta_id: contaId,
              descricao: `${nota.descricao} (recebido)`,
              valor: nota.valor,
              tipo: 'receita',
              formapagamento: formaPagamento,
              hora: new Date().toLocaleTimeString('pt-BR'),
              data: new Date().toISOString().split('T')[0],
              created_at: new Date().toISOString(),
              origin: 'fiado_pago'
            }]);
        }
      }

      setSelecionadas([]);
      setMostrandoModal(false);
      setFormaPagamento('PIX');
      carregarTransacoes(contaId);
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao registrar pagamento');
    }
  };

  const toggleSelecionar = (id: number) => {
    setSelecionadas(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (carregando) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-6xl">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar
        </Link>

        <h1 className="text-2xl font-bold mb-6">Fiados</h1>

        <div className="bg-orange-100 text-orange-600 p-3 rounded border border-orange-300 shadow-md mb-6 text-center">
          <p className="text-xs font-bold">TOTAL FIADO</p>
          <p className="text-2xl font-bold">R$ {parseFloat(totalFiado).toFixed(2).replace('.', ',')}</p>
        </div>

        {/* FILTRO DE CLIENTE */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
          <label className="block text-sm font-bold mb-2">Filtrar por Cliente</label>
          <select
            value={clienteSelecionado}
            onChange={(e) => {
              setClienteSelecionado(e.target.value);
              setSelecionadas([]);
            }}
            className="w-full border border-gray-300 p-2 rounded"
          >
            <option value="">Todos os clientes</option>
            {clientes.map(cliente => (
              <option key={cliente} value={cliente}>{cliente}</option>
            ))}
          </select>
        </div>

        {/* TOTAL SELECIONADO */}
        {selecionadas.length > 0 && (
          <div className="bg-green-100 text-green-600 p-3 rounded border border-green-300 mb-4 text-center">
            <p className="text-xs font-bold">{selecionadas.length} notas selecionadas</p>
            <p className="text-2xl font-bold">R$ {parseFloat(totalSelecionado).toFixed(2).replace('.', ',')}</p>
            <button
              onClick={() => setMostrandoModal(true)}
              className="mt-2 bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700"
            >
              Receber Pagamento
            </button>
          </div>
        )}

        {/* LISTA DE NOTAS */}
        <div>
          <h2 className="text-lg font-bold mb-3">
            {clienteSelecionado ? `Notas de ${clienteSelecionado}` : 'Todas as Notas de Fiado'}
          </h2>
          {transacoesFiltradas.length === 0 ? (
            <p className="text-gray-500">Nenhuma nota de fiado</p>
          ) : (
            <div className="space-y-2">
              {transacoesFiltradas.map((t) => (
                <div
                  key={t.id}
                  className="bg-orange-50 p-3 rounded border-l-4 border-orange-600 flex items-center gap-3"
                >
                  <input
                    type="checkbox"
                    checked={selecionadas.includes(t.id)}
                    onChange={() => toggleSelecionar(t.id)}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="font-bold">{t.descricao}</p>
                    <p className="text-xs text-gray-600">{t.data} - {t.hora}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">R$ {t.valor.toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL PAGAMENTO */}
        {mostrandoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Registrar Pagamento</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600">{selecionadas.length} notas</p>
                <p className="font-bold text-2xl">R$ {parseFloat(totalSelecionado).toFixed(2).replace('.', ',')}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Forma de Pagamento</label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded"
                >
                  <option>PIX</option>
                  <option>DINHEIRO</option>
                  <option>CARTÃO</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={confirmarPagamento}
                  className="flex-1 bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setMostrandoModal(false)}
                  className="flex-1 bg-gray-400 text-white p-2 rounded font-bold hover:bg-gray-500"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
