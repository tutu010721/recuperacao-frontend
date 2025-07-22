'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Importa o componente de Link

// Tipos para os dados que vamos buscar
type UserData = {
  name: string;
  email: string;
  role: string; // Adicionamos a 'role' para saber se o usuário é admin
};
type StoreData = {
  id: string;
  name: string;
  webhookUrl: string;
};

export default function DashboardPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<UserData | null>(null);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        // Busca os dados do usuário e das lojas em paralelo para ser mais rápido
        const [userResponse, storesResponse] = await Promise.all([
          fetch('https://recupera-esprojeto.onrender.com/api/me', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch('https://recupera-esprojeto.onrender.com/api/stores', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
        ]);

        if (!userResponse.ok || !storesResponse.ok) {
          throw new Error('Falha ao buscar dados. Faça o login novamente.');
        }

        const userData = await userResponse.json();
        const storesData = await storesResponse.json();

        setUser(userData);
        setStores(storesData);

      } catch (err: any) {
        setError(err.message);
        localStorage.removeItem('authToken');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('URL do Webhook copiada!');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    router.push('/');
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Carregando painel...</div>;
  }
  
  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-red-500">Erro: {error}</div>;
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="container mx-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold">Painel do Cliente</h1>
          <div className="text-right">
            <p className="font-semibold">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
            
            {/* Link para o Painel do Admin, só aparece se o usuário for 'admin' */}
            {user && user.role === 'admin' && (
              <Link href="/admin/dashboard" className="mt-2 block text-sm text-yellow-400 hover:underline">
                Acessar Painel do Admin
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="mt-2 block text-sm text-red-400 hover:underline"
            >
              Sair (Logout)
            </button>
          </div>
        </header>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Minhas Lojas</h2>
          <div className="space-y-4">
            {stores.length > 0 ? (
              stores.map((store) => (
                <div key={store.id} className="bg-gray-800 p-5 rounded-lg shadow-lg">
                  <h3 className="text-xl font-bold text-indigo-400">{store.name}</h3>
                  <p className="mt-2 text-gray-300">URL do Webhook:</p>
                  <div className="mt-1 flex items-center space-x-2 bg-gray-900 p-2 rounded">
                    <input 
                      type="text"
                      readOnly
                      value={store.webhookUrl}
                      className="flex-grow bg-transparent text-gray-400 focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(store.webhookUrl)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded text-sm"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gray-800 p-5 rounded-lg text-center">
                <p>Você ainda não cadastrou nenhuma loja.</p>
                {/* No futuro, aqui teremos um botão para "Adicionar Nova Loja" */}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
