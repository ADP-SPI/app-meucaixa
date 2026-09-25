'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, getDataBrasil } from '@/lib/supabase';

type Agendamento = {
  id: number;
  nome_cliente: string;
  data: string;
  horario: string;
};

const formatarData = (data: string) => {
  const [ano, mes, dia] = data.split('-').map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export default function Agenda() {
  const [agendas, setAgendas] = useState<Agendamento[]>([]);
  const [nomeCliente, setNomeCliente] = useState('');
  const [dataSelecionada, setDataSelecionada] = useState(getDataBrasil());
  const [horarioSelecionado, setHorarioSelecionado] = useState('');
  const [contaId, setContaId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const conta = localStorage.getItem('conta_id');
    if (conta) {
      const cId = parseInt(conta);
      setContaId(cId);
      migrarAgendasLocais(cId).then(() => carregarAgendas(cId));
    } else {
      setCarregando(false);
    }
  }, []);

  // Agendamentos antigos ficavam só no localStorage; envia uma única vez para o Supabase
  const migrarAgendasLocais = async (cId: number) => {
    try {
      const locais = JSON.parse(localStorage.getItem('agendas') || '[]');
      if (!Array.isArray(locais) || locais.length === 0) return;

      const registros = locais
        .filter((a: any) => a && a.nome_cliente && a.horario && a.data)
        .map((a: any) => ({
          conta_id: cId,
          nome_cliente: a.nome_cliente,
          data: a.data,
          horario: a.horario,
        }));

      if (registros.length > 0) {
        const { error } = await supabase.from('agendamentos').insert(registros);
        if (error) throw error;
      }
      localStorage.removeItem('agendas');
    } catch (err) {
      console.error('Erro ao migrar agendamentos locais:', err);
    }
  };

  const carregarAgendas = async (cId: number) => {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('id, nome_cliente, data, horario')
        .eq('conta_id', cId)
        .order('data', { ascending: true })
        .order('horario', { ascending: true });

      if (error) throw error;
      setAgendas(data || []);
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
    }
    setCarregando(false);
  };

  const adicionarAgenda = async () => {
    if (!nomeCliente.trim() || !dataSelecionada || !horarioSelecionado) {
      alert('Preencha nome, data e horário');
      return;
    }

    if (!contaId) {
      alert('Erro: conta não identificada');
      return;
    }

    setSalvando(true);
    try {
      const { error } = await supabase
        .from('agendamentos')
        .insert([{
          conta_id: contaId,
          nome_cliente: nomeCliente.trim(),
          data: dataSelecionada,
          horario: horarioSelecionado,
        }]);

      if (error) throw error;

      setNomeCliente('');
      setHorarioSelecionado('');
      await carregarAgendas(contaId);
    } catch (err) {
      console.error('Erro ao salvar agendamento:', err);
      alert('Erro ao salvar agendamento');
    }
    setSalvando(false);
  };

  const gerarHorarios = () => {
    const horarios = [];
    for (let h = 8; h < 21; h++) {
      for (let m = 0; m < 60; m += 30) {
        horarios.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return horarios;
  };

  const hoje = getDataBrasil();
  const agendasPorData = agendas.reduce<Record<string, Agendamento[]>>((grupos, a) => {
    (grupos[a.data] ||= []).push(a);
    return grupos;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-6xl">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar
        </Link>

        <h1 className="text-2xl font-bold mb-6">Agenda</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Nome do Cliente</label>
            <input
              type="text"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              placeholder="Digite o nome"
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Data</label>
            <input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Horário</label>
            <select
              value={horarioSelecionado}
              onChange={(e) => setHorarioSelecionado(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded"
            >
              <option value="">Selecione um horário</option>
              {gerarHorarios().map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          <button
            onClick={adicionarAgenda}
            disabled={salvando}
            className="w-full bg-blue-100 text-blue-600 border border-blue-300 p-3 rounded font-bold hover:bg-blue-200 disabled:opacity-50"
          >
            {salvando ? 'SALVANDO...' : '+ AGENDAR'}
          </button>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-4">Clientes Agendados</h2>
          {carregando ? (
            <p className="text-gray-500">Carregando...</p>
          ) : agendas.length === 0 ? (
            <p className="text-gray-500">Nenhum agendamento</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(agendasPorData).map(([data, itens]) => (
                <div key={data} className={data < hoje ? 'opacity-50' : ''}>
                  <h3 className="text-sm font-bold text-gray-700 mb-2 capitalize">
                    {formatarData(data)}{data === hoje ? ' — Hoje' : ''}
                  </h3>
                  <div className="space-y-2">
                    {itens.map((a) => (
                      <div key={a.id} className="bg-white p-3 rounded border border-gray-200">
                        <p className="font-bold">{a.nome_cliente || 'Sem nome'}</p>
                        <p className="text-sm text-gray-600">{a.horario ? a.horario.slice(0, 5) : '--:--'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
