import { useState } from 'react';
import { Plus, Phone, Mail, MapPin, Euro, MoreVertical, Trash2 } from 'lucide-react';
import { getPipeline, savePipeline } from '@/lib/store';
import { PipelineContact } from '@/types';

const stages = [
  { key: 'neu', label: 'Neu', color: 'bg-info/20 text-info' },
  { key: 'kontaktiert', label: 'Kontaktiert', color: 'bg-warning/20 text-warning' },
  { key: 'angebot', label: 'Angebot', color: 'bg-primary/20 text-primary' },
  { key: 'verhandlung', label: 'Verhandlung', color: 'bg-accent text-foreground' },
  { key: 'gewonnen', label: 'Gewonnen', color: 'bg-success/20 text-success' },
  { key: 'verloren', label: 'Verloren', color: 'bg-destructive/20 text-destructive' },
] as const;

export default function Pipeline() {
  const [contacts, setContacts] = useState(getPipeline());
  const [showAdd, setShowAdd] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const update = (updated: PipelineContact[]) => { setContacts(updated); savePipeline(updated); };

  const moveToStage = (id: string, stage: PipelineContact['stage']) => {
    update(contacts.map(c => c.id === id ? { ...c, stage } : c));
  };

  const deleteContact = (id: string) => {
    update(contacts.filter(c => c.id !== id));
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">{contacts.length} potenzielle Kunden</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={16} /> Neuer Lead
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map(({ key, label, color }) => {
          const stageContacts = contacts.filter(c => c.stage === key);
          const totalValue = stageContacts.reduce((s, c) => s + c.value, 0);
          return (
            <div
              key={key}
              className="min-w-[280px] flex-shrink-0"
              onDragOver={e => e.preventDefault()}
              onDrop={() => { if (dragId) moveToStage(dragId, key as PipelineContact['stage']); setDragId(null); }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{label}</span>
                  <span className="text-xs text-muted-foreground">{stageContacts.length}</span>
                </div>
                <span className="text-xs text-muted-foreground">€{totalValue.toLocaleString('de-DE')}/mo</span>
              </div>
              <div className="space-y-3">
                {stageContacts.map(c => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => setDragId(c.id)}
                    className="glass-card p-4 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{c.name}</h3>
                        <p className="text-xs text-muted-foreground">{c.company}</p>
                      </div>
                      <button onClick={() => deleteContact(c.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><MapPin size={12} />{c.city}</div>
                      <div className="flex items-center gap-1"><Euro size={12} />€{c.value}/mo potenzial</div>
                      <div className="flex items-center gap-1"><Phone size={12} />{c.phone}</div>
                    </div>
                    {c.notes && <p className="text-xs text-muted-foreground mt-2 italic">"{c.notes}"</p>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onAdd={(c) => { update([...contacts, c]); setShowAdd(false); }} />}
    </div>
  );
}

function AddLeadModal({ onClose, onAdd }: { onClose: () => void; onAdd: (c: PipelineContact) => void }) {
  const [form, setForm] = useState({ name: '', company: '', companyType: '', phone: '', email: '', city: '', notes: '', value: '' });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-foreground mb-4">Neuer Lead</h2>
        <div className="space-y-3">
          {[
            { k: 'name', l: 'Name' }, { k: 'company', l: 'Unternehmen' }, { k: 'companyType', l: 'Branche' },
            { k: 'city', l: 'Stadt' }, { k: 'phone', l: 'Telefon' }, { k: 'email', l: 'Email' },
            { k: 'value', l: 'Pot. Monatswert (€)', t: 'number' },
          ].map(({ k, l, t }) => (
            <div key={k}>
              <label className="text-sm text-muted-foreground block mb-1">{l}</label>
              <input type={t || 'text'} value={(form as any)[k]} onChange={e => set(k, e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          ))}
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Notizen</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-md text-sm border border-border text-foreground hover:bg-accent transition-colors">Abbrechen</button>
          <button onClick={() => onAdd({
            ...form, id: crypto.randomUUID(), stage: 'neu', value: parseFloat(form.value) || 0, createdAt: new Date().toISOString().split('T')[0],
          })} className="flex-1 py-2 rounded-md text-sm bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">Erstellen</button>
        </div>
      </div>
    </div>
  );
}
