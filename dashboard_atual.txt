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
            <div className={`p-3 rounded text-white mb-4 text-center font-bold ${avisoVencimento.tipo === 'vencido' ? 'bg-red-600' : 'bg-yellow-600'}`}>
              {avisoVencimento.tipo === 'vencido' ? 'ASSINATURA VENCIDA' : `ASSINATURA VENCE EM ${avisoVencimento.dias} DIAS`}
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
            <p className="text-gray-600 mt-2">Gestao simples do seu negocio</p>
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
            {tipoPlano !== 'pessoal' && tipoUsuario === 'proprietario' && (
              <a href="/usuarios" className="block bg-white text-black p-4 rounded border border-gray-200 text-center font-bold hover:bg-gray-50 transition">
                Gerenciar Usuarios
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
