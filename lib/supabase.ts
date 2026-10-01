import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://rbocrgnmsadkbfoqbzpe.supabase.co',
  'sb_publishable_CXx1yNZ2C03bTuNpeDUNsQ_k4JHv9Vm'
);

const FUSO_BRASIL = 'America/Sao_Paulo';

// Data de hoje em Brasília no formato YYYY-MM-DD, independente do fuso do aparelho/servidor
export const getDataBrasil = () => {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO_BRASIL }).format(new Date());
};

// Hora atual em Brasília no formato HH:MM:SS
export const getHoraBrasil = () => {
  return new Date().toLocaleTimeString('pt-BR', { timeZone: FUSO_BRASIL });
};

// Colunas `timestamp` sem fuso (ex: notas_fiados.created_at) guardam UTC sem o "Z";
// sem ele o navegador leria como horário local e mostraria 3h a mais.
const lerDataBanco = (valor: string | Date) => {
  if (valor instanceof Date) return valor;
  const temFuso = /(Z|[+-]\d{2}:?\d{2})$/.test(valor);
  return new Date(temFuso ? valor : `${valor}Z`);
};

// "DD/MM/AAAA HH:MM:SS" em Brasília
export const formatarDataHoraBrasil = (valor: string | Date) => {
  const data = lerDataBanco(valor);
  return data.toLocaleDateString('pt-BR', { timeZone: FUSO_BRASIL }) + ' ' +
    data.toLocaleTimeString('pt-BR', { timeZone: FUSO_BRASIL });
};
