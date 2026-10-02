// Formas de pagamento gravadas em transacoes.formapagamento.
// Formato oficial: maiúsculas, com acento em CARTÃO (é como os registros já estão no banco).
export const PIX = 'PIX';
export const DINHEIRO = 'DINHEIRO';
export const CARTAO = 'CARTÃO';
export const FIADO = 'FIADO';

// Formas que representam dinheiro recebido (FIADO fica de fora: ainda não foi pago)
export const FORMAS_RECEBIMENTO = [PIX, DINHEIRO, CARTAO];

// Aceita variações ("CARTAO", "cartão", " Cartao ") e devolve o formato oficial,
// para que Caixa e Relatórios reconheçam o pagamento venha de onde vier.
export const normalizarFormaPagamento = (forma: string | null | undefined) => {
  const chave = (forma || '').trim().toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (chave === 'CARTAO') return CARTAO;
  if (chave === 'PIX') return PIX;
  if (chave === 'DINHEIRO') return DINHEIRO;
  if (chave === 'FIADO') return FIADO;
  return (forma || '').trim();
};
