'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  useEffect(() => {
    const usuarioId = localStorage.getItem('usuario_id');
    
    if (usuarioId) {
      // Se está logado, vai pro dashboard (PWA ou browser)
      window.location.href = '/dashboard';
    } else {
      // Se NÃO está logado
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;
      if (isPWA) {
        // PWA sem login → vai pro login
        window.location.href = '/login';
      }
      // Browser sem login → fica na landing page (sem redirect)
    }
  }, []);

  console.log('Landing Page carregado');

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">

      {/* HEADER */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-green-600">💰 Meu Caixa</div>
          <Link href="/login" className="text-gray-600 hover:text-gray-900 font-bold">
            Entrar
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
           Gestão Simples do Seu Negócio ✨
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Controle seu caixa, comanda, fiados e cardápio em um só lugar. 
          Perfeito para barbearias, lanchonetes, bars e salões.
        </p>
        <Link 
          href="/planos"
          className="inline-block bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition"
        >
          Começar Teste Grátis (15 dias)
        </Link>
      </section>

      {/* BENEFÍCIOS */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Por que escolher Meu Caixa?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold mb-2">Controle de Caixa</h3>
            <p className="text-gray-600">
              Registre todas as receitas e despesas. Veja o saldo do dia em tempo real.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="text-4xl mb-4">🍽️</div>
            <h3 className="text-xl font-bold mb-2">Comanda Digital</h3>
            <p className="text-gray-600">
              Crie e feche comandas rapidinho. Sem papel, sem confusão.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-bold mb-2">Controle de Fiados</h3>
            <p className="text-gray-600">
              Acompanhe quem deve e quando vence. Nunca mais perca uma cobrança.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="text-4xl mb-4">🍔</div>
            <h3 className="text-xl font-bold mb-2">Cardápio Personalizado</h3>
            <p className="text-gray-600">
              Crie seu cardápio com preços. Atualize quando quiser.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Relatórios</h3>
            <p className="text-gray-600">
              Veja gráficos e estatísticas do seu negócio. Tome melhores decisões.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold mb-2">Funciona no Celular</h3>
            <p className="text-gray-600">
              Use no iPhone, Android ou qualquer navegador. Instale como app.
            </p>
          </div>
        </div>
      </section>

      {/* CTA FOOTER */}
      <section className="bg-green-600 text-white py-20">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-lg mb-8">
            15 dias de teste grátis. Sem cartão de crédito. Sem compromisso.
          </p>
          <Link 
            href="/planos"
            className="inline-block bg-white text-green-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
          >
            Começar Agora
          </Link>
        </div>
      </section>
    </div>
  );
}
