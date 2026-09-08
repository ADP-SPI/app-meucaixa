'use client';

import { supabase } from '@/lib/supabase';
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
    const { data } = await supabase
      .from('assinaturas')
      .select('data_vencimento')
      .eq('conta_id', contaId)
      .single();
    if (!data?.data_vencimento) return;
    const hoje = new Date();
    const vencimento = new Date(data.data_vencimento);
    const dias = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    if (dias <= 0) {
      setAvisoVencimento({tipo: 'vencido', dias: 0});
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

  const validarSessao = () => {
    const usuarioId = localStorage.getItem('usuario_id');
    const cId = localStorage.getItem('conta_id');
    const nome = localStorage.getItem('usuario_nome');
    const tipo = localStorage.getItem('tipo_usuario');
    const empresa = localStorage.getItem('empresa_nome');
    const tPlano = localStorage.getItem('tipo_plano');
    if (!usuarioId || !cId || !nome) {
      localStorage.clear();
      sessionStorage.clear();
      router.push('/login');
      return;
    }
    setNomeUsuario(nome);
    setTipoUsuario(tipo || '');
    setNomeEmpresa(empresa || '');
    setContaId(cId);
    setTipoPlano(tPlano || 'empresa');
    setValidando(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('usuario_id');
    localStorage.removeItem('conta_id');
    localStorage.removeItem('usuario_nome');
    localStorage.removeItem('tipo_usuario');
    localStorage.removeItem('empresa_nome');
    localStorage.removeItem('tipo_plano');
    localStorage.removeItem('device_id');
    sessionStorage.clear();
    document.cookie = 'usuario_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    document.cookie = 'conta_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    document.cookie = 'usuario_nome=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    document.cookie = 'tipo_usuario=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    document.cookie = 'empresa_nome=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    document.cookie = 'tipo_plano=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    window.location.href = '/login';
  };

  if (validando) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Carregando...</p></div>;
  }

  return (
    <>
      {avisoVencimento && avisoVencimento.tipo === 'vencido' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md text-center">
            <h2 className="text-3xl font-bold text-red-600 mb-4">🔴 PLANO VENCIDO</h2>
            <p className="text-gray-700 mb-6">Seu plano venceu. Renove agora para continuar usando.</p>
            <button
              onClick={() => router.push('/renovacao')}
              className="w-full bg-red-600 text-white px-6 py-3 rounded font-bold hover:bg-red-700"
            >
              Renovar Plano
            </button>
          </div>
        </div>
      )}

      {avisoVencimento && avisoVencimento.tipo === 'ultimo5' && (
        <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white p-4 flex justify-between items-center z-50 shadow-lg">
          <div>
            <p className="font-bold">🔵 AVISO: Vence em {avisoVencimento.dias} dia{avisoVencimento.dias > 1 ? 's' : ''}</p>
            <p className="text-sm">Últimos dias para renovar seu plano</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAvisoVencimento(null)}
              className="bg-white text-gray-800 px-4 py-2 rounded font-bold hover:bg-gray-100 text-sm"
            >
              Descartar
            </button>
            <button
              onClick={() => router.push('/renovacao')}
              className="bg-white text-gray-800 px-4 py-2 rounded font-bold hover:bg-gray-100 text-sm"
            >
              Renovar
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
        <div className="w-full max-w-6xl">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Empresa:</p>
              <p className="text-lg font-bold text-gray-900">{nomeEmpresa}</p>
              <p className="text-sm text-gray-600 mt-2">Logado como:</p>
              <p className="text-sm font-bold text-gray-900">{nomeUsuario}</p>
              {tipoUsuario === 'proprietario' && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-1 inline-block">
                  👤 Proprietário
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="text-blue-600 hover:underline font-bold"
            >
              Sair / Trocar Usuário
            </button>
          </div>

          <div className="text-center py-8 mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Meu Caixa</h1>
            <p className="text-gray-600 mt-2">Gestão simples do seu negócio</p>
          </div>

          <div className="space-y-3">
            {tipoPlano !== 'pessoal' && (
              <a href="/agenda" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
                📅 AGENDA
              </a>
            )}
            <a href="/caixa" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
              💰 CAIXA
            </a>
            {tipoPlano !== 'pessoal' && (
              <a href="/fiados" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
                📝 FIADOS
              </a>
            )}
            {tipoPlano !== 'pessoal' && (
              <a href="/comanda" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
                🍽️ COMAND / ORÇAMENTO / PEDIDOA
              </a>
            )}
            {tipoPlano !== 'pessoal' && (
              <a href="/cardapio" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
                📋 CARDÁPIO / PRODUTOS OU SERVIÇOS
              </a>
            )}
            <a href="/relatorios" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
              📊 RELATÓRIOS
            </a>
            {tipoPlano !== 'pessoal' && tipoUsuario === 'proprietario' && (
              <a href="/usuarios" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
                👥 GERENCIAR USUÁRIOS
              </a>
            )}
            {contaId === '4' && (
              <a href="/admin" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
                🔧 ADMIN
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
