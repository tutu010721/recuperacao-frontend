'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Lead = {
  id: string;
  store_id: string;
  store_name: string;
  parsed_data: null | { // Agora permitimos que parsed_data seja nulo
    customer_name: string;
    customer_phone: string;
    total_value: number;
    currency: string;
  };
  status: 'new' | 'contacted' | 'recovered' | 'lost';
  received_at: string;
};

export default function AgentDashboardPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeads = async (token: string) => {
    try {
      setLoading(true);
      const response = await fetch('https://recupera-esprojeto.onrender.com/api/leads', {
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
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/');
    } else {
      fetchLeads(token);
    }
  }, [router]);
  
  const handleUpdateStatus = async (leadId: string, newStatus: Lead['status']) => {
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
        <h1 className="text-4xl font-bold mb-8">Painel do Atendente - Fila de Recuperação</h1>
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
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-700">
                  <td className="px-5 py-4 border-b border-gray-700 text-sm">
                    {/* AQUI ESTÁ A CORREÇÃO com '?.' e '||' */}
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
                    {/* AQUI ESTÁ A CORREÇÃO com '?.' e '||' */}
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
