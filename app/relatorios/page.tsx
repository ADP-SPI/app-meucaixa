'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Relatorios() {
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroOperacao, setFiltroOperacao] = useState('ambos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [contaId, setContaId] = useState<number | null>(null);
  const [filtroAplicado, setFiltroAplicado] = useState(false);
  const [mostrarTotaisIndividuais, setMostrarTotaisIndividuais] = useState(false);

  useEffect(() => {
    const conta = localStorage.getItem('conta_id');
    if (conta) {
      setContaId(parseInt(conta));
      carregarTransacoes(parseInt(conta));
    }
  }, []);

  const carregarTransacoes = async (cId?: number) => {
    const id = cId || contaId;
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('conta_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransacoes(data || []);
    } catch (err) {
      console.error('Erro ao carregar transações:', err);
      setTransacoes([]);
    }
  };

  const transacoesFiltradas = filtroAplicado ? transacoes.filter((t) => {
    if (filtroOperacao !== 'ambos' && t.tipo !== filtroOperacao) return false;
    if (filtroTipo && filtroTipo !== '' && t.formapagamento !== filtroTipo) return false;
    if (dataInicio && t.data < dataInicio) return false;
    if (dataFim && t.data > dataFim) return false;
    return true;
  }) : transacoes;

  const calcularTotal = () => {
    return transacoesFiltradas
      .reduce((sum, t) => {
        if (t.tipo === 'receita') return sum + t.valor;
        if (t.tipo === 'despesa') return sum - t.valor;
        if (t.tipo === 'retirada_pessoal') return sum - t.valor;
        return sum;
      }, 0)
      .toFixed(2);
  };

  const calcularPorTipoOperacao = (tipo: string) => {
    return transacoesFiltradas
      .filter((t) => t.tipo === tipo)
      .reduce((sum, t) => sum + t.valor, 0)
      .toFixed(2)
      .replace('.', ',');
  };

  const calcularSaldo = () => {
    const receita = parseFloat(transacoesFiltradas.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0).toFixed(2));
    const despesa = parseFloat(transacoesFiltradas.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + t.valor, 0).toFixed(2));
    const retirada = parseFloat(transacoesFiltradas.filter(t => t.tipo === 'retirada_pessoal').reduce((sum, t) => sum + t.valor, 0).toFixed(2));
    return (receita - despesa - retirada).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-6xl">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar
        </Link>

        <h1 className="text-3xl font-bold mb-2">Relatórios</h1>
        <p className="text-gray-600 mb-6">Analise suas transações por período</p>

        {/* FILTROS */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-bold mb-1">Tipo de Operação</label>
              <select
                value={filtroOperacao}
                onChange={(e) => setFiltroOperacao(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded text-sm"
              >
                <option value="ambos">Todos</option>
                <option value="receita">Apenas Receitas</option>
                <option value="despesa">Apenas Despesas</option>
                <option value="retirada_pessoal">Apenas Retiradas Pessoais</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Forma de Pagamento</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded text-sm"
              >
                <option value="">Todas</option>
                <option value="PIX">PIX</option>
                <option value="DINHEIRO">DINHEIRO</option>
                <option value="CARTÃO">CARTÃO</option>
                <option value="FIADO">FIADO</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Data Início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">Data Fim</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFiltroAplicado(true)}
              className="flex-1 bg-blue-100 text-blue-600 border border-blue-300 p-2 rounded font-bold hover:bg-blue-200 text-sm"
            >
              FILTRAR
            </button>
            <button
              onClick={() => {
                setFiltroTipo('');
                setFiltroOperacao('ambos');
                setDataInicio('');
                setDataFim('');
                setFiltroAplicado(false);
              }}
              className="flex-1 bg-gray-100 text-gray-600 border border-gray-300 p-2 rounded font-bold hover:bg-gray-200 text-sm"
            >
              LIMPAR
            </button>
            <button
              onClick={() => setMostrarTotaisIndividuais(!mostrarTotaisIndividuais)}
              className="flex-1 bg-purple-100 text-purple-600 border border-purple-300 p-2 rounded font-bold hover:bg-purple-200 text-sm"
            >
              {mostrarTotaisIndividuais ? 'RESUMO' : 'DETALHES'}
            </button>
          </div>
        </div>

        {/* TOTAIS */}
        {!mostrarTotaisIndividuais ? (
          <div className={`${parseFloat(calcularTotal()) >= 0 ? 'bg-green-200' : 'bg-red-200'} p-3 rounded border ${parseFloat(calcularTotal()) >= 0 ? 'border-green-300' : 'border-red-300'} mb-4 text-center`}>
            <p className="text-xs font-bold">TOTAL</p>
            <p className="text-2xl font-bold">{parseFloat(calcularTotal()) >= 0 ? '+' : ''}R$ {parseFloat(calcularTotal()).toFixed(2).replace('.', ',')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-green-100 text-green-600 p-3 rounded border border-green-300 text-center">
              <p className="text-xs font-bold">TOTAL RECEITAS</p>
              <p className="text-lg font-bold">R$ {calcularPorTipoOperacao('receita')}</p>
            </div>
            <div className="bg-red-100 text-red-600 p-3 rounded border border-red-300 text-center">
              <p className="text-xs font-bold">TOTAL DESPESAS</p>
              <p className="text-lg font-bold">R$ {calcularPorTipoOperacao('despesa')}</p>
            </div>
            <div className="bg-blue-100 text-blue-600 p-3 rounded border border-blue-300 text-center">
              <p className="text-xs font-bold">TOTAL RETIRADAS</p>
              <p className="text-lg font-bold">R$ {calcularPorTipoOperacao('retirada_pessoal')}</p>
            </div>
          </div>
        )}

        {/* SALDO TOTAL */}
        {mostrarTotaisIndividuais && (
          <div className={`${parseFloat(calcularSaldo()) >= 0 ? 'bg-green-200' : 'bg-red-200'} p-3 rounded border ${parseFloat(calcularSaldo()) >= 0 ? 'border-green-300' : 'border-red-300'} mb-4 text-center`}>
            <p className="text-xs font-bold">SALDO</p>
            <p className="text-2xl font-bold">{parseFloat(calcularSaldo()) >= 0 ? '+' : ''}R$ {parseFloat(calcularSaldo()).toFixed(2).replace('.', ',')}</p>
          </div>
        )}

        {/* DETALHES DAS TRANSAÇÕES */}
        <div>
          <h2 className="text-lg font-bold mb-3">Detalhes das Transações</h2>
          {transacoesFiltradas.length === 0 ? (
            <p className="text-gray-500">Nenhuma transação encontrada</p>
          ) : (
            <div className="space-y-2">
              {transacoesFiltradas.map((t) => (
                <div key={t.id} className="bg-white p-3 rounded border border-gray-300">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-bold text-sm">{t.descricao || 'Sem descrição'}</p>
                      <p className="text-xs text-gray-600">{t.data} - {t.hora}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${t.tipo === 'receita' ? 'text-green-600' : t.tipo === 'retirada_pessoal' ? 'text-blue-600' : 'text-red-600'}`}>
                        {t.tipo === 'receita' ? '+' : '-'} R$ {t.valor.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-xs text-gray-600">{t.formapagamento}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
