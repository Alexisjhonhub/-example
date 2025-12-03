import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, darkMode, toggleTheme }) => {
  const menuItems = [
    { id: 'dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
    { id: 'services', icon: 'fa-car-side', label: 'Operaciones' },
    { id: 'inbox', icon: 'fa-whatsapp', label: 'Mensajes' },
    { id: 'customers', icon: 'fa-users', label: 'Clientes' },
    { id: 'reports', icon: 'fa-file-invoice', label: 'Reportes' },
  ];

  return (
    <div className="w-20 md:w-64 bg-slate-900 dark:bg-slate-950 text-white flex flex-col h-screen sticky top-0 transition-all duration-300 shadow-xl z-50 border-r border-slate-800 dark:border-slate-900">
      <div className="p-4 md:p-6 flex items-center justify-center md:justify-start gap-3 border-b border-slate-800 bg-slate-950">
        <div className="w-10 h-10 md:w-10 md:h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/30">
          <i className="fa-solid fa-soap text-white text-lg"></i>
        </div>
        <div className="hidden md:block">
            <h1 className="font-bold text-lg tracking-tight leading-none text-white">404 Studio</h1>
            <span className="text-xs text-brand-500 font-bold uppercase tracking-widest">Xpress</span>
        </div>
      </div>

      <nav className="flex-1 mt-6 px-2 md:px-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-3 md:px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
              activeTab === item.id
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {activeTab === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/30 rounded-r-full"></div>
            )}
            <i className={`fa-solid ${item.icon} text-lg w-6 text-center group-hover:scale-110 transition-transform ${activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}></i>
            <span className="hidden md:block font-medium tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950/50 space-y-4">
        
        {/* Dark Mode Toggle */}
        <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-800"
        >
            <i className={`fa-solid ${darkMode ? 'fa-sun text-yellow-400' : 'fa-moon text-slate-400'} w-6 text-center`}></i>
            <span className="hidden md:block text-sm font-medium">{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="relative">
            <img src="https://ui-avatars.com/api/?name=Admin+User&background=0ea5e9&color=fff" alt="Admin" className="w-10 h-10 rounded-full border-2 border-slate-700" />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-white">Administrador</p>
            <p className="text-xs text-slate-500">Local Principal</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;