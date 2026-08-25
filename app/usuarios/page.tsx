'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rbocrgnmsadkbfoqbzpe.supabase.co',
  'sb_publishable_CXx1yNZ2C03bTuNpeDUNsQ_k4JHv9Vm'
);

export default function Usuarios() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [plano, setPlano] = useState<any>(null);
  const [contaId, setContaId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [excluindo, setExcluindo] = useState<number | null>(null);

  useEffect(() => {
    const tipoUsuario = localStorage.getItem('tipo_usuario');
    
    if (tipoUsuario !== 'proprietario') {
      alert('❌ Apenas o proprietário pode gerenciar usuários');
      window.location.href = '/';
      return;
    }
  }, []);

  useEffect(() => {
    const conta = localStorage.getItem('conta_id');
    if (conta) {
      setContaId(parseInt(conta));
      carregarDados(parseInt(conta));
    }
  }, []);

  const carregarDados = async (cId: number) => {
    try {
      // Carregar dados da conta
      const { data: contaData } = await supabase
        .from('contas')
        .select('plano_id')
        .eq('id', cId)
        .single();

      // Carregar plano
      if (contaData?.plano_id) {
        const { data: planoData } = await supabase
          .from('planos')
          .select('*')
          .eq('id', contaData.plano_id)
          .single();

        setPlano(planoData);
      }

      // Carregar usuários
      const { data: usuariosData } = await supabase
        .from('usuarios')
        .select('id, email, nome, tipo')
        .eq('conta_id', cId)
        .order('tipo', { ascending: false });

      setUsuarios(usuariosData || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setErro('Erro ao carregar dados');
    }
    setCarregando(false);
  };

  const adicionarUsuario = async () => {
    if (!novoNome.trim() || !novoEmail.trim() || !novaSenha.trim()) {
      setErro('Preencha nome, email e senha');
      return;
    }

    if (!contaId || !plano) return;

    // Verificar se atingiu o limite
    if (usuarios.length >= plano.max_usuarios) {
      setErro(`Você atingiu o limite de ${plano.max_usuarios} acessos para seu plano`);
      return;
    }

    setProcessando(true);
    setErro('');
    setSucesso('');

    try {
      // Verificar se email já existe
      const { data: emailExiste } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', novoEmail)
        .single();

      if (emailExiste) {
        setErro('Este email já está cadastrado');
        setProcessando(false);
        return;
      }

      // Criar novo usuário
      const { error } = await supabase
        .from('usuarios')
        .insert([{
          conta_id: contaId,
          email: novoEmail,
          senha_hash: novaSenha,
          nome: novoNome,
          tipo: 'funcionario',
          ativo: true
        }]);

      if (error) {
        setErro('Erro ao criar usuário');
        setProcessando(false);
        return;
      }

      setSucesso(`✅ Usuário ${novoNome} criado com sucesso!`);
      setNovoNome('');
      setNovoEmail('');
      setNovaSenha('');
      setModalAberto(false);

      setTimeout(() => {
        carregarDados(contaId);
        setSucesso('');
      }, 2000);
    } catch (err) {
      console.error('Erro:', err);
      setErro('Erro ao processar');
    }

    setProcessando(false);
  };

  const removerUsuario = async (usuarioId: number, email: string) => {
    if (!contaId) return;

    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', usuarioId)
        .eq('conta_id', contaId);

      if (error) throw error;

      setSucesso(`✅ Usuário ${email} removido!`);
      setExcluindo(null);

      setTimeout(() => {
        carregarDados(contaId);
        setSucesso('');
      }, 1500);
    } catch (err) {
      console.error('Erro:', err);
      setErro('Erro ao remover usuário');
    }
  };

  if (carregando) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Carregando...</p></div>;
  }

  const vagosDisponiveis = plano ? plano.max_usuarios - usuarios.length : 0;

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center">
      <div className="w-full max-w-2xl">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar
        </Link>

        <h1 className="text-2xl font-bold mb-6">👥 Gerenciar Usuários</h1>

        {/* RESUMO DO PLANO */}
        {plano && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600">Seu plano:</p>
            <p className="text-xl font-bold text-blue-600">{plano.nome}</p>
            <p className="text-sm mt-2">
              Acessos: <span className="font-bold">{usuarios.length} de {plano.max_usuarios}</span>
              {vagosDisponiveis > 0 ? ` (${vagosDisponiveis} disponível${vagosDisponiveis > 1 ? 's' : ''})` : ' (limite atingido)'}
            </p>
          </div>
        )}

        {/* MENSAGENS */}
        {erro && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
            {erro}
          </div>
        )}
        {sucesso && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">
            {sucesso}
          </div>
        )}

        {/* LISTA DE USUÁRIOS */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-bold mb-4">Usuários da Conta</h2>

          {usuarios.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum usuário cadastrado</p>
          ) : (
            <div className="space-y-3">
              {usuarios.map((user) => (
                <div key={user.id} className="flex justify-between items-center bg-gray-50 p-4 rounded border border-gray-200">
                  <div className="flex-1">
                    <p className="font-bold">{user.nome}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {user.tipo === 'proprietario' && (
                      <p className="text-xs text-blue-600 mt-1">👤 Proprietário</p>
                    )}
                  </div>

                  {user.tipo !== 'proprietario' && (
                    <>
                      {excluindo === user.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => removerUsuario(user.id, user.nome)}
                            className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setExcluindo(null)}
                            className="bg-gray-400 text-white px-3 py-2 rounded text-sm hover:bg-gray-500"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setExcluindo(user.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                        >
                          🗑️ Remover
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BOTÃO ADICIONAR */}
        {vagosDisponiveis > 0 && (
          <button
            onClick={() => setModalAberto(true)}
            className="w-full bg-green-600 text-white p-4 rounded font-bold hover:bg-green-700 mb-6"
          >
            + ADICIONAR NOVO USUÁRIO
          </button>
        )}

        {vagosDisponiveis === 0 && usuarios.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded text-sm text-yellow-800">
            ⚠️ Você atingiu o limite de acessos do seu plano. Para adicionar mais usuários, faça upgrade.
          </div>
        )}

        {/* MODAL ADICIONAR USUÁRIO */}
        {modalAberto && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Novo Usuário</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold mb-2">Nome</label>
                  <input
                    type="text"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Ex: Carlos"
                    className="w-full border border-gray-300 p-2 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Email</label>
                  <input
                    type="email"
                    value={novoEmail}
                    onChange={(e) => setNovoEmail(e.target.value)}
                    placeholder="funcionario@email.com"
                    className="w-full border border-gray-300 p-2 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Senha</label>
                  <input
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-gray-300 p-2 rounded"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={adicionarUsuario}
                  disabled={processando}
                  className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700 disabled:bg-gray-400"
                >
                  {processando ? 'Criando...' : '✓ CRIAR USUÁRIO'}
                </button>

                <button
                  onClick={() => {
                    setModalAberto(false);
                    setNovoNome('');
                    setNovoEmail('');
                    setNovaSenha('');
                  }}
                  className="w-full bg-gray-400 text-white p-3 rounded font-bold hover:bg-gray-500"
                >
                  ✕ CANCELAR
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
