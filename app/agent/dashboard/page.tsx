'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Tipos de dados
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

type Metrics = {
    awaitingContact: number;
    inRecovery: number;
    recoveredCount: number;
    recoveredValue: number;
    pendingValue: number;
};

// Componentes
const FilterButton = ({ filter, activeFilter, setFilter, children }: {
  filter: LeadStatus | 'all',
  activeFilter: LeadStatus | 'all',
  setFilter: React.Dispatch<React.SetStateAction<LeadStatus | 'all'>>,
  children: React.ReactNode
}) => (
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

const MetricCard = ({ title, value, formatAsCurrency = false }: { title: string, value: number, formatAsCurrency?: boolean}) => (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg text-center">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-white">
            {formatAsCurrency ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : value}
        </p>
    </div>
);

const recoveryMessages = {
  msg1: (name: string) => `Olá ${name}, tudo bem? Vi que você tentou fazer uma compra conosco mas não conseguiu finalizar. Posso te ajudar em algo?`,
  msg2: (name: string) => `Oi ${name}! Só passando para te lembrar da sua compra. Se precisar de ajuda com o pagamento ou tiver alguma dúvida, é só me chamar aqui!`,
  msg3: (name: string) => `E aí, ${name}! Última chance para garantir seu produto. Se finalizar agora, consigo um cupom de desconto especial para você. Vamos fechar?`
};


export default function AgentDashboardPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [availableStores, setAvailableStores] = useState<Store[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: string | null }>({});

  const fetchDashboardData = useCallback(async (token: string) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (storeFilter !== 'all') params.append('storeId', storeFilter);
      const leadsUrl = `https://recupera-esprojeto.onrender.com/api/leads?${params.toString()}`;

      const [storesResponse, metricsResponse, leadsResponse] = await Promise.all([
        fetch('https://recupera-esprojeto.onrender.com/api/agent/stores', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('https://recupera-esprojeto.onrender.com/api/agent/metrics', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(leadsUrl, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!storesResponse.ok || !metricsResponse.ok || !leadsResponse.ok) {
        throw new Error('Falha ao buscar dados. Faça o login novamente.');
      }

      const storesData = await storesResponse.json();
      const metricsData = await metricsResponse.json();
      const leadsData = await leadsResponse.json();

      setAvailableStores(storesData);
      setMetrics(metricsData);
      setLeads(leadsData);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, storeFilter]);


  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/');
    } else {
      fetchDashboardData(token);
    }
  }, [router, fetchDashboardData]);
  
  
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
      // Após sucesso, atualiza tudo para refletir as novas métricas e a lista filtrada
      fetchDashboardData(token);
    } catch (err: any) {
      alert(`Erro: ${err.message}. Revertendo a alteração.`);
      setLeads(originalLeads);
    }
  };

  const handleCopyMessage = (lead: Lead, messageKey: 'msg1' | 'msg2' | 'msg3') => {
    const customerName = lead.parsed_data?.customer_name || 'cliente';
    const message = recoveryMessages[messageKey](customerName.split(' ')[0]);
    navigator.clipboard.writeText(message);
    setCopiedStates(prev => ({ ...prev, [`${lead.id}-${messageKey}`]: 'copied' }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [`${lead.id}-${messageKey}`]: null }));
    }, 2000);
  };

  if (loading && !metrics) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Carregando painel...</div>;
  }
  
  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-red-500">Erro: {error}</div>;
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8">Painel do Atendente</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <MetricCard title="Aguardando Contato" value={metrics?.awaitingContact ?? 0} />
            <MetricCard title="Em Recuperação" value={metrics?.inRecovery ?? 0} />
            <MetricCard title="Vendas Recuperadas" value={metrics?.recoveredCount ?? 0} />
            <MetricCard title="Valor Recuperado" value={metrics?.recoveredValue ?? 0} formatAsCurrency={true} />
            <MetricCard title="Valor Pendente" value={metrics?.pendingValue ?? 0} formatAsCurrency={true} />
        </div>

        <h2 className="text-2xl font-semibold mb-4">Fila de Recuperação</h2>

        <div className="flex flex-wrap gap-4 items-center mb-8">
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
          <div className="flex items-center space-x-2">
            <FilterButton filter="all" activeFilter={statusFilter} setFilter={setStatusFilter}>Todos</FilterButton>
            <FilterButton filter="new" activeFilter={statusFilter} setFilter={setStatusFilter}>Novos</FilterButton>
            <FilterButton filter="contacted" activeFilter={statusFilter} setFilter={setStatusFilter}>Contatados</FilterButton>
            <FilterButton filter="recovered" activeFilter={statusFilter} setFilter={setStatusFilter}>Recuperados</FilterButton>
            <FilterButton filter="lost" activeFilter={statusFilter} setFilter={setStatusFilter}>Perdidos</FilterButton>
          </div>
        </div>

        <div className="bg-gray-800 shadow-lg rounded-lg overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Cliente</th>
                <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Loja</th>
                <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">Valor</th>
                <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">Mensagens</th>
                <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">Carregando...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">Nenhum lead encontrado para este filtro.</td></tr>
              ) : (
                leads.map((lead) => {
                  const isClosed = lead.status === 'recovered' || lead.status === 'lost';
                  return (
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
                    <td className="px-5 py-4 border-b border-gray-700 text-sm text-center">
                        <div className="flex justify-center items-center space-x-2">
                            <button onClick={() => handleCopyMessage(lead, 'msg1')} disabled={isClosed} className={`text-xs font-bold py-1 px-2 rounded transition-colors ${copiedStates[`${lead.id}-msg1`] ? 'bg-green-500 text-white' : 'bg-white text-gray-800 hover:bg-gray-200'} ${isClosed ? 'opacity-50 cursor-not-allowed' : ''}`}>Msg 1</button>
                            <button onClick={() => handleCopyMessage(lead, 'msg2')} disabled={isClosed} className={`text-xs font-bold py-1 px-2 rounded transition-colors ${copiedStates[`${lead.id}-msg2`] ? 'bg-green-500 text-white' : 'bg-white text-gray-800 hover:bg-gray-200'} ${isClosed ? 'opacity-50 cursor-not-allowed' : ''}`}>Msg 2</button>
                            <button onClick={() => handleCopyMessage(lead, 'msg3')} disabled={isClosed} className={`text-xs font-bold py-1 px-2 rounded transition-colors ${copiedStates[`${lead.id}-msg3`] ? 'bg-green-500 text-white' : 'bg-white text-gray-800 hover:bg-gray-200'} ${isClosed ? 'opacity-50 cursor-not-allowed' : ''}`}>Msg 3</button>
                        </div>
                    </td>
                    <td className="px-5 py-4 border-b border-gray-700 text-sm text-center space-x-2">
                       <a href={`https://wa.me/${lead.parsed_data?.customer_phone || ''}`} target="_blank" rel="noopener noreferrer" 
                          onClick={(e) => { if(isClosed) e.preventDefault(); else handleUpdateStatus(lead.id, 'contacted'); }}
                          className={`inline-block text-xs font-bold py-2 px-3 rounded ${isClosed ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-500'}`}>
                          Contato
                       </a>
                       <button onClick={() => handleUpdateStatus(lead.id, 'recovered')} disabled={isClosed} className={`text-xs font-bold py-2 px-3 rounded ${isClosed ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'}`}>Recuperado</button>
                       <button onClick={() => handleUpdateStatus(lead.id, 'lost')} disabled={isClosed} className={`text-xs font-bold py-2 px-3 rounded ${isClosed ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500'}`}>Perdido</button>
                    </td>
                  </tr>
                );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
