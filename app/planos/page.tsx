'use client';
import PlanosCadastro, { PLANOS_EMPRESA } from '@/app/_components/PlanosCadastro';

export default function PlanosPage() {
  return (
    <PlanosCadastro
      planos={PLANOS_EMPRESA}
      tituloSecao="PLANOS PARA EMPRESAS"
      gridClassName="md:grid-cols-3 max-w-5xl"
      mostrarRecursos
      placeholderNomeConta="Nome da Empresa"
      linkAlternativo={{ href: '/planospessoais', texto: 'Procurando um plano para uso pessoal? Veja os planos Individual e Casal →' }}
    />
  );
}
