import { Customer, PipelineContact, Task, CalendarEvent, FinanceData } from '@/types';

function load<T>(key: string, fallback: T): T {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Demo data
const demoCustomers: Customer[] = [
  {
    id: '1', name: 'Thomas Müller', company: 'Müller Tischlerei', companyType: 'Tischler',
    city: 'München', address: 'Musterstraße 12, 80331 München', phone: '+49 89 1234567',
    email: 'mueller@tischlerei.de', notes: 'Sehr zufrieden mit dem Service',
    partnerSince: '2024-03-15', totalRevenue: 12500,
    monthlyRevenue: { '2024-06': 500, '2024-07': 500, '2024-08': 500, '2024-09': 500, '2024-10': 500, '2024-11': 500, '2024-12': 500, '2025-01': 500, '2025-02': 500, '2025-03': 500 },
    invoices: [
      { id: 'inv1', date: '2025-03-01', amount: 500, status: 'bezahlt', description: 'Voice Agent März' },
      { id: 'inv2', date: '2025-02-01', amount: 500, status: 'bezahlt', description: 'Voice Agent Februar' },
    ],
    voiceAgents: [
      { id: 'va1', name: 'Terminbuchung Bot', prompt: 'Du bist ein freundlicher Assistent für Terminbuchungen...', knowledgebase: 'Öffnungszeiten, Services, Preisliste', phone: '+49 89 9876543', link: 'https://agent.example.com/va1', active: true },
    ],
  },
  {
    id: '2', name: 'Sarah Weber', company: 'Weber Friseursalon', companyType: 'Friseur-Salon',
    city: 'Berlin', address: 'Hauptstraße 45, 10117 Berlin', phone: '+49 30 7654321',
    email: 'sarah@weber-friseur.de', notes: 'Möchte zweiten Agent für Instagram',
    partnerSince: '2024-06-01', totalRevenue: 7500,
    monthlyRevenue: { '2024-08': 450, '2024-09': 450, '2024-10': 450, '2024-11': 450, '2024-12': 450, '2025-01': 450, '2025-02': 450, '2025-03': 450 },
    invoices: [
      { id: 'inv3', date: '2025-03-01', amount: 450, status: 'offen', description: 'Voice Agent März' },
    ],
    voiceAgents: [
      { id: 'va2', name: 'Termin-Assistent', prompt: 'Du bist der Terminassistent des Weber Friseursalons...', knowledgebase: 'Dienstleistungen, Preise, Verfügbarkeiten', phone: '+49 30 1112233', link: 'https://agent.example.com/va2', active: true },
    ],
  },
  {
    id: '3', name: 'Klaus Schmidt', company: 'Schmidt KFZ', companyType: 'KFZ-Werkstatt',
    city: 'Hamburg', address: 'Werkstattweg 8, 20095 Hamburg', phone: '+49 40 5551234',
    email: 'klaus@schmidt-kfz.de', notes: 'Interessiert an Outbound-Calls',
    partnerSince: '2024-01-10', totalRevenue: 18000,
    monthlyRevenue: { '2024-03': 600, '2024-04': 600, '2024-05': 600, '2024-06': 600, '2024-07': 600, '2024-08': 600, '2024-09': 600, '2024-10': 600, '2024-11': 600, '2024-12': 600, '2025-01': 600, '2025-02': 600, '2025-03': 600 },
    invoices: [
      { id: 'inv4', date: '2025-03-01', amount: 600, status: 'bezahlt', description: 'Voice Agent März' },
    ],
    voiceAgents: [
      { id: 'va3', name: 'Service-Hotline', prompt: 'Du bist die Service-Hotline von Schmidt KFZ...', knowledgebase: 'Services, Ersatzteile, Öffnungszeiten', phone: '+49 40 9998877', link: 'https://agent.example.com/va3', active: true },
    ],
  },
];

const demoPipeline: PipelineContact[] = [
  { id: 'p1', name: 'Andrea Fischer', company: 'Fischer Klempnerei', companyType: 'Klempner', phone: '+49 711 1234', email: 'fischer@klempner.de', city: 'Stuttgart', notes: 'Hat Interesse gezeigt nach Demo', stage: 'kontaktiert', value: 500, createdAt: '2025-03-10' },
  { id: 'p2', name: 'Peter Braun', company: 'Braun Elektro', companyType: 'Elektriker', phone: '+49 221 5678', email: 'braun@elektro.de', city: 'Köln', notes: 'Erstkontakt über LinkedIn', stage: 'neu', value: 450, createdAt: '2025-03-18' },
  { id: 'p3', name: 'Lisa Hoffmann', company: 'Hoffmann Dental', companyType: 'Zahnarztpraxis', phone: '+49 69 4321', email: 'hoffmann@dental.de', city: 'Frankfurt', notes: 'Angebot gesendet am 15.03.', stage: 'angebot', value: 700, createdAt: '2025-03-05' },
];

const demoTasks: Task[] = [
  { id: 't1', title: 'Follow-up mit Fischer Klempnerei', description: 'Angebot nachfassen', date: '2025-03-22', time: '10:00', priority: 'hoch', completed: false, createdAt: '2025-03-20' },
  { id: 't2', title: 'Voice Agent für Weber aktualisieren', description: 'Neue Preisliste einpflegen', date: '2025-03-22', time: '14:00', priority: 'mittel', completed: false, createdAt: '2025-03-19' },
  { id: 't3', title: 'Rechnung Schmidt KFZ erstellen', description: 'Monatsrechnung April vorbereiten', date: '2025-03-25', time: '09:00', priority: 'niedrig', completed: false, createdAt: '2025-03-18' },
];

const demoEvents: CalendarEvent[] = [
  { id: 'e1', title: 'Call mit Fischer', date: '2025-03-22', startTime: '10:00', endTime: '10:30', color: 'hsl(160, 84%, 39%)', description: 'Demo-Call' },
  { id: 'e2', title: 'Team Meeting', date: '2025-03-22', startTime: '14:00', endTime: '15:00', color: 'hsl(217, 91%, 60%)', description: 'Wöchentliches Meeting' },
  { id: 'e3', title: 'Braun Elektro Demo', date: '2025-03-24', startTime: '11:00', endTime: '12:00', color: 'hsl(38, 92%, 50%)', description: 'Erstpräsentation' },
];

const demoFinances: FinanceData = {
  currentBalance: 34520,
  fixedMonthlyCosts: [
    { id: 'fc1', description: 'Büro Miete', amount: 800, category: 'Miete', date: '2025-03-01', type: 'fix' },
    { id: 'fc2', description: 'Software Lizenzen', amount: 250, category: 'Software', date: '2025-03-01', type: 'fix' },
    { id: 'fc3', description: 'Telefon & Internet', amount: 80, category: 'Kommunikation', date: '2025-03-01', type: 'fix' },
  ],
  variableMonthlyCosts: [
    { id: 'vc1', description: 'API Kosten (OpenAI, Twilio)', amount: 420, category: 'API', date: '2025-03-15', type: 'variabel' },
    { id: 'vc2', description: 'Marketing', amount: 300, category: 'Marketing', date: '2025-03-10', type: 'variabel' },
  ],
  fixedMonthlyIncome: [
    { description: 'Müller Tischlerei', amount: 500 },
    { description: 'Weber Friseursalon', amount: 450 },
    { description: 'Schmidt KFZ', amount: 600 },
  ],
  monthlyRevenues: {
    '2024-06': 1100, '2024-07': 1100, '2024-08': 1550, '2024-09': 1550, '2024-10': 1550,
    '2024-11': 1550, '2024-12': 1550, '2025-01': 1550, '2025-02': 1550, '2025-03': 1550,
  },
  expenses: [
    { id: 'ex1', description: 'Büro Miete', amount: 800, category: 'Miete', date: '2025-03-01', type: 'fix' },
    { id: 'ex2', description: 'OpenAI API', amount: 320, category: 'API', date: '2025-03-15', type: 'variabel' },
    { id: 'ex3', description: 'Twilio', amount: 100, category: 'API', date: '2025-03-15', type: 'variabel' },
    { id: 'ex4', description: 'LinkedIn Ads', amount: 300, category: 'Marketing', date: '2025-03-10', type: 'variabel' },
    { id: 'ex5', description: 'Software Lizenzen', amount: 250, category: 'Software', date: '2025-03-01', type: 'fix' },
  ],
};

export function getCustomers(): Customer[] { return load('hs_customers', demoCustomers); }
export function saveCustomers(c: Customer[]) { save('hs_customers', c); }
export function getPipeline(): PipelineContact[] { return load('hs_pipeline', demoPipeline); }
export function savePipeline(p: PipelineContact[]) { save('hs_pipeline', p); }
export function getTasks(): Task[] { return load('hs_tasks', demoTasks); }
export function saveTasks(t: Task[]) { save('hs_tasks', t); }
export function getEvents(): CalendarEvent[] { return load('hs_events', demoEvents); }
export function saveEvents(e: CalendarEvent[]) { save('hs_events', e); }
export function getFinances(): FinanceData { return load('hs_finances', demoFinances); }
export function saveFinances(f: FinanceData) { save('hs_finances', f); }
