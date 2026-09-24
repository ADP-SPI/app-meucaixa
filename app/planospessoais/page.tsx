'use client';
import PlanosCadastro, { PLANOS_PESSOAIS } from '@/app/_components/PlanosCadastro';

export default function PlanosPessoaisPage() {
  return (
    <PlanosCadastro
      planos={PLANOS_PESSOAIS}
      tituloSecao="PLANOS PARA USO PESSOAL"
      gridClassName="md:grid-cols-2 max-w-2xl"
      mostrarRecursos={false}
      placeholderNomeConta="Nome da Conta (ex: Família Silva)"
      linkAlternativo={{ href: '/planos', texto: 'Tem um negócio? Veja os planos para empresas →' }}
    />
  );
}
