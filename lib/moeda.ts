// Padrão brasileiro de valores monetários: vírgula decimal e ponto de milhar (1.234,50).

// 1234.5 -> "1.234,50" (sem o "R$", que as telas escrevem antes do valor)
export const formatarMoeda = (valor: number | string | null | undefined) => {
  const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
  return (Number.isFinite(numero) ? (numero as number) : 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Converte o que o usuário digitou para número. Aceita "10,50", "1.234,50", "10" e também "10.50".
// Retorna NaN se não for um valor válido.
export const lerMoeda = (texto: string | number | null | undefined) => {
  if (typeof texto === 'number') return texto;
  let limpo = (texto || '').replace(/[R$\s]/g, '');
  if (!/^[\d.,]+$/.test(limpo)) return NaN;
  if ((limpo.match(/,/g) || []).length > 1) return NaN;

  if (limpo.includes(',')) {
    // vírgula é o decimal; pontos são milhar
    limpo = limpo.replace(/\./g, '').replace(',', '.');
  } else {
    const partes = limpo.split('.');
    // "1.500" ou "1.234.567": pontos de milhar. "10.5" / "10.50": ponto decimal.
    if (partes.length > 2 || (partes.length === 2 && partes[1].length === 3)) {
      limpo = partes.join('');
    }
  }

  const numero = parseFloat(limpo);
  return Number.isFinite(numero) ? Math.round(numero * 100) / 100 : NaN;
};

// Para preencher um campo de edição com um valor salvo: 10.5 -> "10,50"
export const moedaParaCampo = (valor: number | string | null | undefined) =>
  valor === null || valor === undefined || valor === '' ? '' : formatarMoeda(valor);

// Mantém só caracteres válidos enquanto o usuário digita
export const filtrarDigitacaoMoeda = (texto: string) => texto.replace(/[^\d.,]/g, '');
