import { useState } from 'react';
import { Plus, Bot, Trash2, X, Pencil, Phone, Link as LinkIcon, Key, FileText } from 'lucide-react';
import { getAgents, saveAgents, getCustomers } from '@/lib/store';
import { Agent } from '@/types';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  planung: { label: 'Planung', color: 'bg-info/20 text-info' },
  entwicklung: { label: 'Entwicklung', color: 'bg-warning/20 text-warning' },
  aktiv: { label: 'Aktiv', color: 'bg-success/20 text-success' },
  pausiert: { label: 'Pausiert', color: 'bg-muted text-muted-foreground' },
};

export default function Agents() {
  const [agents, setAgents] = useState(getAgents());
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Agent | null>(null);

  const update = (a: Agent[]) => { setAgents(a); saveAgents(a); };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agents</h1>
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
              <div key={a.id} onClick={() => setSelected(a)} className="glass-card p-5 cursor-pointer hover:border-primary/30 transition-colors">
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

      {showAdd && <AgentModal onClose={() => setShowAdd(false)} onSave={(a) => { update([...agents, a]); setShowAdd(false); }} />}
      {selected && (
        <AgentDetailModal
          agent={selected}
          onClose={() => setSelected(null)}
          onSave={(a) => { update(agents.map(x => x.id === a.id ? a : x)); setSelected(a); }}
          onDelete={() => { update(agents.filter(x => x.id !== selected.id)); setSelected(null); }}
        />
      )}
    </div>
  );
}

function AgentModal({ agent, onClose, onSave }: { agent?: Agent; onClose: () => void; onSave: (a: Agent) => void }) {
  const customers = getCustomers();
  const [form, setForm] = useState({
    name: agent?.name || '',
    description: agent?.description || '',
    prompt: agent?.prompt || '',
    knowledgebase: agent?.knowledgebase || '',
    phone: agent?.phone || '',
    status: agent?.status || 'planung' as Agent['status'],
    customerId: agent?.customerId || '',
    notes: agent?.notes || '',
    apiKeys: agent?.apiKeys || [] as { label: string; value: string }[],
  });
  const [newApiLabel, setNewApiLabel] = useState('');
  const [newApiValue, setNewApiValue] = useState('');

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const addApi = () => {
    if (newApiLabel && newApiValue) {
      set('apiKeys', [...form.apiKeys, { label: newApiLabel, value: newApiValue }]);
      setNewApiLabel('');
      setNewApiValue('');
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">{agent ? 'Agent bearbeiten' : 'Neuer Agent'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div><label className="text-xs text-muted-foreground block mb-1">Name</label><input value={form.name} onChange={e => set('name', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" /></div>
          <div><label className="text-xs text-muted-foreground block mb-1">Beschreibung</label><input value={form.description} onChange={e => set('description', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" /></div>
          <div><label className="text-xs text-muted-foreground block mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div><label className="text-xs text-muted-foreground block mb-1">Kunde (optional)</label>
            <select value={form.customerId} onChange={e => set('customerId', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">– Kein Kunde –</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
            </select>
          </div>
          <div><label className="text-xs text-muted-foreground block mb-1">Prompt</label><textarea value={form.prompt} onChange={e => set('prompt', e.target.value)} rows={4} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none font-mono text-xs" /></div>
          <div><label className="text-xs text-muted-foreground block mb-1">Knowledgebase</label><textarea value={form.knowledgebase} onChange={e => set('knowledgebase', e.target.value)} rows={2} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" /></div>
          <div><label className="text-xs text-muted-foreground block mb-1">Telefonnummer</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" /></div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">API Keys</label>
            {form.apiKeys.map((api, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-secondary px-2 py-1 rounded text-foreground">{api.label}: {api.value.slice(0, 8)}...</span>
                <button onClick={() => set('apiKeys', form.apiKeys.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive"><Trash2 size={10} /></button>
              </div>
            ))}
            <div className="flex gap-2 mt-1">
              <input placeholder="Label" value={newApiLabel} onChange={e => setNewApiLabel(e.target.value)} className="flex-1 bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none" />
              <input placeholder="Key/Value" value={newApiValue} onChange={e => setNewApiValue(e.target.value)} className="flex-1 bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none" />
              <button onClick={addApi} className="text-xs text-primary hover:underline">+</button>
            </div>
          </div>
          <div><label className="text-xs text-muted-foreground block mb-1">Notizen</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" /></div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-md text-xs border border-border text-foreground hover:bg-accent">Abbrechen</button>
          <button onClick={() => onSave({ ...form, id: agent?.id || crypto.randomUUID(), createdAt: agent?.createdAt || new Date().toISOString().split('T')[0] })} className="flex-1 py-2 rounded-md text-xs bg-primary text-primary-foreground font-medium hover:opacity-90">
            {agent ? 'Speichern' : 'Erstellen'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AgentDetailModal({ agent, onClose, onSave, onDelete }: { agent: Agent; onClose: () => void; onSave: (a: Agent) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const st = STATUS_LABELS[agent.status];
  const customers = getCustomers();
  const customer = customers.find(c => c.id === agent.customerId);

  if (editing) return <AgentModal agent={agent} onClose={() => setEditing(false)} onSave={(a) => { onSave(a); setEditing(false); }} />;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bot size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">{agent.name}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
          {customer && <span className="text-xs text-muted-foreground">Kunde: {customer.name}</span>}
        </div>

        {agent.description && <p className="text-sm text-foreground mb-4">{agent.description}</p>}

        {agent.prompt && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><FileText size={10} />Prompt</p>
            <pre className="text-xs bg-secondary p-3 rounded-md text-foreground whitespace-pre-wrap font-mono max-h-40 overflow-auto">{agent.prompt}</pre>
          </div>
        )}

        {agent.knowledgebase && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-1">Knowledgebase</p>
            <p className="text-sm text-foreground bg-secondary p-3 rounded-md">{agent.knowledgebase}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          {agent.phone && <div><p className="text-xs text-muted-foreground flex items-center gap-1"><Phone size={10} />Telefon</p><p className="text-sm text-foreground">{agent.phone}</p></div>}
        </div>

        {agent.apiKeys.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Key size={10} />API Keys</p>
            <div className="space-y-1">
              {agent.apiKeys.map((api, i) => (
                <div key={i} className="text-xs bg-secondary px-3 py-2 rounded-md text-foreground flex justify-between">
                  <span className="font-medium">{api.label}</span>
                  <span className="text-muted-foreground font-mono">{api.value.slice(0, 12)}...</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {agent.notes && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-1">Notizen</p>
            <p className="text-sm text-foreground bg-secondary p-3 rounded-md">{agent.notes}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={() => setEditing(true)} className="flex-1 py-2 rounded-md text-xs border border-border text-foreground hover:bg-accent flex items-center justify-center gap-1"><Pencil size={12} />Bearbeiten</button>
          <button onClick={onDelete} className="py-2 px-4 rounded-md text-xs text-destructive hover:bg-destructive/10 flex items-center gap-1"><Trash2 size={12} />Löschen</button>
        </div>
      </div>
    </div>
  );
}
