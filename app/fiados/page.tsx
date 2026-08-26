'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rbocrgnmsadkbfoqbzpe.supabase.co',
  'sb_publishable_CXx1yNZ2C03bTuNpeDUNsQ_k4JHv9Vm'
);

export default function Fiados() {
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [pagando, setPagando] = useState<any>(null);
  const [formaPagamento, setFormaPagamento] = useState('PIX');
  const [contaId, setContaId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);

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

  const confirmarPagamento = async () => {
    if (!pagando || !contaId) return;

    try {
      await supabase
        .from('transacoes')
        .delete()
        .eq('id', pagando.id);

      await supabase
        .from('transacoes')
        .insert([{
          conta_id: contaId,
          descricao: `${pagando.descricao} (recebido)`,
          valor: pagando.valor,
          tipo: 'receita',
          formapagamento: formaPagamento,
          hora: new Date().toLocaleTimeString('pt-BR'),
          data: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          origin: 'fiado_pago'
        }]);

      setPagando(null);
      setFormaPagamento('PIX');
      carregarTransacoes(contaId);
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao registrar pagamento');
    }
  };

  const totalFiado = transacoes.reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0).toFixed(2);

  if (carregando) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-6xl">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar
        </Link>

        <h1 className="text-2xl font-bold mb-6">Fiados</h1>

        <div className="bg-orange-600 text-white p-6 rounded-lg shadow-md mb-6 text-center">
          <p className="text-sm">TOTAL FIADO</p>
          <p className="text-4xl font-bold">R$ {totalFiado}</p>
        </div>

        {pagando && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Registrar Pagamento</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-bold text-lg">{pagando.descricao}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">Valor</p>
                <p className="font-bold text-2xl text-green-600">R$ {parseFloat(pagando.valor).toFixed(2)}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">Data Original</p>
                <p className="font-bold">{pagando.data}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Como você recebeu?</label>
                <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className="w-full border border-gray-300 p-2 rounded">
                  <option>PIX</option>
                  <option>DINHEIRO</option>
                  <option>CARTÃO</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPagando(null)} className="flex-1 bg-gray-400 text-white p-3 rounded font-bold hover:bg-gray-500">Cancelar</button>
                <button onClick={confirmarPagamento} className="flex-1 bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700">Confirmar Pagamento</button>
              </div>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-bold mb-4">Clientes com Débito</h2>
          {transacoes.length === 0 ? (
            <p className="text-gray-500">Nenhum fiado pendente</p>
          ) : (
            <div className="space-y-2">
              {transacoes.map((t) => (
                <div key={t.id} className="bg-white p-4 rounded border-l-4 border-orange-600">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg">{t.descricao}</p>
                      <p className="text-sm text-gray-600">{t.data} - {t.hora}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-orange-600">R$ {parseFloat(t.valor).toFixed(2)}</p>
                      <button onClick={() => setPagando(t)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-bold mt-2">PAGO</button>
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
