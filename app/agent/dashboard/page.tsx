'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Definimos um tipo para o formato dos nossos leads
type Lead = {
  id: string;
  store_id: string;
  raw_data: {
    customer: {
      name: string;
      email: string;
      phone: string;
    };
    transaction?: {
      value: number;
      currency: string;
    };
    product?: {
        name: string;
    }
  };
  status: string;
  received_at: string;
};

export default function AgentDashboardPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Função para buscar os leads da API
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
      return;
    }
    fetchLeads(token);
  }, [router]);
  
  // --- NOVA FUNÇÃO PARA CONTATAR O LEAD E ATUALIZAR O STATUS ---
  const handleContact = async (leadId: string, leadPhone: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      // 1. Chama a API para atualizar o status
      const response = await fetch(`https://recupera-esprojeto.onrender.com/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'contacted' }),
      });

      if (!response.ok) throw new Error('Falha ao atualizar status.');

      const updatedLead = await response.json();

      // 2. Atualiza a lista de leads na tela instantaneamente
      setLeads(currentLeads => 
        currentLeads.map(lead => 
          lead.id === leadId ? updatedLead : lead
        )
      );
      
      // 3. Abre o link do WhatsApp
      const whatsappUrl = `https://wa.me/${leadPhone}`;
      window.open(whatsappUrl, '_blank');

    } catch (err: any) {
      alert(`Erro: ${err.message}`); // Mostra um alerta simples em caso de erro
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Carregando leads...</div>;
  if (error) return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-red-500">Erro: {error}</div>;

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8">Painel do Atendente</h1>
        <div className="space-y-4">
          {leads.length > 0 ? (
            leads.map((lead) => (
              <div key={lead.id} className="bg-gray-800 p-4 rounded-lg shadow-lg flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  {/* --- MOSTRADOR DE STATUS --- */}
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    lead.status === 'new' ? 'bg-blue-500' :
                    lead.status === 'contacted' ? 'bg-yellow-500' :
                    lead.status === 'recovered' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {lead.status}
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold">{lead.raw_data.customer.name}</h2>
                    <p className="text-gray-400">{lead.raw_data.customer.email}</p>
                    <p className="text-sm text-gray-500">Recebido em: {new Date(lead.received_at).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold text-green-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: lead.raw_data.transaction?.currency || 'BRL' }).format(lead.raw_data.transaction?.value || 0)}
                    </p>
                    {/* --- BOTÃO ATUALIZADO --- */}
                    <button
                        onClick={() => handleContact(lead.id, lead.raw_data.customer.phone)}
                        className="mt-2 inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                        Contatar WhatsApp
                    </button>
                </div>
              </div>
            ))
          ) : (
            <p>Nenhum lead para recuperação no momento.</p>
          )}
        </div>
      </div>
    </main>
  );
}
