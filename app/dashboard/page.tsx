'use client'; // Precisa ser um componente de cliente para usar hooks

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  // 1. LÓGICA DE PROTEÇÃO DA ROTA
  useEffect(() => {
    // Pega o token do localStorage
    const token = localStorage.getItem('authToken');

    // Se não houver token, redireciona para a página de login
    if (!token) {
      router.push('/');
    }
  }, [router]); // O hook roda quando o componente é montado

  // 2. FUNÇÃO DE LOGOUT
  const handleLogout = () => {
    // Remove o token do localStorage
    localStorage.removeItem('authToken');
    // Redireciona para a página de login
    router.push('/');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-8">
      <div className="w-full max-w-4xl text-center">
        <h1 className="text-5xl font-bold">Bem-vindo ao seu Painel!</h1>
        <p className="mt-4 text-lg text-gray-400">
          Esta é uma área protegida. Futuramente, suas métricas e ferramentas aparecerão aqui.
        </p>
        
        {/* 3. BOTÃO DE LOGOUT */}
        <button
          onClick={handleLogout}
          className="mt-8 py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Sair (Logout)
        </button>
      </div>
    </main>
  );
}
