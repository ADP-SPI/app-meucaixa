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

useEffect(() => {
    const conta = localStorage.getItem('conta_id');
    if (conta) {
      setContaId(parseInt(conta));
    }
  }, []);


   const carregarTransacoes = async () => {
    if (!contaId) return;
    
    try {
      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('conta_id', contaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setTransacoes(data || []);
    } catch (err) {
      console.error('Erro ao carregar transações:', err);
      setTransacoes([]);
    }
  }; 

   const transacoesFiltradas = filtroAplicado ? transacoes.filter((t) => {
    // Filtro de Tipo de Operação
    if (filtroOperacao === 'receita' && t.tipo !== 'receita') return false;
    if (filtroOperacao === 'despesa' && t.tipo !== 'despesa') return false;
    if (filtroOperacao === 'retirada_pessoal' && t.tipo !== 'retirada_pessoal') return false;
    
    // Filtro de Forma de Pagamento
    if (filtroTipo && filtroTipo !== '' && t.formapagamento !== filtroTipo) return false;
     
    // Filtro de Data Início
    if (dataInicio && t.data < dataInicio) return false;
    // Filtro de Data Fim
    if (dataFim && t.data > dataFim) return false;
    
    return true;
  }) : [];

    const calcularTotal = () => {
    return transacoesFiltradas.reduce((sum, t) => sum + (t.tipo === 'despesa' ? -(parseFloat(t.valor) || 0) : (parseFloat(t.valor) || 0)), 0).toFixed(2);
  };

  const calcularPorTipo = (tipo: string) => {
    return transacoesFiltradas
      .filter(t => t.formapagamento === tipo)
      .reduce((sum, t) => sum + (t.tipo === 'despesa' ? -(parseFloat(t.valor) || 0) : (parseFloat(t.valor) || 0)), 0)
      .toFixed(2);
  };

  const calcularPorTipoOperacao = (tipo: string) => {
    return transacoesFiltradas
      .filter(t => t.tipo === tipo)
      .reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0)
      .toFixed(2);
  };

  const mostrarTotaisIndividuais = filtroOperacao === 'ambos';

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-6xl">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar
        </Link>

        <h1 className="text-2xl font-bold mb-6">Relatórios</h1>

        {/* FILTROS */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Tipo de Operação</label>
            <select
              value={filtroOperacao}
           onChange={(e) => {
             setFiltroOperacao(e.target.value);
             setFiltroAplicado(false);
             }}              
              className="w-full border border-gray-300 p-2 rounded"
            >
              <option value="ambos">Todas as Movimentações</option>
              <option value="receita">Apenas Receitas</option>
              <option value="despesa">Apenas Despesas</option>
              <option value="retirada_pessoal">Apenas Retiradas Pessoais</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Forma de Pagamento</label>
            <select
              value={filtroTipo}
              onChange={(e) => {
                   setFiltroTipo(e.target.value);
                   setFiltroAplicado(false);
                 }}
  className="w-full border border-gray-300 p-2 rounded"
            >
              <option value="">Todas</option>
              <option value="PIX">PIX</option>
              <option value="DINHEIRO">DINHEIRO</option>
              <option value="CARTÃO">CARTÃO</option>
              <option value="FIADO">FIADO</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Data Início</label>
            <input
              type="date"
              value={dataInicio}
               onChange={(e) => {
                setDataInicio(e.target.value);
                setFiltroAplicado(false);
               }}
              
className="w-full border border-gray-300 p-2 rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Data Fim</label>
            <input
              type="date"
              value={dataFim}
      	       onChange={(e) => {
                setDataFim(e.target.value);
                setFiltroAplicado(false);
               }}
  className="w-full border border-gray-300 p-2 rounded"
/>          
</div>

          <button
            onClick={() => {
              carregarTransacoes();
              setFiltroAplicado(true);
            }}
            className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700"
          >
            FILTRAR
          </button>       
        </div>

        {/* TOTAIS */}
        {!mostrarTotaisIndividuais ? (
          <div className="bg-green-600 text-white p-6 rounded-lg shadow-md text-center mb-6">
            <p className="text-sm">TOTAL</p>
            <p className="text-4xl font-bold">R$ {calcularTotal()}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-600 text-white p-6 rounded-lg shadow-md text-center">
              <p className="text-sm">TOTAL RECEITAS</p>
              <p className="text-2xl font-bold">R$ {calcularPorTipoOperacao('receita')}</p>
            </div>
            <div className="bg-red-600 text-white p-6 rounded-lg shadow-md text-center">
              <p className="text-sm">TOTAL DESPESAS</p>
              <p className="text-2xl font-bold">R$ {calcularPorTipoOperacao('despesa')}</p>
            </div>
            <div className="bg-purple-600 text-white p-6 rounded-lg shadow-md text-center">
              <p className="text-sm">TOTAL RETIRADAS</p>
              <p className="text-2xl font-bold">R$ {calcularPorTipoOperacao('retirada_pessoal')}</p>
            </div>
          </div>
        )}

           {/* SALDO TOTAL */}
        {mostrarTotaisIndividuais && (
          <div className={`${calcularTotal() >= 0 ? 'bg-blue-600' : 'bg-red-600'} text-white p-6 rounded-lg shadow-md text-center mb-6 w-full`}>
            <p className="text-sm">SALDO</p>
            <p className="text-2xl font-bold">R$ {calcularTotal()}</p>
          </div>
        )}

        {/* DETALHES DAS TRANSAÇÕES */}
        <div>
          <h2 className="text-lg font-bold mb-4">Detalhes das Transações</h2>
          {transacoesFiltradas && transacoesFiltradas.length === 0 ? (
            <p className="text-gray-500">Nenhuma transação encontrada</p>
          ) : (
            <div className="space-y-2">
              {transacoesFiltradas && transacoesFiltradas.map((t) => (
                t ? (
                  <div key={t.id} className="bg-white p-3 rounded border border-gray-300">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-bold">{t.descricao || 'Sem descrição'}</p>
                        <p className="text-xs text-gray-600">{t.data} - {t.hora}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${t.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.tipo === 'receita' ? '+' : '-'} R$ {parseFloat(t.valor || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-600">{t.formaPagamento}</p>
                      </div>
                    </div>
                  </div>
                ) : null
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
