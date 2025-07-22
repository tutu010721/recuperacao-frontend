'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Tipo para os dados do usuário que virão da lista
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/');
      return;
    }

    const verifyAdminAndFetchUsers = async () => {
      try {
        // Primeiro, verificamos se o usuário logado é um admin
        const meResponse = await fetch('https://recupera-esprojeto.onrender.com/api/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!meResponse.ok) throw new Error('Falha na autenticação.');
        
        const currentUser = await meResponse.json();
        if (currentUser.role !== 'admin') {
          throw new Error('Acesso negado. Você não é um administrador.');
        }

        // Se for admin, buscamos a lista de todos os usuários
        const usersResponse = await fetch('https://recupera-esprojeto.onrender.com/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!usersResponse.ok) throw new Error('Falha ao buscar a lista de usuários.');
        
        const usersData: User[] = await usersResponse.json();
        setUsers(usersData);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    verifyAdminAndFetchUsers();
  }, [router]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Verificando permissões e carregando dados...</div>;
  }

  // Se houver um erro (como acesso negado), mostramos a mensagem de erro.
  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-red-500">Erro: {error}</div>;
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8">Painel do Administrador</h1>
        <h2 className="text-2xl font-semibold mb-4">Gerenciamento de Usuários</h2>
        <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Nome</th>
                <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Função (Role)</th>
                <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-700">
                  <td className="px-5 py-5 border-b border-gray-700 text-sm">{user.name}</td>
                  <td className="px-5 py-5 border-b border-gray-700 text-sm">{user.email}</td>
                  <td className="px-5 py-5 border-b border-gray-700 text-sm">
                    <span className={`px-2 py-1 font-semibold leading-tight rounded-full ${
                      user.role === 'admin' ? 'text-red-300 bg-red-800' : 
                      user.role === 'seller' ? 'text-green-300 bg-green-800' : 'text-blue-300 bg-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-700 text-sm">{new Date(user.created_at).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
