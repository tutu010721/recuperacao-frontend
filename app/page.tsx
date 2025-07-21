'use client'; // Diretiva obrigatória para usar interatividade no Next.js App Router

import { useState } from 'react';

export default function LoginPage() {
  // Estados para armazenar o que o usuário digita
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados para feedback ao usuário
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Função chamada quando o formulário é enviado
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Impede que a página recarregue
    setError(''); // Limpa erros antigos
    setSuccess(''); // Limpa sucessos antigos

    // Validação simples
    if (!email || !password) {
      setError('Por favor, preencha o email e a senha.');
      return;
    }

    try {
      // Fazendo a chamada para a nossa API de backend!
      const response = await fetch('https://recupera-esprojeto.onrender.com/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Se a resposta não for 2xx, consideramos um erro
        throw new Error(data.error || 'Falha no login');
      }

      // Login bem-sucedido!
      setSuccess('Login realizado com sucesso!');
      console.log('Token recebido:', data.token); // Mostra o token no console
      // Aqui, no futuro, salvaremos o token e redirecionaremos o usuário

    } catch (err: any) {
      setError(err.message);
      console.error('Erro no login:', err);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-8">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Entrar
            </button>
          </div>
        </form>
        {error && <p className="mt-4 text-center text-red-400">{error}</p>}
        {success && <p className="mt-4 text-center text-green-400">{success}</p>}
      </div>
    </main>
  );
}
