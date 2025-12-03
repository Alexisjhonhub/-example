import React, { useState } from 'react';
import { ServiceRecord, ServiceStatus, ServiceType } from '../types';

// Declare globals for the CDN libraries
declare global {
    interface Window {
        html2canvas: any;
        jspdf: any;
    }
}

interface ServiceManagerProps {
  orders: ServiceRecord[];
  onAddOrder: (service: ServiceRecord) => void;
  onDeleteOrder: (id: string) => void;
}

// Reuse the "Orders" component slot but re-engineer it for Car Wash Services
const ServiceManager: React.FC<ServiceManagerProps> = ({ orders: services, onAddOrder: onAddService, onDeleteOrder: onDeleteService }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoiceService, setInvoiceService] = useState<ServiceRecord | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    plate: '',
    customerName: '',
    phone: '',
    serviceType: ServiceType.BASIC,
    price: 25,
    status: ServiceStatus.WAITING,
    notes: ''
  });

  // Filter services based on search
  const filteredServices = services.filter(service => 
    service.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (service: ServiceRecord) => {
    setEditingId(service.id);
    setFormData({
        plate: service.plate,
        customerName: service.customerName,
        phone: service.phone,
        serviceType: service.serviceType as ServiceType,
        price: service.price,
        status: service.status,
        notes: service.notes || ''
    });
    setIsModalOpen(true);
  }

  const handleUpdateStatus = (id: string, newStatus: ServiceStatus) => {
      const service = services.find(s => s.id === id);
      if (service) {
          // This simulates an update. In a real app we'd need an onUpdate prop
          onDeleteService(id);
          onAddService({ ...service, status: newStatus });
      }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
        onDeleteService(editingId);
    }

    const newService: ServiceRecord = {
      id: editingId || `TKT-${Date.now().toString().slice(-4)}`,
      plate: formData.plate.toUpperCase(),
      customerName: formData.customerName,
      phone: formData.phone,
      serviceType: formData.serviceType,
      price: Number(formData.price),
      status: formData.status,
      entryTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      notes: formData.notes
    };

    onAddService(newService);
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ plate: '', customerName: '', phone: '', serviceType: ServiceType.BASIC, price: 25, status: ServiceStatus.WAITING, notes: '' });
  };

  const getStatusColor = (status: ServiceStatus) => {
    switch(status) {
        case ServiceStatus.READY: return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800';
        case ServiceStatus.IN_PROCESS: return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800';
        case ServiceStatus.WAITING: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
        case ServiceStatus.DELIVERED: return 'bg-slate-800 text-white border-slate-900 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600';
        case ServiceStatus.DEBT: return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800';
        case ServiceStatus.CANCELLED: return 'bg-red-50 text-red-400 border-red-100 line-through dark:bg-red-900/20 dark:text-red-500 dark:border-red-900';
    }
  };

  // Helper to construct the invoice text
  const getInvoiceText = (service: ServiceRecord) => {
      const date = new Date().toLocaleDateString();
      return `🧾 *BOLETA DE VENTA ELECTRÓNICA*
*404 STUDIO XPRESS*
----------------------------
Ticket: #${service.id}
Fecha: ${date}
Cliente: ${service.customerName}
Placa: ${service.plate}
----------------------------
DESCRIPCIÓN          IMPORTE
${service.serviceType}    S/ ${service.price.toFixed(2)}
----------------------------
*TOTAL: S/ ${service.price.toFixed(2)}*
----------------------------
Gracias por su visita! 🚗✨
`;
  };

  // Helper to open WhatsApp
  const openWhatsAppLink = (phone: string, text: string) => {
      // Clean phone number: remove non-digits
      let cleanPhone = phone.replace(/\D/g, '');
      // Add Peru prefix if missing (assuming 9 digit numbers are local mobile)
      if (cleanPhone.length === 9) {
          cleanPhone = '51' + cleanPhone;
      }
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
  };

  const sendWhatsApp = (service: ServiceRecord) => {
      const message = getInvoiceText(service);
      openWhatsAppLink(service.phone, message);
  };

  const sendInvoiceWhatsApp = () => {
      if (!invoiceService) return;
      const message = getInvoiceText(invoiceService);
      openWhatsAppLink(invoiceService.phone, message);
  };

  const downloadInvoicePDF = async () => {
      if (!invoiceService) return;
      setIsDownloading(true);
      
      try {
          const element = document.getElementById('printable-invoice');
          if (!element || !window.html2canvas || !window.jspdf) {
              alert("Error al cargar librerías de PDF.");
              return;
          }

          // Generate Canvas from HTML
          const canvas = await window.html2canvas(element, { scale: 2, useCORS: true });
          const imgData = canvas.toDataURL('image/png');

          // Initialize PDF
          const { jsPDF } = window.jspdf;
          // Use 'p', 'mm', [width, height] for custom thermal paper size logic if needed, 
          // but A4 or formatted A6 is safer for general use. Let's use A6 for a "Boleta" feel.
          const doc = new jsPDF('p', 'mm', 'a6');
          
          const imgProps = doc.getImageProperties(imgData);
          const pdfWidth = doc.internal.pageSize.getWidth();
          // Calculate height to keep aspect ratio
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          // Add image to PDF
          doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          
          // Download
          doc.save(`Boleta-${invoiceService.id}.pdf`);

      } catch (error) {
          console.error("PDF Error", error);
          alert("Error al generar PDF.");
      } finally {
          setIsDownloading(false);
      }
  };

  const openInvoice = (service: ServiceRecord) => {
      setInvoiceService(service);
  };

  return (
    <div className="p-6 md:p-10 bg-slate-50 dark:bg-slate-950 h-full overflow-y-auto transition-colors duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Operaciones y Ventas</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Base de datos de servicios, tickets y facturación.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
             <div className="relative">
                <i className="fa-solid fa-search absolute left-3 top-3 text-slate-400"></i>
                <input 
                    type="text" 
                    placeholder="Buscar venta (Placa, Cliente...)" 
                    className="w-full md:w-64 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button 
                onClick={() => {
                    setEditingId(null);
                    setFormData({ plate: '', customerName: '', phone: '', serviceType: ServiceType.BASIC, price: 25, status: ServiceStatus.WAITING, notes: '' });
                    setIsModalOpen(true);
                }}
                className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-brand-500/30 font-bold transition-all flex items-center justify-center gap-2"
            >
                <i className="fa-solid fa-car"></i> Nuevo Ingreso
            </button>
        </div>
      </header>

      {/* Kanban-lite Cards for Mobile / Table for Desktop */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                    <tr>
                        <th className="px-6 py-4">Ticket / Hora</th>
                        <th className="px-6 py-4">Vehículo</th>
                        <th className="px-6 py-4">Servicio</th>
                        <th className="px-6 py-4">Estado</th>
                        <th className="px-6 py-4 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {filteredServices.map((service) => (
                        <tr key={service.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="px-6 py-4">
                                <span className="text-xs font-mono text-slate-400 dark:text-slate-500 block">{service.id}</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{service.entryTime}</span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 text-xs border-2 border-slate-300 dark:border-slate-600">
                                        {service.plate.slice(0,3)}<br/>{service.plate.slice(4)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">{service.plate}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{service.customerName}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="block font-medium text-slate-700 dark:text-slate-300">{service.serviceType}</span>
                                <span className="text-xs text-brand-600 dark:text-brand-400 font-bold">S/ {service.price.toFixed(2)}</span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase text-center border ${getStatusColor(service.status)}`}>
                                        {service.status}
                                    </span>
                                    
                                    {/* Quick State Toggles */}
                                    <div className="flex gap-1 justify-center">
                                        {service.status === ServiceStatus.WAITING && (
                                             <button onClick={() => handleUpdateStatus(service.id, ServiceStatus.IN_PROCESS)} className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50">Iniciar</button>
                                        )}
                                        {service.status === ServiceStatus.IN_PROCESS && (
                                             <button onClick={() => handleUpdateStatus(service.id, ServiceStatus.READY)} className="text-[10px] bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300 px-2 py-1 rounded hover:bg-green-100 dark:hover:bg-green-900/50">Terminar</button>
                                        )}
                                        {service.status === ServiceStatus.READY && (
                                             <button onClick={() => handleUpdateStatus(service.id, ServiceStatus.DELIVERED)} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600">Entregar</button>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                    <button 
                                        onClick={() => openInvoice(service)}
                                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
                                        title="Ver Boleta"
                                    >
                                        <i className="fa-solid fa-receipt"></i>
                                    </button>
                                    
                                    {/* Botón WhatsApp Directo con Factura */}
                                    <button 
                                        onClick={() => sendWhatsApp(service)}
                                        className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 shadow-md shadow-green-500/20 tooltip"
                                        title="Enviar Boleta por WhatsApp"
                                    >
                                        <i className="fa-brands fa-whatsapp"></i>
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleEdit(service)}
                                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-500 dark:hover:text-brand-400"
                                        title="Editar"
                                    >
                                        <i className="fa-solid fa-pen"></i>
                                    </button>
                                    <button 
                                        onClick={() => { if(window.confirm('¿Está seguro de eliminar este registro? Esta acción no se puede deshacer.')) onDeleteService(service.id) }}
                                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400"
                                        title="Eliminar Registro"
                                    >
                                        <i className="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                     {filteredServices.length === 0 && (
                        <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500">
                                <i className="fa-solid fa-soap text-4xl mb-4 opacity-20 block"></i>
                                {services.length === 0 ? "No hay autos en el taller." : "No se encontraron resultados para tu búsqueda."}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg transition-colors border border-slate-100 dark:border-slate-700">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800 rounded-t-2xl">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editingId ? 'Editar Servicio' : 'Nuevo Ingreso Vehicular'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Placa</label>
                            <input 
                                required
                                autoFocus
                                type="text" 
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-mono text-lg uppercase placeholder:text-slate-300 dark:text-white"
                                value={formData.plate}
                                onChange={e => setFormData({...formData, plate: e.target.value.toUpperCase()})}
                                placeholder="ABC-123"
                            />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Teléfono</label>
                            <input 
                                type="tel" 
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                placeholder="999..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Cliente</label>
                        <input 
                            required
                            type="text" 
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                            value={formData.customerName}
                            onChange={e => setFormData({...formData, customerName: e.target.value})}
                            placeholder="Nombre del conductor"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tipo de Servicio</label>
                            <select 
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                                value={formData.serviceType}
                                onChange={e => setFormData({...formData, serviceType: e.target.value as ServiceType})}
                            >
                                {Object.values(ServiceType).map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Precio (S/)</label>
                            <input 
                                type="number" 
                                min="0"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                                value={formData.price}
                                onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                            />
                        </div>
                    </div>

                    <div>
                         <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Estado</label>
                        <select 
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                            value={formData.status}
                            onChange={e => setFormData({...formData, status: e.target.value as ServiceStatus})}
                        >
                            {Object.values(ServiceStatus).map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Notas</label>
                        <textarea 
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none h-20 dark:text-white"
                            value={formData.notes}
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                            placeholder="Observaciones adicionales..."
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button 
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-600 font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-lg shadow-brand-500/30"
                        >
                            {editingId ? 'Guardar Cambios' : 'Registrar Ingreso'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Invoice Modal (Simplified Boleta) */}
      {invoiceService && (
        <div id="invoice-modal" className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden relative border border-slate-100 dark:border-slate-700 font-mono text-sm">
                {/* Close Button - Hidden in Print */}
                <button 
                    onClick={() => setInvoiceService(null)} 
                    className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 z-10 no-print"
                >
                    <i className="fa-solid fa-xmark text-xl"></i>
                </button>

                {/* Printable Area - Thermal Receipt Style */}
                <div id="printable-invoice" className="p-6 bg-white text-slate-900">
                    <div className="text-center mb-4">
                         <h2 className="text-xl font-bold uppercase tracking-wider">404 STUDIO XPRESS</h2>
                         <p className="text-xs text-slate-500">RUC: 20601234567</p>
                         <p className="text-xs text-slate-500">Av. Principal 123, Lima, Perú</p>
                         <p className="text-xs text-slate-500 mt-1">Cel: 987 654 321</p>
                    </div>

                    <div className="text-center border-t border-b border-dashed border-slate-300 py-2 mb-4">
                        <h3 className="font-bold text-lg">BOLETA DE VENTA</h3>
                        <p className="text-xs">SERIE B001 - {invoiceService.id}</p>
                    </div>

                    <div className="mb-4 text-xs uppercase leading-relaxed">
                        <div className="flex justify-between">
                            <span>Fecha:</span>
                            <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Cliente:</span>
                            <span className="text-right">{invoiceService.customerName}</span>
                        </div>
                         <div className="flex justify-between">
                            <span>Placa:</span>
                            <span>{invoiceService.plate}</span>
                        </div>
                    </div>

                    <table className="w-full text-xs uppercase mb-4">
                        <thead className="border-b border-dashed border-slate-300">
                            <tr>
                                <th className="text-left py-1">Cant.</th>
                                <th className="text-left py-1">Descripción</th>
                                <th className="text-right py-1">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="py-2">1</td>
                                <td className="py-2">{invoiceService.serviceType}</td>
                                <td className="text-right py-2">{invoiceService.price.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="border-t border-dashed border-slate-300 pt-2 mb-6">
                        <div className="flex justify-between font-bold text-lg">
                            <span>TOTAL A PAGAR</span>
                            <span>S/ {invoiceService.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>Op. Gravada</span>
                            <span>S/ {(invoiceService.price / 1.18).toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between text-xs text-slate-500">
                            <span>IGV (18%)</span>
                            <span>S/ {(invoiceService.price - (invoiceService.price / 1.18)).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="text-center text-xs text-slate-500">
                        <p>¡Gracias por su preferencia!</p>
                        <p className="mt-1">Representación Impresa de la<br/>Boleta de Venta Electrónica</p>
                    </div>
                </div>

                {/* Actions Footer - Hidden in Print */}
                <div className="bg-slate-50 dark:bg-slate-800 p-4 border-t border-slate-100 dark:border-slate-700 flex gap-2 no-print">
                    <button 
                        onClick={sendInvoiceWhatsApp}
                        className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1"
                        title="Enviar por WhatsApp"
                    >
                        <i className="fa-brands fa-whatsapp"></i> WhatsApp
                    </button>
                     <button 
                        onClick={downloadInvoicePDF}
                        disabled={isDownloading}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1"
                    >
                        {isDownloading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-file-pdf"></i>}
                        PDF
                    </button>
                    <button 
                        onClick={() => window.print()}
                        className="flex-1 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1"
                    >
                        <i className="fa-solid fa-print"></i>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManager;