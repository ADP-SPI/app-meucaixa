'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, getDataBrasil } from '@/lib/supabase';

// Período padrão: do dia 1 do mês atual até hoje (Brasília)
const periodoPadrao = () => {
  const hoje = getDataBrasil();
  return { inicio: hoje.slice(0, 8) + '01', fim: hoje };
};

type Filtros = { operacao: string; forma: string; inicio: string; fim: string };

export default function Relatorios() {
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroOperacao, setFiltroOperacao] = useState('ambos');
  const [dataInicio, setDataInicio] = useState(() => periodoPadrao().inicio);
  const [dataFim, setDataFim] = useState(() => periodoPadrao().fim);
  const [contaId, setContaId] = useState<number | null>(null);
  // Filtros em vigor: só mudam ao clicar em FILTRAR/LIMPAR, não a cada alteração nos campos
  const [filtrosAplicados, setFiltrosAplicados] = useState<Filtros>(() => ({ operacao: 'ambos', forma: '', ...periodoPadrao() }));
  const [carregando, setCarregando] = useState(true);
  const [erroFiltro, setErroFiltro] = useState('');

  useEffect(() => {
    const conta = localStorage.getItem('conta_id');
    if (conta) {
      setContaId(parseInt(conta));
      carregarTransacoes(parseInt(conta), filtrosAplicados.inicio, filtrosAplicados.fim);
    } else {
      setCarregando(false);
    }
  }, []);

  const carregarTransacoes = async (id: number, inicio: string, fim: string) => {
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('conta_id', id)
        .gte('data', inicio)
        .lte('data', fim)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransacoes(data || []);
    } catch (err) {
      console.error('Erro ao carregar transações:', err);
      setTransacoes([]);
    }
    setCarregando(false);
  };

  const aplicarFiltros = (filtros: Filtros) => {
    if (!filtros.inicio || !filtros.fim) {
      setErroFiltro('Informe a Data Início e a Data Fim.');
      return;
    }
    if (filtros.inicio > filtros.fim) {
      setErroFiltro('A Data Início não pode ser depois da Data Fim.');
      return;
    }
    setErroFiltro('');
    setFiltrosAplicados(filtros);
    if (contaId) carregarTransacoes(contaId, filtros.inicio, filtros.fim);
  };

  const filtrar = () => {
    aplicarFiltros({ operacao: filtroOperacao, forma: filtroTipo, inicio: dataInicio, fim: dataFim });
  };

  const limpar = () => {
    const padrao = periodoPadrao();
    setFiltroTipo('');
    setFiltroOperacao('ambos');
    setDataInicio(padrao.inicio);
    setDataFim(padrao.fim);
    aplicarFiltros({ operacao: 'ambos', forma: '', ...padrao });
  };

  // O período já vem filtrado do banco; a checagem de data aqui é só uma garantia extra
  const transacoesFiltradas = transacoes.filter((t) => {
    if (t.data < filtrosAplicados.inicio || t.data > filtrosAplicados.fim) return false;
    if (filtrosAplicados.operacao !== 'ambos' && t.tipo !== filtrosAplicados.operacao) return false;
    if (filtrosAplicados.forma && t.formapagamento !== filtrosAplicados.forma) return false;
    return true;
  });

  // Fiado ainda não foi recebido: fica fora de Receita/Saldo e aparece no card FIADO
  const ehFiado = (t: any) => t.tipo === 'receita' && t.formapagamento === 'FIADO';

  const somar = (lista: any[]) => lista.reduce((sum, t) => sum + t.valor, 0);

  const totalFiado = somar(transacoesFiltradas.filter(ehFiado));
  const totalReceitas = somar(transacoesFiltradas.filter((t) => t.tipo === 'receita' && !ehFiado(t)));
  const totalDespesas = somar(transacoesFiltradas.filter((t) => t.tipo === 'despesa'));
  const totalRetiradas = somar(transacoesFiltradas.filter((t) => t.tipo === 'retirada_pessoal'));
  const saldo = totalReceitas - totalDespesas - totalRetiradas;

  const moeda = (valor: number) => valor.toFixed(2).replace('.', ',');
  const dataBR = (data: string) => data.split('-').reverse().join('/');

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
              onClick={filtrar}
              className="flex-1 bg-blue-100 text-blue-600 border border-blue-300 p-2 rounded font-bold hover:bg-blue-200 text-sm"
            >
              FILTRAR
            </button>
            <button
              onClick={limpar}
              className="flex-1 bg-gray-100 text-gray-600 border border-gray-300 p-2 rounded font-bold hover:bg-gray-200 text-sm"
            >
              LIMPAR
            </button>
          </div>
          {erroFiltro && <p className="text-sm text-red-600 mt-2">{erroFiltro}</p>}
        </div>

        <p className="text-sm text-gray-600 mb-3">
          Período: <span className="font-bold">{dataBR(filtrosAplicados.inicio)}</span> a <span className="font-bold">{dataBR(filtrosAplicados.fim)}</span>
          {carregando && ' — carregando...'}
        </p>

        {/* TOTAIS (sempre visíveis) */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-green-100 text-green-600 p-3 rounded border border-green-300 text-center">
            <p className="text-xs font-bold">TOTAL RECEITAS</p>
            <p className="text-lg font-bold">R$ {moeda(totalReceitas)}</p>
          </div>
          <div className="bg-red-100 text-red-600 p-3 rounded border border-red-300 text-center">
            <p className="text-xs font-bold">TOTAL DESPESAS</p>
            <p className="text-lg font-bold">R$ {moeda(totalDespesas)}</p>
          </div>
          <div className="bg-blue-100 text-blue-600 p-3 rounded border border-blue-300 text-center">
            <p className="text-xs font-bold">TOTAL RETIRADAS</p>
            <p className="text-lg font-bold">R$ {moeda(totalRetiradas)}</p>
          </div>
        </div>

        {/* SALDO */}
        <div className={`${saldo >= 0 ? 'bg-green-200 border-green-300' : 'bg-red-200 border-red-300'} p-3 rounded border mb-4 text-center`}>
          <p className="text-xs font-bold">SALDO</p>
          <p className="text-2xl font-bold">{saldo >= 0 ? '+' : '-'}R$ {moeda(Math.abs(saldo))}</p>
        </div>

        {/* FIADO (fora dos totais) */}
        {totalFiado > 0 && (
          <div className="bg-orange-50 text-black p-3 rounded border border-orange-300 mb-4 text-center">
            <p className="text-xs font-bold">FIADO (a receber)</p>
            <p className="text-lg font-bold">R$ {moeda(totalFiado)}</p>
            <p className="text-xs text-orange-900 mt-1">Não entra no total das receitas nem no saldo</p>
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
                      <p className="text-xs text-gray-600">{dataBR(t.data)} - {t.hora}</p>
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
