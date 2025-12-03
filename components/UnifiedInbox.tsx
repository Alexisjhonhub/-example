import React, { useState, useRef, useEffect } from 'react';
import { Conversation, Channel, Message, ServiceRecord } from '../types';
import { generateSmartReply } from '../services/geminiService';

interface UnifiedInboxProps {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  orders: ServiceRecord[]; // Renamed internally but keeping prop name for App.tsx compat
  onDeleteConversation: (id: string) => void;
}

const UnifiedInbox: React.FC<UnifiedInboxProps> = ({ conversations, setConversations, orders: services, onDeleteConversation }) => {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = conversations.find(c => c.id === selectedConvId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedConvId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'agent',
      content: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setConversations(prev => prev.map(c => {
      if (c.id === selectedConvId) {
        return {
          ...c,
          messages: [...c.messages, newMessage],
          lastMessage: inputText,
          unreadCount: 0
        };
      }
      return c;
    }));

    setInputText('');
  };

  const handleGenerateAI = async () => {
    if (!selectedConversation) return;

    setIsGenerating(true);
    
    // 1. Identify Plate
    let detectedPlate = selectedConversation.plate;
    
    // If no plate in profile, scan chat history for regex pattern [A-Z]{3}-[0-9]{3}
    if (!detectedPlate) {
         const allText = selectedConversation.messages.map(m => m.content).join(' ');
         const match = allText.match(/[A-Z]{3}-?\d{3,4}/i);
         if (match) detectedPlate = match[0].toUpperCase();
    }

    // 2. Find relevant service
    let relevantServices: ServiceRecord[] = [];
    if (detectedPlate) {
        relevantServices = services.filter(s => s.plate.replace('-','') === detectedPlate?.replace('-',''));
    } else {
        relevantServices = services.filter(s => s.customerName.toLowerCase().includes(selectedConversation.customerName.toLowerCase()));
    }

    const suggestion = await generateSmartReply(
        selectedConversation.messages, 
        selectedConversation.customerName, 
        detectedPlate,
        relevantServices
    );
    
    setInputText(suggestion);
    setIsGenerating(false);
  };

  const handleDelete = () => {
      if(selectedConvId && window.confirm("¿Eliminar esta conversación?")) {
          onDeleteConversation(selectedConvId);
          setSelectedConvId(null);
      }
  }

  // New function to handle real WhatsApp redirection
  const handleSendWhatsAppReal = () => {
      if (!selectedConversation) return;
      
      // Attempt to find phone number from service records
      let phone = '';
      const relatedService = services.find(s => 
          s.plate === selectedConversation.plate || 
          s.customerName === selectedConversation.customerName
      );

      if (relatedService) {
          phone = relatedService.phone;
      }

      // Fallback: Check if message content has a phone number
      if (!phone) {
          const phoneInput = prompt("No se encontró número registrado. Ingrese el número del cliente (sin código de país):", "");
          if (!phoneInput) return;
          phone = phoneInput;
      }

      // Clean phone number
      phone = phone.replace(/\D/g, ''); // Remove non-digits

      // Format for Peru (+51) if not present
      if (phone.length === 9) {
          phone = '51' + phone;
      }

      const text = encodeURIComponent(inputText);
      window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const getChannelIcon = (channel: Channel) => {
    switch(channel) {
        case Channel.WHATSAPP: return <i className="fa-brands fa-whatsapp text-green-500"></i>;
        case Channel.INSTAGRAM: return <i className="fa-brands fa-instagram text-pink-500"></i>;
        case Channel.EMAIL: return <i className="fa-regular fa-envelope text-blue-500"></i>;
    }
  };

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      {/* Sidebar List */}
      <div className="w-full md:w-96 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
            <div>
                <h2 className="font-bold text-lg text-slate-800 dark:text-white">Buzón de Mensajes</h2>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">404 Studio Xpress</p>
            </div>
            <div className="flex gap-2">
                <button className="text-slate-400 hover:text-brand-500"><i className="fa-solid fa-filter"></i></button>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto">
            {conversations.map(conv => (
                <div 
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${selectedConvId === conv.id ? 'bg-blue-50 dark:bg-slate-800 border-l-4 border-l-brand-500' : ''}`}
                >
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                            {getChannelIcon(conv.channel)}
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{conv.customerName}</span>
                        </div>
                        <span className="text-xs text-slate-400">{conv.messages[conv.messages.length-1]?.timestamp}</span>
                    </div>
                    {conv.plate && <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono mb-1 inline-block">{conv.plate}</span>}
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{conv.lastMessage}</p>
                    {conv.unreadCount > 0 && (
                        <div className="mt-2 flex justify-between items-center">
                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{conv.unreadCount} nuevo</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {selectedConversation ? (
            <>
                <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm z-10">
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold">
                            {selectedConversation.customerName.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white">{selectedConversation.customerName}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                {getChannelIcon(selectedConversation.channel)} via {selectedConversation.channel}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={handleDelete}
                            className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                            title="Archivar"
                        >
                            <i className="fa-solid fa-box-archive"></i>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-100/50 dark:bg-slate-950">
                    {selectedConversation.messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm text-sm ${
                                msg.sender === 'user' 
                                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-700' 
                                : 'bg-brand-600 text-white rounded-tr-none'
                            }`}>
                                <p>{msg.content}</p>
                                <span className={`text-[10px] mt-1 block ${msg.sender === 'user' ? 'text-slate-400' : 'text-brand-200'}`}>
                                    {msg.timestamp}
                                </span>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                    {inputText && isGenerating && (
                         <div className="mb-2 text-xs text-brand-600 dark:text-brand-400 animate-pulse flex items-center gap-2">
                            <i className="fa-solid fa-robot"></i> AutoBot consultando estado del vehículo...
                         </div>
                    )}
                    <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-brand-300 dark:focus-within:border-brand-500 transition-colors">
                        <button 
                            onClick={handleGenerateAI}
                            disabled={isGenerating}
                            className="p-2 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors tooltip flex flex-col items-center justify-center w-12"
                            title="Respuesta Inteligente"
                        >
                             <i className={`fa-solid fa-wand-magic-sparkles text-lg ${isGenerating ? 'fa-beat' : ''}`}></i>
                             <span className="text-[9px] font-bold">Auto</span>
                        </button>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Escribe un mensaje..."
                            className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-sm max-h-32 py-2 text-slate-900 dark:text-white placeholder-slate-400"
                            rows={1}
                        />
                         <button 
                            onClick={handleSendWhatsAppReal}
                            disabled={!inputText.trim()}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md shadow-green-500/30 w-10 flex items-center justify-center"
                            title="Enviar por WhatsApp (+51)"
                        >
                            <i className="fa-brands fa-whatsapp"></i>
                        </button>
                        <button 
                            onClick={handleSendMessage}
                            disabled={!inputText.trim()}
                            className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-md shadow-brand-500/30 w-10 flex items-center justify-center"
                            title="Guardar en Chat (Interno)"
                        >
                            <i className="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 text-center">
                        <i className="fa-brands fa-whatsapp mr-1"></i> El botón verde abrirá WhatsApp Web con tu número (+51).
                    </p>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-950">
                <i className="fa-regular fa-comments text-6xl mb-4 opacity-30"></i>
                <p>Selecciona un cliente para chatear</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedInbox;