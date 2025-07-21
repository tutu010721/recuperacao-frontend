'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Criamos um tipo para os dados do usuário para ajudar com o TypeScript
type UserData = {
  name: string;
  email: string;
};

export default function DashboardPage() {
  const router = useRouter();
  // Novo estado para guardar os dados do usuário ou erro
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/');
      return; // Para a execução se não houver token
    }

    // Função para buscar os dados protegidos
    const fetchUserData = async () => {
      try {
        const response = await fetch('https://recupera-esprojeto.onrender.com/api/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // É AQUI QUE USAMOS NOSSA CHAVE DE ACESSO!
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Falha ao autenticar. Faça o login novamente.');
        }

        const data: UserData = await response.json();
        setUserData(data); // Salva os dados do usuário no estado

      } catch (err: any) {
        setError(err.message);
        // Se houver erro (ex: token expirado), limpa o token e volta pro login
        localStorage.removeItem('authToken');
        router.push('/');
      }
    };

    fetchUserData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    router.push('/');
  };

  // Enquanto os dados não chegam, mostramos uma mensagem de carregando
  if (!userData) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Carregando...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-8">
      <div className="w-full max-w-4xl text-center">
        {/* Agora a mensagem é personalizada com o nome do usuário! */}
        <h1 className="text-5xl font-bold">Bem-vindo, {userData.name}!</h1>
        <p className="mt-4 text-lg text-gray-400">
          Este é o seu painel. Seu email registrado é: {userData.email}
        </p>
        
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
