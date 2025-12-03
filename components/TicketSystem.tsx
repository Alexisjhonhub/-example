import React, { useState } from 'react';
import { Customer } from '../types';

interface CustomerCRMProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void; // Not primarily used but kept for interface compat
  onDeleteCustomer: (id: string) => void;
}

// Re-using TicketSystem slot for "Clientes/CRM"
const CustomerCRM: React.FC<CustomerCRMProps> = ({ customers, onDeleteCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.plate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 bg-slate-50 dark:bg-slate-950 h-full overflow-y-auto transition-colors duration-300">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Cartera de Clientes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Historial, fidelización y deudas.</p>
        </div>
      </header>

      <div className="mb-6">
        <div className="relative max-w-md">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-3.5 text-slate-400"></i>
            <input 
                type="text" 
                placeholder="Buscar por nombre o placa..." 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none shadow-sm transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => (
            <div key={customer.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:border-brand-200 dark:hover:border-brand-700 transition-all group relative">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xl group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {customer.name.charAt(0)}
                    </div>
                    {customer.hasDebt && (
                        <span className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                            DEUDA PENDIENTE
                        </span>
                    )}
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{customer.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{customer.phone}</p>
                
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 mb-4 border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Placa Principal</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">{customer.plate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Visitas</span>
                        <span className="font-bold text-brand-600 dark:text-brand-400">{customer.totalVisits}</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                        onClick={() => alert(`Historial detallado de ${customer.name} (Próximamente)`)}
                    >
                        Ver Historial
                    </button>
                    <button 
                        className="w-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:border-green-200 dark:hover:border-green-800"
                        title="Contactar WhatsApp"
                        onClick={() => window.open(`https://wa.me/${customer.phone}`, '_blank')}
                    >
                        <i className="fa-brands fa-whatsapp"></i>
                    </button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerCRM;