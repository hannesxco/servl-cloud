import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, MapPin, Euro, Clock, Pencil, Trash2, Upload, X } from 'lucide-react';
import { useCustomers } from '@/lib/cloud-store';
import { Customer } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export default function CRM() {
  const { customers, saveCustomers } = useCustomers();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const navigate = useNavigate();

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  const partnerMonths = (since: string) => {
    const d = new Date(since);
    const now = new Date();
    return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30));
  };

  const updateCustomers = (updated: Customer[]) => {
    saveCustomers(updated);
  };

  const deleteCustomer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Kunde wirklich löschen?')) {
      updateCustomers(customers.filter(c => c.id !== id));
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kunden</h1>
          <p className="text-sm text-muted-foreground mt-1">{customers.length} aktive Kunden</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={16} /> Neuer Kunde
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Kunden suchen..."
          className="w-full bg-card border border-border rounded-md pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div
            key={c.id}
            onClick={() => navigate(`/crm/${c.id}`)}
            className="glass-card p-5 cursor-pointer hover:border-primary/30 transition-colors group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {c.avatar ? (
                  <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full object-cover bg-secondary" loading="lazy" width={40} height={40} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-purple/20 flex items-center justify-center text-brand-purple font-semibold text-sm">
                    {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{c.name}</h3>
                  <p className="text-sm text-muted-foreground">{c.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); setEditCustomer(c); }} className="p-1 text-muted-foreground hover:text-foreground rounded"><Pencil size={14} /></button>
                <button onClick={(e) => deleteCustomer(c.id, e)} className="p-1 text-muted-foreground hover:text-destructive rounded"><Trash2 size={14} /></button>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground mb-3 inline-block">{c.companyType}</span>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Euro size={14} /> <span className="text-foreground font-medium">€{c.totalRevenue.toLocaleString('de-DE')}</span> Gesamtumsatz
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock size={14} /> {partnerMonths(c.partnerSince)} Monate Partner
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={14} /> {c.city}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && <CustomerModal onClose={() => setShowAdd(false)} onSave={(c) => {
        updateCustomers([...customers, c]);
        setShowAdd(false);
      }} />}

      {editCustomer && <CustomerModal customer={editCustomer} onClose={() => setEditCustomer(null)} onSave={(c) => {
        updateCustomers(customers.map(cu => cu.id === c.id ? c : cu));
        setEditCustomer(null);
      }} />}
    </div>
  );
}

function CustomerModal({ customer, onClose, onSave }: { customer?: Customer; onClose: () => void; onSave: (c: Customer) => void }) {
  const isEdit = !!customer;
  const [form, setForm] = useState({
    name: customer?.name || '', company: customer?.company || '', companyType: customer?.companyType || '',
    city: customer?.city || '', address: customer?.address || '', phone: customer?.phone || '',
    email: customer?.email || '', notes: customer?.notes || '',
  });
  const [avatarUrl, setAvatarUrl] = useState(customer?.avatar || '');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('customer-avatars').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('customer-avatars').getPublicUrl(path);
      setAvatarUrl(publicUrl);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (isEdit) {
      onSave({ ...customer!, ...form, avatar: avatarUrl || undefined });
    } else {
      onSave({
        ...form, id: crypto.randomUUID(), partnerSince: new Date().toISOString().split('T')[0],
        totalRevenue: 0, monthlyRevenue: {}, invoices: [], voiceAgents: [],
        avatar: avatarUrl || undefined,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-lg max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-foreground mb-4">{isEdit ? 'Kunde bearbeiten' : 'Neuer Kunde'}</h2>

        <div className="mb-4">
          <label className="text-sm text-muted-foreground block mb-2">Profilbild</label>
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <div className="relative">
                <img src={avatarUrl} alt="Profilbild" className="w-16 h-16 rounded-full object-cover bg-secondary" />
                <button
                  onClick={() => setAvatarUrl('')}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                <Upload size={20} />
              </div>
            )}
            <div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="text-sm px-3 py-1.5 rounded-md border border-border text-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                {uploading ? 'Wird hochgeladen...' : 'Bild hochladen'}
              </button>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG oder WebP</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>

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
          <button onClick={handleSave} className="flex-1 py-2 rounded-md text-sm bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">{isEdit ? 'Speichern' : 'Erstellen'}</button>
        </div>
      </div>
    </div>
  );
}
