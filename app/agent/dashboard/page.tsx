'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type LeadStatus = 'new' | 'contacted' | 'recovered' | 'lost';

type Lead = {
  id: string;
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

type Store = {
  id: string;
  name: string;
};

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
  const [availableStores, setAvailableStores] = useState<Store[]>([]); // Para popular o dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Nossos dois filtros
  const [statusFilter, setStatusFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');

  const fetchInitialData = useCallback(async (token: string) => {
    try {
      // Busca as lojas que o atendente pode ver para popular o filtro
      const storesResponse = await fetch('https://recupera-esprojeto.onrender.com/api/agent/stores', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!storesResponse.ok) throw new Error('Falha ao buscar lojas do atendente.');
      const storesData = await storesResponse.json();
      setAvailableStores(storesData);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const fetchLeads = useCallback(async (token: string) => {
    try {
      setLoading(true);
      // Constrói a URL com os dois filtros
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (storeFilter !== 'all') params.append('storeId', storeFilter);
      
      const url = `https://recupera-esprojeto.onrender.com/api/leads?${params.toString()}`;

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
  }, [statusFilter, storeFilter]); // Re-executa a busca se um dos filtros mudar

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/');
    } else {
      fetchInitialData(token); // Busca as lojas uma vez
      fetchLeads(token);       // Busca os leads (e vai re-buscar se os filtros mudarem)
    }
  }, [router, fetchInitialData, fetchLeads]);
  
  const handleUpdateStatus = async (leadId: string, newStatus: LeadStatus) => {
    // ... (código existente, sem alterações)
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-4">Painel do Atendente</h1>
        <p className="text-gray-400 mb-8">Fila de Recuperação</p>

        {/* --- BARRA DE FILTROS --- */}
        <div className="flex flex-wrap gap-4 items-center mb-8">
          {/* Filtro de Lojas */}
          <div>
            <label htmlFor="store-filter" className="text-sm font-medium mr-2">Filtrar por Loja:</label>
            <select
              id="store-filter"
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="bg-gray-700 text-white text-sm rounded-md p-2 border-transparent focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">Todas as Lojas</option>
              {availableStores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>
          {/* Filtro de Status */}
          <div className="flex items-center space-x-2">
            <FilterButton filter="all" activeFilter={statusFilter} setFilter={setStatusFilter}>Todos</FilterButton>
            <FilterButton filter="new" activeFilter={statusFilter} setFilter={setStatusFilter}>Novos</FilterButton>
            <FilterButton filter="contacted" activeFilter={statusFilter} setFilter={setStatusFilter}>Contatados</FilterButton>
          </div>
        </div>

        <div className="bg-gray-800 shadow-lg rounded-lg overflow-x-auto">
          <table className="min-w-full leading-normal">
            {/* ... (o resto da tabela continua o mesmo) ... */}
          </table>
        </div>
      </div>
    </main>
  );
}
