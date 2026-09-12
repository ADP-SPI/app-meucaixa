'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import SignatureCanvas from 'react-signature-canvas';
import jsPDF from 'jspdf';

const getDataBrasil = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

export default function Comanda() {
  const router = useRouter();
  const sigCanvas = useRef<any>(null);
  const printRef = useRef<any>(null);
  const [cardapio, setCardapio] = useState<any[]>([]);
  const [modo, setModo] = useState('cardapio');
  const [comandas, setComandas] = useState<any[]>([]);
  const [abrindoComanda, setAbrindoComanda] = useState(false);
  const [nomeComanda, setNomeComanda] = useState('');
  const [itemRapido, setItemRapido] = useState('');
  const [precoRapido, setPrecoRapido] = useState('');
  const [modalAberto, setModalAberto] = useState<number | null>(null);
  const [fechando, setFechando] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState('PIX');
  const [contaId, setContaId] = useState<number | null>(null);
  const [notaGerada, setNotaGerada] = useState<any | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [mostrandoOpcoeNota, setMostrandoOpcoeNota] = useState(false);
  const [mostrandoAssinatura, setMostrandoAssinatura] = useState(false);
  const [mostrandoPreview, setMostrandoPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');

  useEffect(() => {
    const conta = localStorage.getItem('conta_id');
    if (conta) {
      setContaId(parseInt(conta));
      carregarDados(parseInt(conta));
    }
  }, []);

  const carregarDados = async (cId: number) => {
    try {
      const { data: cardapioData } = await supabase
        .from('cardapio')
        .select('*')
        .eq('conta_id', cId);
      const { data: comandasData } = await supabase
        .from('comandas')
        .select('*')
        .eq('conta_id', cId)
        .order('created_at', { ascending: false });
      setCardapio(cardapioData || []);
      setComandas(comandasData || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
    setCarregando(false);
  };

  const gerarNumeroNota = async (cId: number) => {
    try {
      const { data } = await supabase
        .from('notas_fiados')
        .select('numero_nota')
        .eq('conta_id', cId)
        .order('numero_nota', { ascending: false })
        .limit(1);
      
      const ultimoNumero = data && data.length > 0 ? data[0].numero_nota : 0;
      return (ultimoNumero + 1) % 10000;
    } catch {
      return Math.floor(Math.random() * 10000);
    }
  };

  const gerarNotaPDF = (notaData: any, assinatura?: string) => {
    const numItens = (notaData.itens || []).length;
    const alturaItem = 5;
    const alturaBase = 60;
    const alturaTotal = alturaBase + (numItens * alturaItem) + 15;

    const doc: any = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [48, alturaTotal]
    });

    let yPos = 10;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('MEU CAIXA', pageWidth / 2, yPos, { align: 'center' } as any);
    yPos += 8;

    doc.setFontSize(10);
    doc.text(`Nota #${String(notaData.numero).padStart(4, '0')}`, pageWidth / 2, yPos, { align: 'center' } as any);
    yPos += 6;

    doc.text(notaData.comanda, pageWidth / 2, yPos, { align: 'center' } as any);
    yPos += 6;

    const agora = new Date();
    doc.setFontSize(9);
    doc.text(agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR'), pageWidth / 2, yPos, { align: 'center' } as any);
    yPos += 10;

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Item', 5, yPos);
    doc.text('Total', pageWidth - 5, yPos, { align: 'right' } as any);
    yPos += 3;
    doc.setDrawColor(0);
    doc.line(3, yPos, pageWidth - 3, yPos);
    yPos += 5;

    doc.setFontSize(9);
    (notaData.itens || []).forEach((item: any) => {
      const nomeItem = item.nome.substring(0, 20);
      const valor = `${(item.quantidade * item.preco).toFixed(2).replace('.', ',')}`;
      doc.text(nomeItem, 5, yPos);
      doc.text(valor, pageWidth - 5, yPos, { align: 'right' } as any);
      yPos += 5;
    });

    yPos += 2;
    doc.setDrawColor(0);
    doc.line(3, yPos, pageWidth - 3, yPos);
    yPos += 5;

    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    const totalTexto = `TOTAL R$ ${notaData.subtotal.toFixed(2).replace('.', ',')}`;
    doc.text(totalTexto, pageWidth / 2, yPos, { align: 'center' } as any);
    yPos += 8;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.line(10, yPos, pageWidth - 10, yPos);
    yPos += 5;
    doc.text('Assinatura do Cliente', pageWidth / 2, yPos, { align: 'center' } as any);
    yPos += 8;

    if (assinatura) {
      doc.addImage(assinatura, 'PNG', 5, yPos, pageWidth - 10, 12);
    }

    return doc;
  };

  const salvarNotaSupabase = async (notaData: any, doc: any, assinatura?: string) => {
    try {
      const pdfBlob = doc.output('blob');
      const nomeArquivo = `nota_${notaData.numero}_${Date.now()}.pdf`;
      
      const { error: uploadError } = await supabase.storage
        .from('notas-fiados')
        .upload(nomeArquivo, pdfBlob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload falhou:', uploadError);
        return false;
      }

      const dataExpiracao = new Date();
      dataExpiracao.setDate(dataExpiracao.getDate() + 5);

      const { error: updateError } = await supabase
        .from('notas_fiados')
        .update({ 
          arquivo_nome: nomeArquivo,
          assinatura_digital: assinatura || null,
          data_expiracao: dataExpiracao.toISOString()
        })
        .eq('id', notaData.id);

      if (updateError) {
        console.error('Update falhou:', updateError);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Erro:', err);
      return false;
    }
  };

  const criarComanda = async () => {
    if (!nomeComanda.trim() || !contaId) return;
    try {
      const { error } = await supabase
        .from('comandas')
        .insert([{
          conta_id: contaId,
          nome: nomeComanda,
          itens: [],
          data: getDataBrasil(),
          hora: new Date().toLocaleTimeString('pt-BR')
        }]);
      if (error) throw error;
      setNomeComanda('');
      setAbrindoComanda(false);
      carregarDados(contaId);
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao criar comanda');
    }
  };

  const adicionarItem = async (comandaId: number, item: any) => {
    const comanda = comandas.find(c => c.id === comandaId);
    if (!comanda) return;
    const itensAtualizados = [
      ...(comanda.itens || []),
      {
        id: Date.now(),
        nome: item.nome || itemRapido,
        preco: item.preco || parseFloat(precoRapido),
        quantidade: 1
      }
    ];
    try {
      const { error } = await supabase
        .from('comandas')
        .update({ itens: itensAtualizados })
        .eq('id', comandaId);
      if (error) throw error;
      setItemRapido('');
      setPrecoRapido('');
      carregarDados(contaId!);
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao adicionar item');
    }
  };

  const removerItem = async (comandaId: number, itemId: number) => {
    const comanda = comandas.find(c => c.id === comandaId);
    if (!comanda) return;
    const itensAtualizados = (comanda.itens || []).filter((item: any) => item.id !== itemId);
    try {
      await supabase
        .from('comandas')
        .update({ itens: itensAtualizados })
        .eq('id', comandaId);
      carregarDados(contaId!);
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao remover item');
    }
  };

  const calcularSubtotal = (comandaId: number) => {
    const comanda = comandas.find(c => c.id === comandaId);
    if (!comanda || !comanda.itens) return 0;
    return comanda.itens.reduce((total: number, item: any) => total + (item.quantidade * item.preco), 0);
  };

  const fecharComanda = async (comandaId: number) => {
    const subtotal = calcularSubtotal(comandaId);
    const comanda = comandas.find(c => c.id === comandaId);
    if (subtotal === 0 || !comanda || !contaId) return;

    try {
      if (formaPagamento === 'FIADO') {
        const numeroNota = await gerarNumeroNota(contaId);

        const dataExpiracao = new Date();
        dataExpiracao.setDate(dataExpiracao.getDate() + 5);

        const { data: notaData } = await supabase
          .from('notas_fiados')
          .insert([{
            conta_id: contaId,
            numero_nota: numeroNota,
            cliente_nome: comanda.nome,
            itens: comanda.itens || [],
            total_valor: subtotal,
            status: 'aberta',
            data_expiracao: dataExpiracao.toISOString()
          }])
          .select();

        await supabase
          .from('transacoes')
          .insert([{
            conta_id: contaId,
            descricao: `Fiado: ${comanda.nome}`,
            valor: subtotal,
            tipo: 'receita',
            formapagamento: 'FIADO',
            hora: new Date().toLocaleTimeString('pt-BR'),
            data: getDataBrasil(),
            origin: 'comanda',
            itens: comanda.itens || []
          }]);

        await supabase
          .from('comandas')
          .delete()
          .eq('id', comandaId);
        
        setNotaGerada({
          id: notaData?.[0]?.id || 0,
          numero: numeroNota,
          comanda: comanda.nome,
          subtotal: subtotal,
          itens: comanda.itens || []
        });
        setMostrandoOpcoeNota(true);
        setModalAberto(null);
        setFechando(false);
      } else {

        await supabase
          .from('transacoes')
          .insert([{
            conta_id: contaId,
            descricao: `Comanda: ${comanda.nome}`,
            valor: subtotal,
            tipo: 'receita',
            formapagamento: formaPagamento,
            hora: new Date().toLocaleTimeString('pt-BR'),
            data: getDataBrasil(),
            origin: 'comanda',
            itens: comanda.itens || []
          }]);

        await supabase
          .from('comandas')
          .delete()
          .eq('id', comandaId);

        setModalAberto(null);
        setFechando(false);
      }
      setFormaPagamento('PIX');
      carregarDados(contaId);
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao fechar comanda');
    }
  };

  const deletarComanda = async (comandaId: number) => {
    try {
      await supabase
        .from('comandas')
        .delete()
        .eq('id', comandaId);
      setModalAberto(null);
      carregarDados(contaId!);
    } catch (err) {
      console.error('Erro:', err);
      alert('Erro ao deletar comanda');
    }
  };

  if (carregando) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Carregando...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-6xl">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          Voltar
        </Link>
        <h1 className="text-2xl font-bold mb-6">Comanda / Orcamento / Pedido</h1>
        <div className="mb-6">
          <label className="block text-sm font-bold mb-2">Modo de Operacao</label>
          <select value={modo} onChange={(e) => setModo(e.target.value)} className="w-full border border-gray-300 p-2 rounded">
            <option value="cardapio">Usar Cardapio</option>
            <option value="rapido">Modo Rapido (digitar)</option>
          </select>
        </div>
        {!abrindoComanda && modalAberto === null && (
          <button onClick={() => setAbrindoComanda(true)} className="w-full bg-green-600 text-white p-4 rounded font-bold hover:bg-green-700 mb-6">
            + ABRIR COMANDA
          </button>
        )}
        {abrindoComanda && (
          <div className="bg-white rounded-lg p-4 mb-6 border-2 border-blue-200">
            <input type="text" placeholder="Nome do cliente" value={nomeComanda} onChange={(e) => setNomeComanda(e.target.value)} className="w-full border border-gray-300 p-2 rounded mb-3" />
            <div className="flex gap-2">
              <button onClick={criarComanda} className="flex-1 bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700">Criar</button>
              <button onClick={() => setAbrindoComanda(false)} className="flex-1 bg-gray-400 text-white p-2 rounded font-bold hover:bg-gray-500">Cancelar</button>
            </div>
          </div>
        )}
        <div className="space-y-2 mb-6">
          {comandas.map((comanda) => (
            <button key={comanda.id} onClick={() => setModalAberto(comanda.id)} className="w-full bg-white text-left p-4 rounded border-2 border-gray-200 hover:border-blue-600 transition">
              <p className="font-bold">{comanda.nome}</p>
              <p className="text-sm text-gray-600">{(comanda.itens || []).length} itens - R$ {calcularSubtotal(comanda.id).toFixed(2)}</p>
            </button>
          ))}
        </div>
        {modalAberto && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-screen overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">{comandas.find(c => c.id === modalAberto)?.nome}</h2>
              <div className="mb-4 flex-1">
                <h3 className="font-bold mb-2">Itens</h3>
                {(comandas.find(c => c.id === modalAberto)?.itens || []).length === 0 ? (
                  <p className="text-gray-500">Nenhum item</p>
                ) : (
                  <div className="space-y-2">
                    {(comandas.find(c => c.id === modalAberto)?.itens || []).map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                        <div>
                          <p className="font-bold">{item.nome}</p>
                          <p className="text-sm text-gray-600">{item.quantidade}x R$ {item.preco.toFixed(2)} = R$ {(item.quantidade * item.preco).toFixed(2)}</p>
                        </div>
                        <button onClick={() => removerItem(modalAberto, item.id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">X</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {modo === 'cardapio' && (
                <div className="mb-4">
                  <h3 className="font-bold mb-2">Adicionar do Cardapio</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {cardapio.map((item) => (
                      <button key={item.id} onClick={() => adicionarItem(modalAberto, item)} className="w-full text-left bg-blue-50 p-2 rounded hover:bg-blue-100 text-sm">
                        {item.nome} - R$ {item.preco.toFixed(2)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {modo === 'rapido' && (
                <div className="mb-4">
                  <h3 className="font-bold mb-2">Adicionar Rapido</h3>
                  <input type="text" placeholder="Nome do item" value={itemRapido} onChange={(e) => setItemRapido(e.target.value)} className="w-full border border-gray-300 p-2 rounded mb-2" />
                  <input type="number" placeholder="Preco" value={precoRapido} onChange={(e) => setPrecoRapido(e.target.value)} className="w-full border border-gray-300 p-2 rounded mb-2" />
                  <button onClick={() => adicionarItem(modalAberto, {})} className="w-full bg-blue-600 text-white p-2 rounded font-bold hover:bg-blue-700">Adicionar</button>
                </div>
              )}
              <div className="bg-blue-100 p-4 rounded-lg mb-4 text-center">
                <p className="text-sm text-gray-600">SUBTOTAL</p>
                <p className="text-3xl font-bold text-blue-600">R$ {calcularSubtotal(modalAberto).toFixed(2)}</p>
              </div>
              {!fechando && (
                <div className="flex gap-2">
                  <button onClick={() => setFechando(true)} className="flex-1 bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700">Fechar Comanda</button>
                  <button onClick={() => deletarComanda(modalAberto)} className="flex-1 bg-red-600 text-white p-3 rounded font-bold hover:bg-red-700">Excluir</button>
                  <button onClick={() => setModalAberto(null)} className="flex-1 bg-gray-400 text-white p-3 rounded font-bold hover:bg-gray-500">Voltar</button>
                </div>
              )}
              {fechando && (
                <div className="mb-4">
                  <label className="block text-sm font-bold mb-2">Forma de Pagamento</label>
                  <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className="w-full border border-gray-300 p-2 rounded mb-4">
                    <option>PIX</option>
                    <option>DINHEIRO</option>
                    <option>CARTAO</option>
                    <option>FIADO</option>
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => fecharComanda(modalAberto)} className="flex-1 bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700">Confirmar</button>
                    <button onClick={() => setFechando(false)} className="flex-1 bg-gray-400 text-white p-3 rounded font-bold hover:bg-gray-500">Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {notaGerada && mostrandoOpcoeNota && !mostrandoAssinatura && !mostrandoPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
              <h2 className="text-2xl font-bold text-green-600 mb-4">Nota #{String(notaGerada.numero).padStart(4, '0')} Gerada!</h2>
              <p className="text-gray-600 mb-2">Cliente: {notaGerada.comanda}</p>
              <p className="text-3xl font-bold text-green-600 mb-6">R$ {notaGerada.subtotal.toFixed(2)}</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setMostrandoAssinatura(true);
                  }}
                  className="w-full bg-purple-600 text-white p-3 rounded font-bold hover:bg-purple-700"
                >
                  Assinar na Tela
                </button>
                <button
                  onClick={async () => {
                    const doc = gerarNotaPDF(notaGerada);
                    const url = doc.output('dataurlstring');
                    setPdfUrl(url);
                    setMostrandoPreview(true);
                  }}
                  className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700"
                >
                  Imprimir Agora
                </button>
                <button
                  onClick={async () => {
                    const doc = gerarNotaPDF(notaGerada);
                    await salvarNotaSupabase(notaGerada, doc);
                    setNotaGerada(null);
                    setMostrandoOpcoeNota(false);
                  }}
                  className="w-full bg-gray-600 text-white p-3 rounded font-bold hover:bg-gray-700"
                >
                  Salvar Impressão
                </button>
              </div>
            </div>
          </div>
        )}
        {mostrandoPreview && pdfUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-auto">
              <h2 className="text-2xl font-bold mb-4">Preview Nota</h2>
              <iframe
                ref={printRef}
                src={pdfUrl}
                className="w-full h-96 border-2 border-gray-300 rounded mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const doc = gerarNotaPDF(notaGerada);
                    await salvarNotaSupabase(notaGerada, doc);
                    if (printRef.current) {
                      printRef.current.contentWindow?.print();
                    }
                    setTimeout(() => {
                      setMostrandoPreview(false);
                      setNotaGerada(null);
                      setMostrandoOpcoeNota(false);
                      setPdfUrl('');
                    }, 500);
                  }}
                  className="flex-1 bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700"
                >
                  Imprimir
                </button>
                <button
                  onClick={() => {
                    setMostrandoPreview(false);
                    setPdfUrl('');
                  }}
                  className="flex-1 bg-gray-400 text-white p-3 rounded font-bold hover:bg-gray-500"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
        {mostrandoAssinatura && notaGerada && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Assinar Nota</h2>
              <p className="text-sm text-gray-600 mb-2">Assine no espaço abaixo:</p>
              <div className="border-2 border-gray-300 rounded mb-4 bg-white">
                <SignatureCanvas
                  ref={sigCanvas}
                  canvasProps={{ width: 300, height: 150, className: 'border rounded' }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => sigCanvas.current?.clear()}
                  className="flex-1 bg-gray-400 text-white p-2 rounded font-bold hover:bg-gray-500"
                >
                  Limpar
                </button>
                <button
                  onClick={async () => {
                    const sig = sigCanvas.current?.toDataURL();
                    const doc = gerarNotaPDF(notaGerada, sig);
                    await salvarNotaSupabase(notaGerada, doc, sig);
                    setMostrandoAssinatura(false);
                    setNotaGerada(null);
                    setMostrandoOpcoeNota(false);
                  }}
                  className="flex-1 bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setMostrandoAssinatura(false)}
                  className="flex-1 bg-red-600 text-white p-2 rounded font-bold hover:bg-red-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
