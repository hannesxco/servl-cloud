import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, CheckSquare, Calendar, Euro, Wallet, ArrowRight, Sparkles } from 'lucide-react';
import { getCustomers, getTasks, getEvents, getFinances } from '@/lib/store';
import { CalendarEvent } from '@/types';

const QUOTES = [
  "Dein Kontostand sagt 'nein', aber dein Mindset sagt 'noch nicht'. 🚀",
  "Hustle so hart, dass dein zukünftiges Ich dir eine Dankeskarte schickt. 💌",
  "Montag ist nur ein weiterer Tag, um zu zeigen, dass du härter bist als dein Wecker. ⏰",
  "Verkaufe den Traum. Liefere die Realität. Kassiere die Rechnung. 💰",
  "Du bist einen Kaltanruf von deinem nächsten 6-stelligen Deal entfernt. Ruf an! 📞",
  "Kaffee trinken. Empire aufbauen. Repeat. ☕👑",
  "Wenn jemand sagt 'Das geht nicht' – lächle. Das ist dein Startschuss. 😏",
  "Deine Komfortzone hat WLAN. Trotzdem: Raus da! 🏃‍♂️",
  "Jeder Millionär hat irgendwann mal mit 0 angefangen. Du bist auf dem Weg. 📈",
  "Schlaf ist optional. Erfolg nicht. (Okay, schlaf trotzdem.) 😴💪",
  "Die beste Marketing-Strategie? Aufstehen und liefern. Jeden. Einzelnen. Tag. 🔥",
  "Dein nächster Kunde scrollt gerade durch LinkedIn. Zeig dich! 🎯",
  "Stress ist nur der Beweis, dass du etwas Großes aufbaust. Mach weiter! 🏗️",
  "Fake it till you make it? Nein – Build it till they can't ignore it. 🛠️",
  "Revenue ist Applaus. Profit ist Standing Ovation. Cash ist die Zugabe. 🎭",
  "Hannes, du bist nicht selbstständig – du bist SELBST-STÄNDIG. Und das ist geil. 🦁",
  "Wer nicht automatisiert, arbeitet für seine Arbeit. Let the agents work! 🤖",
  "Dein Business ist wie ein Gym-Abo: Nur effektiv, wenn du auch hingehst. 🏋️",
  "Plot Twist: Der nächste große Player in der Branche bist du. 🎬",
  "Emails beantworten ist kein Hustle. Deals closen ist Hustle. 🤝",
];

function getDailyQuote(): string {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}

export default function Dashboard() {
  const customers = getCustomers();
  const tasks = getTasks();
  const events = getEvents();
  const finances = getFinances();

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  const todayTasks = tasks.filter(t => t.date === today && !t.completed);
  const todayEvents = events.filter(e => e.date === today);
  const monthlyRevenue = finances.monthlyRevenues[currentMonth] || 0;
  const recentExpenses = finances.expenses.slice(0, 3);
  const mrr = finances.fixedMonthlyIncome.reduce((s, i) => s + i.amount, 0);

  const quote = useMemo(() => getDailyQuote(), []);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Willkommen zurück, Hannes</h1>
        <p className="text-muted-foreground text-sm mt-1">Hier ist deine Übersicht für heute</p>
      </div>

      {/* Daily Quote */}
      <div className="glass-card p-4 mb-6 flex items-center gap-3 bg-primary/5 border-primary/10">
        <Sparkles size={18} className="text-primary shrink-0" />
        <p className="text-sm text-foreground italic">{quote}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Euro} label="Monatsumsatz" value={`€${monthlyRevenue.toLocaleString('de-DE')}`} sub={currentMonth} />
        <StatCard icon={Wallet} label="Kontostand" value={`€${finances.currentBalance.toLocaleString('de-DE')}`} sub="Aktuell" />
        <StatCard icon={TrendingUp} label="MRR" value={`€${mrr.toLocaleString('de-DE')}`} sub={`${customers.length} Kunden`} />
        <StatCard icon={Users} label="Kunden" value={customers.length.toString()} sub="Aktive Kunden" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Calendar View */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            <Link to="/kalender" className="text-xs text-primary hover:underline flex items-center gap-1">Kalender <ArrowRight size={12} /></Link>
          </div>
          <DayTimeline events={todayEvents} />
        </div>

        {/* Today's Tasks */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><CheckSquare size={18} className="text-primary" />Heutige Aufgaben</h2>
            <Link to="/aufgaben" className="text-xs text-primary hover:underline flex items-center gap-1">Alle <ArrowRight size={12} /></Link>
          </div>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine offenen Aufgaben heute</p>
          ) : (
            <div className="space-y-3">
              {todayTasks.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.time} Uhr</p>
                  </div>
                  <PriorityBadge priority={t.priority} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><Wallet size={18} className="text-primary" />Letzte Ausgaben</h2>
            <Link to="/finanzen" className="text-xs text-primary hover:underline flex items-center gap-1">Alle <ArrowRight size={12} /></Link>
          </div>
          {recentExpenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Ausgaben vorhanden</p>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map(e => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">{e.description}</p>
                    <p className="text-xs text-muted-foreground">{e.category}</p>
                  </div>
                  <span className="text-sm font-medium text-destructive">-€{e.amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-foreground mb-4">Schnellzugriff</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/crm', icon: Users, label: 'Kunden', desc: `${customers.length} aktiv` },
              { to: '/pipeline', icon: TrendingUp, label: 'Pipeline', desc: 'Leads verwalten' },
              { to: '/aufgaben', icon: CheckSquare, label: 'Aufgaben', desc: `${tasks.filter(t => !t.completed).length} offen` },
              { to: '/kalender', icon: Calendar, label: 'Kalender', desc: 'Termine' },
            ].map(({ to, icon: Icon, label, desc }) => (
              <Link key={to} to={to} className="p-4 rounded-md bg-secondary/50 hover:bg-accent transition-colors group">
                <Icon size={20} className="text-primary mb-2" />
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="stat-label">{label}</span>
        <Icon size={18} className="text-primary" />
      </div>
      <p className="stat-value">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    dringend: 'bg-destructive/20 text-destructive',
    hoch: 'bg-warning/20 text-warning',
    mittel: 'bg-info/20 text-info',
    niedrig: 'bg-muted text-muted-foreground',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[priority] || colors.niedrig}`}>{priority}</span>;
}

function DayTimeline({ events }: { events: CalendarEvent[] }) {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  // Show a window of hours: from earliest event (or 7) to latest event end (or 20)
  const timeToH = (t: string) => { const [h, m] = t.split(':').map(Number); return h + m / 60; };
  let minH = 7, maxH = 20;
  events.forEach(e => {
    const s = timeToH(e.startTime);
    const end = timeToH(e.endTime);
    if (s < minH) minH = Math.floor(s);
    if (end > maxH) maxH = Math.ceil(end);
  });

  const hours = Array.from({ length: maxH - minH }, (_, i) => minH + i);
  const HOUR_HEIGHT = 48;

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine Termine heute</p>;
  }

  return (
    <div className="relative overflow-y-auto max-h-[320px] pr-1" style={{ scrollbarWidth: 'thin' }}>
      <div className="relative" style={{ height: hours.length * HOUR_HEIGHT }}>
        {/* Hour lines */}
        {hours.map(h => (
          <div
            key={h}
            className="absolute left-0 right-0 flex items-start"
            style={{ top: (h - minH) * HOUR_HEIGHT }}
          >
            <span className="text-[10px] text-muted-foreground w-10 shrink-0 -mt-1.5 text-right pr-2">
              {String(h).padStart(2, '0')}:00
            </span>
            <div className="flex-1 border-t border-border/50" />
          </div>
        ))}

        {/* Current time indicator */}
        {currentHour >= minH && currentHour <= maxH && (
          <div
            className="absolute left-10 right-0 flex items-center z-20 pointer-events-none"
            style={{ top: (currentHour - minH) * HOUR_HEIGHT }}
          >
            <div className="w-2 h-2 rounded-full bg-destructive -ml-1" />
            <div className="flex-1 border-t-2 border-destructive" />
          </div>
        )}

        {/* Events */}
        {events.map(e => {
          const start = timeToH(e.startTime);
          const end = timeToH(e.endTime);
          const top = (start - minH) * HOUR_HEIGHT;
          const height = Math.max((end - start) * HOUR_HEIGHT, 20);
          return (
            <div
              key={e.id}
              className="absolute left-11 right-1 rounded-md px-2 py-1 overflow-hidden z-10"
              style={{
                top,
                height,
                backgroundColor: e.color,
              }}
            >
              <p className="text-xs font-medium text-white truncate">{e.title}</p>
              {height > 28 && (
                <p className="text-[10px] text-white/80">{e.startTime} – {e.endTime}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
