'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rbocrgnmsadkbfoqbzpe.supabase.co',
  'sb_publishable_CXx1yNZ2C03bTuNpeDUNsQ_k4JHv9Vm'
);

export default function Comanda() {
  const router = useRouter();
  const [cardapio, setCardapio] = useState<any[]>([]);
  const [modo, setModo] = useState('cardapio');
  const [comandas, setComandas] = useState<any[]>([]);
  const [abrindoComanda, setAbrindoComanda] = useState(false);
  const [nomeComanda, setNomeComanda] = useState('');
  const [itemRapido, setItemRapido] = useState('');
  const [precoRapido, setPrecoRapido] = useState('');
  const [modalAberto, setModalAberto] = useState<number | null>(null);
  const [fechando, setFechando] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState('PIX');
  const [contaId, setContaId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const conta = localStorage.getItem('conta_id');
    if (conta) {
      setContaId(parseInt(conta));
      carregarDados(parseInt(conta));
    }
  }, []);

  const carregarDados = async (cId: number) => {
    try {
      const { data: cardapioData } = await supabase
        .from('cardapio')
        .select('*')
        .eq('conta_id', cId);

      const { data: comandasData } = await supabase
        .from('comandas')
        .select('*')
        .eq('conta_id', cId)
        .order('created_at', { ascending: false });

      setCardapio(cardapioData || []);
      setComandas(comandasData || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
    setCarregando(false);
  };

  const criarComanda = async () => {
    if (!nomeComanda.trim() || !contaId) return;

    try {
      const { error } = await supabase
        .from('comandas')
        .insert([{
          conta_id: contaId,
          nome: nomeComanda,
          itens: [],
          data: new Date().toISOString().split('T')[0],
          hora: new Date().toLocaleTimeString('pt-BR')
        }]);

      if (error) throw error;

      setNomeComanda('');
      setAbrindoComanda(false);
      carregarDados(contaId);
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao criar comanda');
    }
  };

  const adicionarItem = async (comandaId: number, item: any) => {
    const comanda = comandas.find(c => c.id === comandaId);
    if (!comanda) return;

    const itensAtualizados = [
      ...(comanda.itens || []),
      {
        id: Date.now(),
        nome: item.nome || itemRapido,
        preco: item.preco || parseFloat(precoRapido),
        quantidade: 1
      }
    ];

    try {
      const { error } = await supabase
        .from('comandas')
        .update({ itens: itensAtualizados })
        .eq('id', comandaId);

      if (error) throw error;

      setItemRapido('');
      setPrecoRapido('');
      carregarDados(contaId!);
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const removerItem = async (comandaId: number, itemId: number) => {
    const comanda = comandas.find(c => c.id === comandaId);
    if (!comanda) return;

    const itensAtualizados = (comanda.itens || []).filter((i: any) => i.id !== itemId);

    try {
      await supabase
        .from('comandas')
        .update({ itens: itensAtualizados })
        .eq('id', comandaId);

      carregarDados(contaId!);
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  const calcularSubtotal = (comandaId: number) => {
    const comanda = comandas.find(c => c.id === comandaId);
    if (!comanda || !comanda.itens) return 0;
    return comanda.itens.reduce((sum: number, item: any) => sum + item.preco * item.quantidade, 0);
  };

  const fecharComanda = async (comandaId: number) => {
    const subtotal = calcularSubtotal(comandaId);
    const comanda = comandas.find(c => c.id === comandaId);

    if (subtotal === 0 || !comanda || !contaId) return;

    try {
      await supabase
        .from('transacoes')
        .insert([{
          conta_id: contaId,
          descricao: `Comanda: ${comanda.nome}`,
          valor: subtotal,
          tipo: 'receita',
          formapagamento: formaPagamento,
          hora: new Date().toLocaleTimeString('pt-BR'),
          data: new Date().toISOString().split('T')[0],
          origin: 'comanda',
          itens: comanda.itens || []
        }]);

      await supabase
        .from('comandas')
        .delete()
        .eq('id', comandaId);

      setModalAberto(null);
      setFechando(false);
      setFormaPagamento('PIX');
      alert(`Comanda de ${comanda.nome} fechada! R$ ${subtotal.toFixed(2)} adicionado ao caixa.`);
      carregarDados(contaId);
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao fechar comanda');
    }
  };

  const deletarComanda = async (comandaId: number) => {
    try {
      await supabase
        .from('comandas')
        .delete()
        .eq('id', comandaId);

      setModalAberto(null);
      carregarDados(contaId!);
    } catch (err) {
      console.error('Erro:', err);
    }
  };

  if (carregando) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-6xl">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar
        </Link>

        <h1 className="text-2xl font-bold mb-6">Comanda</h1>

        <div className="mb-6">
          <label className="block text-sm font-bold mb-2">Modo de Operação</label>
          <select value={modo} onChange={(e) => setModo(e.target.value)} className="w-full border border-gray-300 p-2 rounded">
            <option value="cardapio">Usar Cardápio</option>
            <option value="rapido">Modo Rápido (digitar)</option>
          </select>
        </div>

        {!abrindoComanda && modalAberto === null && (
          <button onClick={() => setAbrindoComanda(true)} className="w-full bg-green-600 text-white p-4 rounded font-bold hover:bg-green-700 mb-6">
            + ABRIR COMANDA
          </button>
        )}

        {abrindoComanda && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-bold mb-4">Nova Comanda</h2>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">Mesa ou Nome do Cliente</label>
              <input type="text" value={nomeComanda} onChange={(e) => setNomeComanda(e.target.value)} placeholder="Ex: Mesa 1, João Silva..." className="w-full border border-gray-300 p-2 rounded" />
            </div>
            <div className="flex gap-2">
              <button onClick={criarComanda} className="flex-1 bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700">✓ ABRIR</button>
              <button onClick={() => setAbrindoComanda(false)} className="flex-1 bg-gray-400 text-white p-3 rounded font-bold hover:bg-gray-500">✕ CANCELAR</button>
            </div>
          </div>
        )}

        {modalAberto === null && comandas.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4">Comandas Abertas ({comandas.length})</h2>
            <div className="space-y-2">
              {comandas.map(cmd => (
                <button key={cmd.id} onClick={() => setModalAberto(cmd.id)} className="w-full bg-white border border-gray-200 p-4 rounded text-left hover:bg-gray-50">
                  <p className="font-bold text-lg">{cmd.nome}</p>
                  <p className="text-sm text-gray-600">{(cmd.itens || []).length} itens - R$ {calcularSubtotal(cmd.id).toFixed(2)}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {modalAberto !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto flex flex-col">
              <h2 className="text-xl font-bold mb-4">{comandas.find(c => c.id === modalAberto)?.nome}</h2>

              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                {modo === 'cardapio' ? (
                  <>
                    <label className="block text-sm font-bold mb-2">Selecione um item</label>
                    <select value="" onChange={(e) => {if (e.target.value) {const item = cardapio.find(i => i.id.toString() === e.target.value); if (item) adicionarItem(modalAberto, item); e.target.value = '';}}} className="w-full border border-gray-300 p-2 rounded">
                      <option value="">-- Escolha um item --</option>
                      {cardapio.map(item => (<option key={item.id} value={item.id}>{item.nome} - R$ {item.preco.toFixed(2)}</option>))}
                    </select>
                  </>
                ) : (
                  <>
                    <div className="mb-3">
                      <input type="text" value={itemRapido} onChange={(e) => setItemRapido(e.target.value)} placeholder="Nome do item" className="w-full border border-gray-300 p-2 rounded mb-2" />
                      <input type="number" value={precoRapido} onChange={(e) => setPrecoRapido(e.target.value)} placeholder="Preço" step="0.01" className="w-full border border-gray-300 p-2 rounded" />
                    </div>
                    <button onClick={() => adicionarItem(modalAberto, {})} className="w-full bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700">+ ADICIONAR ITEM</button>
                  </>
                )}
              </div>

              <div className="mb-4 flex-1">
                <h3 className="font-bold mb-2">Itens</h3>
                {(comandas.find(c => c.id === modalAberto)?.itens || []).length === 0 ? (
                  <p className="text-gray-500">Nenhum item</p>
                ) : (
                  <div className="space-y-2">
                    {(comandas.find(c => c.id === modalAberto)?.itens || []).map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                        <div>
                          <p className="font-bold">{item.nome}</p>
                          <p className="text-sm text-gray-600">{item.quantidade}x R$ {item.preco.toFixed(2)} = R$ {(item.quantidade * item.preco).toFixed(2)}</p>
                        </div>
                        <button onClick={() => removerItem(modalAberto, item.id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-blue-100 p-4 rounded-lg mb-4 text-center">
                <p className="text-sm text-gray-600">SUBTOTAL</p>
                <p className="text-3xl font-bold text-blue-600">R$ {calcularSubtotal(modalAberto).toFixed(2)}</p>
              </div>

              {!fechando && (
                <div className="flex gap-2">
                  <button onClick={() => setFechando(true)} className="flex-1 bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700">Fechar Comanda</button>
                  <button onClick={() => deletarComanda(modalAberto)} className="flex-1 bg-red-600 text-white p-3 rounded font-bold hover:bg-red-700">Excluir</button>
                  <button onClick={() => setModalAberto(null)} className="flex-1 bg-gray-400 text-white p-3 rounded font-bold hover:bg-gray-500">Voltar</button>
                </div>
              )}

              {fechando && (
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-2">Forma de Pagamento</label>
                  <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className="w-full border border-gray-300 p-2 rounded mb-4">
                    <option>PIX</option>
                    <option>DINHEIRO</option>
                    <option>CARTÃO</option>
                    <option>FIADO</option>
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => fecharComanda(modalAberto)} className="flex-1 bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700">✓ Confirmar</button>
                    <button onClick={() => setFechando(false)} className="flex-1 bg-gray-400 text-white p-3 rounded font-bold hover:bg-gray-500">✕ Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
