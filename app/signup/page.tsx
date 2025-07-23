'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [platform, setPlatform] = useState('adoorei'); // Plataforma padrão
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!name || !email || !password || !platform) {
      setError('Todos os campos são obrigatórios.');
      return;
    }

    try {
      // 1. Cria o novo usuário
      const signupResponse = await fetch('https://recupera-esprojeto.onrender.com/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'seller' }),
      });

      const signupData = await signupResponse.json();
      if (!signupResponse.ok) {
        throw new Error(signupData.error || 'Falha ao realizar o cadastro.');
      }

      // 2. Faz o login para obter o token
      const loginResponse = await fetch('https://recupera-esprojeto.onrender.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const loginData = await loginResponse.json();
      if (!loginResponse.ok) {
        router.push('/?message=Cadastro realizado. Por favor, faça o login.');
        return;
      }
      
      const token = loginData.token;
      localStorage.setItem('authToken', token);

      // 3. Cria a primeira loja para o usuário
      await fetch('https://recupera-esprojeto.onrender.com/api/stores', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: "Minha Primeira Loja", platform: platform }),
      });
      
      // 4. Redireciona para o dashboard
      router.push('/dashboard');

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-8">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center">Crie sua Conta</h1>
        <p className="text-center text-gray-400">Comece a recuperar suas vendas hoje.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">Seu Nome</label>
            <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">Seu Melhor Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">Crie uma Senha</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="platform" className="block text-sm font-medium text-gray-300">Qual checkout você utiliza?</label>
            <select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
              <option value="adoorei">Adoorei</option>
              <option value="hotmart">Hotmart</option>
              <option value="kiwify">Kiwify</option>
              <option value="generic">Outro / Genérico</option>
            </select>
          </div>
          <div>
            <button type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none">
              Criar minha conta
            </button>
          </div>
        </form>
        {error && <p className="mt-4 text-center text-red-400">{error}</p>}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-400">
            Já tem uma conta?{' '}
            <Link href="/" className="font-medium text-indigo-400 hover:text-indigo-500">
              Faça o login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
