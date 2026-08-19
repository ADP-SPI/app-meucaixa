'use client';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold text-gray-900">App Barbearia</h1>
          <p className="text-gray-600 mt-2">Controle sua barbearia</p>
        </div>

        {/* Menu Principal */}
        <div className="space-y-3">
          <a href="/agenda" className="block bg-blue-600 text-white p-4 rounded-lg text-center font-bold">
            📅 AGENDA
          </a>
          <a href="/caixa" className="block bg-green-600 text-white p-4 rounded-lg text-center font-bold">
            💰 CAIXA
          </a>
          <a href="/fiados" className="block bg-orange-600 text-white p-4 rounded-lg text-center font-bold">
            📋 FIADOS
          </a>
          <a href="/relatorios" className="block bg-purple-600 text-white p-4 rounded-lg text-center font-bold">
            📊 RELATÓRIOS
          </a>
        </div>
      </div>
    </div>
  );
}
