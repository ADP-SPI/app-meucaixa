'use client';

import { supabase } from '@/lib/supabase';
import { verificarAssinatura } from '@/lib/assinatura';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const router = useRouter();
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState('');
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [contaId, setContaId] = useState('');
  const [tipoPlano, setTipoPlano] = useState('');
  const [planoId, setPlanoId] = useState<number | null>(null);
  const [validando, setValidando] = useState(true);
  const [avisoVencimento, setAvisoVencimento] = useState<{tipo: string; dias: number} | null>(null);
  const [ultimoDiaVerificado, setUltimoDiaVerificado] = useState<number>(new Date().getDate());

  useEffect(() => {
    let pullStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      pullStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      if (currentY - pullStartY > 100 && window.scrollY === 0) {
        window.location.reload();
      }
    };
    window.addEventListener('touchstart', handleTouchStart, false);
    window.addEventListener('touchmove', handleTouchMove, false);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  useEffect(() => {
    const usuarioId = localStorage.getItem('usuario_id');
    validarSessao();
    if (usuarioId) {
      const interval = setInterval(() => {
        verificarDeviceChange();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    buscarVencimento();
    const interval = setInterval(() => {
      const hoje = new Date().getDate();
      if (hoje !== ultimoDiaVerificado) {
        setUltimoDiaVerificado(hoje);
        buscarVencimento();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [ultimoDiaVerificado]);

  const buscarVencimento = async () => {
    const contaId = localStorage.getItem('conta_id');
    if (!contaId) return;
    const { expirada, diasRestantes: dias, destino } = await verificarAssinatura(parseInt(contaId));
    if (expirada) {
      router.replace(`${destino}?expirado=1`);
      return;
    }
    if (dias === null) {
      setAvisoVencimento(null);
    } else if (dias === 0) {
      setAvisoVencimento({tipo: 'hoje', dias: 0});
    } else if (dias >= 1 && dias <= 5) {
      setAvisoVencimento({tipo: 'ultimo5', dias});
    } else {
      setAvisoVencimento(null);
    }
  };

  const verificarDeviceChange = async () => {
    const usuarioId = localStorage.getItem('usuario_id');
    const deviceIdLocal = localStorage.getItem('device_id');
    if (!usuarioId) return;
    try {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('device_id')
        .eq('id', parseInt(usuarioId))
        .single();
      if (usuario?.device_id && usuario.device_id !== deviceIdLocal) {
        localStorage.clear();
        router.push('/login?logado_outro_dispositivo=true');
      }
    } catch (err) {
      console.error('Erro ao verificar device:', err);
    }
  };

  const validarSessao = async () => {
    const usuarioId = localStorage.getItem('usuario_id');
    const deviceId = localStorage.getItem('device_id');
    if (!usuarioId || !deviceId) {
      router.push('/login');
      return;
    }
    try {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('nome, tipo, device_id, conta_id')
        .eq('id', parseInt(usuarioId))
        .single();
      if (!usuario || usuario.device_id !== deviceId) {
        localStorage.clear();
        router.push('/login?sessao_invalida=true');
        return;
      }
      setNomeUsuario(usuario.nome);
      setTipoUsuario(usuario.tipo);
      const contaIdValue = usuario.conta_id.toString();
      setContaId(contaIdValue);
      localStorage.setItem('conta_id', contaIdValue);
      const { data: conta } = await supabase
        .from('contas')
        .select('nome, plano_id')
        .eq('id', usuario.conta_id)
        .single();
      if (conta) {
        setNomeEmpresa(conta.nome);
        const planoMap: {[key: number]: string} = {1: 'basico', 2: 'pro', 3: 'enterprise', 4: 'pessoal', 5: 'pessoal'};
        setTipoPlano(planoMap[conta.plano_id] || 'basico');
        setPlanoId(conta.plano_id);
      }
    } catch (err) {
      console.error('Erro ao validar sessao:', err);
      router.push('/login');
    } finally {
      setValidando(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (validando) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Validando sessao...</p></div>;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-md mx-auto p-4">
          {avisoVencimento && (
            <div className={`p-3 rounded text-white mb-4 text-center font-bold ${avisoVencimento.tipo === 'hoje' ? 'bg-red-600' : 'bg-yellow-600'}`}>
              {avisoVencimento.tipo === 'hoje'
                ? 'ASSINATURA VENCE HOJE (ÚLTIMO DIA DE ACESSO)'
                : `ASSINATURA VENCE EM ${avisoVencimento.dias} ${avisoVencimento.dias === 1 ? 'DIA' : 'DIAS'}`}
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-sm text-gray-600">Bem-vindo</p>
              <p className="font-bold text-gray-900">{nomeUsuario}</p>
              <p className="text-xs text-gray-500">{nomeEmpresa}</p>
              {tipoUsuario === 'proprietario' && (
                <span className="text-xs text-gray-500">
                  Proprietario
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="text-blue-600 hover:underline font-bold"
            >
              Sair / Trocar Usuario
            </button>
          </div>

          <div className="text-center py-8 mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Meu Caixa</h1>
            <p className="text-gray-600 mt-2">
              {planoId === 5 ? 'Controle Financeiro do Casal'
                : planoId === 4 ? 'Controle Financeiro Pessoal'
                : 'Gestão Simples do Seu Negócio'}
            </p>
          </div>

          <div className="space-y-3">
            {tipoPlano !== 'pessoal' && (
              <a href="/agenda" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
                Agenda
              </a>
            )}
            <a href="/caixa" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
              Caixa
            </a>
            {tipoPlano !== 'pessoal' && (
              <a href="/fiados" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
                Fiados
              </a>
            )}
            {tipoPlano !== 'pessoal' && (
              <a href="/notas-fiado" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
                Notas de Fiado
              </a>
            )}
            {tipoPlano !== 'pessoal' && (
              <a href="/comanda" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
                Comanda / Orçamento / Pedido
              </a>
            )}
            {tipoPlano !== 'pessoal' && (
              <a href="/cardapio" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
                Cardapio / Produtos ou Serviços
              </a>
            )}
            <a href="/relatorios" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
              Relatorios
            </a>
            {tipoUsuario === 'proprietario' && (
              <a href="/usuarios" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
                {tipoPlano === 'pessoal' ? 'Membros da Família / Cônjuge' : 'Gerenciar Usuarios'}
              </a>
            )}
            {contaId === '4' && (
              <a href="/admin" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
                Admin
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
