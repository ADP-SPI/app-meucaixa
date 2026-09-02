cat > app/components/AvisoVencimento.tsx << 'EOF'
'use client';

import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AvisoVencimento() {
  const router = useRouter();
  const [mostrarAviso, setMostrarAviso] = useState(false);
  const [tipoAviso, setTipoAviso] = useState<'10' | '5' | '3' | '1' | 'vencido' | null>(null);
  const [diasRestantes, setDiasRestantes] = useState(0);

  useEffect(() => {
    const buscarVencimento = async () => {
      try {
        const contaId = localStorage.getItem('conta_id');
        if (!contaId) return;

        const { data: assinatura } = await supabase
          .from('assinaturas')
          .select('data_vencimento')
          .eq('conta_id', contaId)
          .single();

        if (!assinatura?.data_vencimento) return;

        const hoje = new Date();
        const vencimento = new Date(assinatura.data_vencimento);
        const dias = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        setDiasRestantes(dias);

                if (dias <= 0) {
          setTipoAviso('vencido');
          setMostrarAviso(true);
        } else if (dias <= 1) {
          setTipoAviso('1');
          setMostrarAviso(true);
        } else if (dias <= 3) {
          setTipoAviso('3');
          setMostrarAviso(true);
        } else if (dias <= 5) {
          setTipoAviso('5');
          setMostrarAviso(true);
        } else if (dias <= 10) {
          setTipoAviso('10');
          setMostrarAviso(true);
        }
      } catch (err) {
        console.error('Erro ao buscar vencimento:', err);
      }
    };

    buscarVencimento();
  }, []);

  const handleRenovar = () => {
    router.push('/planos');
  };

  if (!mostrarAviso) return null;

  if (tipoAviso === 'vencido') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">🔴 PLANO VENCIDO</h2>
          <p className="text-gray-700 mb-6">Seu plano venceu. Renove agora para continuar usando.</p>
          <button
            onClick={handleRenovar}
            className="w-full bg-red-600 text-white px-6 py-3 rounded font-bold hover:bg-red-700"
          >
            Renovar Plano
          </button>
        </div>
      </div>
    );
  }

  const avisos: Record<string, { titulo: string; cor: string }> = {
    '1': { titulo: '🔴 URGENTE: Vence Amanhã', cor: 'bg-red-600' },
    '3': { titulo: '🟡 ATENÇÃO: Vence em 3 Dias', cor: 'bg-yellow-500' },
    '5': { titulo: '🔵 AVISO: Vence em 5 Dias', cor: 'bg-blue-500' },
    '10': { titulo: '🔵 INFO: Vence em 10 Dias', cor: 'bg-blue-400' },
  };

  const aviso = avisos[tipoAviso || ''];
  if (!aviso) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 ${aviso.cor} text-white p-4 flex justify-between items-center z-50 shadow-lg`}>
      <div>
        <p className="font-bold">{aviso.titulo}</p>
        <p className="text-sm">{diasRestantes} dias restantes</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setMostrarAviso(false)}
          className="bg-white text-gray-800 px-4 py-2 rounded font-bold hover:bg-gray-100"
        >
          Descartar
        </button>
        <button
          onClick={handleRenovar}
          className="bg-white text-gray-800 px-4 py-2 rounded font-bold hover:bg-gray-100"
        >
          Renovar
        </button>
      </div>
    </div>
  );
}
EOF
