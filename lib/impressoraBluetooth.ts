// Impressão direta em impressora térmica Bluetooth (BLE) via Web Bluetooth + ESC/POS.
// Funciona no Chrome/Edge para Android (inclusive no PWA). Safari/iOS não suporta Web Bluetooth.
import { formatarDataHoraBrasil } from '@/lib/supabase';

// Serviços BLE mais comuns em impressoras térmicas genéricas (MTP, PT-210, RPP, Goojprt, KP...).
// Precisam ser declarados no requestDevice, senão o Chrome bloqueia o acesso a eles.
const SERVICOS_IMPRESSORA: (number | string)[] = [
  0x18f0,
  0xff00,
  0xffe0,
  0xfee7,
  0xae30,
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
];

const CHAVE_IMPRESSORA = 'impressora_conectada';
const LARGURA = 32; // colunas da fonte padrão em bobina de 58mm
const TAMANHO_PACOTE = 20; // cabe no MTU mínimo do BLE

type Impressora = { device: any; caracteristica: any };

// Mantém a conexão viva enquanto o app estiver aberto, para não pedir a impressora a cada nota
let impressoraAtual: Impressora | null = null;

export const bluetoothDisponivel = () =>
  typeof navigator !== 'undefined' && !!(navigator as any).bluetooth;

const acharCaracteristicaEscrita = async (server: any) => {
  for (const uuid of SERVICOS_IMPRESSORA) {
    let servico;
    try {
      servico = await server.getPrimaryService(uuid);
    } catch {
      continue;
    }
    const caracteristicas = await servico.getCharacteristics();
    const escrita = caracteristicas.find(
      (c: any) => c.properties.write || c.properties.writeWithoutResponse
    );
    if (escrita) return escrita;
  }
  throw new Error('Impressora sem serviço de impressão BLE compatível.');
};

const conectarDevice = async (device: any): Promise<Impressora> => {
  const server = device.gatt.connected ? device.gatt : await device.gatt.connect();
  const caracteristica = await acharCaracteristicaEscrita(server);
  impressoraAtual = { device, caracteristica };
  localStorage.setItem(CHAVE_IMPRESSORA, JSON.stringify({ name: device.name || 'Impressora', id: device.id }));
  return impressoraAtual;
};

// Abre o seletor do Chrome. Precisa ser chamado a partir de um clique do usuário.
export const escolherImpressora = async (): Promise<Impressora> => {
  if (!bluetoothDisponivel()) {
    throw new Error('Seu navegador não suporta Bluetooth. Use o Chrome no Android.');
  }
  const device = await (navigator as any).bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: SERVICOS_IMPRESSORA,
  });
  return conectarDevice(device);
};

// Reaproveita a impressora já conectada; se a conexão caiu, tenta reconectar sem abrir o seletor
const obterImpressora = async (): Promise<Impressora> => {
  if (impressoraAtual) {
    try {
      return await conectarDevice(impressoraAtual.device);
    } catch {
      impressoraAtual = null;
    }
  }

  const bt = (navigator as any).bluetooth;
  const salva = JSON.parse(localStorage.getItem(CHAVE_IMPRESSORA) || 'null');
  if (salva?.id && typeof bt.getDevices === 'function') {
    try {
      const devices = await bt.getDevices();
      const device = devices.find((d: any) => d.id === salva.id);
      if (device) return await conectarDevice(device);
    } catch {
      // segue para o seletor
    }
  }

  return escolherImpressora();
};

const enviar = async ({ caracteristica }: Impressora, dados: Uint8Array) => {
  const comResposta = caracteristica.properties.write;
  for (let i = 0; i < dados.length; i += TAMANHO_PACOTE) {
    const pacote = dados.slice(i, i + TAMANHO_PACOTE);
    if (comResposta) {
      await caracteristica.writeValue(pacote);
    } else {
      await caracteristica.writeValueWithoutResponse(pacote);
      await new Promise((r) => setTimeout(r, 15));
    }
  }
};

// --- ESC/POS ---

const ESC = 0x1b;
const GS = 0x1d;
const CMD = {
  iniciar: [ESC, 0x40],
  esquerda: [ESC, 0x61, 0],
  centro: [ESC, 0x61, 1],
  negritoOn: [ESC, 0x45, 1],
  negritoOff: [ESC, 0x45, 0],
  tamanhoDuplo: [GS, 0x21, 0x11],
  tamanhoNormal: [GS, 0x21, 0x00],
  avancar: (linhas: number) => [ESC, 0x64, linhas],
  cortar: [GS, 0x56, 0x42, 0x00],
};

// TextEncoder gera UTF-8, que as térmicas não entendem para acentos: imprime sem acento
const semAcento = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e]/g, '');

const moeda = (valor: number) => (valor || 0).toFixed(2).replace('.', ',');

const linhaDuasColunas = (esquerda: string, direita: string) => {
  const espaco = LARGURA - direita.length - 1;
  const texto = esquerda.length > espaco ? esquerda.slice(0, espaco) : esquerda;
  return texto + ' '.repeat(LARGURA - texto.length - direita.length) + direita;
};

export const gerarEscPosNota = (nota: any): Uint8Array => {
  const encoder = new TextEncoder();
  const partes: number[] = [];
  const cmd = (bytes: number[]) => partes.push(...bytes);
  const texto = (t: string) => partes.push(...encoder.encode(semAcento(t) + '\n'));
  const separador = () => texto('-'.repeat(LARGURA));

  cmd(CMD.iniciar);
  cmd(CMD.centro);
  cmd(CMD.negritoOn);
  cmd(CMD.tamanhoDuplo);
  texto('MEU CAIXA');
  cmd(CMD.tamanhoNormal);
  texto(`Nota #${String(nota.numero_nota).padStart(4, '0')}`);
  cmd(CMD.negritoOff);
  texto(nota.cliente_nome || 'Cliente');
  texto(formatarDataHoraBrasil(nota.created_at));

  cmd(CMD.esquerda);
  separador();
  texto(linhaDuasColunas('Item', 'Valor'));
  separador();
  (Array.isArray(nota.itens) ? nota.itens : []).forEach((item: any) => {
    const quantidade = item.quantidade || 1;
    texto(linhaDuasColunas(`${quantidade}x ${item.nome || 'Item'}`, moeda(quantidade * (item.preco || 0))));
  });
  separador();

  cmd(CMD.centro);
  cmd(CMD.negritoOn);
  cmd(CMD.tamanhoDuplo);
  texto(`TOTAL R$ ${moeda(nota.total_valor)}`);
  cmd(CMD.tamanhoNormal);
  cmd(CMD.negritoOff);

  // Espaço para assinatura
  cmd(CMD.avancar(3));
  texto('________________________');
  texto('Assinatura do Cliente');

  cmd(CMD.avancar(4));
  cmd(CMD.cortar);

  return new Uint8Array(partes);
};

export const imprimirNotaBluetooth = async (nota: any) => {
  const impressora = await obterImpressora();
  await enviar(impressora, gerarEscPosNota(nota));
  return impressora.device.name || 'Impressora';
};
