'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Agenda() {
  const [agendas, setAgendas] = useState<any[]>([]);
  const [nomeCliente, setNomeCliente] = useState('');
  const [horarioSelecionado, setHorarioSelecionado] = useState('');

  useEffect(() => {
    carregarAgendas();
  }, []);

  const carregarAgendas = () => {
    try {
      const data = JSON.parse(localStorage.getItem('agendas') || '[]');
      if (Array.isArray(data)) {
        setAgendas(data.filter(a => a && a.nome_cliente));
      }
    } catch (e) {
      setAgendas([]);
    }
  };

  const adicionarAgenda = () => {
    if (!nomeCliente.trim() || !horarioSelecionado) {
      alert('Preencha nome e horário');
      return;
    }

    const novaAgenda = {
      id: Date.now(),
      nome_cliente: nomeCliente,
      horario: horarioSelecionado,
      data: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem('agendas') || '[]');
    existing.push(novaAgenda);
    localStorage.setItem('agendas', JSON.stringify(existing));

    setNomeCliente('');
    setHorarioSelecionado('');
    carregarAgendas();
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

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-6xl">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
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
            className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700"
          >
            + AGENDAR
          </button>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-4">Agendamentos de Hoje</h2>
          {agendas && agendas.length === 0 ? (
            <p className="text-gray-500">Nenhum agendamento</p>
          ) : (
            <div className="space-y-2">
              {agendas && agendas.map((a) => (
                a ? (
                  <div key={a.id} className="bg-white p-3 rounded border border-gray-200">
                    <p className="font-bold">{a.nome_cliente || 'Sem nome'}</p>
                    <p className="text-sm text-gray-600">{a.horario || '--:--'}</p>
                  </div>
                ) : null
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
