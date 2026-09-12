'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function NotasFiado() {
  const [notas, setNotas] = useState<any[]>([]);
  const [contaId, setContaId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const conta = localStorage.getItem('conta_id');
    if (conta) {
      const cId = parseInt(conta);
      setContaId(cId);
      carregarNotas(cId);
    } else {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (!contaId) return;
    
    const interval = setInterval(() => {
      carregarNotas(contaId);
    }, 5000);

    return () => clearInterval(interval);
  }, [contaId]);

  const carregarNotas = async (cId: number) => {
    try {
      const { data, error } = await supabase
        .from('notas_fiados')
        .select('*')
        .eq('conta_id', cId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro Supabase:', error);
      }
      setNotas(data || []);
    } catch (err) {
      console.error('Erro ao carregar notas:', err);
    }
    setCarregando(false);
  };

  const imprimirNota = async (nota: any) => {
    try {
      if (nota.arquivo_nome) {
        const { data } = await supabase.storage
          .from('notas-fiados')
          .getPublicUrl(`${contaId}/${nota.arquivo_nome}`);
        window.open(data.publicUrl, '_blank');
      } else {
        alert('Arquivo não encontrado para esta nota');
      }
    } catch (err) {
      console.error('Erro ao imprimir:', err);
      alert('Erro ao acessar nota');
    }
  };

  const deletarNota = async (notaId: number) => {
    try {
      const { error } = await supabase
        .from('notas_fiados')
        .delete()
        .eq('id', notaId);
      
      if (error) {
        alert('Erro ao deletar nota');
      } else {
        carregarNotas(contaId!);
      }
    } catch (err) {
      console.error('Erro ao deletar:', err);
      alert('Erro ao deletar nota');
    }
  };

  if (!contaId && !carregando) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Erro: Conta não encontrada</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-4xl">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          Voltar
        </Link>
        
        <h1 className="text-2xl font-bold mb-6">Notas de Fiado</h1>

        {carregando && notas.length === 0 && <p className="text-center text-gray-600">Carregando notas...</p>}

        {notas.length === 0 && !carregando && (
          <p className="text-gray-500 text-center py-8">Nenhuma nota disponível</p>
        )}

        {notas.length > 0 && (
          <div className="space-y-2">
            {notas.map((nota) => (
              <div key={nota.id} className="bg-white p-4 rounded border-2 border-gray-200 flex justify-between items-center">
                <div>
                  <p className="font-bold">Nota #{String(nota.numero_nota).padStart(4, '0')}</p>
                  <p className="text-sm text-gray-600">Cliente: {nota.cliente_nome}</p>
                  <p className="text-sm text-gray-600">Total: R$ {nota.total_valor.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Status: {nota.status} | Arquivo: {nota.arquivo_nome ? 'Sim' : 'Não'}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => imprimirNota(nota)}
                    className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700"
                  >
                    Imprimir
                  </button>
                  <button 
                    onClick={() => deletarNota(nota.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700"
                  >
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
