import { Customer, PipelineContact, Task, CalendarEvent, CalendarCategory, FinanceData, Agent, UploadedInvoice, Project, ProjectTag, MailMessage } from '@/types';

function load<T>(key: string, fallback: T): T {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

const emptyFinances: FinanceData = {
  currentBalance: 0,
  fixedMonthlyCosts: [],
  variableMonthlyCosts: [],
  fixedMonthlyIncome: [],
  monthlyRevenues: {},
  expenses: [],
};

const defaultCalendars: CalendarCategory[] = [
  { id: 'cal-1', name: 'Akquise', color: 'hsl(217, 91%, 60%)' },
  { id: 'cal-2', name: 'Agentbau', color: 'hsl(160, 84%, 39%)' },
  { id: 'cal-3', name: 'Buchhaltung', color: 'hsl(38, 92%, 50%)' },
  { id: 'cal-4', name: 'Kundentermine', color: 'hsl(280, 65%, 60%)' },
];

export function getCustomers(): Customer[] { return load('sc_customers', []); }
export function saveCustomers(c: Customer[]) { save('sc_customers', c); }
export function getPipeline(): PipelineContact[] { return load('sc_pipeline', []); }
export function savePipeline(p: PipelineContact[]) { save('sc_pipeline', p); }
export function getTasks(): Task[] { return load('sc_tasks', []); }
export function saveTasks(t: Task[]) { save('sc_tasks', t); }
export function getEvents(): CalendarEvent[] { return load('sc_events', []); }
export function saveEvents(e: CalendarEvent[]) { save('sc_events', e); }
export function getFinances(): FinanceData { return load('sc_finances', emptyFinances); }
export function saveFinances(f: FinanceData) { save('sc_finances', f); }
export function getCalendars(): CalendarCategory[] { return load('sc_calendars', defaultCalendars); }
export function saveCalendars(c: CalendarCategory[]) { save('sc_calendars', c); }
export function getAgents(): Agent[] { return load('sc_agents', []); }
export function saveAgents(a: Agent[]) { save('sc_agents', a); }
export function getUploadedInvoices(): UploadedInvoice[] { return load('sc_invoices', []); }
export function saveUploadedInvoices(i: UploadedInvoice[]) { save('sc_invoices', i); }

// Projects
export function getProjects(): Project[] { return load('sc_projects', []); }
export function saveProjects(p: Project[]) { save('sc_projects', p); }
export function getProjectTags(): ProjectTag[] { return load('sc_project_tags', []); }
export function saveProjectTags(t: ProjectTag[]) { save('sc_project_tags', t); }

// Mail
export function getMails(): MailMessage[] { return load('sc_mails', []); }
export function saveMails(m: MailMessage[]) { save('sc_mails', m); }
