import { useState, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Settings, X, Pencil } from 'lucide-react';
import { getEvents, saveEvents, getCalendars, saveCalendars } from '@/lib/store';
import { CalendarEvent, CalendarCategory } from '@/types';

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const DAYS_FULL = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const PRESET_COLORS = [
  'hsl(217, 91%, 60%)', 'hsl(160, 84%, 39%)', 'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 60%)', 'hsl(0, 72%, 51%)', 'hsl(340, 75%, 55%)',
  'hsl(190, 80%, 45%)', 'hsl(100, 60%, 45%)',
];

type ViewMode = 'month' | 'week' | 'day' | 'year';

export default function CalendarView() {
  const [events, setEvents] = useState(getEvents());
  const [calendars, setCalendars] = useState(getCalendars());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>('month');
  const [showAdd, setShowAdd] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showCalSettings, setShowCalSettings] = useState(false);
  const [visibleCals, setVisibleCals] = useState<Set<string>>(new Set(calendars.map(c => c.id)));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date().toISOString().split('T')[0];

  const updateEvents = (e: CalendarEvent[]) => { setEvents(e); saveEvents(e); };
  const updateCalendars = (c: CalendarCategory[]) => { setCalendars(c); saveCalendars(c); setVisibleCals(new Set(c.map(x => x.id))); };

  const getDateStr = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const filteredEvents = events.filter(e => visibleCals.has(e.calendarId));
  const getCalColor = (calId: string) => calendars.find(c => c.id === calId)?.color || 'hsl(217, 91%, 60%)';

  const prev = () => {
    if (view === 'month') setCurrentDate(new Date(year, month - 1, 1));
    else if (view === 'week') setCurrentDate(new Date(currentDate.getTime() - 7 * 86400000));
    else if (view === 'day') setCurrentDate(new Date(currentDate.getTime() - 86400000));
    else setCurrentDate(new Date(year - 1, 0, 1));
  };
  const next = () => {
    if (view === 'month') setCurrentDate(new Date(year, month + 1, 1));
    else if (view === 'week') setCurrentDate(new Date(currentDate.getTime() + 7 * 86400000));
    else if (view === 'day') setCurrentDate(new Date(currentDate.getTime() + 86400000));
    else setCurrentDate(new Date(year + 1, 0, 1));
  };

  const goToday = () => setCurrentDate(new Date());

  const headerLabel = () => {
    if (view === 'year') return `${year}`;
    if (view === 'month') return `${MONTHS[month]} ${year}`;
    if (view === 'day') return `${DAYS_FULL[(currentDate.getDay() + 6) % 7]}, ${currentDate.getDate()}. ${MONTHS[month]} ${year}`;
    // week
    const start = getWeekStart(currentDate);
    const end = new Date(start.getTime() + 6 * 86400000);
    if (start.getMonth() === end.getMonth()) return `${start.getDate()}. – ${end.getDate()}. ${MONTHS[start.getMonth()]} ${year}`;
    return `${start.getDate()}. ${MONTHS[start.getMonth()]} – ${end.getDate()}. ${MONTHS[end.getMonth()]} ${year}`;
  };

  const openAdd = (date: string, time?: string) => {
    setSelectedDate(date);
    setSelectedTime(time || null);
    setEditEvent(null);
    setShowAdd(true);
  };

  const openEdit = (ev: CalendarEvent) => {
    setEditEvent(ev);
    setSelectedDate(ev.date);
    setSelectedTime(ev.startTime);
    setShowAdd(true);
  };

  // Drag-to-create state
  const dragRef = useRef<{ startDate: string; startTime: string } | null>(null);

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">{headerLabel()}</h1>
          <div className="flex items-center gap-1">
            <button onClick={prev} className="p-1.5 rounded hover:bg-accent transition-colors"><ChevronLeft size={16} /></button>
            <button onClick={next} className="p-1.5 rounded hover:bg-accent transition-colors"><ChevronRight size={16} /></button>
          </div>
          <button onClick={goToday} className="text-xs px-3 py-1 rounded border border-border hover:bg-accent transition-colors text-foreground">Heute</button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-secondary rounded-md p-0.5">
            {(['day', 'week', 'month', 'year'] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setView(v)} className={`text-xs px-3 py-1.5 rounded transition-colors ${view === v ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {v === 'day' ? 'Tag' : v === 'week' ? 'Woche' : v === 'month' ? 'Monat' : 'Jahr'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowCalSettings(true)} className="p-2 rounded hover:bg-accent transition-colors text-muted-foreground"><Settings size={16} /></button>
          <button onClick={() => openAdd(today)} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 transition-opacity">
            <Plus size={14} /> Termin
          </button>
        </div>
      </div>

      {/* Calendar sidebar + main */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Sidebar calendars */}
        <div className="w-48 shrink-0 space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Kalender</p>
          {calendars.map(cal => (
            <label key={cal.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm text-foreground">
              <input
                type="checkbox"
                checked={visibleCals.has(cal.id)}
                onChange={() => {
                  const next = new Set(visibleCals);
                  next.has(cal.id) ? next.delete(cal.id) : next.add(cal.id);
                  setVisibleCals(next);
                }}
                className="rounded border-border"
              />
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cal.color }} />
              <span className="truncate">{cal.name}</span>
            </label>
          ))}
        </div>

        {/* Main view */}
        <div className="flex-1 min-h-0 overflow-auto">
          {view === 'month' && <MonthView year={year} month={month} today={today} events={filteredEvents} getCalColor={getCalColor} onCellClick={openAdd} onEventClick={openEdit} dragRef={dragRef} />}
          {view === 'week' && <WeekView currentDate={currentDate} today={today} events={filteredEvents} getCalColor={getCalColor} onCellClick={openAdd} onEventClick={openEdit} />}
          {view === 'day' && <DayView currentDate={currentDate} today={today} events={filteredEvents} getCalColor={getCalColor} onCellClick={openAdd} onEventClick={openEdit} />}
          {view === 'year' && <YearView year={year} today={today} events={filteredEvents} getCalColor={getCalColor} onMonthClick={(m: number) => { setCurrentDate(new Date(year, m, 1)); setView('month'); }} />}
        </div>
      </div>

      {showAdd && (
        <EventModal
          event={editEvent}
          date={selectedDate || today}
          time={selectedTime}
          calendars={calendars}
          onClose={() => { setShowAdd(false); setEditEvent(null); }}
          onSave={(ev) => {
            if (editEvent) {
              updateEvents(events.map(e => e.id === ev.id ? ev : e));
            } else {
              updateEvents([...events, ev]);
            }
            setShowAdd(false);
            setEditEvent(null);
          }}
          onDelete={editEvent ? () => { updateEvents(events.filter(e => e.id !== editEvent.id)); setShowAdd(false); setEditEvent(null); } : undefined}
        />
      )}

      {showCalSettings && (
        <CalendarSettingsModal
          calendars={calendars}
          onClose={() => setShowCalSettings(false)}
          onSave={updateCalendars}
        />
      )}
    </div>
  );
}

/* ========== MONTH VIEW ========== */
function MonthView({ year, month, today, events, getCalColor, onCellClick, onEventClick, dragRef }: any) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const getDateStr = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-7 border-b border-border">
        {DAYS.map(d => (
          <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1" style={{ gridAutoRows: '1fr' }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} className="border-b border-r border-border bg-secondary/30 p-1" />;
          const dateStr = getDateStr(day);
          const dayEvents = events.filter((e: CalendarEvent) => e.date === dateStr);
          const isToday = dateStr === today;
          return (
            <div
              key={i}
              onClick={() => onCellClick(dateStr)}
              className={`border-b border-r border-border p-1 cursor-pointer hover:bg-accent/30 transition-colors min-h-[80px] ${isToday ? 'bg-primary/5' : ''}`}
            >
              <div className="flex justify-end">
                <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground font-semibold' : 'text-foreground'}`}>{day}</span>
              </div>
              <div className="mt-0.5 space-y-0.5">
                {dayEvents.slice(0, 3).map((e: CalendarEvent) => (
                  <div
                    key={e.id}
                    onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
                    className="text-[10px] leading-tight px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: getCalColor(e.calendarId) + '22', color: getCalColor(e.calendarId), borderLeft: `2px solid ${getCalColor(e.calendarId)}` }}
                  >
                    {e.startTime} {e.title}
                  </div>
                ))}
                {dayEvents.length > 3 && <p className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} mehr</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ========== WEEK VIEW ========== */
function getWeekStart(d: Date) {
  const day = d.getDay();
  const diff = (day + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function WeekView({ currentDate, today, events, getCalColor, onCellClick, onEventClick }: any) {
  const weekStart = getWeekStart(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getTime() + i * 86400000);
    return { date: d, str: d.toISOString().split('T')[0], label: `${DAYS[i]} ${d.getDate()}` };
  });

  return (
    <div className="h-full overflow-auto">
      <div className="grid grid-cols-[60px_repeat(7,1fr)] sticky top-0 z-10 bg-background border-b border-border">
        <div />
        {days.map(d => (
          <div key={d.str} className={`py-2 text-center text-xs font-medium border-l border-border ${d.str === today ? 'text-primary' : 'text-muted-foreground'}`}>
            {d.label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[60px_repeat(7,1fr)]">
        {HOURS.map(h => (
          <div key={h} className="contents">
            <div className="h-12 text-[10px] text-muted-foreground pr-2 text-right pt-0 border-r border-border">
              {String(h).padStart(2, '0')}:00
            </div>
            {days.map(d => {
              const hourEvents = events.filter((e: CalendarEvent) => e.date === d.str && parseInt(e.startTime) === h);
              return (
                <div
                  key={d.str + h}
                  className={`h-12 border-b border-l border-border hover:bg-accent/20 cursor-pointer relative ${d.str === today ? 'bg-primary/3' : ''}`}
                  onClick={() => onCellClick(d.str, `${String(h).padStart(2, '0')}:00`)}
                >
                  {hourEvents.map((e: CalendarEvent) => (
                    <div
                      key={e.id}
                      onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
                      className="absolute inset-x-0.5 top-0 text-[10px] px-1 py-0.5 rounded truncate cursor-pointer z-10"
                      style={{ backgroundColor: getCalColor(e.calendarId) + '33', color: getCalColor(e.calendarId), borderLeft: `2px solid ${getCalColor(e.calendarId)}` }}
                    >
                      {e.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========== DAY VIEW ========== */
function DayView({ currentDate, today, events, getCalColor, onCellClick, onEventClick }: any) {
  const dateStr = currentDate.toISOString().split('T')[0];
  const dayEvents = events.filter((e: CalendarEvent) => e.date === dateStr);

  return (
    <div className="h-full overflow-auto">
      <div className="grid grid-cols-[60px_1fr]">
        {HOURS.map(h => {
          const hourEvents = dayEvents.filter((e: CalendarEvent) => parseInt(e.startTime) === h);
          return (
            <div key={h} className="contents">
              <div className="h-14 text-[10px] text-muted-foreground pr-2 text-right pt-0 border-r border-border">
                {String(h).padStart(2, '0')}:00
              </div>
              <div
                className="h-14 border-b border-border hover:bg-accent/20 cursor-pointer relative"
                onClick={() => onCellClick(dateStr, `${String(h).padStart(2, '0')}:00`)}
              >
                {hourEvents.map((e: CalendarEvent) => (
                  <div
                    key={e.id}
                    onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
                    className="absolute inset-x-1 top-0.5 text-xs px-2 py-1 rounded cursor-pointer"
                    style={{ backgroundColor: getCalColor(e.calendarId) + '33', color: getCalColor(e.calendarId), borderLeft: `3px solid ${getCalColor(e.calendarId)}` }}
                  >
                    <span className="font-medium">{e.title}</span>
                    <span className="ml-2 opacity-70">{e.startTime} - {e.endTime}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ========== YEAR VIEW ========== */
function YearView({ year, today, events, getCalColor, onMonthClick }: any) {
  return (
    <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
      {MONTHS.map((name, m) => {
        const firstDay = new Date(year, m, 1);
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        const startDay = (firstDay.getDay() + 6) % 7;
        const cells: (number | null)[] = [];
        for (let i = 0; i < startDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);

        return (
          <div key={m} className="cursor-pointer hover:bg-accent/30 p-3 rounded-lg transition-colors" onClick={() => onMonthClick(m)}>
            <p className="text-xs font-semibold text-foreground mb-2">{name}</p>
            <div className="grid grid-cols-7 gap-0">
              {['M','D','M','D','F','S','S'].map((d, i) => <div key={i} className="text-[8px] text-muted-foreground text-center">{d}</div>)}
              {cells.map((day, i) => {
                if (!day) return <div key={i} className="w-full aspect-square" />;
                const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasEvent = events.some((e: CalendarEvent) => e.date === dateStr);
                const isToday = dateStr === today;
                return (
                  <div key={i} className="flex items-center justify-center aspect-square">
                    <span className={`text-[9px] w-4 h-4 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : hasEvent ? 'bg-primary/20 text-primary' : 'text-foreground'}`}>{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ========== EVENT MODAL ========== */
function EventModal({ event, date, time, calendars, onClose, onSave, onDelete }: {
  event: CalendarEvent | null; date: string; time: string | null; calendars: CalendarCategory[];
  onClose: () => void; onSave: (e: CalendarEvent) => void; onDelete?: () => void;
}) {
  const [form, setForm] = useState({
    title: event?.title || '',
    date: event?.date || date,
    startTime: event?.startTime || time || '09:00',
    endTime: event?.endTime || (time ? `${String(parseInt(time) + 1).padStart(2, '0')}:00` : '10:00'),
    description: event?.description || '',
    calendarId: event?.calendarId || calendars[0]?.id || '',
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const calColor = calendars.find(c => c.id === form.calendarId)?.color || 'hsl(217, 91%, 60%)';

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">{event ? 'Termin bearbeiten' : 'Neuer Termin'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Titel hinzufügen" className="w-full bg-transparent border-b border-border px-0 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          <div className="grid grid-cols-2 gap-3">
            <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Kalender</label>
            <select value={form.calendarId} onChange={e => set('calendarId', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              {calendars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Beschreibung" rows={2} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
        </div>
        <div className="flex gap-3 mt-5">
          {onDelete && <button onClick={onDelete} className="px-3 py-2 rounded-md text-xs text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={14} /></button>}
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2 rounded-md text-xs border border-border text-foreground hover:bg-accent transition-colors">Abbrechen</button>
          <button onClick={() => onSave({ ...form, id: event?.id || crypto.randomUUID(), color: calColor })} className="px-4 py-2 rounded-md text-xs bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
            {event ? 'Speichern' : 'Erstellen'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========== CALENDAR SETTINGS MODAL ========== */
function CalendarSettingsModal({ calendars, onClose, onSave }: { calendars: CalendarCategory[]; onClose: () => void; onSave: (c: CalendarCategory[]) => void }) {
  const [cals, setCals] = useState([...calendars]);
  const [editId, setEditId] = useState<string | null>(null);

  const addCal = () => {
    const newCal: CalendarCategory = { id: crypto.randomUUID(), name: 'Neuer Kalender', color: PRESET_COLORS[cals.length % PRESET_COLORS.length] };
    setCals([...cals, newCal]);
    setEditId(newCal.id);
  };

  const updateCal = (id: string, key: string, value: string) => {
    setCals(cals.map(c => c.id === id ? { ...c, [key]: value } : c));
  };

  const deleteCal = (id: string) => {
    if (cals.length <= 1) return;
    setCals(cals.filter(c => c.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Kalender verwalten</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <div className="space-y-2 mb-4">
          {cals.map(cal => (
            <div key={cal.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary">
              {editId === cal.id ? (
                <>
                  <div className="relative">
                    <div className="w-5 h-5 rounded-full cursor-pointer" style={{ backgroundColor: cal.color }} />
                    <select
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      value={cal.color}
                      onChange={e => updateCal(cal.id, 'color', e.target.value)}
                    >
                      {PRESET_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <input
                    value={cal.name}
                    onChange={e => updateCal(cal.id, 'name', e.target.value)}
                    className="flex-1 bg-secondary border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    autoFocus
                    onBlur={() => setEditId(null)}
                    onKeyDown={e => e.key === 'Enter' && setEditId(null)}
                  />
                </>
              ) : (
                <>
                  <div className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: cal.color }} />
                  <span className="flex-1 text-sm text-foreground">{cal.name}</span>
                  <button onClick={() => setEditId(cal.id)} className="text-muted-foreground hover:text-foreground"><Pencil size={12} /></button>
                  {cals.length > 1 && <button onClick={() => deleteCal(cal.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>}
                </>
              )}
              {/* Color picker dots */}
              {editId === cal.id && (
                <div className="flex gap-1 ml-1">
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => updateCal(cal.id, 'color', c)} className={`w-4 h-4 rounded-full border ${cal.color === c ? 'border-foreground' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <button onClick={addCal} className="text-xs text-primary hover:underline flex items-center gap-1 mb-4"><Plus size={12} /> Kalender hinzufügen</button>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-md text-xs border border-border text-foreground hover:bg-accent transition-colors">Abbrechen</button>
          <button onClick={() => { onSave(cals); onClose(); }} className="flex-1 py-2 rounded-md text-xs bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">Speichern</button>
        </div>
      </div>
    </div>
  );
}
