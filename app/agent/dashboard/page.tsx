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
    transaction?: { // Opcional, pois nem todo evento tem transação
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

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/');
      return;
    }

    const fetchLeads = async () => {
      try {
        const response = await fetch('https://recupera-esprojeto.onrender.com/api/leads', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Falha ao buscar leads. Faça o login novamente.');
        }

        const data: Lead[] = await response.json();
        setLeads(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [router]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Carregando leads...</div>;
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-red-500">Erro: {error}</div>;
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8">Painel do Atendente</h1>
        <div className="space-y-4">
          {leads.length > 0 ? (
            leads.map((lead) => (
              <div key={lead.id} className="bg-gray-800 p-4 rounded-lg shadow-lg flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">{lead.raw_data.customer.name}</h2>
                  <p className="text-gray-400">{lead.raw_data.customer.email}</p>
                  <p className="text-gray-400">Produto: {lead.raw_data.product?.name || 'Não informado'}</p>
                  <p className="text-sm text-gray-500">Recebido em: {new Date(lead.received_at).toLocaleString('pt-BR')}</p>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold text-green-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: lead.raw_data.transaction?.currency || 'BRL' }).format(lead.raw_data.transaction?.value || 0)}
                    </p>
                    <a
                        href={`https://wa.me/${lead.raw_data.customer.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                    >
                        Contatar WhatsApp
                    </a>
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
