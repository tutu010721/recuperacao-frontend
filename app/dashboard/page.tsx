'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Tipos para os dados que vamos buscar
type UserData = { name: string; email: string; role: string; };
type StoreData = { id: string; name: string; webhookUrl: string; };

export default function DashboardPage() {
  const router = useRouter();
  
  // Estados existentes
  const [user, setUser] = useState<UserData | null>(null);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- NOVOS ESTADOS PARA O FORMULÁRIO DE CRIAR LOJA ---
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
      // ... (a função fetchData continua a mesma) ...
      try {
        const [userResponse, storesResponse] = await Promise.all([
          fetch('https://recupera-esprojeto.onrender.com/api/me', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('https://recupera-esprojeto.onrender.com/api/stores', { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);
        if (!userResponse.ok || !storesResponse.ok) throw new Error('Falha ao buscar dados.');
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
  
  const copyToClipboard = (text: string) => { /* ... (continua o mesmo) ... */ };
  const handleLogout = () => { /* ... (continua o mesmo) ... */ };

  // --- NOVA FUNÇÃO PARA CRIAR A LOJA ---
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
      if (!response.ok) throw new Error(newStore.error || 'Falha ao criar loja.');

      // Adiciona a nova loja à lista existente e reseta o formulário
      setStores(currentStores => [...currentStores, newStore]);
      setNewStoreName('');
      setShowCreateForm(false);
    } catch (err: any) {
      setFormError(err.message);
    }
  };
  
  // ... (o resto do código como if(loading), etc, continua o mesmo) ...

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="container mx-auto">
        <header className="flex justify-between items-center mb-10">
            {/* ... (o header continua o mesmo) ... */}
        </header>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Minhas Lojas</h2>
            {/* Botão para mostrar/esconder o formulário */}
            <button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
            >
              {showCreateForm ? 'Cancelar' : '+ Adicionar Nova Loja'}
            </button>
          </div>

          {/* --- FORMULÁRIO DE CRIAÇÃO (SÓ APARECE QUANDO showCreateForm É TRUE) --- */}
          {showCreateForm && (
            <div className="bg-gray-800 p-5 rounded-lg mb-4">
              <form onSubmit={handleCreateStore}>
                <label htmlFor="newStoreName" className="block text-sm font-medium text-gray-300">Nome da Nova Loja</label>
                <div className="mt-1 flex space-x-2">
                  <input
                    id="newStoreName"
                    type="text"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    className="flex-grow bg-gray-700 border border-gray-600 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: Loja de Calçados Online"
                  />
                  <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Salvar</button>
                </div>
                {formError && <p className="mt-2 text-red-400 text-sm">{formError}</p>}
              </form>
            </div>
          )}
          
          <div className="space-y-4">
            {/* ... (o código para listar as lojas continua o mesmo) ... */}
          </div>
        </section>
      </div>
    </main>
  );
}
