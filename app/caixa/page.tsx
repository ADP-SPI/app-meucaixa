'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rbocrgnmsadkbfoqbzpe.supabase.co',
  'sb_publishable_CXx1yNZ2C03bTuNpeDUNsQ_k4JHv9Vm'
);

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
            data: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

     setNomeCliente('');
      setValor('');
      setformapagamento('PIX');
      setTipoOperacao('receita');
      
      // Recarrega as transações imediatamente
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
      
      const transacao = transacoes.find(t => t.id === id);
      if (!transacao) {
        console.log('Transação não encontrada');
        return;
      }
      
      console.log('Transação encontrada:', transacao);
      
      // Se era Fiado pago, retorna como FIADO
      if (transacao.origin === 'fiado_pago') {
        console.log('Restaurando fiado...');
        const { error: erroFiado } = await supabase
          .from('transacoes')
          .insert([{
            conta_id: contaId,
            descricao: transacao.descricao.replace(' (recebido)', ''),
            valor: transacao.valor,
            tipo: 'receita',
            formapagamento: 'FIADO',
            hora: new Date().toLocaleTimeString('pt-BR'),
            data: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString()
          }]);
        if (erroFiado) console.error('Erro ao restaurar fiado:', erroFiado);
      }
      
      // Se era Comanda, retorna com itens
      if (transacao.origin === 'comanda') {
        console.log('Restaurando comanda...');
        const { error: erroComanda } = await supabase
          .from('comandas')
          .insert([{
            conta_id: contaId,
            nome: transacao.descricao.replace('Comanda: ', ''),
            itens: transacao.itens || [],
            data: new Date().toISOString().split('T')[0],
            hora: new Date().toLocaleTimeString('pt-BR'),
            created_at: new Date().toISOString()
          }]);
        if (erroComanda) console.error('Erro ao restaurar comanda:', erroComanda);
      }
      
      // Deletar do caixa
      console.log('Deletando do caixa...');
      const { error: erroDelete } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', id)
        .eq('conta_id', contaId);
      
      if (erroDelete) {
        console.error('Erro ao deletar:', erroDelete);
        throw erroDelete;
      }
      
      console.log('Exclusão bem-sucedida!');
      setExcluindoId(null);
      carregarTransacoes(contaId);
    } catch (err) {
      console.error('Erro completo:', err);
      alert('Erro ao excluir transação');
    }
  };

    const [transacoesHoje, setTransacoesHoje] = useState<any[]>([]);

useEffect(() => {
  if (transacoes.length > 0) {
    const agora = new Date();
    const dataHojeSP = new Date(agora.getTime() - (3 * 60 * 60 * 1000));
    const hoje = dataHojeSP.toISOString().split('T')[0];
    
    const filtradas = transacoes.filter(t => t && t.data === hoje);
    setTransacoesHoje(filtradas);
  } else {
    setTransacoesHoje([]);
  }
}, [transacoes]);

  const receitas = transacoesHoje.filter(t => t.tipo === 'receita' && t.formapagamento !== 'FIADO');
  const despesas = transacoesHoje.filter(t => t.tipo === 'despesa');
  const fiados = transacoesHoje.filter(t => t.tipo === 'receita' && t.formapagamento === 'FIADO');
  const retiradas = transacoesHoje.filter(t => t.tipo === 'retirada_pessoal');
  
  const totalReceitas = receitas.reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0);
  const totalDespesas = despesas.reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0);
  const totalFiados = fiados.reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0);
  const totalRetiradas = retiradas.reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0);
  
  const saldo = totalReceitas - totalDespesas;   

  const receitasPorForma = (forma: string) => {
    return receitas
      .filter(t => t.formapagamento === forma)
      .reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0)
      .toFixed(2);
  };

  if (carregando) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Carregando...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-6xl">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar
        </Link>

        <h1 className="text-2xl font-bold mb-6">Caixa</h1>

 	{/* RESUMO DO DIA */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-600 text-white p-4 rounded-lg text-center">
            <p className="text-sm">RECEITAS</p>
            <p className="text-2xl font-bold">R$ {totalReceitas.toFixed(2)}</p>
          </div>
          <div className="bg-red-600 text-white p-4 rounded-lg text-center">
            <p className="text-sm">DESPESAS</p>
            <p className="text-2xl font-bold">R$ {totalDespesas.toFixed(2)}</p>
          </div>
          <div className={`${saldo >= 0 ? 'bg-blue-600' : 'bg-red-600'} text-white p-4 rounded-lg text-center`}>
            <p className="text-sm">SALDO</p>
            <p className="text-2xl font-bold">R$ {saldo.toFixed(2)}</p>
          </div>
        </div>

	   {/* RETIRADAS PESSOAIS */}
        {totalRetiradas > 0 && (
          <div className="text-center border-t border-gray-300 pt-3 mb-6">
            <p className="text-sm text-gray-700">
              Total das Retiradas Pessoais: <span className="font-bold">R$ {totalRetiradas.toFixed(2)}</span>
            </p>
          </div>
        )} 

        </div>

        {/* DETALHES DE RECEITAS */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white text-black p-4 rounded-lg text-center border border-gray-200">
            <p className="text-sm">PIX</p>
            <p className="text-xl font-bold">R$ {receitasPorForma('PIX')}</p>
          </div>
          <div className="bg-white text-black p-4 rounded-lg text-center border border-gray-200">
            <p className="text-sm">DINHEIRO</p>
            <p className="text-xl font-bold">R$ {receitasPorForma('DINHEIRO')}</p>
          </div>
          <div className="bg-white text-black p-4 rounded-lg text-center border border-gray-200">
            <p className="text-sm">CARTÃO</p>
            <p className="text-xl font-bold">R$ {receitasPorForma('CARTÃO')}</p>
          </div>
          <div className="bg-white text-black p-4 rounded-lg text-center border border-gray-200">
            <p className="text-sm">FIADO</p>
            <p className="text-xl font-bold">R$ {totalFiados.toFixed(2)}</p>
            <p className="text-xs mt-2">(não entra na receita)</p>
          </div>
        </div>

        {/* FORMULÁRIO */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Tipo de Operação</label>
            <select
              value={tipoOperacao}
              onChange={(e) => setTipoOperacao(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded"
            >
              <option value="receita">Receita (Ganho)</option>
              <option value="despesa">Despesa (Gasto)</option>
              <option value="retirada_pessoal">Retirada Pessoal</option>
             </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Descrição</label>
            <input
              type="text"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              placeholder="Ex: Cliente João, Reposição, Aluguel..."
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Valor (R$)</label>
            <input
              type="number"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Forma de Pagamento</label>
            <select
              value={formapagamento}
              onChange={(e) => setformapagamento(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded"
            >
              <option>PIX</option>
              <option>DINHEIRO</option>
              <option>CARTÃO</option>
              {tipoOperacao === 'receita' && <option>FIADO</option>}
            </select>
          </div>

          <button
            onClick={adicionarTransacao}
            className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700"
          >
            + REGISTRAR
          </button>
        </div>

        {/* MOVIMENTAÇÕES DO DIA */}
        <div>
          <h2 className="text-lg font-bold mb-4">Movimentações de Hoje</h2>
          {transacoesHoje && transacoesHoje.length === 0 ? (
            <p className="text-gray-500">Nenhuma movimentação</p>
          ) : (
            <div className="space-y-2">
              {transacoesHoje && transacoesHoje.map((t) => (
                t ? (
                  <div
                    key={t.id}
                    className={`p-3 rounded border-l-4 ${
                    
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
                        <p className="font-bold">{t.descricao || 'Sem descrição'}</p>
                        <p className="text-sm text-gray-600">
                          {t.formapagamento} - {t.hora}
                        </p>
                      </div>
                      <div className="text-right">
                       
			<p className={`font-bold text-lg ${
                          t.tipo === 'receita' ? 'text-green-600' : t.tipo === 'retirada_pessoal' ? 'text-blue-600' : 'text-red-600'
                        }`}>
                          {t.tipo === 'receita' ? '+' : t.tipo === 'retirada_pessoal' ? '-' : '-'} R$ {parseFloat(t.valor || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="ml-3">
                        {excluindoId === t.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => confirmarExclusao(t.id)}
                              className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                            >
                              Sim
                            </button>
                            <button
                              onClick={() => setExcluindoId(null)}
                              className="bg-gray-400 text-white px-2 py-1 rounded text-xs hover:bg-gray-500"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setExcluindoId(t.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            🗑️ Excluir
                          </button>
                        )}
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
