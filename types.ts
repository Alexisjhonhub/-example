export enum Channel {
  WHATSAPP = 'WhatsApp',
  INSTAGRAM = 'Instagram',
  EMAIL = 'Email',
}

export enum ServiceStatus {
  WAITING = 'En Espera',
  IN_PROCESS = 'En Proceso',
  READY = 'Listo',
  DELIVERED = 'Entregado',
  DEBT = 'Debe',
  CANCELLED = 'Cancelado',
}

export enum ServiceType {
  BASIC = 'Lavado Básico',
  PREMIUM = 'Lavado Premium',
  WAX = 'Encerado',
  DETAIL = 'Detailing Interior',
  FULL = 'Paquete Completo',
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  plate: string; // Primary vehicle
  totalVisits: number;
  totalSpent: number;
  hasDebt: boolean;
}

export interface Message {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  customerName: string;
  plate?: string;
  channel: Channel;
  lastMessage: string;
  unreadCount: number;
  messages: Message[];
  status: 'active' | 'archived';
}

export interface ServiceRecord {
  id: string; // Ticket ID
  plate: string;
  customerName: string;
  phone: string;
  serviceType: string;
  price: number;
  status: ServiceStatus;
  entryTime: string;
  exitTime?: string;
  notes?: string;
}

export interface DashboardMetrics {
  carsInProcess: number;
  carsReady: number;
  revenueToday: number;
  debtCount: number;
  avgServiceTime: string;
}