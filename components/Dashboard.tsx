import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DashboardMetrics, ServiceType, ServiceRecord } from '../types';

interface DashboardProps {
  metrics: DashboardMetrics;
  services: ServiceRecord[];
}

const COLORS = ['#0ea5e9', '#0284c7', '#38bdf8', '#075985', '#6366f1'];

const Dashboard: React.FC<DashboardProps> = ({ metrics, services }) => {

  // Calculate Real-time Hourly Traffic
  const dataHours = useMemo(() => {
    // Initialize chart buckets (e.g. 8AM to 6PM)
    const hoursMap = new Map<number, number>();
    const startHour = 8;
    const endHour = 20;

    for (let i = startHour; i <= endHour; i++) {
        hoursMap.set(i, 0);
    }

    // Process all services
    services.forEach(service => {
        try {
            // Attempt to parse "14:30" or "2:30 PM"
            // Simple heuristic: grab the first number
            const timeStr = service.entryTime;
            let hour = parseInt(timeStr.split(':')[0]);
            
            // Adjust for PM if needed (simple check)
            if (timeStr.toLowerCase().includes('pm') && hour < 12) {
                hour += 12;
            }
            if (timeStr.toLowerCase().includes('am') && hour === 12) {
                hour = 0;
            }

            // Fallback for 24h format if no AM/PM
            if (!timeStr.toLowerCase().includes('m') && hour < 8) {
                 // Assume early hours might be errors or 24h, but let's stick to the map range
            }

            if (hoursMap.has(hour)) {
                hoursMap.set(hour, (hoursMap.get(hour) || 0) + 1);
            }
        } catch (e) {
            console.error("Error parsing time for chart", service.entryTime);
        }
    });

    // Convert to Recharts format
    return Array.from(hoursMap.entries()).map(([hour, count]) => ({
        name: hour > 12 ? `${hour - 12}PM` : (hour === 12 ? '12PM' : `${hour}AM`),
        cars: count
    }));
  }, [services]);

  // Calculate Real-time Service Distribution
  const dataServices = useMemo(() => {
      const typeCounts: Record<string, number> = {};
      
      services.forEach(s => {
          typeCounts[s.serviceType] = (typeCounts[s.serviceType] || 0) + 1;
      });

      const chartData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
      
      // If empty, return a placeholder so the pie chart isn't invisible
      if (chartData.length === 0) return [{ name: 'Sin datos', value: 1 }];
      
      return chartData;
  }, [services]);

  return (
    <div className="p-6 md:p-10 bg-slate-50 dark:bg-slate-950 min-h-full transition-colors duration-300">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
            <span className="bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-300 text-xs font-bold px-2.5 py-0.5 rounded border border-brand-200 dark:border-brand-800">SEDE CENTRAL</span>
            <span className="text-slate-400 dark:text-slate-500 text-xs font-mono">{new Date().toLocaleDateString()}</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard Operativo</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Monitoreo de flujo vehicular y servicios.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase">Autos en Proceso</p>
                    <h3 className="text-4xl font-bold text-slate-800 dark:text-white mt-2">{metrics.carsInProcess}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl">
                    <i className="fa-solid fa-soap"></i>
                </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{width: '60%'}}></div>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Capacidad dinámica</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase">Autos Listos</p>
                    <h3 className="text-4xl font-bold text-slate-800 dark:text-white mt-2">{metrics.carsReady}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center text-xl">
                    <i className="fa-solid fa-check-double"></i>
                </div>
            </div>
             <p className="text-xs text-green-600 dark:text-green-400 mt-4 font-bold bg-green-50 dark:bg-green-900/30 inline-block px-2 py-1 rounded">
                <i className="fa-brands fa-whatsapp mr-1"></i> Notificar
             </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase">Ingresos Hoy</p>
                    <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">S/ {metrics.revenueToday.toFixed(2)}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xl">
                    <i className="fa-solid fa-cash-register"></i>
                </div>
            </div>
             <p className="text-xs text-green-500 dark:text-green-400 mt-4 font-semibold"><i className="fa-solid fa-arrow-up"></i> Calculado en vivo</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition-all border-l-4 border-l-red-500">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase">Por Cobrar (Deuda)</p>
                    <h3 className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{metrics.debtCount}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center text-xl">
                    <i className="fa-solid fa-file-invoice-dollar"></i>
                </div>
            </div>
             <p className="text-xs text-red-500 dark:text-red-400 mt-4 font-medium">Autos entregados sin pagar</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 dark:text-white">Flujo Vehicular por Hora (Tiempo Real)</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">Hoy</span>
            </div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataHours}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.2} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                            cursor={{fill: '#f0f9ff', opacity: 0.1}}
                        />
                        <Bar dataKey="cars" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
            <h3 className="font-bold text-slate-800 dark:text-white mb-6">Tipos de Servicio</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={dataServices}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {dataServices.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
                {dataServices.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">{entry.name} ({entry.value})</span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;