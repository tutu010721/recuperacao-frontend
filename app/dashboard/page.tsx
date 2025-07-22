'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Tipos para os dados que vamos buscar
type UserData = { name: string; email: string; role: string; };
type StoreData = { id: string; name: string; webhookUrl: string; };

export default function DashboardPage() {
  const router = useRouter();
  
  // Estados para dados da página
  const [user, setUser] = useState<UserData | null>(null);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para o formulário de criar nova loja
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
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

  const handleCreateStore = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    const token = localStorage.getItem('authToken');

    if (!newStoreName) {
      setFormError('O nome da loja é obrigatório.');
      return;
    }

    try {
      const response = await fetch('https://recupera-esprojeto.onrender.com/api/stores', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newStoreName }),
      });
      
      const newStore = await response.json();
      if (!response.ok) {
        throw new Error(newStore.error || 'Falha ao criar loja.');
      }

      setStores(currentStores => [...currentStores, newStore]);
      setNewStoreName('');
      setShowCreateForm(false);
    } catch (err: any) {
      setFormError(err.message);
    }
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Minhas Lojas</h2>
            <button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
            >
              {showCreateForm ? 'Cancelar' : '+ Adicionar Nova Loja'}
            </button>
          </div>

          {showCreateForm && (
            <div className="bg-gray-800 p-5 rounded-lg mb-4 transition-all duration-300">
              <form onSubmit={handleCreateStore}>
                <label htmlFor="newStoreName" className="block text-sm font-medium text-gray-300">Nome da Nova Loja</label>
                <div className="mt-1 flex space-x-2">
                  <input
                    id="newStoreName"
                    type="text"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    className="flex-grow bg-gray-700 border border-gray-600 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: Minha Loja de Sucesso"
                    autoFocus
                  />
                  <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Salvar Loja</button>
                </div>
                {formError && <p className="mt-2 text-red-400 text-sm">{formError}</p>}
              </form>
            </div>
          )}
          
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
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
