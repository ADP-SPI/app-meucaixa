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
      router.push('/dashboard');
    }
  }, [router]);

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
          Gestão Simples do Seu Negócio
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
              Registre quem deve, quando pagou e quanto falta receber.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold mb-2">Cardápio Online</h3>
            <p className="text-gray-600">
              Gerencie seus itens, preços e promoções facilmente.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Relatórios</h3>
            <p className="text-gray-600">
              Veja quanto você ganhou, gastou e lucrou em cada período.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-bold mb-2">Múltiplos Usuários</h3>
            <p className="text-gray-600">
              Adicione funcionários e controle quem acessa o que.
            </p>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section className="bg-white py-20 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Escolha o Plano Ideal</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Plano Básico */}
            <div className="border-2 border-gray-200 rounded-lg p-8 hover:border-green-600 transition">
              <h3 className="text-2xl font-bold mb-2">Básico</h3>
              <p className="text-gray-600 mb-4">Para começar</p>
              <div className="text-3xl font-bold text-green-600 mb-6">
                R$ 29,90<span className="text-sm text-gray-600">/mês</span>
              </div>
              <ul className="space-y-2 mb-6 text-gray-700">
                <li>✓ 1 acesso</li>
                <li>✓ 50 itens no cardápio</li>
                <li>✓ 10 mesas/comandas</li>
                <li>✓ Suporte por email</li>
              </ul>
              <Link 
                href="/planos"
                className="w-full block text-center bg-white border-2 border-green-600 text-green-600 px-4 py-2 rounded font-bold hover:bg-green-50 transition"
              >
                Teste Grátis
              </Link>
            </div>

            {/* Plano Pro */}
            <div className="border-2 border-green-600 rounded-lg p-8 bg-gradient-to-b from-green-50 to-white relative">
              <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <p className="text-gray-600 mb-4">Melhor custo-benefício</p>
              <div className="text-3xl font-bold text-green-600 mb-6">
                R$ 49,90<span className="text-sm text-gray-600">/mês</span>
              </div>
              <ul className="space-y-2 mb-6 text-gray-700">
                <li>✓ 3 acessos</li>
                <li>✓ 100 itens no cardápio</li>
                <li>✓ 30 mesas/comandas</li>
                <li>✓ Suporte por email + WhatsApp</li>
              </ul>
              <Link 
                href="/planos"
                className="w-full block text-center bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 transition"
              >
                Teste Grátis
              </Link>
            </div>

            {/* Plano Enterprise */}
            <div className="border-2 border-gray-200 rounded-lg p-8 hover:border-green-600 transition">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <p className="text-gray-600 mb-4">Sem limites</p>
              <div className="text-3xl font-bold text-green-600 mb-6">
                R$ 79,90<span className="text-sm text-gray-600">/mês</span>
              </div>
              <ul className="space-y-2 mb-6 text-gray-700">
                <li>✓ Acessos ilimitados</li>
                <li>✓ Itens ilimitados</li>
                <li>✓ Mesas ilimitadas</li>
                <li>✓ Suporte prioritário</li>
              </ul>
              <Link 
                href="/planos"
                className="w-full block text-center bg-white border-2 border-green-600 text-green-600 px-4 py-2 rounded font-bold hover:bg-green-50 transition"
              >
                Teste Grátis
              </Link>
            </div>
          </div>

          <p className="text-center text-gray-600 mt-8">
            💚 Todos os planos incluem 15 dias de teste grátis. Sem cartão de crédito!
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
        <p className="text-xl text-gray-600 mb-8">
          15 dias grátis para testar tudo. Sem compromisso.
        </p>
        <Link 
          href="/planos"
          className="inline-block bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition"
        >
          Começar Agora
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-8 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-white mb-4">Meu Caixa</h3>
              <p className="text-sm">Gestão simples do seu negócio.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Produto</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/planos" className="hover:text-white">Planos</Link></li>
                <li><Link href="/planos" className="hover:text-white">Recursos</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Suporte</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:contato@meucaixa.com.br" className="hover:text-white">Email</a></li>
                <li><a href="https://wa.me/5544999999999" className="hover:text-white">WhatsApp</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacidade</a></li>
                <li><a href="#" className="hover:text-white">Termos</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Meu Caixa. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
