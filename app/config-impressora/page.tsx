'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BluetoothDevice {
  name: string;
  id: string;
}

interface NavigatorWithBluetooth extends Navigator {
  bluetooth?: {
    requestDevice(options: any): Promise<any>;
  };
}

export default function ConfigImpressora() {
  const [impressoras, setImpressoras] = useState<BluetoothDevice[]>([]);
  const [impressoraConectada, setImpressoraConectada] = useState<BluetoothDevice | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    // Carregar impressora salva ao iniciar
    const salva = localStorage.getItem('impressora_conectada');
    if (salva) {
      try {
        setImpressoraConectada(JSON.parse(salva));
      } catch (e) {
        console.error('Erro ao carregar impressora salva:', e);
      }
    }
  }, []);

  const buscarImpressoras = async () => {
    setCarregando(true);
    setMensagem('');
    setErro('');

    try {
      const nav = navigator as NavigatorWithBluetooth;
      
      // Verifica se o navegador suporta Web Bluetooth API
      if (!nav.bluetooth) {
        throw new Error('Seu navegador não suporta Bluetooth. Use Chrome/Edge no Android.');
      }

      // Solicita dispositivo Bluetooth
      const device = await nav.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'KA-' },
          { namePrefix: 'Thermal' },
          { namePrefix: 'PRINTER' },
          { namePrefix: 'ESC' },
        ],
        optionalServices: ['serial', 'device_information'],
      });

      if (device) {
        const novaImpressora: BluetoothDevice = {
          name: device.name || 'Impressora Desconhecida',
          id: device.id,
        };

        // Salva no localStorage
        localStorage.setItem('impressora_conectada', JSON.stringify(novaImpressora));
        setImpressoraConectada(novaImpressora);
        setMensagem(`✅ Impressora conectada: ${novaImpressora.name}`);
      }
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        setErro('Nenhuma impressora Bluetooth encontrada. Verifique se está ligada e próxima.');
      } else if (err.name === 'NotAllowedError') {
        setErro('Você cancelou a busca de impressora.');
      } else {
        setErro(`Erro: ${err.message}`);
      }
    }

    setCarregando(false);
  };

  const desconectar = () => {
    localStorage.removeItem('impressora_conectada');
    setImpressoraConectada(null);
    setMensagem('');
    setErro('');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-md">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-2">Configurar Impressora</h1>
          <p className="text-gray-600 mb-6">Configure sua impressora Bluetooth térmica</p>

          {/* Status Atual */}
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
            {impressoraConectada ? (
              <div>
                <p className="font-bold text-green-700">✅ Impressora Conectada</p>
                <p className="text-gray-700">{impressoraConectada.name}</p>
                <p className="text-xs text-gray-500 mt-1">ID: {impressoraConectada.id}</p>
              </div>
            ) : (
              <p className="text-gray-600">❌ Nenhuma impressora conectada</p>
            )}
          </div>

          {/* Mensagens */}
          {mensagem && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {mensagem}
            </div>
          )}

          {erro && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {erro}
            </div>
          )}

          {/* Botões */}
          <div className="flex flex-col gap-3">
            <button
              onClick={buscarImpressoras}
              disabled={carregando}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {carregando ? 'Buscando...' : '🔍 Conectar Impressora'}
            </button>

            {impressoraConectada && (
              <button
                onClick={desconectar}
                className="w-full bg-red-100 text-red-600 border border-red-300 py-3 rounded-lg font-bold hover:bg-red-200"
              >
                ❌ Desconectar
              </button>
            )}
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded text-xs text-gray-600">
            <p className="font-bold mb-2">ℹ️ Como usar:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Clique em "Conectar Impressora"</li>
              <li>Escolha sua impressora Bluetooth</li>
              <li>Pronto! Ficará salva automaticamente</li>
              <li>Próximas vezes: já estará conectada</li>
            </ol>
          </div>

          {/* Nota Importante */}
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            <p className="font-bold">⚠️ Importante:</p>
            <p>Funciona apenas no Android com Chrome/Edge. A impressora deve estar ligada e próxima do celular.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
