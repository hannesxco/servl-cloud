import { useState } from 'react';
import { Plus, Bot, Trash2, X, Phone, Key, FileText, ChevronLeft, Save, Pencil } from 'lucide-react';
import { useAgents, useCustomers } from '@/lib/cloud-store';
import { Agent } from '@/types';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  planung: { label: 'Planung', color: 'bg-info/20 text-info' },
  entwicklung: { label: 'Entwicklung', color: 'bg-warning/20 text-warning' },
  aktiv: { label: 'Aktiv', color: 'bg-success/20 text-success' },
  pausiert: { label: 'Pausiert', color: 'bg-muted text-muted-foreground' },
};

export default function Agents() {
  const { agents, saveAgents } = useAgents();
  const [showAdd, setShowAdd] = useState(false);
  const [openAgent, setOpenAgent] = useState<Agent | null>(null);

  const update = (a: Agent[]) => { saveAgents(a); };

  if (openAgent) {
    return (
      <AgentWorkspace
        agent={openAgent}
        onBack={() => setOpenAgent(null)}
        onSave={(a) => { update(agents.map(x => x.id === a.id ? a : x)); setOpenAgent(a); }}
        onDelete={() => { update(agents.filter(x => x.id !== openAgent.id)); setOpenAgent(null); }}
      />
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Agents</h1>
          <p className="text-sm text-muted-foreground mt-1">Voice-Agents planen und verwalten</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={16} /> Neuer Agent
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Bot size={40} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Noch keine Agents erstellt</p>
          <button onClick={() => setShowAdd(true)} className="mt-3 text-xs text-primary hover:underline">Ersten Agent erstellen</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(a => {
            const st = STATUS_LABELS[a.status];
            return (
              <div key={a.id} onClick={() => setOpenAgent(a)} className="glass-card p-5 cursor-pointer hover:border-primary/30 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bot size={18} className="text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">{a.name}</h3>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{a.description || 'Keine Beschreibung'}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {a.phone && <span className="flex items-center gap-1"><Phone size={10} />{a.phone}</span>}
                  <span className="flex items-center gap-1"><Key size={10} />{a.apiKeys.length} APIs</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AgentCreateModal onClose={() => setShowAdd(false)} onSave={(a) => { update([...agents, a]); setShowAdd(false); }} />}
    </div>
  );
}

function AgentWorkspace({ agent, onBack, onSave, onDelete }: { agent: Agent; onBack: () => void; onSave: (a: Agent) => void; onDelete: () => void }) {
  const { customers } = useCustomers();
  const customer = customers.find(c => c.id === agent.customerId);
  const st = STATUS_LABELS[agent.status];

  const [prompt, setPrompt] = useState(agent.prompt);
  const [knowledgebase, setKnowledgebase] = useState(agent.knowledgebase);
  const [description, setDescription] = useState(agent.description);
  const [phone, setPhone] = useState(agent.phone);
  const [status, setStatus] = useState(agent.status);
  const [customerId, setCustomerId] = useState(agent.customerId || '');
  const [notes, setNotes] = useState(agent.notes);
  const [apiKeys, setApiKeys] = useState(agent.apiKeys);
  const [newApiLabel, setNewApiLabel] = useState('');
  const [newApiValue, setNewApiValue] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const markChanged = () => setHasChanges(true);

  const save = () => {
    onSave({ ...agent, prompt, knowledgebase, description, phone, status, customerId, notes, apiKeys });
    setHasChanges(false);
  };

  const addApi = () => {
    if (newApiLabel && newApiValue) {
      setApiKeys([...apiKeys, { label: newApiLabel, value: newApiValue }]);
      setNewApiLabel(''); setNewApiValue('');
      markChanged();
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={16} /> Zurück
          </button>
          <div className="w-px h-5 bg-border" />
          <Bot size={18} className="text-primary" />
          <h1 className="text-sm font-semibold text-foreground">{agent.name}</h1>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <button onClick={save} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 transition-opacity">
              <Save size={12} /> Speichern
            </button>
          )}
          <button onClick={onDelete} className="text-xs text-destructive hover:bg-destructive/10 px-2 py-1.5 rounded transition-colors flex items-center gap-1">
            <Trash2 size={12} /> Löschen
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-border min-w-0">
          <div className="px-4 py-2 border-b border-border flex items-center gap-2">
            <FileText size={14} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">System Prompt</span>
          </div>
          <div className="flex-1 p-4 min-h-0">
            <textarea
              value={prompt}
              onChange={e => { setPrompt(e.target.value); markChanged(); }}
              placeholder="Schreibe hier den System-Prompt für deinen Voice-Agent..."
              className="w-full h-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none font-mono leading-relaxed"
            />
          </div>
        </div>

        <div className="w-full md:w-[400px] shrink-0 overflow-auto bg-secondary/20">
          <div className="p-4 space-y-5">
            <Section title="Beschreibung">
              <textarea value={description} onChange={e => { setDescription(e.target.value); markChanged(); }} placeholder="Beschreibung des Agents..." rows={2} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
            </Section>
            <Section title="Status">
              <select value={status} onChange={e => { setStatus(e.target.value as Agent['status']); markChanged(); }} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Section>
            <Section title="Kunde">
              <select value={customerId} onChange={e => { setCustomerId(e.target.value); markChanged(); }} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">– Kein Kunde –</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
              </select>
            </Section>
            <Section title="Knowledge Base">
              <textarea value={knowledgebase} onChange={e => { setKnowledgebase(e.target.value); markChanged(); }} placeholder="Wissensgrundlage, Fakten, FAQ..." rows={5} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
            </Section>
            <Section title="Telefonnummer">
              <input value={phone} onChange={e => { setPhone(e.target.value); markChanged(); }} placeholder="+49 ..." className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </Section>
            <Section title="API Keys">
              <div className="space-y-1.5 mb-2">
                {apiKeys.map((api, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-background border border-border rounded-md px-3 py-2">
                    <div>
                      <span className="text-xs font-medium text-foreground">{api.label}</span>
                      <span className="text-xs text-muted-foreground ml-2 font-mono">{api.value.slice(0, 16)}...</span>
                    </div>
                    <button onClick={() => { setApiKeys(apiKeys.filter((_, i) => i !== idx)); markChanged(); }} className="text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input placeholder="Label" value={newApiLabel} onChange={e => setNewApiLabel(e.target.value)} className="flex-1 bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                <input placeholder="API Key" value={newApiValue} onChange={e => setNewApiValue(e.target.value)} className="flex-1 bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                <button onClick={addApi} className="text-xs bg-primary text-primary-foreground px-2.5 py-1.5 rounded font-medium hover:opacity-90">+</button>
              </div>
            </Section>
            <Section title="Notizen">
              <textarea value={notes} onChange={e => { setNotes(e.target.value); markChanged(); }} placeholder="Interne Notizen..." rows={3} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{title}</p>
      {children}
    </div>
  );
}

function AgentCreateModal({ onClose, onSave }: { onClose: () => void; onSave: (a: Agent) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl shadow-lg p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Neuer Agent</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Agent-Name" className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" autoFocus />
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Kurzbeschreibung (optional)" className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-md text-xs border border-border text-foreground hover:bg-accent">Abbrechen</button>
          <button
            onClick={() => {
              if (!name.trim()) return;
              onSave({
                id: crypto.randomUUID(), name: name.trim(), description, prompt: '', knowledgebase: '',
                phone: '', apiKeys: [], status: 'planung', notes: '', createdAt: new Date().toISOString().split('T')[0],
              });
            }}
            className="flex-1 py-2 rounded-md text-xs bg-primary text-primary-foreground font-medium hover:opacity-90"
          >
            Erstellen & Öffnen
          </button>
        </div>
      </div>
    </div>
  );
}
