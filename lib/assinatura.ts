import { supabase, getDataBrasil } from '@/lib/supabase';

// Mesmos IDs usados em app/dashboard/page.tsx e app/_components/PlanosCadastro.tsx
const PLANOS_PESSOAIS_IDS = [4, 5];

// Conta administradora (ver app/dashboard/page.tsx): nunca é bloqueada
const CONTA_ADMIN_ID = 4;

// Páginas que não exigem assinatura em dia
export const ROTAS_PUBLICAS = ['/', '/login', '/planos', '/planospessoais', '/plano-expirado', '/renovacao'];

export type SituacaoAssinatura = {
  expirada: boolean;
  diasRestantes: number | null; // 0 = vence hoje
  destino: '/planos' | '/planospessoais';
};

// data_vencimento vem como timestamp sem fuso ("2026-10-01T00:00:00" ou "2026-10-14T23:14:15.638");
// o dia gravado é o último dia de acesso.
const diasAte = (dataVencimento: string) => {
  const venc = Date.parse(dataVencimento.slice(0, 10) + 'T00:00:00Z');
  const hoje = Date.parse(getDataBrasil() + 'T00:00:00Z');
  return Math.round((venc - hoje) / 86400000);
};

export const verificarAssinatura = async (contaId: number): Promise<SituacaoAssinatura> => {
  const [{ data: conta }, { data: assinatura }] = await Promise.all([
    supabase.from('contas').select('plano_id').eq('id', contaId).single(),
    supabase.from('assinaturas').select('data_vencimento').eq('conta_id', contaId).single(),
  ]);

  const destino = PLANOS_PESSOAIS_IDS.includes(conta?.plano_id) ? '/planospessoais' : '/planos';

  if (contaId === CONTA_ADMIN_ID || !assinatura?.data_vencimento) {
    return { expirada: false, diasRestantes: null, destino };
  }

  const diasRestantes = diasAte(assinatura.data_vencimento);
  // Acesso liberado durante todo o dia do vencimento; bloqueio só a partir do dia seguinte
  return { expirada: diasRestantes < 0, diasRestantes, destino };
};
