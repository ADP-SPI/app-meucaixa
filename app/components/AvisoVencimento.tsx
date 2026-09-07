'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AvisoVencimento() {
  const router = useRouter();
  const [aviso, setAviso] = useState<{tipo: string; dias: number} | null>(null);

  useEffect(() => {
    const verificarVencimento = async () => {
      try {
        const contaId = localStorage.getItem('conta_id');
        if (!contaId) return;

        const { data, error } = await supabase
          .from('assinaturas')
          .select('data_vencimento')
          .eq('conta_id', contaId)
          .single();

        if (error || !data?.data_vencimento) {
          console.log('Sem assinatura encontrada');
          return;
        }

        const hoje = new Date();
        const vencimento = new Date(data.data_vencimento);
        const dias = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        console.log('Dias restantes:', dias);

        if (dias <= 0) {
          setAviso({tipo: 'vencido', dias: 0});
        } else if (dias <= 1) {
          setAviso({tipo: '1dia', dias});
        } else if (dias <= 3) {
          setAviso({tipo: '3dias', dias});
        } else if (dias <= 5) {
          setAviso({tipo: '5dias', dias});
        } else if (dias <= 10) {
          setAviso({tipo: '10dias', dias});
        }
      } catch (err) {
        console.error('Erro vencimento:', err);
      }
    };

    verificarVencimento();
  }, []);

  if (!aviso) return null;

  if (aviso.tipo === 'vencido') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <h2 className="text-3xl font-bold text-red-600 mb-4">🔴 PLANO VENCIDO</h2>
          <p className="text-gray-700 mb-6">Seu plano venceu. Renove agora para continuar usando.</p>
          <button
            onClick={() => router.push('/planos')}
            className="w-full bg-red-600 text-white px-6 py-3 rounded font-bold hover:bg-red-700 transition"
          >
            Renovar Plano
          </button>
        </div>
      </div>
    );
  }

  const configs: Record<string, {titulo: string; cor: string; mensagem: string}> = {
    '1dia': {
      titulo: '🔴 URGENTE: Vence Amanhã',
      cor: 'bg-red-600',
      mensagem: 'Seu plano vence em 1 dia. Renove agora!'
    },
    '3dias': {
      titulo: '🟡 ATENÇÃO: Vence em 3 Dias',
      cor: 'bg-yellow-500',
      mensagem: 'Seu plano vence em 3 dias.'
    },
    '5dias': {
      titulo: '🔵 AVISO: Vence em 5 Dias',
      cor: 'bg-blue-500',
      mensagem: 'Seu plano vence em 5 dias.'
    },
    '10dias': {
      titulo: '🔵 INFO: Vence em 10 Dias',
      cor: 'bg-blue-400',
      mensagem: 'Seu plano vence em 10 dias.'
    }
  };

  const config = configs[aviso.tipo];
  if (!config) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 ${config.cor} text-white p-4 flex justify-between items-center z-50 shadow-lg`}>
      <div>
        <p className="font-bold">{config.titulo}</p>
        <p className="text-sm">{config.mensagem}</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => setAviso(null)}
          className="bg-white text-gray-800 px-4 py-2 rounded font-bold hover:bg-gray-100 transition text-sm"
        >
          Descartar
        </button>
        <button
          onClick={() => router.push('/planos')}
          className="bg-white text-gray-800 px-4 py-2 rounded font-bold hover:bg-gray-100 transition text-sm"
        >
          Renovar
        </button>
      </div>
    </div>
  );
}
