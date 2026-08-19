'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Caixa() {
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [nomeCliente, setNomeCliente] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState('PIX');

  useEffect(() => {
    carregarTransacoes();
  }, []);

  const carregarTransacoes = () => {
    try {
      const data = JSON.parse(localStorage.getItem('transacoes') || '[]');
      if (Array.isArray(data)) {
        setTransacoes(data.filter(t => t && t.valor !== undefined));
      }
    } catch (e) {
      setTransacoes([]);
    }
  };

  const adicionarTransacao = () => {
    if (!nomeCliente.trim() || !valor || isNaN(parseFloat(valor))) {
      alert('Preencha nome e valor corretamente');
      return;
    }

    const novaTransacao = {
      id: Date.now(),
      nome_cliente: nomeCliente,
      valor: parseFloat(valor),
      tipo: tipo,
      hora: new Date().toLocaleTimeString('pt-BR'),
      data: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem('transacoes') || '[]');
    existing.push(novaTransacao);
    localStorage.setItem('transacoes', JSON.stringify(existing));

    setNomeCliente('');
    setValor('');
    setTipo('PIX');
    carregarTransacoes();
  };

  const calcularTotal = (tipo_filtro?: string) => {
    const total = transacoes
      .filter(t => t && (!tipo_filtro || t.tipo === tipo_filtro))
      .reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0);
    return total.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-6xl">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar
        </Link>

        <h1 className="text-2xl font-bold mb-6">Caixa</h1>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-600 text-white p-4 rounded-lg text-center">
            <p className="text-sm">PIX</p>
            <p className="text-2xl font-bold">R$ {calcularTotal('PIX')}</p>
          </div>
          <div className="bg-green-600 text-white p-4 rounded-lg text-center">
            <p className="text-sm">DINHEIRO</p>
            <p className="text-2xl font-bold">R$ {calcularTotal('DINHEIRO')}</p>
          </div>
          <div className="bg-purple-600 text-white p-4 rounded-lg text-center">
            <p className="text-sm">CARTÃO</p>
            <p className="text-2xl font-bold">R$ {calcularTotal('CARTÃO')}</p>
          </div>
          <div className="bg-orange-600 text-white p-4 rounded-lg text-center">
            <p className="text-sm">FIADO</p>
            <p className="text-2xl font-bold">R$ {calcularTotal('FIADO')}</p>
          </div>
        </div>

        <div className="bg-red-700 text-white p-4 rounded-lg text-center mb-6">
          <p className="text-sm">TOTAL DO DIA</p>
          <p className="text-3xl font-bold">R$ {calcularTotal()}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Nome do Cliente</label>
            <input
              type="text"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              placeholder="Digite o nome"
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
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded"
            >
              <option>PIX</option>
              <option>DINHEIRO</option>
              <option>CARTÃO</option>
              <option>FIADO</option>
            </select>
          </div>

          <button
            onClick={adicionarTransacao}
            className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700"
          >
            + REGISTRAR
          </button>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-4">Transações de Hoje</h2>
          {transacoes && transacoes.length === 0 ? (
            <p className="text-gray-500">Nenhuma transação</p>
          ) : (
            <div className="space-y-2">
              {transacoes && transacoes.map((t) => (
                t ? (
                  <div key={t.id} className="bg-white p-3 rounded border border-gray-200">
                    <p className="font-bold">{t.nome_cliente || 'Sem nome'}</p>
                    <p className="text-sm text-gray-600">
                      R$ {parseFloat(t.valor || 0).toFixed(2)} - {t.tipo || 'PIX'} - {t.hora || '--:--'}
                    </p>
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
