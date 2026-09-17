import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://rbocrgnmsadkbfoqbzpe.supabase.co',
  'sb_publishable_CXx1yNZ2C03bTuNpeDUNsQ_k4JHv9Vm'
);

export const getDataBrasil = () => {
  const agora = new Date();
  const offset = agora.getTimezoneOffset() * 60000;
  const dataBrasil = new Date(agora.getTime() - offset);
  return dataBrasil.toISOString().split('T')[0];
};
