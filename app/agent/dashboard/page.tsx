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

const FilterButton = ({ filter, activeFilter, setFilter, children }: { filter: string, activeFilter: string, setFilter: (filter: string) => void, children: React.ReactNode }) => (
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
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchLeads = useCallback(async (token: string, filter: string) => {
    try {
      setLoading(true);
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
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/');
    } else {
      fetchLeads(token, activeFilter);
    }
  }, [router, fetchLeads, activeFilter]);
  
  const handleUpdateStatus = async (leadId: string, newStatus: LeadStatus) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const originalLeads = [...leads];
    
    setLeads(currentLeads =>
      currentLeads.map(lead =>
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      )
    );

    try {
      const response = await fetch(`https://recupera-esprojeto.onrender.com/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar status na API.');
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}. Revertendo a alteração.`);
      setLeads(originalLeads);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Carregando leads...</div>;
  }
  
  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-red-500">Erro: {error}</div>;
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-4">Painel do Atendente</h1>
        <p className="text-gray-400 mb-8">Fila de Recuperação</p>

        <div className="flex space-x-2 mb-8">
          <FilterButton filter="all" activeFilter={activeFilter} setFilter={setActiveFilter}>Todos</FilterButton>
          <FilterButton filter="new" activeFilter={activeFilter} setFilter={setActiveFilter}>Novos</FilterButton>
          <FilterButton filter="contacted" activeFilter={activeFilter} setFilter={setActiveFilter}>Contatados</FilterButton>
          <FilterButton filter="recovered" activeFilter={activeFilter} setFilter={setActiveFilter}>Recuperados</FilterButton>
          <FilterButton filter="lost" activeFilter={activeFilter} setFilter={setActiveFilter}>Perdidos</FilterButton>
        </div>

        <div className="bg-gray-800 shadow-lg rounded-lg overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Cliente</th>
                <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Loja</th>
                <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">Valor</th>
                <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading === false && leads.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">
                    Nenhum lead encontrado para este filtro.
                  </td>
                </tr>
              )}
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-700">
                  <td className="px-5 py-4 border-b border-gray-700 text-sm">
                    <p className="font-semibold whitespace-no-wrap">{lead.parsed_data?.customer_name || 'Dado não processado'}</p>
                    <p className="text-gray-400 text-xs whitespace-no-wrap">{new Date(lead.received_at).toLocaleString('pt-BR')}</p>
                  </td>
                  <td className="px-5 py-4 border-b border-gray-700 text-sm">
                    <p className="text-gray-300 whitespace-no-wrap">{lead.store_name}</p>
                  </td>
                  <td className="px-5 py-4 border-b border-gray-700 text-sm">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full whitespace-no-wrap ${
                      lead.status === 'new' ? 'bg-blue-600 text-blue-100' :
                      lead.status === 'contacted' ? 'bg-yellow-600 text-yellow-100' :
                      lead.status === 'recovered' ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
                    }`}>
                      {lead.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 border-b border-gray-700 text-sm text-right font-semibold text-green-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: lead.parsed_data?.currency || 'BRL' }).format(lead.parsed_data?.total_value || 0)}
                  </td>
                  <td className="px-5 py-4 border-b border-gray-700 text-sm text-center space-x-2">
                     <a href={`https://wa.me/${lead.parsed_data?.customer_phone || ''}`} target="_blank" rel="noopener noreferrer" 
                        onClick={() => handleUpdateStatus(lead.id, 'contacted')}
                        className="text-xs bg-gray-600 hover:bg-gray-500 font-bold py-2 px-3 rounded">
                        Contato
                     </a>
                     <button onClick={() => handleUpdateStatus(lead.id, 'recovered')} className="text-xs bg-green-600 hover:bg-green-500 font-bold py-2 px-3 rounded">Recuperado</button>
                     <button onClick={() => handleUpdateStatus(lead.id, 'lost')} className="text-xs bg-red-600 hover:bg-red-500 font-bold py-2 px-3 rounded">Perdido</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
