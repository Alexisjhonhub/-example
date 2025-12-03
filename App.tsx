import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import UnifiedInbox from './components/UnifiedInbox';
import CustomerCRM from './components/TicketSystem'; // Logic reused from TicketSystem
import ServiceManager from './components/Orders'; // Logic reused from Orders
import { MOCK_CONVERSATIONS, MOCK_SERVICES, MOCK_CUSTOMERS } from './constants';
import { generateDailyReport } from './services/geminiService';
import { ServiceRecord, Customer, Conversation, DashboardMetrics, ServiceStatus } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [generatedReport, setGeneratedReport] = useState('');
  const [loadingReport, setLoadingReport] = useState(false);

  // --- THEME STATE ---
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('carwash_theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('carwash_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('carwash_theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  // --- STATE WITH PERSISTENCE (CarWash Context) ---
  
  const [services, setServices] = useState<ServiceRecord[]>(() => {
    const saved = localStorage.getItem('carwash_services');
    return saved ? JSON.parse(saved) : MOCK_SERVICES;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('carwash_customers');
    return saved ? JSON.parse(saved) : MOCK_CUSTOMERS;
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('carwash_conversations');
    return saved ? JSON.parse(saved) : MOCK_CONVERSATIONS;
  });

  useEffect(() => {
    localStorage.setItem('carwash_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('carwash_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('carwash_conversations', JSON.stringify(conversations));
  }, [conversations]);

  // --- LOGIC ---

  const calculateMetrics = (): DashboardMetrics => {
    const inProcess = services.filter(s => s.status === ServiceStatus.IN_PROCESS || s.status === ServiceStatus.WAITING).length;
    const ready = services.filter(s => s.status === ServiceStatus.READY).length;
    
    // Revenue logic (simplified)
    const revenue = services
        .filter(s => s.status === ServiceStatus.DELIVERED || s.status === ServiceStatus.READY)
        .reduce((sum, s) => sum + s.price, 0);

    const debtCount = services.filter(s => s.status === ServiceStatus.DEBT).length;

    return {
        carsInProcess: inProcess,
        carsReady: ready,
        revenueToday: revenue,
        debtCount: debtCount,
        avgServiceTime: "45 min"
    };
  };

  const metrics = calculateMetrics();

  const handleAddService = (newService: ServiceRecord) => {
    setServices(prev => [newService, ...prev]);
    
    // Auto-create or update customer
    const existingCust = customers.find(c => c.name === newService.customerName || c.plate === newService.plate);
    if (!existingCust) {
        const newCust: Customer = {
            id: `C-${Date.now()}`,
            name: newService.customerName,
            phone: newService.phone,
            plate: newService.plate,
            totalVisits: 1,
            totalSpent: newService.price,
            hasDebt: false
        };
        setCustomers(prev => [...prev, newCust]);
    } else {
        // Update customer stats
        setCustomers(prev => prev.map(c => {
            if(c.id === existingCust.id) {
                return {
                    ...c,
                    totalVisits: c.totalVisits + 1,
                    totalSpent: c.totalSpent + newService.price
                };
            }
            return c;
        }));
    }
  };

  const handleDeleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const handleAddCustomer = (newCustomer: Customer) => {
      setCustomers(prev => [newCustomer, ...prev]);
  };

  const handleDeleteCustomer = (id: string) => {
      setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
  };

  const handleGenerateReport = async () => {
    setReportModalOpen(true);
    setLoadingReport(true);
    const report = await generateDailyReport(metrics, services);
    setGeneratedReport(report);
    setLoadingReport(false);
  };

  // Render logic based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard metrics={metrics} services={services} />;
      case 'inbox':
        return (
            <UnifiedInbox 
                conversations={conversations} 
                setConversations={setConversations}
                orders={services} 
                onDeleteConversation={handleDeleteConversation}
            />
        );
      case 'customers':
        return (
            <CustomerCRM 
                customers={customers} 
                onAddCustomer={handleAddCustomer} 
                onDeleteCustomer={handleDeleteCustomer}
            />
        );
      case 'services':
        return (
            <ServiceManager 
                orders={services} 
                onAddOrder={handleAddService} 
                onDeleteOrder={handleDeleteService}
            />
        );
      case 'reports':
        return (
            <div className="p-10 flex flex-col items-center justify-center h-full text-center">
                <div className="max-w-md">
                    <div className="w-20 h-20 bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-200 dark:shadow-none">
                        <i className="fa-solid fa-wand-magic-sparkles text-3xl"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Asistente Gerencial IA</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">Genera un análisis completo del día: ingresos, cuellos de botella en lavado y recomendaciones operativas.</p>
                    <button 
                        onClick={handleGenerateReport}
                        className="bg-slate-900 dark:bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-brand-700 transition-all shadow-lg shadow-slate-900/20"
                    >
                        Generar Reporte Diario
                    </button>
                    
                    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-xs text-slate-400 mb-2">Configuración</p>
                        <button 
                            onClick={() => {
                                if(window.confirm("¿Reiniciar sistema a valores de fábrica?")) {
                                    localStorage.clear();
                                    window.location.reload();
                                }
                            }}
                            className="text-xs text-red-400 hover:text-red-600 underline"
                        >
                            Resetear Base de Datos
                        </button>
                    </div>
                </div>
            </div>
        );
      default:
        return <div>Seleccione una opción</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} darkMode={darkMode} toggleTheme={toggleTheme} />
      <main className="flex-1 overflow-auto relative">
        {renderContent()}
      </main>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-slate-100 dark:border-slate-700">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                        {loadingReport ? 'Analizando operaciones...' : 'Reporte Diario - 404 Studio Xpress'}
                    </h3>
                    <button onClick={() => setReportModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    {loadingReport ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <i className="fa-solid fa-circle-notch fa-spin text-4xl text-brand-500"></i>
                            <p className="text-slate-500 dark:text-slate-400 animate-pulse">Gemini está calculando tiempos de lavado...</p>
                        </div>
                    ) : (
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                            <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">{generatedReport}</div>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl flex justify-end gap-3">
                    <button onClick={() => setReportModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">Cerrar</button>
                    <button 
                        onClick={() => window.print()}
                        disabled={loadingReport}
                        className="px-4 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow-md disabled:opacity-50"
                    >
                        <i className="fa-solid fa-print mr-2"></i> Imprimir
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;