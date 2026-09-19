'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';

interface NavigatorWithBluetooth extends Navigator {
  bluetooth?: {
    requestDevice(options: any): Promise<any>;
  };
}

const getDataBrasil = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

const getHoraBrasil = () => {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
};

export default function NotasFiado() {
  const [notas, setNotas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [contaId, setContaId] = useState<number | null>(null);
  const [impressoraConectada, setImpressoraConectada] = useState<any | null>(null);
  const [mensagemImpressora, setMensagemImpressora] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [mostrandoPreview, setMostrandoPreview] = useState(false);
  const [notaSelecionada, setNotaSelecionada] = useState<any | null>(null);

  useEffect(() => {
    const conta = localStorage.getItem('conta_id');
    if (conta) {
      setContaId(parseInt(conta));
      carregarNotas(parseInt(conta));
    }

    const impressora = localStorage.getItem('impressora_conectada');
    if (impressora) {
      try {
        setImpressoraConectada(JSON.parse(impressora));
      } catch (e) {
        console.error('Erro ao carregar impressora:', e);
      }
    }
  }, []);

  const carregarNotas = async (cId: number) => {
    try {
      const { data, error } = await supabase
        .from('notas_fiados')
        .select('*')
        .eq('conta_id', cId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotas(data || []);
    } catch (err) {
      console.error('Erro ao carregar notas:', err);
    }
    setCarregando(false);
  };

  const gerarNotaPDF = (nota: any, assinatura?: string) => {
    const itens = nota.itens || [];
    const numItens = Array.isArray(itens) ? itens.length : 0;
    const alturaItem = 5;
    const alturaBase = 60;
    const alturaAssinatura = 35;
    const alturaTotal = alturaBase + (numItens * alturaItem) + alturaAssinatura;

    const doc: any = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [52, alturaTotal]
    });

    let yPos = 10;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('MEU CAIXA', pageWidth / 2, yPos, { align: 'center' } as any);
    yPos += 5;

    doc.setFontSize(10);
    doc.text(`Nota #${String(nota.numero_nota).padStart(4, '0')}`, pageWidth / 2, yPos, { align: 'center' } as any);
    yPos += 5;

    doc.text(nota.cliente_nome || 'Cliente', pageWidth / 2, yPos, { align: 'center' } as any);
    yPos += 5;

    const dataNota = new Date(nota.created_at);
    doc.setFontSize(9);
    doc.text(dataNota.toLocaleDateString('pt-BR') + ' ' + dataNota.toLocaleTimeString('pt-BR'), pageWidth / 2, yPos, { align: 'center' } as any);
    yPos += 5;

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setDrawColor(0);
    doc.line(3, yPos, pageWidth - 3, yPos);
    yPos += 3;

    doc.text('Item', 5, yPos);
    doc.text('Valor', pageWidth - 5, yPos, { align: 'right' } as any);
    yPos += 3;

    doc.setDrawColor(0);
    doc.line(3, yPos, pageWidth - 3, yPos);
    yPos += 4;

    doc.setFontSize(8);
    if (Array.isArray(itens)) {
      itens.forEach((item: any) => {
        const nomeItem = item.nome ? item.nome.substring(0, 20) : 'Item';
        const valor = `${item.preco ? item.preco.toFixed(2).replace('.', ',') : '0,00'}`;
        doc.text(nomeItem, 5, yPos);
        doc.text(valor, pageWidth - 5, yPos, { align: 'right' } as any);
        yPos += 5;
      });
    }

    yPos += 0;
    doc.setDrawColor(0);
    doc.line(3, yPos, pageWidth - 3, yPos);
    yPos += 5;

    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    const totalTexto = `TOTAL R$ ${nota.total_valor.toFixed(2).replace('.', ',')}`;
    doc.text(totalTexto, pageWidth / 2, yPos, { align: 'center' } as any);
    yPos += 10;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);

    yPos += 5;

    if (assinatura && assinatura.startsWith('data:')) {
      try {
        doc.addImage(assinatura, 'PNG', 8, yPos, pageWidth - 16, 8);
        yPos += 9;
      } catch (e) {
        console.warn('Erro ao adicionar assinatura ao PDF:', e);
        yPos += 8;
      }
    } else {
      yPos += 8;
    }

    doc.setDrawColor(0);
    doc.line(10, yPos, pageWidth - 10, yPos);
    yPos += 3;
    doc.setFontSize(7);
    doc.text('Assinatura do Cliente', pageWidth / 2, yPos, { align: 'center' } as any);
    yPos += 4;

    return doc;
  };

  const handleImprimir = (nota: any, assinatura?: string) => {
    const doc = gerarNotaPDF(nota, assinatura);
    const url = doc.output('dataurlstring');
    setPdfUrl(url);
    setNotaSelecionada(nota);
    setMostrandoPreview(true);
  };

  if (carregando) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Carregando...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-4xl">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar
        </Link>

        {impressoraConectada && (
          <div className="bg-green-100 border-l-4 border-green-600 p-3 mb-4 text-green-800 text-sm">
            🖨️ Impressora conectada: {impressoraConectada.name}
          </div>
        )}

        {mensagemImpressora && (
          <div className="bg-blue-100 border-l-4 border-blue-600 p-3 mb-4 text-blue-800 text-sm">
            {mensagemImpressora}
          </div>
        )}

        <h1 className="text-3xl font-bold mb-2">Notas de Fiado</h1>
        <p className="text-gray-600 mb-6">Histórico de notas de fiado geradas</p>

        {notas.length === 0 ? (
          <p className="text-gray-500 text-center">Nenhuma nota gerada ainda</p>
        ) : (
          <div className="space-y-3">
            {notas.map((nota) => (
              <div key={nota.id} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-orange-600">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-bold text-lg">Nota #{String(nota.numero_nota).padStart(4, '0')}</p>
                    <p className="text-sm text-gray-600">Cliente: {nota.cliente_nome || 'N/A'}</p>
                    <p className="text-sm text-gray-600">
                      Data: {new Date(nota.created_at).toLocaleDateString('pt-BR')} {new Date(nota.created_at).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">R$ {nota.total_valor.toFixed(2).replace('.', ',')}</p>
                    <button
                      onClick={() => handleImprimir(nota)}
                      className="bg-blue-100 text-blue-600 border border-blue-300 px-4 py-2 rounded font-bold hover:bg-blue-200 text-sm mt-2"
                    >
                      {impressoraConectada ? '🖨️ Imprimir' : 'Imprimir'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {mostrandoPreview && pdfUrl && notaSelecionada && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm max-h-screen overflow-auto">
              <h2 className="text-2xl font-bold mb-4">Nota #{String(notaSelecionada.numero_nota).padStart(4, '0')}</h2>
              <div className="flex justify-center mb-4">
                <iframe src={pdfUrl} className="w-52 h-96 border-2 border-gray-300 rounded" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { window.print(); }} className="flex-1 bg-blue-100 text-blue-600 border border-blue-300 p-3 rounded font-bold hover:bg-blue-200">Imprimir</button>
                <button onClick={() => { setMostrandoPreview(false); setPdfUrl(''); setNotaSelecionada(null); }} className="flex-1 bg-gray-100 text-gray-600 border border-gray-300 p-3 rounded font-bold hover:bg-gray-200">Fechar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
