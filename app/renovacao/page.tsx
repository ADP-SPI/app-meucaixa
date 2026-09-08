'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const PLANOS = [
  { id: 1, nome: 'Básico', preco: 29.90 },
  { id: 2, nome: 'Pro', preco: 49.90 },
  { id: 3, nome: 'Enterprise', preco: 79.90 },
  { id: 4, nome: 'Individual', preco: 19.90 },
  { id: 5, nome: 'Casal', preco: 29.90 }
];

const DURAÇÕES = [
  { meses: 1, label: '1 mês' },
  { meses: 3, label: '3 meses' },
  { meses: 6, label: '6 meses' },
  { meses: 12, label: '1 ano' }
];

export default function Renovacao() {
  const router = useRouter();
  const [planoSelecionado, setPlanoSelecionado] = useState<number | null>(null);
  const [duracaoSelecionada, setDuracaoSelecionada] = useState<number>(1);
  const [planoAtual, setPlanoAtual] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');

  useEffect(() => {
    const buscarInfo = async () => {
      const contaId = localStorage.getItem('conta_id');
      if (!contaId) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('assinaturas')
        .select('plano_id, data_vencimento')
        .eq('conta_id', contaId)
        .single();

      if (data) {
        const plano = PLANOS.find(p => p.id === data.plano_id);
        setPlanoAtual(plano?.nome || '');
        setDataVencimento(new Date(data.data_vencimento).toLocaleDateString('pt-BR'));
      }
    };

    buscarInfo();
  }, []);

  const planoEscolhido = PLANOS.find(p => p.id === planoSelecionado);
  const precoTotal = planoEscolhido ? planoEscolhido.preco * duracaoSelecionada : 0;
  const duracao = DURAÇÕES.find(d => d.meses === duracaoSelecionada);

  const handleAssinarRenovar = () => {
    if (!planoEscolhido) return;
    const telefone = '5543996838274';
    const mensagem = `Olá, quero renovar o plano ${planoEscolhido.nome} por ${duracao?.label} - R$${precoTotal.toFixed(2)}`;
    const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-2xl">
        <button onClick={() => router.back()} className="text-blue-600 hover:underline font-bold mb-4">
          ← Voltar
        </button>

        <div className="bg-white rounded-lg p-6 mb-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Renovar Assinatura</h1>
          
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <p className="text-sm text-gray-600">Seu plano atual:</p>
            <p className="text-lg font-bold text-gray-900">{planoAtual || 'Carregando...'}</p>
            <p className="text-sm text-gray-600 mt-1">Vence em: {dataVencimento}</p>
          </div>

          <h2 className="text-lg font-bold text-gray-900 mb-3">Escolher Plano</h2>
          <div className="space-y-2 mb-6">
            {PLANOS.map(plano => (
              <button key={plano.id} onClick={() => setPlanoSelecionado(plano.id)} className={`w-full p-3 rounded text-left font-bold transition ${planoSelecionado === plano.id ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-900 border border-gray-200 hover:bg-gray-100'}`}>
                {plano.nome} - R${plano.preco.toFixed(2)}/mês
              </button>
            ))}
          </div>

          {planoSelecionado && (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Escolher Duração</h2>
              <div className="space-y-2 mb-6">
                {DURAÇÕES.map(dur => (
                  <button key={dur.meses} onClick={() => setDuracaoSelecionada(dur.meses)} className={`w-full p-3 rounded text-left font-bold transition ${duracaoSelecionada === dur.meses ? 'bg-green-600 text-white' : 'bg-gray-50 text-gray-900 border border-gray-200 hover:bg-gray-100'}`}>
                    {dur.label} - R${(planoEscolhido!.preco * dur.meses).toFixed(2)}
                  </button>
                ))}
              </div>

              <div className="bg-blue-50 p-4 rounded mb-6">
                <p className="text-sm text-gray-600">Total a pagar:</p>
                <p className="text-2xl font-bold text-blue-600">R${precoTotal.toFixed(2)}</p>
              </div>

              <button onClick={handleAssinarRenovar} className="w-full bg-green-600 text-white px-6 py-4 rounded font-bold text-lg hover:bg-green-700 transition">
                Renovar via WhatsApp
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
