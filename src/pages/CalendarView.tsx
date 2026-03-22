import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { getEvents, saveEvents } from '@/lib/store';
import { CalendarEvent } from '@/types';

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const COLORS = ['hsl(160, 84%, 39%)', 'hsl(217, 91%, 60%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(280, 65%, 60%)'];

export default function CalendarView() {
  const [events, setEvents] = useState(getEvents());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = (firstDay.getDay() + 6) % 7; // Monday start
  const daysInMonth = lastDay.getDate();

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));

  const update = (e: CalendarEvent[]) => { setEvents(e); saveEvents(e); };
  const today = new Date().toISOString().split('T')[0];

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getDateStr = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kalender</h1>
          <p className="text-sm text-muted-foreground mt-1">{MONTHS[month]} {year}</p>
        </div>
        <button onClick={() => { setSelectedDate(today); setShowAdd(true); }} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={16} /> Neuer Termin
        </button>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={prev} className="p-2 rounded-md hover:bg-accent transition-colors"><ChevronLeft size={20} className="text-foreground" /></button>
          <h2 className="text-lg font-semibold text-foreground">{MONTHS[month]} {year}</h2>
          <button onClick={next} className="p-2 rounded-md hover:bg-accent transition-colors"><ChevronRight size={20} className="text-foreground" /></button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {DAYS.map(d => (
            <div key={d} className="bg-secondary p-3 text-center text-xs font-medium text-muted-foreground">{d}</div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} className="bg-card p-2 min-h-[100px]" />;
            const dateStr = getDateStr(day);
            const dayEvents = events.filter(e => e.date === dateStr);
            const isToday = dateStr === today;
            return (
              <div
                key={i}
                onClick={() => { setSelectedDate(dateStr); setShowAdd(true); }}
                className={`bg-card p-2 min-h-[100px] cursor-pointer hover:bg-accent/50 transition-colors ${isToday ? 'ring-1 ring-inset ring-primary' : ''}`}
              >
                <span className={`text-sm ${isToday ? 'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center font-bold' : 'text-foreground'}`}>{day}</span>
                <div className="mt-1 space-y-1">
                  {dayEvents.map(e => (
                    <div key={e.id} className="text-xs px-1.5 py-0.5 rounded truncate text-foreground" style={{ backgroundColor: e.color + '33', borderLeft: `2px solid ${e.color}` }}>
                      {e.startTime} {e.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming events */}
      <div className="mt-6 glass-card p-6">
        <h2 className="font-semibold text-foreground mb-4">Anstehende Termine</h2>
        <div className="space-y-3">
          {events
            .filter(e => e.date >= today)
            .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
            .slice(0, 5)
            .map(e => (
              <div key={e.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 rounded-full" style={{ backgroundColor: e.color }} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.date} · {e.startTime} - {e.endTime}</p>
                  </div>
                </div>
                <button onClick={() => update(events.filter(ev => ev.id !== e.id))} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
              </div>
            ))}
        </div>
      </div>

      {showAdd && <AddEventModal date={selectedDate || today} onClose={() => setShowAdd(false)} onAdd={(e) => { update([...events, e]); setShowAdd(false); }} />}
    </div>
  );
}

function AddEventModal({ date, onClose, onAdd }: { date: string; onClose: () => void; onAdd: (e: CalendarEvent) => void }) {
  const [form, setForm] = useState({ title: '', date, startTime: '09:00', endTime: '10:00', description: '', color: COLORS[0] });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-foreground mb-4">Neuer Termin</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Titel</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Datum</label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Start</label>
              <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Ende</label>
              <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Farbe</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => set('color', c)} className={`w-8 h-8 rounded-full border-2 ${form.color === c ? 'border-foreground' : 'border-transparent'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Beschreibung</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-md text-sm border border-border text-foreground hover:bg-accent transition-colors">Abbrechen</button>
          <button onClick={() => onAdd({ ...form, id: crypto.randomUUID() })} className="flex-1 py-2 rounded-md text-sm bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">Erstellen</button>
        </div>
      </div>
    </div>
  );
}
