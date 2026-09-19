'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, getDataBrasil } from '@/lib/supabase';

export default function Caixa() {
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [tipoOperacao, setTipoOperacao] = useState('receita');
  const [nomeCliente, setNomeCliente] = useState('');
  const [valor, setValor] = useState('');
  const [formapagamento, setformapagamento] = useState('PIX');
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [contaId, setContaId] = useState<number | null>(null);

  useEffect(() => {
    const conta = localStorage.getItem('conta_id');
    if (conta) {
      setContaId(parseInt(conta));
      carregarTransacoes(parseInt(conta));
    }
  }, []);

  const carregarTransacoes = async (cId: number) => {
    try {
      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('conta_id', cId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransacoes(data || []);
    } catch (err) {
      console.error('Erro ao carregar transações:', err);
    }
    setCarregando(false);
  };

  const adicionarTransacao = async () => {
    if (!nomeCliente.trim() || !valor || isNaN(parseFloat(valor))) {
      alert('Preencha descrição e valor corretamente');
      return;
    }

    if (!contaId) {
      alert('Erro: conta não identificada');
      return;
    }

    try {
      const { error } = await supabase
        .from('transacoes')
        .insert([
          {
            conta_id: contaId,
            descricao: nomeCliente,
            valor: parseFloat(valor),
            tipo: tipoOperacao,
            formapagamento: formapagamento,
            hora: new Date().toLocaleTimeString('pt-BR'),
            data: getDataBrasil(),
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      setNomeCliente('');
      setValor('');
      setformapagamento('PIX');
      setTipoOperacao('receita');
      
      setTimeout(() => {
        if (contaId) {
          carregarTransacoes(contaId);
        }
      }, 500);   
    } catch (err) {
      console.error('Erro ao adicionar transação:', err);
      alert('Erro ao registrar transação');
    }
  };

  const confirmarExclusao = async (id: number) => {
    if (!contaId) {
      console.log('Erro: contaId não está definido');
      return;
    }
    
    try {
      console.log('Iniciando exclusão de ID:', id);
      const { error } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', id)
        .eq('conta_id', contaId);

      if (error) throw error;
      setExcluindoId(null);
      carregarTransacoes(contaId);
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Erro ao excluir transação');
    }
  };

  const calcularSaldos = () => {
    let receita = 0;
    let despesa = 0;
    let retirada = 0;
    const dataHoje = getDataBrasil();

    transacoes.forEach((t) => {
      if (t.data !== dataHoje) return;

      if (t.tipo === 'receita') {
        receita += t.valor;
      } else if (t.tipo === 'despesa') {
        despesa += t.valor;
      } else if (t.tipo === 'retirada_pessoal') {
        retirada += t.valor;
      }
    });

    return { receita, despesa, retirada };
  };

  const totalFiados = transacoes
    .filter((t) => t.tipo === 'receita' && t.formapagamento === 'FIADO' && t.data === getDataBrasil())
    .reduce((sum, t) => sum + t.valor, 0);

  const receitasPorForma = (forma: string) => {
    return transacoes
      .filter((t) => t.tipo === 'receita' && t.formapagamento === forma && t.data === getDataBrasil())
      .reduce((sum, t) => sum + t.valor, 0)
      .toFixed(2)
      .replace('.', ',');
  };

  const { receita, despesa, retirada } = calcularSaldos();
  const saldo = receita - despesa - retirada;

  if (carregando) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Carregando...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-4xl">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar
        </Link>
        <h1 className="text-3xl font-bold mb-2">Caixa</h1>
        <p className="text-gray-600 mb-6">Registre todas as receitas, despesas e retiradas</p>

        {/* SALDOS */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-green-100 text-black p-3 rounded-lg text-center border border-green-300">
            <p className="text-xs font-bold">RECEITA</p>
            <p className="text-lg font-bold">R$ {receita.toFixed(2).replace('.', ',')}</p>
          </div>
          <div className="bg-red-100 text-black p-3 rounded-lg text-center border border-red-300">
            <p className="text-xs font-bold">DESPESA</p>
            <p className="text-lg font-bold">R$ {despesa.toFixed(2).replace('.', ',')}</p>
          </div>
          <div className="bg-blue-100 text-black p-3 rounded-lg text-center border border-blue-300">
            <p className="text-xs font-bold">RETIRADA</p>
            <p className="text-lg font-bold">R$ {retirada.toFixed(2).replace('.', ',')}</p>
          </div>
        </div>

        {/* SALDO TOTAL */}
        <div className={`p-4 rounded-lg mb-4 text-center ${saldo >= 0 ? 'bg-green-200' : 'bg-red-200'}`}>
          <p className="text-sm font-bold">SALDO</p>
          <p className="text-3xl font-bold">{saldo >= 0 ? '+' : ''}R$ {saldo.toFixed(2).replace('.', ',')}</p>
        </div>

        {/* FORMAS DE PAGAMENTO */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          <div className="bg-white text-black p-2 rounded text-center border border-gray-200">
            <p className="text-xs font-bold">PIX</p>
            <p className="text-sm font-bold">R$ {receitasPorForma('PIX')}</p>
          </div>
          <div className="bg-white text-black p-2 rounded text-center border border-gray-200">
            <p className="text-xs font-bold">DINHEIRO</p>
            <p className="text-sm font-bold">R$ {receitasPorForma('DINHEIRO')}</p>
          </div>
          <div className="bg-white text-black p-2 rounded text-center border border-gray-200">
            <p className="text-xs font-bold">CARTÃO</p>
            <p className="text-sm font-bold">R$ {receitasPorForma('CARTÃO')}</p>
          </div>
          <div className="bg-orange-50 text-black p-2 rounded text-center border border-orange-300">
            <p className="text-xs font-bold">FIADO</p>
            <p className="text-sm font-bold">R$ {totalFiados.toFixed(2).replace('.', ',')}</p>
          </div>
        </div>

        {/* OBSERVAÇÃO FIADO */}
        <div className="bg-orange-100 border-l-4 border-orange-600 px-3 py-1 mb-4 rounded">
          <p className="text-xs text-orange-900"><strong>Obs:</strong> Fiado não entra no total das receitas, mas aparece separado</p>
        </div>

        {/* FORMULÁRIO */}
        <div className="bg-white p-5 rounded-lg shadow-md mb-6">
          <div className="mb-3">
            <label className="block text-xs font-bold mb-1">Tipo de Operação</label>
            <select
              value={tipoOperacao}
              onChange={(e) => setTipoOperacao(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded text-sm"
            >
              <option value="receita">Receita (Ganho)</option>
              <option value="despesa">Despesa (Gasto)</option>
              <option value="retirada_pessoal">Retirada Pessoal</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-bold mb-1">Descrição</label>
            <input
              type="text"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              placeholder="Ex: Cliente João, Reposição, Aluguel..."
              className="w-full border border-gray-300 p-2 rounded text-sm"
            />
          </div>

          <div className="mb-3">
            <label className="block text-xs font-bold mb-1">Valor (R$)</label>
            <input
              type="number"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              step="0.01"
              className="w-full border border-gray-300 p-2 rounded text-sm"
            />
          </div>

          <div className="mb-3">
            <label className="block text-xs font-bold mb-1">Forma de Pagamento</label>
            <select
              value={formapagamento}
              onChange={(e) => setformapagamento(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded text-sm"
            >
              <option>PIX</option>
              <option>DINHEIRO</option>
              <option>CARTÃO</option>
              {tipoOperacao === 'receita' && <option>FIADO</option>}
            </select>
          </div>

          <button
            onClick={adicionarTransacao}
            className="w-full bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700 text-sm"
          >
            + REGISTRAR
          </button>
        </div>

        {/* MOVIMENTAÇÕES DO DIA */}
        <div>
          <h2 className="text-lg font-bold mb-3">Movimentações de Hoje</h2>
          {transacoes.filter(t => t.data === getDataBrasil()).length === 0 ? (
            <p className="text-gray-500">Nenhuma movimentação</p>
          ) : (
            <div className="space-y-2">
              {transacoes.map((t) => (
                t && t.data === getDataBrasil() ? (
                  <div
                    key={t.id}
                    className={`p-2 rounded border-l-4 ${
                      t.tipo === 'receita'
                        ? t.formapagamento === 'FIADO'
                          ? 'bg-orange-50 border-orange-600'
                          : 'bg-green-50 border-green-600'
                        : t.tipo === 'retirada_pessoal'
                        ? 'bg-blue-50 border-blue-600'
                        : 'bg-red-50 border-red-600'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-bold text-sm">{t.descricao || 'Sem descrição'}</p>
                        <p className="text-xs text-gray-600">
                          {t.formapagamento} - {t.hora}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          t.tipo === 'receita' ? 'text-green-600' : t.tipo === 'retirada_pessoal' ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {t.tipo === 'receita' ? '+' : '-'} R$ {t.valor.toFixed(2).replace('.', ',')}
                        </p>
                        <button
                          onClick={() => setExcluindoId(t.id)}
                          className="text-xs text-red-600 hover:text-red-800 mt-1"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null
              ))}
            </div>
          )}
        </div>

        {/* CONFIRMAÇÃO EXCLUSÃO */}
        {excluindoId !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm">
              <h2 className="text-lg font-bold mb-4">Confirmar Exclusão</h2>
              <p className="text-gray-600 mb-6">Tem certeza que deseja excluir esta transação?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => confirmarExclusao(excluindoId)}
                  className="flex-1 bg-red-600 text-white p-2 rounded font-bold hover:bg-red-700 text-sm"
                >
                  Excluir
                </button>
                <button
                  onClick={() => setExcluindoId(null)}
                  className="flex-1 bg-gray-400 text-white p-2 rounded font-bold hover:bg-gray-500 text-sm"
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
