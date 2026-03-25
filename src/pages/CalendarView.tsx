import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Settings, X, Pencil, RefreshCw, Unplug } from 'lucide-react';
import { getEvents, saveEvents, getCalendars, saveCalendars } from '@/lib/store';
import { CalendarEvent, CalendarCategory } from '@/types';
import { isGCConnected, startGoogleAuth, handleAuthCallback, syncGoogleCalendar, clearGCTokens } from '@/lib/googleCalendar';

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const DAYS_FULL = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const PRESET_COLORS = [
  '#FF6961', '#FFB347', '#77DD77', '#6EB5FF', '#B19CD9', '#FF85A2', '#57C4C4', '#A2D149',
];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

type ViewMode = 'month' | 'week' | 'day' | 'year';

function getWeekStart(d: Date) {
  const day = d.getDay();
  const diff = (day + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
}

function formatHour(h: number) {
  return `${String(h).padStart(2, '0')}:00`;
}

function timeToHour(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
}

function getDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarView() {
  const [events, setEvents] = useState(getEvents());
  const [calendars, setCalendars] = useState(getCalendars());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>('week');
  const [showAdd, setShowAdd] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<string | null>(null);
  const [showCalSettings, setShowCalSettings] = useState(false);
  const [visibleCals, setVisibleCals] = useState<Set<string>>(new Set(calendars.map(c => c.id)));
  const [syncing, setSyncing] = useState(false);
  const [gcConnected, setGcConnected] = useState(isGCConnected());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = getDateStr(new Date());

  const updateEvents = (e: CalendarEvent[]) => { setEvents(e); saveEvents(e); };
  const updateCalendars = (c: CalendarCategory[]) => { setCalendars(c); saveCalendars(c); setVisibleCals(new Set(c.map(x => x.id))); };

  // Handle Google OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      window.history.replaceState({}, '', window.location.pathname);
      handleAuthCallback(code).then(() => {
        setGcConnected(true);
        return syncGoogleCalendar();
      }).then(merged => {
        setEvents(merged);
        setCalendars(getCalendars());
        setVisibleCals(new Set(getCalendars().map(c => c.id)));
      }).catch(err => console.error('Google auth failed:', err));
    }
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const merged = await syncGoogleCalendar();
      setEvents(merged);
      setCalendars(getCalendars());
      setVisibleCals(new Set(getCalendars().map(c => c.id)));
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = () => {
    clearGCTokens();
    setGcConnected(false);
    // Remove google events
    const local = events.filter(e => !e.id.startsWith('gc-'));
    updateEvents(local);
  };

  const filteredEvents = events.filter(e => visibleCals.has(e.calendarId));
  const getCalColor = (calId: string) => calendars.find(c => c.id === calId)?.color || '#6EB5FF';

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
    const start = getWeekStart(currentDate);
    const end = new Date(start.getTime() + 6 * 86400000);
    if (start.getMonth() === end.getMonth()) return `${MONTHS[start.getMonth()]} ${year}`;
    return `${MONTHS[start.getMonth()]} – ${MONTHS[end.getMonth()]} ${year}`;
  };

  const openAdd = (date: string, startTime?: string, endTime?: string) => {
    setSelectedDate(date);
    setSelectedTime(startTime || null);
    setSelectedEndTime(endTime || null);
    setEditEvent(null);
    setShowAdd(true);
  };

  const openEdit = (ev: CalendarEvent) => {
    setEditEvent(ev);
    setSelectedDate(ev.date);
    setSelectedTime(ev.startTime);
    setSelectedEndTime(ev.endTime);
    setShowAdd(true);
  };

  // Current time indicator
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header - Notion style */}
      <div className="px-6 pt-4 pb-2 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-foreground">{headerLabel()}</h1>
          <div className="flex items-center gap-1">
            <button onClick={prev} className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground"><ChevronLeft size={18} /></button>
            <button onClick={goToday} className="text-xs px-2.5 py-1 rounded border border-border hover:bg-accent transition-colors text-foreground font-medium">Heute</button>
            <button onClick={next} className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground"><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-secondary rounded-md p-0.5">
            {(['day', 'week', 'month', 'year'] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setView(v)} className={`text-xs px-3 py-1 rounded transition-colors ${view === v ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {v === 'day' ? 'Tag' : v === 'week' ? 'Woche' : v === 'month' ? 'Monat' : 'Jahr'}
              </button>
            ))}
          </div>
          {gcConnected ? (
            <>
              <button onClick={handleSync} disabled={syncing} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded border border-border hover:bg-accent transition-colors text-foreground font-medium disabled:opacity-50" title="Google Calendar synchronisieren">
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                Sync
              </button>
              <button onClick={handleDisconnect} className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground" title="Google Calendar trennen">
                <Unplug size={16} />
              </button>
            </>
          ) : (
            <button onClick={startGoogleAuth} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded border border-border hover:bg-accent transition-colors text-foreground font-medium">
              Google verbinden
            </button>
          )}
          <button onClick={() => setShowCalSettings(true)} className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground"><Settings size={16} /></button>
          <button onClick={() => openAdd(today)} className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground"><Plus size={16} /></button>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-44 shrink-0 border-r border-border p-3 space-y-1 overflow-auto">
          <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Kalender</p>
          {calendars.map(cal => (
            <label key={cal.id} className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-accent cursor-pointer text-xs text-foreground">
              <input
                type="checkbox"
                checked={visibleCals.has(cal.id)}
                onChange={() => {
                  const n = new Set(visibleCals);
                  n.has(cal.id) ? n.delete(cal.id) : n.add(cal.id);
                  setVisibleCals(n);
                }}
                className="rounded border-border"
                style={{ accentColor: cal.color }}
              />
              <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: cal.color }} />
              <span className="truncate">{cal.name}</span>
            </label>
          ))}
        </div>

        {/* Calendar content */}
        <div className="flex-1 min-h-0 overflow-auto">
          {view === 'week' && <WeekView currentDate={currentDate} today={today} now={now} events={filteredEvents} getCalColor={getCalColor} onCellClick={openAdd} onEventClick={openEdit} />}
          {view === 'day' && <DayView currentDate={currentDate} today={today} now={now} events={filteredEvents} getCalColor={getCalColor} onCellClick={openAdd} onEventClick={openEdit} />}
          {view === 'month' && <MonthView year={year} month={month} today={today} events={filteredEvents} getCalColor={getCalColor} onCellClick={openAdd} onEventClick={openEdit} />}
          {view === 'year' && <YearView year={year} today={today} events={filteredEvents} getCalColor={getCalColor} onMonthClick={(m: number) => { setCurrentDate(new Date(year, m, 1)); setView('month'); }} />}
        </div>
      </div>

      {showAdd && (
        <EventModal
          event={editEvent}
          date={selectedDate || today}
          time={selectedTime}
          endTime={selectedEndTime}
          calendars={calendars}
          onClose={() => { setShowAdd(false); setEditEvent(null); }}
          onSave={(ev) => {
            if (editEvent) updateEvents(events.map(e => e.id === ev.id ? ev : e));
            else updateEvents([...events, ev]);
            setShowAdd(false); setEditEvent(null);
          }}
          onDelete={editEvent ? () => { updateEvents(events.filter(e => e.id !== editEvent.id)); setShowAdd(false); setEditEvent(null); } : undefined}
        />
      )}

      {showCalSettings && (
        <CalendarSettingsModal calendars={calendars} onClose={() => setShowCalSettings(false)} onSave={updateCalendars} />
      )}
    </div>
  );
}

/* ========== WEEK VIEW (Notion-style) ========== */
function WeekView({ currentDate, today, now, events, getCalColor, onCellClick, onEventClick }: any) {
  const weekStart = getWeekStart(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getTime() + i * 86400000);
    return { date: d, str: getDateStr(d), dayNum: d.getDate(), dayName: DAYS[i] };
  });

  const HOUR_HEIGHT = 48;
  const [isDragging, setIsDragging] = useState(false);
  const [dragCol, setDragCol] = useState(-1);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragEndY, setDragEndY] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  const yToHour = (y: number) => Math.max(0, Math.min(23.5, Math.floor(y / HOUR_HEIGHT * 2) / 2));

  const handleMouseDown = (e: React.MouseEvent, colIdx: number) => {
    if ((e.target as HTMLElement).closest('.event-block')) return;
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;
    const y = e.clientY - rect.top + (gridRef.current?.parentElement?.scrollTop || 0);
    setIsDragging(true);
    setDragCol(colIdx);
    setDragStartY(y);
    setDragEndY(y);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top + (gridRef.current.parentElement?.scrollTop || 0);
    setDragEndY(y);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const startHour = yToHour(Math.min(dragStartY, dragEndY));
    const endHour = yToHour(Math.max(dragStartY, dragEndY)) + 0.5;
    if (endHour - startHour >= 0.5 && dragCol >= 0 && dragCol < days.length) {
      const day = days[dragCol];
      const startH = Math.floor(startHour);
      const startM = (startHour % 1) * 60;
      const endH = Math.floor(endHour);
      const endM = (endHour % 1) * 60;
      onCellClick(
        day.str,
        `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
        `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
      );
    }
  };

  // Current time line
  const nowStr = getDateStr(now);
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const nowCol = days.findIndex(d => d.str === nowStr);

  // All-day / multi-day events banner area
  const allDayEvents = events.filter((e: CalendarEvent) => !e.startTime || e.startTime === e.endTime);
  const timedEvents = events.filter((e: CalendarEvent) => e.startTime && e.startTime !== e.endTime);

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="grid border-b border-border sticky top-0 z-20 bg-background" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
        <div className="text-[10px] text-muted-foreground text-right pr-2 py-2">MEZ</div>
        {days.map((d, i) => (
          <div key={d.str} className={`text-center py-2 border-l border-border ${d.str === today ? '' : ''}`}>
            <span className="text-[11px] text-muted-foreground">{d.dayName} </span>
            <span className={`text-sm font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${d.str === today ? 'bg-destructive text-white' : 'text-foreground'}`}>
              {d.dayNum}
            </span>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-auto relative" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <div ref={gridRef} className="relative" style={{ height: HOUR_HEIGHT * 24 }}>
          {/* Grid */}
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
            {/* Time labels */}
            <div className="relative">
              {HOURS.map(h => (
                <div key={h} className="absolute right-2 text-[10px] text-muted-foreground" style={{ top: h * HOUR_HEIGHT - 6 }}>
                  {h > 0 ? formatHour(h) : ''}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((d, colIdx) => (
              <div
                key={d.str}
                className={`relative border-l border-border ${d.str === today ? 'bg-primary/[0.02]' : ''}`}
                onMouseDown={e => handleMouseDown(e, colIdx)}
              >
                {/* Hour lines */}
                {HOURS.map(h => (
                  <div key={h} className="absolute w-full border-t border-border/50" style={{ top: h * HOUR_HEIGHT }} />
                ))}

                {/* Events */}
                {timedEvents
                  .filter((e: CalendarEvent) => e.date === d.str)
                  .map((e: CalendarEvent) => {
                    const startH = timeToHour(e.startTime);
                    const endH = timeToHour(e.endTime);
                    const top = startH * HOUR_HEIGHT;
                    const height = Math.max((endH - startH) * HOUR_HEIGHT, 28);
                    const color = getCalColor(e.calendarId);
                    const isShort = height < 40;
                    return (
                      <div
                        key={e.id}
                        className="event-block absolute left-0.5 right-1 rounded-md px-2 py-0.5 cursor-pointer z-10 hover:opacity-90 transition-opacity"
                        style={{
                          top,
                          height,
                          backgroundColor: color + '25',
                          borderLeft: `3px solid ${color}`,
                          overflow: 'visible',
                        }}
                        onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
                        title={`${e.title} (${e.startTime} – ${e.endTime})`}
                      >
                        <p className="text-[11px] font-semibold truncate leading-tight" style={{ color }}>{e.title}</p>
                        {!isShort && (
                          <p className="text-[10px] opacity-70 leading-tight" style={{ color }}>
                            {e.startTime} – {e.endTime}
                          </p>
                        )}
                      </div>
                    );
                  })}

                {/* Drag selection */}
                {isDragging && dragCol === colIdx && (
                  <div
                    className="absolute left-0.5 right-1 rounded-md border-2 border-primary/40 bg-primary/10 z-20 pointer-events-none"
                    style={{
                      top: Math.min(dragStartY, dragEndY),
                      height: Math.abs(dragEndY - dragStartY),
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Current time line */}
          {nowCol >= 0 && (
            <div
              className="absolute z-30 pointer-events-none"
              style={{
                top: nowHour * HOUR_HEIGHT,
                left: `calc(56px + ${nowCol} * ((100% - 56px) / 7))`,
                width: `calc((100% - 56px) / 7)`,
              }}
            >
              <div className="relative">
                <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-destructive" />
                <div className="h-0.5 bg-destructive w-full" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========== DAY VIEW ========== */
function DayView({ currentDate, today, now, events, getCalColor, onCellClick, onEventClick }: any) {
  const dateStr = getDateStr(currentDate);
  const dayEvents = events.filter((e: CalendarEvent) => e.date === dateStr);
  const HOUR_HEIGHT = 56;

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragEndY, setDragEndY] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  const yToHour = (y: number) => Math.max(0, Math.min(23.5, Math.floor(y / HOUR_HEIGHT * 2) / 2));

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.event-block')) return;
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;
    const y = e.clientY - rect.top + (gridRef.current?.parentElement?.scrollTop || 0);
    setIsDragging(true);
    setDragStartY(y);
    setDragEndY(y);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top + (gridRef.current.parentElement?.scrollTop || 0);
    setDragEndY(y);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const startHour = yToHour(Math.min(dragStartY, dragEndY));
    const endHour = yToHour(Math.max(dragStartY, dragEndY)) + 0.5;
    if (endHour - startHour >= 0.5) {
      const startH = Math.floor(startHour);
      const startM = (startHour % 1) * 60;
      const endH = Math.floor(endHour);
      const endM = (endHour % 1) * 60;
      onCellClick(
        dateStr,
        `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
        `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
      );
    }
  };

  const nowStr = getDateStr(now);
  const nowHour = now.getHours() + now.getMinutes() / 60;

  return (
    <div className="h-full overflow-auto" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div ref={gridRef} className="relative grid" style={{ gridTemplateColumns: '56px 1fr', height: HOUR_HEIGHT * 24 }}>
        {/* Time labels */}
        <div className="relative">
          {HOURS.map(h => (
            <div key={h} className="absolute right-2 text-[10px] text-muted-foreground" style={{ top: h * HOUR_HEIGHT - 6 }}>
              {h > 0 ? formatHour(h) : ''}
            </div>
          ))}
        </div>

        {/* Day column */}
        <div className="relative border-l border-border" onMouseDown={handleMouseDown}>
          {HOURS.map(h => (
            <div key={h} className="absolute w-full border-t border-border/50" style={{ top: h * HOUR_HEIGHT }} />
          ))}

          {dayEvents.filter((e: CalendarEvent) => e.startTime).map((e: CalendarEvent) => {
            const startH = timeToHour(e.startTime);
            const endH = timeToHour(e.endTime);
            const top = startH * HOUR_HEIGHT;
            const height = Math.max((endH - startH) * HOUR_HEIGHT, 24);
            const color = getCalColor(e.calendarId);
            return (
              <div
                key={e.id}
                className="event-block absolute left-1 right-4 rounded-md px-3 py-1.5 cursor-pointer z-10 hover:opacity-90"
                style={{ top, height, backgroundColor: color + '25', borderLeft: `3px solid ${color}` }}
                onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
              >
                <p className="text-xs font-semibold" style={{ color }}>{e.title}</p>
                <p className="text-[10px] opacity-70" style={{ color }}>{e.startTime} – {e.endTime}</p>
              </div>
            );
          })}

          {isDragging && (
            <div
              className="absolute left-1 right-4 rounded-md border-2 border-primary/40 bg-primary/10 z-20 pointer-events-none"
              style={{ top: Math.min(dragStartY, dragEndY), height: Math.abs(dragEndY - dragStartY) }}
            />
          )}

          {dateStr === nowStr && (
            <div className="absolute left-0 right-0 z-30 pointer-events-none" style={{ top: nowHour * HOUR_HEIGHT }}>
              <div className="relative">
                <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-destructive" />
                <div className="h-0.5 bg-destructive w-full" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========== MONTH VIEW ========== */
function MonthView({ year, month, today, events, getCalColor, onCellClick, onEventClick }: any) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const makeDateStr = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-7 border-b border-border">
        {DAYS.map(d => (
          <div key={d} className="py-2 text-center text-[11px] font-medium text-muted-foreground">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1" style={{ gridAutoRows: '1fr' }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} className="border-b border-r border-border bg-secondary/20 p-1" />;
          const dateStr = makeDateStr(day);
          const dayEvents = events.filter((e: CalendarEvent) => e.date === dateStr);
          const isToday = dateStr === today;
          return (
            <div
              key={i}
              onClick={() => onCellClick(dateStr)}
              className="border-b border-r border-border p-1 cursor-pointer hover:bg-accent/20 transition-colors min-h-[80px]"
            >
              <div className="flex justify-end">
                <span className={`text-[11px] w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-destructive text-white font-semibold' : 'text-foreground'}`}>{day}</span>
              </div>
              <div className="mt-0.5 space-y-0.5">
                {dayEvents.slice(0, 3).map((e: CalendarEvent) => {
                  const color = getCalColor(e.calendarId);
                  return (
                    <div
                      key={e.id}
                      onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
                      className="text-[10px] leading-tight px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: color + '20', color, borderLeft: `2px solid ${color}` }}
                    >
                      {e.startTime && <span className="opacity-60 mr-0.5">{e.startTime}</span>}
                      {e.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && <p className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3}</p>}
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
    <div className="grid grid-cols-3 lg:grid-cols-4 gap-4 p-4">
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
                    <span className={`text-[9px] w-4 h-4 flex items-center justify-center rounded-full ${isToday ? 'bg-destructive text-white' : hasEvent ? 'bg-primary/20 text-primary' : 'text-foreground'}`}>{day}</span>
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
function EventModal({ event, date, time, endTime, calendars, onClose, onSave, onDelete }: {
  event: CalendarEvent | null; date: string; time: string | null; endTime: string | null; calendars: CalendarCategory[];
  onClose: () => void; onSave: (e: CalendarEvent) => void; onDelete?: () => void;
}) {
  const [form, setForm] = useState({
    title: event?.title || '',
    date: event?.date || date,
    startTime: event?.startTime || time || '09:00',
    endTime: event?.endTime || endTime || (time ? `${String(Math.min(23, parseInt(time) + 1)).padStart(2, '0')}:00` : '10:00'),
    description: event?.description || '',
    calendarId: event?.calendarId || calendars[0]?.id || '',
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const calColor = calendars.find(c => c.id === form.calendarId)?.color || '#6EB5FF';

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">{event ? 'Termin bearbeiten' : 'Neuer Termin'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Titel hinzufügen" className="w-full bg-transparent border-b border-border px-0 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" autoFocus />
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          <div className="grid grid-cols-2 gap-3">
            <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Kalender</label>
            <div className="flex flex-wrap gap-2">
              {calendars.map(c => (
                <button
                  key={c.id}
                  onClick={() => set('calendarId', c.id)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${form.calendarId === c.id ? 'border-foreground bg-secondary font-medium' : 'border-border hover:bg-accent'}`}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Beschreibung (optional)" rows={2} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
        </div>
        <div className="flex gap-3 mt-5">
          {onDelete && <button onClick={onDelete} className="px-3 py-2 rounded-md text-xs text-destructive hover:bg-destructive/10"><Trash2 size={14} /></button>}
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2 rounded-md text-xs border border-border text-foreground hover:bg-accent">Abbrechen</button>
          <button onClick={() => onSave({ ...form, id: event?.id || crypto.randomUUID(), color: calColor })} className="px-4 py-2 rounded-md text-xs bg-primary text-primary-foreground font-medium hover:opacity-90">
            {event ? 'Speichern' : 'Erstellen'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========== CALENDAR SETTINGS ========== */
function CalendarSettingsModal({ calendars, onClose, onSave }: { calendars: CalendarCategory[]; onClose: () => void; onSave: (c: CalendarCategory[]) => void }) {
  const [cals, setCals] = useState([...calendars]);
  const [editId, setEditId] = useState<string | null>(null);

  const addCal = () => {
    const newCal: CalendarCategory = { id: crypto.randomUUID(), name: 'Neuer Kalender', color: PRESET_COLORS[cals.length % PRESET_COLORS.length] };
    setCals([...cals, newCal]);
    setEditId(newCal.id);
  };

  const updateCal = (id: string, key: string, value: string) => setCals(cals.map(c => c.id === id ? { ...c, [key]: value } : c));
  const deleteCal = (id: string) => { if (cals.length > 1) setCals(cals.filter(c => c.id !== id)); };

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
                  <div className="flex gap-1">
                    {PRESET_COLORS.map(c => (
                      <button key={c} onClick={() => updateCal(cal.id, 'color', c)} className={`w-5 h-5 rounded-full border-2 ${cal.color === c ? 'border-foreground' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                    ))}
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
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cal.color }} />
                  <span className="flex-1 text-sm text-foreground">{cal.name}</span>
                  <button onClick={() => setEditId(cal.id)} className="text-muted-foreground hover:text-foreground"><Pencil size={12} /></button>
                  {cals.length > 1 && <button onClick={() => deleteCal(cal.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>}
                </>
              )}
            </div>
          ))}
        </div>
        <button onClick={addCal} className="text-xs text-primary hover:underline flex items-center gap-1 mb-4"><Plus size={12} /> Kalender hinzufügen</button>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-md text-xs border border-border text-foreground hover:bg-accent">Abbrechen</button>
          <button onClick={() => { onSave(cals); onClose(); }} className="flex-1 py-2 rounded-md text-xs bg-primary text-primary-foreground font-medium hover:opacity-90">Speichern</button>
        </div>
      </div>
    </div>
  );
}
