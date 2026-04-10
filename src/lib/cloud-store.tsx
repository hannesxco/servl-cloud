import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Customer, PipelineContact, Task, CalendarEvent, CalendarCategory, FinanceData, Agent, UploadedInvoice, Project, ProjectTag, MailMessage } from '@/types';

const defaultCalendars: CalendarCategory[] = [
  { id: 'cal-1', name: 'Akquise', color: 'hsl(217, 91%, 60%)' },
  { id: 'cal-2', name: 'Agentbau', color: 'hsl(160, 84%, 39%)' },
  { id: 'cal-3', name: 'Buchhaltung', color: 'hsl(38, 92%, 50%)' },
  { id: 'cal-4', name: 'Kundentermine', color: 'hsl(280, 65%, 60%)' },
];

const emptyFinances: FinanceData = {
  currentBalance: 0,
  fixedMonthlyCosts: [],
  variableMonthlyCosts: [],
  fixedMonthlyIncome: [],
  monthlyRevenues: {},
  expenses: [],
};

interface StoreData {
  sc_customers: Customer[];
  sc_pipeline: PipelineContact[];
  sc_tasks: Task[];
  sc_events: CalendarEvent[];
  sc_finances: FinanceData;
  sc_calendars: CalendarCategory[];
  sc_agents: Agent[];
  sc_invoices: UploadedInvoice[];
  sc_projects: Project[];
  sc_project_tags: ProjectTag[];
  sc_mails: MailMessage[];
}

const defaults: StoreData = {
  sc_customers: [],
  sc_pipeline: [],
  sc_tasks: [],
  sc_events: [],
  sc_finances: emptyFinances,
  sc_calendars: defaultCalendars,
  sc_agents: [],
  sc_invoices: [],
  sc_projects: [],
  sc_project_tags: [],
  sc_mails: [],
};

interface CloudStoreContextType {
  data: StoreData;
  loading: boolean;
  update: <K extends keyof StoreData>(key: K, value: StoreData[K]) => void;
}

const CloudStoreContext = createContext<CloudStoreContextType>({
  data: defaults,
  loading: true,
  update: () => {},
});

export function CloudStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoreData>(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const { data: rows, error } = await supabase
          .from('app_data')
          .select('key, value');

        if (error) {
          console.error('Failed to load cloud data:', error);
          // Fall back to localStorage
          setData(loadFromLocalStorage());
          setLoading(false);
          return;
        }

        const loaded = { ...defaults };
        if (rows) {
          for (const row of rows) {
            const key = row.key as keyof StoreData;
            if (key in loaded) {
              (loaded as any)[key] = row.value;
            }
          }
        }
        setData(loaded);
      } catch (err) {
        console.error('Cloud store error:', err);
        setData(loadFromLocalStorage());
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  const update = useCallback(<K extends keyof StoreData>(key: K, value: StoreData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));

    // Write-through to Supabase (fire-and-forget)
    supabase
      .from('app_data')
      .update({ value: value as any, updated_at: new Date().toISOString() })
      .eq('key', key)
      .then(({ error }) => {
        if (error) console.error(`Failed to save ${key}:`, error);
      });
  }, []);

  return (
    <CloudStoreContext.Provider value={{ data, loading, update }}>
      {children}
    </CloudStoreContext.Provider>
  );
}

export function useCloudStore() {
  return useContext(CloudStoreContext);
}

// Convenience hooks
export function useCustomers() {
  const { data, update } = useCloudStore();
  return {
    customers: data.sc_customers,
    saveCustomers: (c: Customer[]) => update('sc_customers', c),
  };
}

export function usePipeline() {
  const { data, update } = useCloudStore();
  return {
    pipeline: data.sc_pipeline,
    savePipeline: (p: PipelineContact[]) => update('sc_pipeline', p),
  };
}

export function useTasks() {
  const { data, update } = useCloudStore();
  return {
    tasks: data.sc_tasks,
    saveTasks: (t: Task[]) => update('sc_tasks', t),
  };
}

export function useEvents() {
  const { data, update } = useCloudStore();
  return {
    events: data.sc_events,
    saveEvents: (e: CalendarEvent[]) => update('sc_events', e),
  };
}

export function useCalendars() {
  const { data, update } = useCloudStore();
  return {
    calendars: data.sc_calendars,
    saveCalendars: (c: CalendarCategory[]) => update('sc_calendars', c),
  };
}

export function useFinances() {
  const { data, update } = useCloudStore();
  return {
    finances: data.sc_finances,
    saveFinances: (f: FinanceData) => update('sc_finances', f),
  };
}

export function useAgents() {
  const { data, update } = useCloudStore();
  return {
    agents: data.sc_agents,
    saveAgents: (a: Agent[]) => update('sc_agents', a),
  };
}

export function useUploadedInvoices() {
  const { data, update } = useCloudStore();
  return {
    invoices: data.sc_invoices,
    saveInvoices: (i: UploadedInvoice[]) => update('sc_invoices', i),
  };
}

export function useProjects() {
  const { data, update } = useCloudStore();
  return {
    projects: data.sc_projects,
    saveProjects: (p: Project[]) => update('sc_projects', p),
  };
}

export function useProjectTags() {
  const { data, update } = useCloudStore();
  return {
    tags: data.sc_project_tags,
    saveTags: (t: ProjectTag[]) => update('sc_project_tags', t),
  };
}

export function useMails() {
  const { data, update } = useCloudStore();
  return {
    mails: data.sc_mails,
    saveMails: (m: MailMessage[]) => update('sc_mails', m),
  };
}

// Fallback: load from localStorage if cloud fails
function loadFromLocalStorage(): StoreData {
  function load<T>(key: string, fallback: T): T {
    try {
      const d = localStorage.getItem(key);
      return d ? JSON.parse(d) : fallback;
    } catch { return fallback; }
  }
  return {
    sc_customers: load('sc_customers', []),
    sc_pipeline: load('sc_pipeline', []),
    sc_tasks: load('sc_tasks', []),
    sc_events: load('sc_events', []),
    sc_finances: load('sc_finances', emptyFinances),
    sc_calendars: load('sc_calendars', defaultCalendars),
    sc_agents: load('sc_agents', []),
    sc_invoices: load('sc_invoices', []),
    sc_projects: load('sc_projects', []),
    sc_project_tags: load('sc_project_tags', []),
    sc_mails: load('sc_mails', []),
  };
}
