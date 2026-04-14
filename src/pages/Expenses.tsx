import { useState, useMemo } from 'react';
import { Plus, TrendingUp, TrendingDown, Receipt, Upload, X, Tag } from 'lucide-react';
import { useBusinessExpenses, useExpenseCategories } from '@/lib/cloud-store';
import { BusinessExpense, ExpenseCategory } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, startOfMonth, subMonths, isAfter } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const CATEGORY_COLORS: Record<string, string> = {
  'Lebensmittel': 'hsl(0, 72%, 51%)',
  'Einrichtung': 'hsl(217, 91%, 60%)',
  'Shopping': 'hsl(38, 92%, 50%)',
  'Sport': 'hsl(280, 65%, 60%)',
  'Software': 'hsl(160, 84%, 39%)',
  'Transport': 'hsl(340, 75%, 55%)',
  'Büro': 'hsl(200, 70%, 50%)',
  'Marketing': 'hsl(30, 85%, 55%)',
};

function getCategoryColor(name: string): string {
  if (CATEGORY_COLORS[name]) return CATEGORY_COLORS[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 65%, 50%)`;
}

function getCategoryInitial(name: string): string {
  return name.substring(0, 2).toUpperCase();
}

export default function Expenses() {
  const { expenses, saveExpenses } = useBusinessExpenses();
  const { categories, saveCategories } = useExpenseCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);

    const thisMonthExpenses = expenses.filter(e => {
      const d = parseISO(e.date);
      return isAfter(d, thisMonthStart) || format(d, 'yyyy-MM') === format(now, 'yyyy-MM');
    });
    const thisMonthTotal = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);

    // Average monthly expenses (last 6 months)
    const monthTotals: Record<string, number> = {};
    for (const e of expenses) {
      const m = format(parseISO(e.date), 'yyyy-MM');
      monthTotals[m] = (monthTotals[m] || 0) + e.amount;
    }
    const months = Object.keys(monthTotals).sort();
    const avg = months.length > 0 ? Object.values(monthTotals).reduce((a, b) => a + b, 0) / months.length : 0;

    // Trend: compare last 2 months
    const lastMonth = format(subMonths(now, 1), 'yyyy-MM');
    const twoMonthsAgo = format(subMonths(now, 2), 'yyyy-MM');
    const lastMonthTotal = monthTotals[lastMonth] || 0;
    const twoMonthsAgoTotal = monthTotals[twoMonthsAgo] || 0;
    const trending = lastMonthTotal >= twoMonthsAgoTotal ? 'up' : 'down';

    return { thisMonthTotal, avg, trending };
  }, [expenses]);

  // Group expenses by date
  const grouped = useMemo(() => {
    const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    const groups: { date: string; items: BusinessExpense[] }[] = [];
    for (const exp of sorted) {
      const last = groups[groups.length - 1];
      if (last && last.date === exp.date) {
        last.items.push(exp);
      } else {
        groups.push({ date: exp.date, items: [exp] });
      }
    }
    return groups;
  }, [expenses]);

  const handleAddExpense = async () => {
    if (!newName || !newAmount || !newCategory) return;
    setUploading(true);

    let receiptUrl: string | undefined;
    if (receiptFile) {
      const ext = receiptFile.name.split('.').pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('expense-receipts').upload(path, receiptFile);
      if (!error) {
        const { data } = supabase.storage.from('expense-receipts').getPublicUrl(path);
        receiptUrl = data.publicUrl;
      }
    }

    const expense: BusinessExpense = {
      id: crypto.randomUUID(),
      name: newName,
      amount: parseFloat(newAmount),
      category: newCategory,
      date: newDate,
      receiptUrl,
      createdAt: new Date().toISOString(),
    };

    saveExpenses([...expenses, expense]);

    // Ensure category exists
    if (!categories.find(c => c.name === newCategory)) {
      saveCategories([...categories, { id: crypto.randomUUID(), name: newCategory }]);
    }

    setNewName('');
    setNewAmount('');
    setNewCategory('');
    setReceiptFile(null);
    setDialogOpen(false);
    setUploading(false);
    setShowNewCat(false);
    setNewCategoryInput('');
  };

  const addNewCategory = () => {
    if (!newCategoryInput.trim()) return;
    const cat: ExpenseCategory = { id: crypto.randomUUID(), name: newCategoryInput.trim() };
    saveCategories([...categories, cat]);
    setNewCategory(cat.name);
    setNewCategoryInput('');
    setShowNewCat(false);
  };

  const formatDay = (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      return format(d, 'dd.MM. EEE', { locale: de });
    } catch { return dateStr; }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Ausgaben</h1>
          <p className="text-sm text-muted-foreground">Betriebsausgaben verwalten</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus size={16} />
              <span className="hidden sm:inline">Ausgabe hinzufügen</span>
              <span className="sm:hidden">Neu</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ausgabe hinzufügen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Name</Label>
                <Input placeholder="z.B. REWE, Amazon..." value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div>
                <Label>Betrag (€)</Label>
                <Input type="number" step="0.01" placeholder="0,00" value={newAmount} onChange={e => setNewAmount(e.target.value)} />
              </div>
              <div>
                <Label>Kategorie</Label>
                {!showNewCat ? (
                  <div className="flex gap-2">
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Kategorie wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => setShowNewCat(true)} title="Neue Kategorie">
                      <Tag size={16} />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input placeholder="Neue Kategorie..." value={newCategoryInput} onChange={e => setNewCategoryInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addNewCategory()} />
                    <Button variant="outline" size="sm" onClick={addNewCategory}>OK</Button>
                    <Button variant="ghost" size="icon" onClick={() => setShowNewCat(false)}><X size={16} /></Button>
                  </div>
                )}
              </div>
              <div>
                <Label>Datum</Label>
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
              </div>
              <div>
                <Label>Beleg (optional)</Label>
                <Input type="file" accept="image/*,.pdf" onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
              </div>
              <Button onClick={handleAddExpense} disabled={uploading || !newName || !newAmount || !newCategory} className="w-full">
                {uploading ? 'Wird hochgeladen...' : 'Speichern'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Dieser Monat</p>
          <p className="text-lg font-bold text-foreground">{stats.thisMonthTotal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Ø Monatlich</p>
          <p className="text-lg font-bold text-foreground">{stats.avg.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Tendenz</p>
          <div className="flex items-center justify-center gap-1">
            {stats.trending === 'up' ? (
              <>
                <TrendingUp size={20} className="text-destructive" />
                <span className="text-sm font-medium text-destructive">Steigend</span>
              </>
            ) : (
              <>
                <TrendingDown size={20} className="text-green-500" />
                <span className="text-sm font-medium text-green-500">Sinkend</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Feed */}
      {grouped.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Receipt size={48} className="mx-auto mb-3 opacity-40" />
          <p>Noch keine Ausgaben erfasst.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {grouped.map(group => (
            <div key={group.date}>
              {/* Date header */}
              <div className="bg-secondary/60 px-4 py-1.5 text-sm font-medium text-muted-foreground rounded-lg mb-0.5">
                {formatDay(group.date)}
              </div>
              {/* Items */}
              {group.items.map((exp, i) => (
                <div key={exp.id} className={`flex items-center gap-3 px-4 py-3 ${i < group.items.length - 1 ? 'border-b border-border/50' : ''}`}>
                  {/* Category icon */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: getCategoryColor(exp.category) }}
                  >
                    {getCategoryInitial(exp.category)}
                  </div>
                  {/* Name + Category */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{exp.name}</p>
                    <p className="text-xs text-muted-foreground">{exp.category}</p>
                  </div>
                  {/* Amount */}
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      -{exp.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                    </span>
                    {exp.receiptUrl && (
                      <a href={exp.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                        <Receipt size={16} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
