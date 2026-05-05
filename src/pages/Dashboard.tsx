import { Link } from 'react-router-dom';
import { Users, TrendingUp, Euro, Wallet, ArrowRight, Mail, FolderKanban } from 'lucide-react';
import { useCustomers, useFinances, useMails, useProjects } from '@/lib/cloud-store';

export default function Dashboard() {
  const { customers } = useCustomers();
  const { finances } = useFinances();
  const { mails } = useMails();
  const { projects } = useProjects();

  const currentMonth = new Date().toISOString().slice(0, 7);

  const monthlyRevenue = finances.monthlyRevenues[currentMonth] || 0;
  const mrr = finances.fixedMonthlyIncome.reduce((s, i) => s + i.amount, 0);
  const recentMails = mails.filter(m => m.folder === 'inbox').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);
  const activeProjects = projects.filter(p => {
    const prog = p.tasks.length === 0 ? 0 : p.tasks.filter(t => t.completed).length / p.tasks.length;
    return prog < 1;
  }).slice(0, 3);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Willkommen zurück, Hannes</h1>
        <p className="text-muted-foreground text-sm mt-1">Hier ist deine Übersicht für heute</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Euro} label="Monatsumsatz" value={`€${monthlyRevenue.toLocaleString('de-DE')}`} sub={currentMonth} color="green" />
        <StatCard icon={Wallet} label="Kontostand" value={`€${finances.currentBalance.toLocaleString('de-DE')}`} sub="Aktuell" color="yellow" />
        <StatCard icon={TrendingUp} label="MRR" value={`€${mrr.toLocaleString('de-DE')}`} sub={`${customers.length} Kunden`} color="blue" />
        <StatCard icon={Users} label="Kunden" value={customers.length.toString()} sub="Aktive Kunden" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><Mail size={18} className="text-brand-purple" />E-Mail</h2>
            <Link to="/mail" className="text-xs text-brand-purple hover:underline flex items-center gap-1">Alle <ArrowRight size={12} /></Link>
          </div>
          {recentMails.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine neuen E-Mails</p>
          ) : (
            <div className="space-y-3">
              {recentMails.map(m => (
                <div key={m.id} className={`p-3 rounded-md ${!m.read ? 'bg-brand-purple/5 border border-brand-purple/10' : 'bg-secondary/50'}`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-sm ${!m.read ? 'font-semibold text-foreground' : 'text-foreground'}`}>{m.fromName || m.from}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(m.date).toLocaleDateString('de-DE')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{m.subject}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><FolderKanban size={18} className="text-brand-yellow" />Projekte</h2>
            <Link to="/projekte" className="text-xs text-brand-yellow hover:underline flex items-center gap-1">Alle <ArrowRight size={12} /></Link>
          </div>
          {activeProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine aktiven Projekte</p>
          ) : (
            <div className="space-y-3">
              {activeProjects.map(p => {
                const prog = p.tasks.length === 0 ? 0 : Math.round((p.tasks.filter(t => t.completed).length / p.tasks.length) * 100);
                return (
                  <div key={p.id} className="p-3 rounded-md bg-secondary/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">{p.name}</span>
                      <span className="text-xs text-muted-foreground">{prog}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-brand-yellow transition-all" style={{ width: `${prog}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub: string; color: 'green' | 'yellow' | 'blue' | 'purple' }) {
  const colorMap = {
    green: { bg: 'bg-brand-green/10', text: 'text-brand-green', border: 'border-brand-green/20' },
    yellow: { bg: 'bg-brand-yellow/10', text: 'text-brand-yellow', border: 'border-brand-yellow/20' },
    blue: { bg: 'bg-brand-blue/10', text: 'text-brand-blue', border: 'border-brand-blue/20' },
    purple: { bg: 'bg-brand-purple/10', text: 'text-brand-purple', border: 'border-brand-purple/20' },
  };
  const c = colorMap[color];
  return (
    <div className={`glass-card p-5 border ${c.border}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="stat-label">{label}</span>
        <div className={`p-2 rounded-lg ${c.bg}`}>
          <Icon size={18} className={c.text} />
        </div>
      </div>
      <p className="stat-value">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

