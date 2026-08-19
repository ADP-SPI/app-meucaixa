'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Fiados() {
  const [fiados, setFiados] = useState<any[]>([]);

  useEffect(() => {
    carregarFiados();
  }, []);

  const carregarFiados = () => {
    try {
      const transacoes = JSON.parse(localStorage.getItem('transacoes') || '[]');
      const fiadosList = transacoes.filter((t: any) => t && t.tipo === 'FIADO');
      setFiados(fiadosList);
    } catch (e) {
      setFiados([]);
    }
  };

  const marcarComoPago = (id: number) => {
    const transacoes = JSON.parse(localStorage.getItem('transacoes') || '[]');
    const updated = transacoes.filter((t: any) => t && t.id !== id);
    localStorage.setItem('transacoes', JSON.stringify(updated));
    carregarFiados();
  };

  const totalFiado = fiados.reduce((sum, f) => sum + (parseFloat(f.valor) || 0), 0).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-6xl">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar
        </Link>

        <h1 className="text-2xl font-bold mb-6">Fiados</h1>

        <div className="bg-orange-600 text-white p-6 rounded-lg shadow-md mb-6 text-center">
          <p className="text-sm">TOTAL FIADO</p>
          <p className="text-4xl font-bold">R$ {totalFiado}</p>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-4">Clientes com Débito</h2>
          {fiados && fiados.length === 0 ? (
            <p className="text-gray-500">Nenhum fiado pendente</p>
          ) : (
            <div className="space-y-2">
              {fiados && fiados.map((f) => (
                f ? (
                  <div key={f.id} className="bg-white p-4 rounded border-l-4 border-orange-600">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-lg">{f.nome_cliente || 'Sem nome'}</p>
                        <p className="text-sm text-gray-600">R$ {parseFloat(f.valor || 0).toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => marcarComoPago(f.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-bold"
                      >
                        PAGO
                      </button>
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
