'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
import { useRouter } from 'next/navigation';

// --- TIPOS DE DADOS ---
type LeadStatus = 'new' | 'contacted' | 'recovered' | 'lost';

type Lead = {
  id: string;
  store_name: string;
  parsed_data: null | {
    customer_name: string;
    customer_email: string;
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

type Note = {
  id: string;
  agent_name: string;
  note: string;
  created_at: string;
};

// --- COMPONENTES AUXILIARES ---
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

const MetricCard = ({ title, value, formatAsCurrency = false }: any) => (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg text-center">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-white">
            {formatAsCurrency ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : value}
        </p>
    </div>
);

// --- PÁGINA PRINCIPAL ---
export default function AgentDashboardPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [availableStores, setAvailableStores] = useState<Store[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [storeFilter, setStoreFilter] = useState('all');

  // --- ESTADOS PARA O MODAL DE ANOTAÇÕES ---
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isNotesLoading, setIsNotesLoading] = useState(false);


  const fetchDashboardData = useCallback(async (token: string) => {
    // ... (código existente, sem alterações)
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
    // ... (código existente, sem alterações)
  };

  // --- FUNÇÕES PARA O MODAL DE ANOTAÇÕES ---
  const openNotesModal = async (lead: Lead) => {
    setSelectedLead(lead);
    setIsNotesLoading(true);
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`https://recupera-esprojeto.onrender.com/api/leads/${lead.id}/notes`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Falha ao buscar anotações.');
      const notesData = await response.json();
      setNotes(notesData);
    } catch (err) {
      alert('Não foi possível carregar as anotações.');
    } finally {
      setIsNotesLoading(false);
    }
  };

  const handleAddNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newNote.trim() || !selectedLead) return;

    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`https://recupera-esprojeto.onrender.com/api/leads/${selectedLead.id}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note: newNote }),
      });
      if (!response.ok) throw new Error('Falha ao adicionar anotação.');
      
      const addedNote = await response.json();
      setNotes(currentNotes => [...currentNotes, addedNote]);
      setNewNote(''); // Limpa o campo
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  const closeModal = () => {
    setSelectedLead(null);
    setNotes([]);
    setNewNote('');
  };


  if (loading && !metrics) { /* ... */ }
  if (error) { /* ... */ }

  return (
    <Fragment>
      <main className="min-h-screen bg-gray-900 text-white p-8">
        <div className="container mx-auto">
          {/* ... (Cabeçalho e Métricas - sem alterações) ... */}
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
              {/* ... (Filtros - sem alterações) ... */}
          </div>

          <div className="bg-gray-800 shadow-lg rounded-lg overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  {/* Coluna "Cliente" agora é clicável */}
                  <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Cliente</th>
                  {/* ... (outros cabeçalhos sem alterações) ... */}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-700">
                    <td className="px-5 py-4 border-b border-gray-700 text-sm">
                      {/* O nome do cliente agora é um botão para abrir o modal */}
                      <button onClick={() => openNotesModal(lead)} className="font-semibold text-indigo-400 hover:underline text-left">
                        {lead.parsed_data?.customer_name || 'Dado não processado'}
                      </button>
                      <p className="text-gray-400 text-xs whitespace-no-wrap">{new Date(lead.received_at).toLocaleString('pt-BR')}</p>
                    </td>
                    {/* ... (outras células sem alterações) ... */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* --- MODAL DE ANOTAÇÕES (Fora do <main>) --- */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <header className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold">Detalhes do Lead: {selectedLead.parsed_data?.customer_name}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">&times;</button>
            </header>
            
            <section className="p-6 flex-grow overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Histórico de Anotações</h3>
              <div className="space-y-4">
                {isNotesLoading ? <p>Carregando anotações...</p> : notes.length > 0 ? (
                  notes.map(note => (
                    <div key={note.id} className="bg-gray-700 p-3 rounded-md">
                      <p className="text-sm">{note.note}</p>
                      <p className="text-xs text-gray-400 mt-2 text-right">
                        - {note.agent_name} em {new Date(note.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  ))
                ) : <p className="text-gray-500">Nenhuma anotação para este lead.</p>}
              </div>
            </section>

            <footer className="p-4 border-t border-gray-700">
              <form onSubmit={handleAddNote}>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Adicionar nova anotação..."
                  rows={3}
                ></textarea>
                <button type="submit" className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
                  Salvar Anotação
                </button>
              </form>
            </footer>
          </div>
        </div>
      )}
    </Fragment>
  );
}
