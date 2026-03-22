import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, CheckSquare, Calendar, Euro, Wallet, ArrowRight } from 'lucide-react';
import { getCustomers, getTasks, getEvents, getFinances } from '@/lib/store';

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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Willkommen zurück, Hannes</h1>
        <p className="text-muted-foreground text-sm mt-1">Hier ist deine Übersicht für heute</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Euro} label="Monatsumsatz" value={`€${monthlyRevenue.toLocaleString('de-DE')}`} sub={currentMonth} />
        <StatCard icon={Wallet} label="Kontostand" value={`€${finances.currentBalance.toLocaleString('de-DE')}`} sub="Aktuell" />
        <StatCard icon={TrendingUp} label="MRR" value={`€${mrr.toLocaleString('de-DE')}`} sub={`${customers.length} Kunden`} />
        <StatCard icon={Users} label="Kunden" value={customers.length.toString()} sub="Aktive Kunden" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Events */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><Calendar size={18} className="text-primary" />Heutige Termine</h2>
            <Link to="/kalender" className="text-xs text-primary hover:underline flex items-center gap-1">Alle <ArrowRight size={12} /></Link>
          </div>
          {todayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Termine heute</p>
          ) : (
            <div className="space-y-3">
              {todayEvents.map(e => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-md bg-secondary/50">
                  <div className="w-1 h-10 rounded-full" style={{ backgroundColor: e.color }} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.startTime} - {e.endTime}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
