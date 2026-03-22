import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Phone, Mail, MapPin, ExternalLink, Bot, FileText, Pencil } from 'lucide-react';
import { getCustomers, saveCustomers } from '@/lib/store';
import { Customer } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState(getCustomers());
  const customer = customers.find(c => c.id === id);
  const [showEdit, setShowEdit] = useState(false);

  if (!customer) return (
    <div className="p-8">
      <button onClick={() => navigate('/crm')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft size={16} />Zurück</button>
      <p className="text-foreground">Kunde nicht gefunden</p>
    </div>
  );

  const handleSave = (updated: Customer) => {
    const newCustomers = customers.map(c => c.id === updated.id ? updated : c);
    setCustomers(newCustomers);
    saveCustomers(newCustomers);
    setShowEdit(false);
  };

  const chartData = Object.entries(customer.monthlyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month: month.slice(5), umsatz: value }));

  return (
    <div className="p-8">
      <button onClick={() => navigate('/crm')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft size={16} />Zurück zu Kunden</button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
          <p className="text-muted-foreground">{customer.company} · <span className="text-primary">{customer.companyType}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowEdit(true)} className="flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm text-foreground hover:bg-accent transition-colors">
            <Pencil size={14} /> Bearbeiten
          </button>
          <span className="stat-value">€{customer.totalRevenue.toLocaleString('de-DE')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="font-semibold text-foreground mb-4">Umsatz nach Monaten</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: 'hsl(220, 10%, 50%)', fontSize: 12 }} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 13%, 90%)', borderRadius: '8px', color: 'hsl(220, 15%, 15%)' }} />
              <Bar dataKey="umsatz" fill="hsl(220, 14%, 15%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Contact Info */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Kontakt</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm"><Phone size={16} className="text-muted-foreground" /><span className="text-foreground">{customer.phone}</span></div>
            <div className="flex items-center gap-3 text-sm"><Mail size={16} className="text-muted-foreground" /><span className="text-foreground">{customer.email}</span></div>
            <div className="flex items-start gap-3 text-sm"><MapPin size={16} className="text-muted-foreground mt-0.5" /><span className="text-foreground">{customer.address}</span></div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm text-muted-foreground mb-2">Standort</h3>
            <div className="w-full h-40 rounded-md bg-secondary flex items-center justify-center overflow-hidden">
              <iframe
                title="map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://www.google.com/maps?q=${encodeURIComponent(customer.address)}&output=embed`}
              />
            </div>
          </div>
          {customer.notes && (
            <div>
              <h3 className="text-sm text-muted-foreground mb-1">Notizen</h3>
              <p className="text-sm text-foreground">{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Voice Agents */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Bot size={18} className="text-muted-foreground" />Aktive Voice Agents</h2>
          {customer.voiceAgents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Voice Agents</p>
          ) : (
            <div className="space-y-4">
              {customer.voiceAgents.map(agent => (
                <div key={agent.id} className="p-4 rounded-md bg-secondary space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-foreground">{agent.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${agent.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>{agent.active ? 'Aktiv' : 'Inaktiv'}</span>
                  </div>
                  <p className="text-sm text-muted-foreground"><strong className="text-foreground">Prompt:</strong> {agent.prompt}</p>
                  <p className="text-sm text-muted-foreground"><strong className="text-foreground">Knowledgebase:</strong> {agent.knowledgebase}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground"><Phone size={14} />{agent.phone}</span>
                    <a href={agent.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-foreground hover:underline"><ExternalLink size={14} />Agent öffnen</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoices */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><FileText size={18} className="text-muted-foreground" />Rechnungen</h2>
          {customer.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Rechnungen</p>
          ) : (
            <div className="space-y-3">
              {customer.invoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-md bg-secondary">
                  <div>
                    <p className="text-sm font-medium text-foreground">{inv.description}</p>
                    <p className="text-xs text-muted-foreground">{inv.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">€{inv.amount}</p>
                    <span className={`text-xs ${inv.status === 'bezahlt' ? 'text-success' : inv.status === 'überfällig' ? 'text-destructive' : 'text-warning'}`}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEdit && <EditCustomerModal customer={customer} onClose={() => setShowEdit(false)} onSave={handleSave} />}
    </div>
  );
}

function EditCustomerModal({ customer, onClose, onSave }: { customer: Customer; onClose: () => void; onSave: (c: Customer) => void }) {
  const [form, setForm] = useState({
    name: customer.name, company: customer.company, companyType: customer.companyType,
    city: customer.city, address: customer.address, phone: customer.phone,
    email: customer.email, notes: customer.notes,
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-lg max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-foreground mb-4">Kunde bearbeiten</h2>
        <div className="space-y-3">
          {[
            { k: 'name', l: 'Name' }, { k: 'company', l: 'Unternehmen' }, { k: 'companyType', l: 'Branche' },
            { k: 'city', l: 'Stadt' }, { k: 'address', l: 'Adresse' }, { k: 'phone', l: 'Telefon' },
            { k: 'email', l: 'Email' },
          ].map(({ k, l }) => (
            <div key={k}>
              <label className="text-sm text-muted-foreground block mb-1">{l}</label>
              <input
                value={(form as any)[k]}
                onChange={e => set(k, e.target.value)}
                className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          ))}
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Notizen</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-md text-sm border border-border text-foreground hover:bg-accent transition-colors">Abbrechen</button>
          <button onClick={() => onSave({ ...customer, ...form })} className="flex-1 py-2 rounded-md text-sm bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">Speichern</button>
        </div>
      </div>
    </div>
  );
}
