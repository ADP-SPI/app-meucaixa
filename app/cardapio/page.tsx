'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Item {
  id: number;
  nome: string;
  preco: string;
}

export default function Cardapio() {
  const [itens, setItens] = useState<Item[]>([]);
  const [contaId, setContaId] = useState<number | null>(null);
  const [novoNome, setNovoNome] = useState('');
  const [novoPreco, setNovoPreco] = useState('');
  const [editando, setEditando] = useState<Item | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const conta = localStorage.getItem('conta_id');
    if (conta) {
      const cId = parseInt(conta);
      setContaId(cId);
      carregarItens(cId);
    } else {
      setCarregando(false);
    }
  }, []);

  const carregarItens = async (cId: number) => {
    try {
      const { data, error } = await supabase
        .from('cardapio')
        .select('*')
        .eq('conta_id', cId)
        .order('nome');

      if (error) throw error;
      setItens(data || []);
    } catch (err) {
      console.error('Erro ao carregar itens:', err);
    }
    setCarregando(false);
  };

  const adicionarItem = async () => {
    if (!novoNome.trim() || !novoPreco.trim() || !contaId) {
      alert('Preencha nome e preço');
      return;
    }

    try {
      const { error } = await supabase
        .from('cardapio')
        .insert([{
          conta_id: contaId,
          nome: novoNome.trim(),
          preco: parseFloat(novoPreco)
        }]);

      if (error) throw error;

      setNovoNome('');
      setNovoPreco('');
      carregarItens(contaId);
    } catch (err) {
      alert('Erro ao adicionar item');
    }
  };

  const iniciarEdicao = (item: Item) => {
    setEditando(item);
    setNovoNome(item.nome);
    setNovoPreco(item.preco);
  };

  const salvarEdicao = async () => {
    if (!editando || !novoNome.trim() || !novoPreco.trim() || !contaId) {
      alert('Preencha nome e preço');
      return;
    }

    try {
      const { error } = await supabase
        .from('cardapio')
        .update({
          nome: novoNome.trim(),
          preco: parseFloat(novoPreco)
        })
        .eq('id', editando.id);

      if (error) throw error;

      setEditando(null);
      setNovoNome('');
      setNovoPreco('');
      carregarItens(contaId);
    } catch (err) {
      alert('Erro ao editar item');
    }
  };

  const deletarItem = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este item?')) return;

    try {
      const { error } = await supabase
        .from('cardapio')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (contaId) carregarItens(contaId);
    } catch (err) {
      alert('Erro ao deletar item');
    }
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

        <h1 className="text-2xl font-bold mb-6">Cardápio</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-bold mb-4">{editando ? '✏️ Editar Item' : '➕ Adicionar Item'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Nome do item"
              className="border border-gray-300 p-2 rounded"
            />
            <input
              type="number"
              value={novoPreco}
              onChange={(e) => setNovoPreco(e.target.value)}
              placeholder="Preço"
              step="0.01"
              className="border border-gray-300 p-2 rounded"
            />
            <div className="flex gap-2">
              {editando ? (
                <>
                  <button
                    onClick={salvarEdicao}
                    className="flex-1 bg-green-100 text-green-600 border border-green-300 p-2 rounded font-bold hover:bg-green-200"
                  >
                    ✓ SALVAR
                  </button>
                  <button
                    onClick={() => {
                      setEditando(null);
                      setNovoNome('');
                      setNovoPreco('');
                    }}
                    className="flex-1 bg-gray-100 text-gray-600 border border-gray-300 p-2 rounded font-bold hover:bg-gray-200"
                  >
                    ✕ CANCELAR
                  </button>
                </>
              ) : (
                <button
                  onClick={adicionarItem}
                  className="w-full bg-green-100 text-green-600 border border-green-300 p-2 rounded font-bold hover:bg-green-200"
                >
                  ➕ ADICIONAR
                </button>
              )}
            </div>
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
                    <button onClick={() => iniciarEdicao(item)} className="flex-1 bg-blue-100 text-blue-600 border border-blue-300 p-2 rounded text-sm hover:bg-blue-200">
                      ✏️ EDITAR
                    </button>
                    <button onClick={() => deletarItem(item.id)} className="flex-1 bg-red-100 text-red-600 border border-red-300 p-2 rounded text-sm hover:bg-red-200">
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
