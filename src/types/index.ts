export interface Customer {
  id: string;
  name: string;
  company: string;
  companyType: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  notes: string;
  partnerSince: string;
  totalRevenue: number;
  monthlyRevenue: Record<string, number>;
  invoices: Invoice[];
  voiceAgents: VoiceAgent[];
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'bezahlt' | 'offen' | 'überfällig';
  description: string;
}

export interface VoiceAgent {
  id: string;
  name: string;
  prompt: string;
  knowledgebase: string;
  phone: string;
  link: string;
  active: boolean;
}

export interface PipelineContact {
  id: string;
  name: string;
  company: string;
  companyType: string;
  phone: string;
  email: string;
  city: string;
  notes: string;
  stage: 'neu' | 'kontaktiert' | 'angebot' | 'verhandlung' | 'gewonnen' | 'verloren';
  value: number;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  priority: 'niedrig' | 'mittel' | 'hoch' | 'dringend';
  completed: boolean;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
  description: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'fix' | 'variabel';
}

export interface FinanceData {
  currentBalance: number;
  fixedMonthlyCosts: Expense[];
  variableMonthlyCosts: Expense[];
  fixedMonthlyIncome: { description: string; amount: number }[];
  monthlyRevenues: Record<string, number>;
  expenses: Expense[];
}
