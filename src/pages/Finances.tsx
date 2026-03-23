import { useState } from 'react';
import { Euro, TrendingUp, Wallet, ArrowDown, ArrowUp, Plus, Trash2, Pencil, X, Save } from 'lucide-react';
import { getFinances, saveFinances } from '@/lib/store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { FinanceData, Expense } from '@/types';

export default function Finances() {
  const [finances, setFinances] = useState(getFinances());
  const [showBalanceEdit, setShowBalanceEdit] = useState(false);
  const [showRevenueAdd, setShowRevenueAdd] = useState(false);
  const [showFixCostAdd, setShowFixCostAdd] = useState(false);
  const [showVarCostAdd, setShowVarCostAdd] = useState(false);
  const [showIncomeAdd, setShowIncomeAdd] = useState(false);

  const update = (f: FinanceData) => { setFinances(f); saveFinances(f); };

  const mrr = finances.fixedMonthlyIncome.reduce((s, i) => s + i.amount, 0);
  const totalFixCosts = finances.fixedMonthlyCosts.reduce((s, c) => s + c.amount, 0);
  const totalVarCosts = finances.variableMonthlyCosts.reduce((s, c) => s + c.amount, 0);
  const totalRevenue = Object.values(finances.monthlyRevenues).reduce((s, v) => s + v, 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyRev = finances.monthlyRevenues[currentMonth] || 0;
  const year = new Date().getFullYear().toString();
  const yearlyRevenue = Object.entries(finances.monthlyRevenues).filter(([k]) => k.startsWith(year)).reduce((s, [, v]) => s + v, 0);

  const chartData = Object.entries(finances.monthlyRevenues).sort(([a], [b]) => a.localeCompare(b)).map(([month, value]) => ({ month: month.slice(2).replace('-', '/'), umsatz: value }));

  const expensesByCategory = [...finances.fixedMonthlyCosts, ...finances.variableMonthlyCosts].reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">Finanzen</h1>
      <p className="text-sm text-muted-foreground mb-6">Deine Unternehmensfinanzen im Überblick</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="glass-card p-4 cursor-pointer hover:border-primary/30" onClick={() => setShowBalanceEdit(true)}>
          <div className="flex items-center gap-2 mb-2"><Wallet size={16} className="text-muted-foreground" /><span className="text-xs text-muted-foreground">Kontostand</span><Pencil size={10} className="text-muted-foreground ml-auto" /></div>
          <p className="text-lg font-bold text-foreground">€{finances.currentBalance.toLocaleString('de-DE')}</p>
        </div>
        <Stat icon={TrendingUp} label="MRR" value={`€${mrr.toLocaleString('de-DE')}`} />
        <Stat icon={Euro} label="Monatsumsatz" value={`€${monthlyRev.toLocaleString('de-DE')}`} />
        <Stat icon={Euro} label="Jahresumsatz" value={`€${yearlyRevenue.toLocaleString('de-DE')}`} />
        <Stat icon={Euro} label="Gesamtumsatz" value={`€${totalRevenue.toLocaleString('de-DE')}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Monatliche Umsätze</h2>
            <button onClick={() => setShowRevenueAdd(true)} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus size={12} /> Umsatz eintragen</button>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 11 }} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 13%, 90%)', borderRadius: '8px', color: 'hsl(220, 15%, 15%)' }} />
                <Bar dataKey="umsatz" fill="hsl(220, 14%, 15%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-20 text-center">Noch keine Umsätze eingetragen</p>
          )}
        </div>

        {/* Expenses by Category */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-foreground mb-4">Ausgaben nach Kategorien</h2>
          {Object.keys(expensesByCategory).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a).map(([cat, amount]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{cat}</span>
                  <span className="text-sm font-medium text-foreground">€{amount.toLocaleString('de-DE')}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">Keine Ausgaben</p>}
        </div>

        {/* Fixed Monthly Income */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><ArrowUp size={16} className="text-success" />Fixe monatl. Einnahmen</h2>
            <button onClick={() => setShowIncomeAdd(true)} className="text-muted-foreground hover:text-primary"><Plus size={16} /></button>
          </div>
          <div className="space-y-2">
            {finances.fixedMonthlyIncome.map((i) => (
              <div key={i.id} className="flex items-center justify-between p-3 rounded-md bg-secondary">
                <span className="text-sm text-foreground">{i.description}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-success">+€{i.amount}</span>
                  <button onClick={() => update({ ...finances, fixedMonthlyIncome: finances.fixedMonthlyIncome.filter(x => x.id !== i.id) })} className="text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="text-sm font-medium text-foreground">MRR Gesamt</span>
              <span className="text-sm font-bold text-success">€{mrr.toLocaleString('de-DE')}</span>
            </div>
          </div>
        </div>

        {/* Fixed Monthly Costs */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><ArrowDown size={16} className="text-destructive" />Fixe monatl. Kosten</h2>
            <button onClick={() => setShowFixCostAdd(true)} className="text-muted-foreground hover:text-primary"><Plus size={16} /></button>
          </div>
          <div className="space-y-2">
            {finances.fixedMonthlyCosts.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-md bg-secondary">
                <span className="text-sm text-foreground">{c.description}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-destructive">-€{c.amount}</span>
                  <button onClick={() => update({ ...finances, fixedMonthlyCosts: finances.fixedMonthlyCosts.filter(x => x.id !== c.id) })} className="text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="text-sm font-medium text-foreground">Gesamt</span>
              <span className="text-sm font-bold text-destructive">€{totalFixCosts.toLocaleString('de-DE')}</span>
            </div>
          </div>
        </div>

        {/* Variable Monthly Costs */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><ArrowDown size={16} className="text-warning" />Variable monatl. Kosten</h2>
            <button onClick={() => setShowVarCostAdd(true)} className="text-muted-foreground hover:text-primary"><Plus size={16} /></button>
          </div>
          <div className="space-y-2">
            {finances.variableMonthlyCosts.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-md bg-secondary">
                <span className="text-sm text-foreground">{c.description}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-warning">-€{c.amount}</span>
                  <button onClick={() => update({ ...finances, variableMonthlyCosts: finances.variableMonthlyCosts.filter(x => x.id !== c.id) })} className="text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="text-sm font-medium text-foreground">Gesamt</span>
              <span className="text-sm font-bold text-warning">€{totalVarCosts.toLocaleString('de-DE')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showBalanceEdit && <EditValueModal title="Kontostand bearbeiten" label="Neuer Kontostand (€)" initial={finances.currentBalance} onClose={() => setShowBalanceEdit(false)} onSave={(v) => { update({ ...finances, currentBalance: v }); setShowBalanceEdit(false); }} />}
      {showRevenueAdd && <AddRevenueModal onClose={() => setShowRevenueAdd(false)} onSave={(month, amount) => { update({ ...finances, monthlyRevenues: { ...finances.monthlyRevenues, [month]: (finances.monthlyRevenues[month] || 0) + amount } }); setShowRevenueAdd(false); }} />}
      {showFixCostAdd && <AddExpenseModal title="Fixe Kosten hinzufügen" type="fix" onClose={() => setShowFixCostAdd(false)} onSave={(e) => { update({ ...finances, fixedMonthlyCosts: [...finances.fixedMonthlyCosts, e] }); setShowFixCostAdd(false); }} />}
      {showVarCostAdd && <AddExpenseModal title="Variable Kosten hinzufügen" type="variabel" onClose={() => setShowVarCostAdd(false)} onSave={(e) => { update({ ...finances, variableMonthlyCosts: [...finances.variableMonthlyCosts, e] }); setShowVarCostAdd(false); }} />}
      {showIncomeAdd && <AddIncomeModal onClose={() => setShowIncomeAdd(false)} onSave={(i) => { update({ ...finances, fixedMonthlyIncome: [...finances.fixedMonthlyIncome, i] }); setShowIncomeAdd(false); }} />}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-2"><Icon size={16} className="text-muted-foreground" /><span className="text-xs text-muted-foreground">{label}</span></div>
      <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

function EditValueModal({ title, label, initial, onClose, onSave }: { title: string; label: string; initial: number; onClose: () => void; onSave: (v: number) => void }) {
  const [val, setVal] = useState(String(initial));
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl shadow-lg p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-foreground mb-4">{title}</h2>
        <label className="text-sm text-muted-foreground block mb-1">{label}</label>
        <input type="number" value={val} onChange={e => setVal(e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring mb-4" />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-md text-xs border border-border text-foreground hover:bg-accent">Abbrechen</button>
          <button onClick={() => onSave(parseFloat(val) || 0)} className="flex-1 py-2 rounded-md text-xs bg-primary text-primary-foreground font-medium hover:opacity-90">Speichern</button>
        </div>
      </div>
    </div>
  );
}

function AddRevenueModal({ onClose, onSave }: { onClose: () => void; onSave: (month: string, amount: number) => void }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [amount, setAmount] = useState('');
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl shadow-lg p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-foreground mb-4">Umsatz eintragen</h2>
        <div className="space-y-3">
          <div><label className="text-sm text-muted-foreground block mb-1">Monat</label><input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" /></div>
          <div><label className="text-sm text-muted-foreground block mb-1">Betrag (€)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" /></div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2 rounded-md text-xs border border-border text-foreground hover:bg-accent">Abbrechen</button>
          <button onClick={() => onSave(month, parseFloat(amount) || 0)} className="flex-1 py-2 rounded-md text-xs bg-primary text-primary-foreground font-medium hover:opacity-90">Hinzufügen</button>
        </div>
      </div>
    </div>
  );
}

function AddExpenseModal({ title, type, onClose, onSave }: { title: string; type: 'fix' | 'variabel'; onClose: () => void; onSave: (e: Expense) => void }) {
  const [form, setForm] = useState({ description: '', amount: '', category: '' });
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl shadow-lg p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-foreground mb-4">{title}</h2>
        <div className="space-y-3">
          <div><label className="text-sm text-muted-foreground block mb-1">Beschreibung</label><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" /></div>
          <div><label className="text-sm text-muted-foreground block mb-1">Betrag (€)</label><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" /></div>
          <div><label className="text-sm text-muted-foreground block mb-1">Kategorie</label><input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="z.B. Miete, Software, API" className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" /></div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2 rounded-md text-xs border border-border text-foreground hover:bg-accent">Abbrechen</button>
          <button onClick={() => onSave({ id: crypto.randomUUID(), description: form.description, amount: parseFloat(form.amount) || 0, category: form.category, date: new Date().toISOString().split('T')[0], type })} className="flex-1 py-2 rounded-md text-xs bg-primary text-primary-foreground font-medium hover:opacity-90">Hinzufügen</button>
        </div>
      </div>
    </div>
  );
}

function AddIncomeModal({ onClose, onSave }: { onClose: () => void; onSave: (i: { id: string; description: string; amount: number }) => void }) {
  const [form, setForm] = useState({ description: '', amount: '' });
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl shadow-lg p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-foreground mb-4">Fixe Einnahme hinzufügen</h2>
        <div className="space-y-3">
          <div><label className="text-sm text-muted-foreground block mb-1">Beschreibung</label><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" /></div>
          <div><label className="text-sm text-muted-foreground block mb-1">Betrag (€)</label><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" /></div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2 rounded-md text-xs border border-border text-foreground hover:bg-accent">Abbrechen</button>
          <button onClick={() => onSave({ id: crypto.randomUUID(), description: form.description, amount: parseFloat(form.amount) || 0 })} className="flex-1 py-2 rounded-md text-xs bg-primary text-primary-foreground font-medium hover:opacity-90">Hinzufügen</button>
        </div>
      </div>
    </div>
  );
}
