'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rbocrgnmsadkbfoqbzpe.supabase.co',
  'sb_publishable_CXx1yNZ2C03bTuNpeDUNsQ_k4JHv9Vm'
);

export default function Cardapio() {
  const [itens, setItens] = useState<any[]>([]);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [editando, setEditando] = useState<any>(null);
  const [contaId, setContaId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const conta = localStorage.getItem('conta_id');
    if (conta) {
      setContaId(parseInt(conta));
      carregarItens(parseInt(conta));
    }
  }, []);

  const carregarItens = async (cId: number) => {
    try {
      const { data } = await supabase
        .from('cardapio')
        .select('*')
        .eq('conta_id', cId)
        .order('created_at', { ascending: false });

      setItens(data || []);
    } catch (err) {
      console.error('Erro:', err);
    }
    setCarregando(false);
  };

  const adicionarItem = async () => {
    if (!nome.trim() || !preco || isNaN(parseFloat(preco)) || !contaId) return;

    try {
      if (editando) {
        await supabase
          .from('cardapio')
          .update({ nome, preco: parseFloat(preco) })
          .eq('id', editando.id);
        setEditando(null);
      } else {
        await supabase
          .from('cardapio')
          .insert([{ conta_id: contaId, nome, preco: parseFloat(preco) }]);
      }

      setNome('');
      setPreco('');
      carregarItens(contaId);
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao salvar item');
    }
  };

  const deletarItem = async (id: number) => {
    try {
      await supabase.from('cardapio').delete().eq('id', id);
      carregarItens(contaId!);
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const iniciarEdicao = (item: any) => {
    setEditando(item);
    setNome(item.nome);
    setPreco(item.preco.toString());
  };

  const cancelarEdicao = () => {
    setEditando(null);
    setNome('');
    setPreco('');
  };

  if (carregando) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-6xl">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar
        </Link>

        <h1 className="text-2xl font-bold mb-6">Cardápio</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-bold mb-4">{editando ? 'Editar Item' : 'Adicionar Item'}</h2>

          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Nome do Item</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Hambúrguer, Pizza..." className="w-full border border-gray-300 p-2 rounded" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Preço (R$)</label>
            <input type="number" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="0.00" step="0.01" className="w-full border border-gray-300 p-2 rounded" />
          </div>

          <div className="flex gap-2">
            <button onClick={adicionarItem} className="flex-1 bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700">
              {editando ? '✓ ATUALIZAR' : '+ ADICIONAR'}
            </button>
            {editando && (
              <button onClick={cancelarEdicao} className="flex-1 bg-gray-400 text-white p-3 rounded font-bold hover:bg-gray-500">
                ✕ CANCELAR
              </button>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-4">Itens do Cardápio ({itens.length})</h2>
          {itens.length === 0 ? (
            <p className="text-gray-500">Nenhum item no cardápio</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itens.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded border border-gray-300">
                  <p className="font-bold text-lg">{item.nome}</p>
                  <p className="text-2xl font-bold text-green-600">R$ {parseFloat(item.preco).toFixed(2)}</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => iniciarEdicao(item)} className="flex-1 bg-blue-600 text-white p-2 rounded text-sm hover:bg-blue-700">
                      ✏️ EDITAR
                    </button>
                    <button onClick={() => deletarItem(item.id)} className="flex-1 bg-red-600 text-white p-2 rounded text-sm hover:bg-red-700">
                      🗑️ DELETAR
                    </button>
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
