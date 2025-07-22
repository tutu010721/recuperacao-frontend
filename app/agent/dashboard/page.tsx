'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type LeadStatus = 'new' | 'contacted' | 'recovered' | 'lost';

type Lead = {
  id: string;
  store_id: string;
  store_name: string;
  parsed_data: null | {
    customer_name: string;
    customer_phone: string;
    total_value: number;
    currency: string;
  };
  status: LeadStatus;
  received_at: string;
};

// Componente para os botões de filtro, para deixar o código mais limpo
const FilterButton = ({ filter, activeFilter, setFilter, children }: any) => (
  <button
    onClick={() => setFilter(filter)}
    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      activeFilter === filter
        ? 'bg-indigo-600 text-white'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }`}
  >
    {children}
  </button>
);


export default function AgentDashboardPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // Estado para o filtro ativo

  // Usamos useCallback para otimizar a função de busca
  const fetchLeads = useCallback(async (token: string, filter: string) => {
    try {
      setLoading(true);
      // Constrói a URL dinamicamente com o filtro
      const url = filter === 'all' 
        ? 'https://recupera-esprojeto.onrender.com/api/leads'
        : `https://recupera-esprojeto.onrender.com/api/leads?status=${filter}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Falha ao buscar leads.');
      const data: Lead[] = await response.json();
      setLeads(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []); // A função em si não muda

  // O useEffect agora depende do 'activeFilter'. Se o filtro mudar, ele busca os dados novamente.
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/');
    } else {
      fetchLeads(token, activeFilter);
    }
  }, [router, fetchLeads, activeFilter]);
  
  const handleUpdateStatus = async (leadId: string, newStatus: LeadStatus) => { /* ...código existente... */ };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-4">Painel do Atendente</h1>
        <p className="text-gray-400 mb-8">Fila de Recuperação</p>

        {/* --- BARRA DE FILTROS --- */}
        <div className="flex space-x-2 mb-8">
          <FilterButton filter="all" activeFilter={activeFilter} setFilter={setActiveFilter}>Todos</FilterButton>
          <FilterButton filter="new" activeFilter={activeFilter} setFilter={setActiveFilter}>Novos</FilterButton>
          <FilterButton filter="contacted" activeFilter={activeFilter} setFilter={setActiveFilter}>Contatados</FilterButton>
          <FilterButton filter="recovered" activeFilter={activeFilter} setFilter={setActiveFilter}>Recuperados</FilterButton>
          <FilterButton filter="lost" activeFilter={activeFilter} setFilter={setActiveFilter}>Perdidos</FilterButton>
        </div>

        <div className="bg-gray-800 shadow-lg rounded-lg overflow-x-auto">
          <table className="min-w-full leading-normal">
            {/* ... o cabeçalho da tabela continua o mesmo ... */}
            <tbody>
              {/* Se não houver leads após filtrar, mostra uma mensagem */}
              {loading === false && leads.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">
                    Nenhum lead encontrado para este filtro.
                  </td>
                </tr>
              )}
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-700">
                  {/* ... o corpo da tabela continua o mesmo ... */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
