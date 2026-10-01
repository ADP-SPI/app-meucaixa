'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getDataBrasil } from '@/lib/supabase';
import { ROTAS_PUBLICAS, verificarAssinatura } from '@/lib/assinatura';

// O login é guardado no localStorage, que o servidor não enxerga; por isso a proteção
// de rotas por assinatura roda aqui no cliente em vez de um middleware/proxy.
export default function AssinaturaGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const rotaPublica = ROTAS_PUBLICAS.includes(pathname);
  const [liberado, setLiberado] = useState(rotaPublica);

  useEffect(() => {
    if (rotaPublica) {
      setLiberado(true);
      return;
    }

    const contaId = localStorage.getItem('conta_id');
    // Sem sessão: cada página já manda para o /login
    if (!contaId) {
      setLiberado(true);
      return;
    }

    // Assinatura só muda de situação na virada do dia: verifica uma vez por dia por conta
    const chaveCache = `assinatura_ok_${contaId}`;
    if (sessionStorage.getItem(chaveCache) === getDataBrasil()) {
      setLiberado(true);
      return;
    }

    setLiberado(false);
    let cancelado = false;
    verificarAssinatura(parseInt(contaId))
      .then(({ expirada, destino }) => {
        if (cancelado) return;
        if (expirada) {
          router.replace(`${destino}?expirado=1`);
          return;
        }
        sessionStorage.setItem(chaveCache, getDataBrasil());
        setLiberado(true);
      })
      .catch((err) => {
        // Falha de rede não pode trancar o cliente fora do sistema
        console.error('Erro ao verificar assinatura:', err);
        if (!cancelado) setLiberado(true);
      });

    return () => {
      cancelado = true;
    };
  }, [pathname, rotaPublica, router]);

  if (!liberado) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p>Verificando assinatura...</p>
      </div>
    );
  }

  return <>{children}</>;
}
