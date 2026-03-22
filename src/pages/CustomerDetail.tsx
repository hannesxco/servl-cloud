import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, ExternalLink, Bot, FileText } from 'lucide-react';
import { getCustomers } from '@/lib/store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const customer = getCustomers().find(c => c.id === id);

  if (!customer) return (
    <div className="p-8">
      <button onClick={() => navigate('/crm')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft size={16} />Zurück</button>
      <p className="text-foreground">Kunde nicht gefunden</p>
    </div>
  );

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
        <span className="stat-value text-primary">€{customer.totalRevenue.toLocaleString('de-DE')}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="font-semibold text-foreground mb-4">Umsatz nach Monaten</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 20%, 16%)" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 44%, 9%)', border: '1px solid hsl(222, 20%, 16%)', borderRadius: '8px', color: 'hsl(210, 40%, 96%)' }} />
              <Bar dataKey="umsatz" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Contact Info */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Kontakt</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm"><Phone size={16} className="text-primary" /><span className="text-foreground">{customer.phone}</span></div>
            <div className="flex items-center gap-3 text-sm"><Mail size={16} className="text-primary" /><span className="text-foreground">{customer.email}</span></div>
            <div className="flex items-start gap-3 text-sm"><MapPin size={16} className="text-primary mt-0.5" /><span className="text-foreground">{customer.address}</span></div>
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
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Bot size={18} className="text-primary" />Aktive Voice Agents</h2>
          {customer.voiceAgents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Voice Agents</p>
          ) : (
            <div className="space-y-4">
              {customer.voiceAgents.map(agent => (
                <div key={agent.id} className="p-4 rounded-md bg-secondary/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-foreground">{agent.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${agent.active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{agent.active ? 'Aktiv' : 'Inaktiv'}</span>
                  </div>
                  <p className="text-sm text-muted-foreground"><strong className="text-foreground">Prompt:</strong> {agent.prompt}</p>
                  <p className="text-sm text-muted-foreground"><strong className="text-foreground">Knowledgebase:</strong> {agent.knowledgebase}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground"><Phone size={14} />{agent.phone}</span>
                    <a href={agent.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline"><ExternalLink size={14} />Agent öffnen</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoices */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><FileText size={18} className="text-primary" />Rechnungen</h2>
          {customer.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Rechnungen</p>
          ) : (
            <div className="space-y-3">
              {customer.invoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">{inv.description}</p>
                    <p className="text-xs text-muted-foreground">{inv.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">€{inv.amount}</p>
                    <span className={`text-xs ${inv.status === 'bezahlt' ? 'text-primary' : inv.status === 'überfällig' ? 'text-destructive' : 'text-warning'}`}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
