'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rbocrgnmsadkbfoqbzpe.supabase.co',
  'sb_publishable_CXx1yNZ2C03bTuNpeDUNsQ_k4JHv9Vm'
);

export default function NotasFiado() {
  const [notas, setNotas] = useState<any[]>([]);
  const [contaId, setContaId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const conta = localStorage.getItem('conta_id');
    if (conta) {
      setContaId(parseInt(conta));
      carregarNotas(parseInt(conta));
    }
  }, []);

  const carregarNotas = async (cId: number) => {
    try {
      console.log('Carregando notas para conta:', cId);
      const { data, error } = await supabase
        .from('notas_fiados')
        .select('*')
        .eq('conta_id', cId)
        .order('created_at', { ascending: false });
      
      console.log('Notas carregadas:', data);
      if (error) console.error('Erro Supabase:', error);
      setNotas(data || []);
    } catch (err) {
      console.error('Erro ao carregar notas:', err);
    }
    setCarregando(false);
  };

  const imprimirNota = async (nota: any) => {
    try {
      console.log('Tentando imprimir nota:', nota);
      if (nota.arquivo_nome) {
        const { data } = await supabase.storage
          .from('notas-fiados')
          .getPublicUrl(`${contaId}/${nota.arquivo_nome}`);
        console.log('URL da nota:', data.publicUrl);
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
      console.log('Deletando nota:', notaId);
      const { error } = await supabase
        .from('notas_fiados')
        .delete()
        .eq('id', notaId);
      
      if (error) {
        console.error('Erro ao deletar:', error);
        alert('Erro ao deletar nota');
      } else {
        carregarNotas(contaId!);
      }
    } catch (err) {
      console.error('Erro ao deletar:', err);
      alert('Erro ao deletar nota');
    }
  };

  if (carregando) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Carregando...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-4xl">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          Voltar
        </Link>
        <h1 className="text-2xl font-bold mb-6">Notas de Fiado</h1>
        
        {notas.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhuma nota disponível</p>
        ) : (
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
