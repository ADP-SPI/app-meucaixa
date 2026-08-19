'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Relatorios() {
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    carregarTransacoes();
  }, []);

  const carregarTransacoes = () => {
    try {
      const data = JSON.parse(localStorage.getItem('transacoes') || '[]');
      if (Array.isArray(data)) {
        setTransacoes(data.filter(t => t && t.valor !== undefined).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    } catch (e) {
      setTransacoes([]);
    }
  };

  const transacoesFiltradas = transacoes.filter((t) => {
    if (filtroTipo && t.tipo !== filtroTipo) return false;
    if (dataInicio && t.data < dataInicio) return false;
    if (dataFim && t.data > dataFim) return false;
    return true;
  });

  const calcularTotal = () => {
    return transacoesFiltradas.reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0).toFixed(2);
  };

  const calcularPorTipo = (tipo: string) => {
    return transacoesFiltradas
      .filter(t => t.tipo === tipo)
      .reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0)
      .toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-6xl">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar
        </Link>

        <h1 className="text-2xl font-bold mb-6">Relatórios</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Forma de Pagamento</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
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
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>

          <button
            onClick={carregarTransacoes}
            className="w-full bg-purple-600 text-white p-3 rounded font-bold hover:bg-purple-700"
          >
            FILTRAR
          </button>
        </div>

        <div className="bg-red-700 text-white p-6 rounded-lg shadow-md text-center mb-6">
          <p className="text-sm">TOTAL FILTRADO</p>
          <p className="text-4xl font-bold">R$ {calcularTotal()}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-600 text-white p-4 rounded text-center">
            <p className="text-xs">PIX</p>
            <p className="text-xl font-bold">R$ {calcularPorTipo('PIX')}</p>
          </div>
          <div className="bg-green-600 text-white p-4 rounded text-center">
            <p className="text-xs">DINHEIRO</p>
            <p className="text-xl font-bold">R$ {calcularPorTipo('DINHEIRO')}</p>
          </div>
          <div className="bg-purple-600 text-white p-4 rounded text-center">
            <p className="text-xs">CARTÃO</p>
            <p className="text-xl font-bold">R$ {calcularPorTipo('CARTÃO')}</p>
          </div>
          <div className="bg-orange-600 text-white p-4 rounded text-center">
            <p className="text-xs">FIADO</p>
            <p className="text-xl font-bold">R$ {calcularPorTipo('FIADO')}</p>
          </div>
        </div>

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
                        <p className="font-bold">{t.nome_cliente || 'Sem nome'}</p>
                        <p className="text-xs text-gray-600">{t.data} - {t.hora}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R$ {parseFloat(t.valor || 0).toFixed(2)}</p>
                        <p className="text-xs text-gray-600">{t.tipo}</p>
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
