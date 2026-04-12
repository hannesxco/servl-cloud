import { useState, useRef } from 'react';
import { Plus, FileText, Trash2, X, Upload, Eye } from 'lucide-react';
import { useUploadedInvoices, useCustomers, useFinances } from '@/lib/cloud-store';
import { UploadedInvoice } from '@/types';

export default function Invoices() {
  const { invoices, saveInvoices } = useUploadedInvoices();
  const { customers, saveCustomers } = useCustomers();
  const { finances, saveFinances } = useFinances();
  const [showUpload, setShowUpload] = useState(false);
  const [preview, setPreview] = useState<UploadedInvoice | null>(null);

  const update = (i: UploadedInvoice[]) => { saveInvoices(i); };

  const syncInvoiceToFinancesAndCustomer = (inv: UploadedInvoice) => {
    const invoiceMonth = inv.date.slice(0, 7);
    const updatedFinances = {
      ...finances,
      monthlyRevenues: { ...finances.monthlyRevenues, [invoiceMonth]: (finances.monthlyRevenues[invoiceMonth] || 0) + inv.amount }
    };
    saveFinances(updatedFinances);

    const customerIdx = customers.findIndex(c => c.id === inv.customerId);
    if (customerIdx >= 0) {
      const customer = { ...customers[customerIdx] };
      customer.invoices = [...customer.invoices, {
        id: inv.id, date: inv.date, amount: inv.amount, status: 'offen' as const, description: inv.purpose || inv.fileName,
      }];
      customer.monthlyRevenue = { ...customer.monthlyRevenue };
      const month = inv.date.slice(0, 7);
      customer.monthlyRevenue[month] = (customer.monthlyRevenue[month] || 0) + inv.amount;
      customer.totalRevenue = Object.values(customer.monthlyRevenue).reduce((s, v) => s + v, 0);
      const updatedCustomers = [...customers];
      updatedCustomers[customerIdx] = customer;
      saveCustomers(updatedCustomers);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Rechnungen</h1>
          <p className="text-sm text-muted-foreground mt-1">{invoices.length} Rechnungen hochgeladen</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
          <Upload size={16} /> Rechnung hochladen
        </button>
      </div>

      {invoices.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FileText size={40} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Noch keine Rechnungen hochgeladen</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {invoices.map(inv => (
            <div key={inv.id} className="glass-card p-5 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setPreview(inv)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-primary" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground truncate max-w-[180px]">{inv.fileName}</h3>
                    <p className="text-xs text-muted-foreground">{inv.customerName}</p>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); update(invoices.filter(x => x.id !== inv.id)); }} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Betrag</span>
                  <span className="font-medium text-foreground">€{inv.amount.toLocaleString('de-DE')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Datum</span>
                  <span className="text-foreground">{inv.date}</span>
                </div>
                {inv.purpose && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Zweck: </span>
                    <span className="text-foreground">{inv.purpose}</span>
                  </div>
                )}
              </div>
              {inv.keypoints.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {inv.keypoints.map((kp, i) => (
                    <span key={i} className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{kp}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showUpload && <UploadModal customers={customers} onClose={() => setShowUpload(false)} onUpload={(inv) => { update([...invoices, inv]); syncInvoiceToFinancesAndCustomer(inv); setShowUpload(false); }} />}
      {preview && <PreviewModal invoice={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function UploadModal({ customers, onClose, onUpload }: { customers: any[]; onClose: () => void; onUpload: (inv: UploadedInvoice) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ customerId: '', amount: '', purpose: '', date: new Date().toISOString().split('T')[0], keypoints: '' });
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFileData(reader.result as string);
      const nameWithoutExt = file.name.replace(/\.[^.]+$/, '');
      const parts = nameWithoutExt.split(/[-_\s]+/).filter(Boolean);
      if (!form.keypoints) {
        setForm(f => ({ ...f, keypoints: parts.join(', ') }));
      }
    };
    reader.readAsDataURL(file);
  };

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const customer = customers.find(c => c.id === form.customerId);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl shadow-lg p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Rechnung hochladen</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">PDF-Datei</label>
            <input ref={fileRef} type="file" accept=".pdf" onChange={handleFile} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-md p-4 text-center hover:border-primary/50 transition-colors">
              {fileName ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText size={16} className="text-primary" />
                  <span className="text-sm text-foreground">{fileName}</span>
                </div>
              ) : (
                <div>
                  <Upload size={20} className="text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">PDF auswählen</p>
                </div>
              )}
            </button>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Kunde zuweisen</label>
            <select value={form.customerId} onChange={e => set('customerId', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">– Kunde auswählen –</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground block mb-1">Betrag (€)</label><input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" /></div>
            <div><label className="text-xs text-muted-foreground block mb-1">Datum</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" /></div>
          </div>
          <div><label className="text-xs text-muted-foreground block mb-1">Zweck</label><input value={form.purpose} onChange={e => set('purpose', e.target.value)} placeholder="z.B. Voice Agent Setup März" className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" /></div>
          <div><label className="text-xs text-muted-foreground block mb-1">Keypoints (kommagetrennt)</label><input value={form.keypoints} onChange={e => set('keypoints', e.target.value)} placeholder="z.B. Setup, Monatlich, Voice Agent" className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" /></div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-md text-xs border border-border text-foreground hover:bg-accent">Abbrechen</button>
          <button
            disabled={!fileData || !form.customerId}
            onClick={() => onUpload({
              id: crypto.randomUUID(), fileName, fileData, customerId: form.customerId,
              customerName: customer?.name || '', amount: parseFloat(form.amount) || 0,
              purpose: form.purpose, date: form.date,
              keypoints: form.keypoints.split(',').map(k => k.trim()).filter(Boolean),
              uploadedAt: new Date().toISOString(),
            })}
            className="flex-1 py-2 rounded-md text-xs bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
          >
            Hochladen
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({ invoice, onClose }: { invoice: UploadedInvoice; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl shadow-lg w-full max-w-4xl h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">{invoice.fileName}</h2>
            <p className="text-xs text-muted-foreground">{invoice.customerName} · €{invoice.amount.toLocaleString('de-DE')} · {invoice.date}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <div className="flex flex-1 min-h-0">
          <div className="flex-1">
            <iframe src={invoice.fileData} className="w-full h-full" title="PDF Preview" />
          </div>
          <div className="w-72 border-l border-border p-4 overflow-auto">
            <h3 className="text-sm font-semibold text-foreground mb-3">Keypoints</h3>
            <div className="space-y-2">
              <div><p className="text-xs text-muted-foreground">Betrag</p><p className="text-sm font-medium text-foreground">€{invoice.amount.toLocaleString('de-DE')}</p></div>
              <div><p className="text-xs text-muted-foreground">Zweck</p><p className="text-sm text-foreground">{invoice.purpose || '–'}</p></div>
              <div><p className="text-xs text-muted-foreground">Datum</p><p className="text-sm text-foreground">{invoice.date}</p></div>
              <div><p className="text-xs text-muted-foreground">Kunde</p><p className="text-sm text-foreground">{invoice.customerName}</p></div>
              {invoice.keypoints.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {invoice.keypoints.map((kp, i) => (
                      <span key={i} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{kp}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
