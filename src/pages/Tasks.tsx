import { useState } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import { getTasks, saveTasks } from '@/lib/store';
import { Task } from '@/types';

const priorityOrder = { dringend: 0, hoch: 1, mittel: 2, niedrig: 3 };
const priorityColors: Record<string, string> = {
  dringend: 'bg-destructive/20 text-destructive border-destructive/30',
  hoch: 'bg-warning/20 text-warning border-warning/30',
  mittel: 'bg-info/20 text-info border-info/30',
  niedrig: 'bg-muted text-muted-foreground border-border',
};

export default function Tasks() {
  const [tasks, setTasks] = useState(getTasks());
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<'alle' | 'offen' | 'erledigt'>('alle');

  const update = (t: Task[]) => { setTasks(t); saveTasks(t); };

  const toggle = (id: string) => update(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const remove = (id: string) => update(tasks.filter(t => t.id !== id));

  const filtered = tasks
    .filter(t => filter === 'alle' || (filter === 'offen' ? !t.completed : t.completed))
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Aufgaben</h1>
          <p className="text-sm text-muted-foreground mt-1">{tasks.filter(t => !t.completed).length} offene Aufgaben</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={16} /> Neue Aufgabe
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {(['alle', 'offen', 'erledigt'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(t => (
          <div key={t.id} className={`glass-card p-4 flex items-center gap-4 ${t.completed ? 'opacity-50' : ''}`}>
            <button onClick={() => toggle(t.id)} className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${t.completed ? 'bg-primary border-primary' : 'border-border hover:border-primary'}`}>
              {t.completed && <Check size={12} className="text-primary-foreground" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${t.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{t.title}</p>
              {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-muted-foreground">{t.date}</span>
                <span className="text-xs text-muted-foreground">{t.time} Uhr</span>
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[t.priority]}`}>{t.priority}</span>
            <button onClick={() => remove(t.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Keine Aufgaben</p>}
      </div>

      {showAdd && <AddTaskModal onClose={() => setShowAdd(false)} onAdd={(t) => { update([...tasks, t]); setShowAdd(false); }} />}
    </div>
  );
}

function AddTaskModal({ onClose, onAdd }: { onClose: () => void; onAdd: (t: Task) => void }) {
  const [form, setForm] = useState({ title: '', description: '', date: new Date().toISOString().split('T')[0], time: '09:00', priority: 'mittel' as Task['priority'] });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-foreground mb-4">Neue Aufgabe</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Titel</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Beschreibung</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Datum</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Uhrzeit</label>
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Priorität</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="niedrig">Niedrig</option>
              <option value="mittel">Mittel</option>
              <option value="hoch">Hoch</option>
              <option value="dringend">Dringend</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-md text-sm border border-border text-foreground hover:bg-accent transition-colors">Abbrechen</button>
          <button onClick={() => onAdd({ ...form, id: crypto.randomUUID(), completed: false, createdAt: new Date().toISOString() })} className="flex-1 py-2 rounded-md text-sm bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">Erstellen</button>
        </div>
      </div>
    </div>
  );
}
