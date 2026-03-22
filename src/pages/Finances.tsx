import { useState } from 'react';
import { Euro, TrendingUp, Wallet, ArrowDown, ArrowUp, Plus } from 'lucide-react';
import { getFinances, saveFinances } from '@/lib/store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Finances() {
  const [finances, setFinances] = useState(getFinances());

  const mrr = finances.fixedMonthlyIncome.reduce((s, i) => s + i.amount, 0);
  const totalFixCosts = finances.fixedMonthlyCosts.reduce((s, c) => s + c.amount, 0);
  const totalVarCosts = finances.variableMonthlyCosts.reduce((s, c) => s + c.amount, 0);
  const totalRevenue = Object.values(finances.monthlyRevenues).reduce((s, v) => s + v, 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyRev = finances.monthlyRevenues[currentMonth] || 0;

  const year = new Date().getFullYear().toString();
  const yearlyRevenue = Object.entries(finances.monthlyRevenues)
    .filter(([k]) => k.startsWith(year))
    .reduce((s, [, v]) => s + v, 0);

  const chartData = Object.entries(finances.monthlyRevenues)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month: month.slice(2).replace('-', '/'), umsatz: value }));

  const expensesByCategory = finances.expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">Finanzen</h1>
      <p className="text-sm text-muted-foreground mb-6">Deine Unternehmensfinanzen im Überblick</p>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Stat icon={Wallet} label="Kontostand" value={`€${finances.currentBalance.toLocaleString('de-DE')}`} />
        <Stat icon={TrendingUp} label="MRR" value={`€${mrr.toLocaleString('de-DE')}`} />
        <Stat icon={Euro} label="Monatsumsatz" value={`€${monthlyRev.toLocaleString('de-DE')}`} />
        <Stat icon={Euro} label="Jahresumsatz" value={`€${yearlyRevenue.toLocaleString('de-DE')}`} />
        <Stat icon={Euro} label="Gesamtumsatz" value={`€${totalRevenue.toLocaleString('de-DE')}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="font-semibold text-foreground mb-4">Monatliche Umsätze</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 16%)" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 44%, 9%)', border: '1px solid hsl(222, 20%, 16%)', borderRadius: '8px', color: 'hsl(210, 40%, 96%)' }} />
              <Bar dataKey="umsatz" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses by Category */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-foreground mb-4">Ausgaben nach Kategorien</h2>
          <div className="space-y-3">
            {Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a).map(([cat, amount]) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{cat}</span>
                <span className="text-sm font-medium text-foreground">€{amount.toLocaleString('de-DE')}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Gesamt</span>
              <span className="text-sm font-bold text-destructive">€{finances.expenses.reduce((s, e) => s + e.amount, 0).toLocaleString('de-DE')}</span>
            </div>
          </div>
        </div>

        {/* Fixed Income */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><ArrowUp size={16} className="text-primary" />Fixe monatl. Einnahmen</h2>
          <div className="space-y-3">
            {finances.fixedMonthlyIncome.map((i, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
                <span className="text-sm text-foreground">{i.description}</span>
                <span className="text-sm font-medium text-primary">+€{i.amount}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="text-sm font-medium text-foreground">MRR Gesamt</span>
              <span className="text-sm font-bold text-primary">€{mrr.toLocaleString('de-DE')}</span>
            </div>
          </div>
        </div>

        {/* Fixed Costs */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><ArrowDown size={16} className="text-destructive" />Fixe monatl. Kosten</h2>
          <div className="space-y-3">
            {finances.fixedMonthlyCosts.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
                <span className="text-sm text-foreground">{c.description}</span>
                <span className="text-sm font-medium text-destructive">-€{c.amount}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="text-sm font-medium text-foreground">Gesamt</span>
              <span className="text-sm font-bold text-destructive">€{totalFixCosts.toLocaleString('de-DE')}</span>
            </div>
          </div>
        </div>

        {/* Variable Costs */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><ArrowDown size={16} className="text-warning" />Variable monatl. Kosten</h2>
          <div className="space-y-3">
            {finances.variableMonthlyCosts.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
                <span className="text-sm text-foreground">{c.description}</span>
                <span className="text-sm font-medium text-warning">-€{c.amount}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="text-sm font-medium text-foreground">Gesamt</span>
              <span className="text-sm font-bold text-warning">€{totalVarCosts.toLocaleString('de-DE')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-primary" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}
