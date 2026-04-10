import { useState, useMemo } from 'react';
import { Search, Plus, Send, Inbox, FileEdit, Mail as MailIcon, ArrowLeft, Trash2, User } from 'lucide-react';
import { useMails, useCustomers } from '@/lib/cloud-store';
import { MailMessage, Customer } from '@/types';

type Folder = 'inbox' | 'sent' | 'drafts';

export default function Mail() {
  const { mails, saveMails } = useMails();
  const { customers } = useCustomers();
  const [folder, setFolder] = useState<Folder>('inbox');
  const [search, setSearch] = useState('');
  const [selectedMail, setSelectedMail] = useState<string | null>(null);
  const [showCompose, setShowCompose] = useState(false);

  const update = (m: MailMessage[]) => { saveMails(m); };

  const folderMails = mails
    .filter(m => m.folder === folder)
    .filter(m => m.subject.toLowerCase().includes(search.toLowerCase()) || m.fromName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const activeMail = mails.find(m => m.id === selectedMail);

  const markRead = (id: string) => {
    update(mails.map(m => m.id === id ? { ...m, read: true } : m));
  };

  const deleteMail = (id: string) => {
    update(mails.filter(m => m.id !== id));
    setSelectedMail(null);
  };

  const unreadCount = mails.filter(m => m.folder === 'inbox' && !m.read).length;

  const folders: { key: Folder; label: string; icon: any; count?: number }[] = [
    { key: 'inbox', label: 'Posteingang', icon: Inbox, count: unreadCount || undefined },
    { key: 'sent', label: 'Gesendet', icon: Send },
    { key: 'drafts', label: 'Entwürfe', icon: FileEdit },
  ];

  return (
    <div className="flex h-full">
      <div className="w-56 border-r border-border p-4 flex flex-col shrink-0">
        <button onClick={() => setShowCompose(true)} className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity mb-4 w-full">
          <Plus size={16} /> Verfassen
        </button>
        <nav className="space-y-0.5">
          {folders.map(f => (
            <button
              key={f.key}
              onClick={() => { setFolder(f.key); setSelectedMail(null); }}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm w-full transition-colors ${folder === f.key ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-secondary'}`}
            >
              <f.icon size={16} />
              <span className="flex-1 text-left">{f.label}</span>
              {f.count && <span className="text-xs bg-brand-blue text-white rounded-full px-1.5">{f.count}</span>}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedMail && activeMail ? (
          <MailDetail mail={activeMail} onBack={() => setSelectedMail(null)} onDelete={() => deleteMail(activeMail.id)} />
        ) : (
          <>
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Mails durchsuchen..." className="w-full bg-secondary border border-border rounded-md pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {folderMails.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MailIcon size={40} className="mb-3 opacity-30" />
                  <p className="text-sm">Keine E-Mails in {folders.find(f => f.key === folder)?.label}</p>
                </div>
              ) : (
                folderMails.map(m => (
                  <div
                    key={m.id}
                    onClick={() => { setSelectedMail(m.id); markRead(m.id); }}
                    className={`px-4 py-3 border-b border-border cursor-pointer hover:bg-secondary/50 transition-colors ${!m.read ? 'bg-brand-blue/5' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm ${!m.read ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                        {folder === 'sent' ? m.toName || m.to : m.fromName || m.from}
                      </span>
                      <span className="text-xs text-muted-foreground">{new Date(m.date).toLocaleDateString('de-DE')}</span>
                    </div>
                    <p className={`text-sm truncate ${!m.read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{m.subject}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{m.body.slice(0, 80)}...</p>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {showCompose && <ComposeModal customers={customers} onClose={() => setShowCompose(false)} onSend={(m) => { update([...mails, m]); setShowCompose(false); }} />}
    </div>
  );
}

function MailDetail({ mail, onBack, onDelete }: { mail: MailMessage; onBack: () => void; onDelete: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <button onClick={onBack} className="p-1 hover:bg-secondary rounded-md"><ArrowLeft size={18} /></button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">{mail.subject}</h2>
        </div>
        <button onClick={onDelete} className="p-2 text-muted-foreground hover:text-destructive rounded-md hover:bg-secondary"><Trash2 size={16} /></button>
      </div>
      <div className="p-6 flex-1 overflow-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-brand-purple/20 flex items-center justify-center">
            <User size={18} className="text-brand-purple" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{mail.fromName || mail.from}</p>
            <p className="text-xs text-muted-foreground">An: {mail.toName || mail.to}</p>
          </div>
          <span className="ml-auto text-xs text-muted-foreground">{new Date(mail.date).toLocaleString('de-DE')}</span>
        </div>
        <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{mail.body}</div>
      </div>
    </div>
  );
}

function ComposeModal({ customers, onClose, onSend }: { customers: Customer[]; onClose: () => void; onSend: (m: MailMessage) => void }) {
  const [to, setTo] = useState('');
  const [toName, setToName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showCustomers, setShowCustomers] = useState(false);
  const [customerId, setCustomerId] = useState<string | undefined>();

  const selectCustomer = (c: Customer) => {
    setTo(c.email);
    setToName(c.name);
    setCustomerId(c.id);
    setShowCustomers(false);
  };

  const send = () => {
    if (!to.trim() || !subject.trim()) return;
    const mail: MailMessage = {
      id: crypto.randomUUID(), from: 'schumacherhannes967@gmail.com', fromName: 'Hannes Schumacher',
      to: to.trim(), toName: toName.trim(), subject: subject.trim(), body: body.trim(),
      date: new Date().toISOString(), read: true, folder: 'sent', customerId,
    };
    onSend(mail);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-foreground mb-4">Neue E-Mail</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground block mb-1">An</label>
            <div className="flex gap-2">
              <input value={to} onChange={e => setTo(e.target.value)} placeholder="email@beispiel.de" className="flex-1 bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              <button onClick={() => setShowCustomers(!showCustomers)} className="px-3 py-2 border border-border rounded-md text-sm text-muted-foreground hover:bg-secondary flex items-center gap-1">
                <User size={14} /> Kunde
              </button>
            </div>
            {showCustomers && customers.length > 0 && (
              <div className="mt-2 bg-card border border-border rounded-md max-h-40 overflow-auto">
                {customers.filter(c => c.email).map(c => (
                  <button key={c.id} onClick={() => selectCustomer(c)} className="w-full text-left px-3 py-2 text-sm hover:bg-secondary flex items-center justify-between">
                    <span className="text-foreground">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Betreff</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Nachricht</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-md text-sm border border-border text-foreground hover:bg-accent transition-colors">Abbrechen</button>
          <button onClick={send} className="flex-1 py-2 rounded-md text-sm bg-primary text-primary-foreground font-medium hover:opacity-90 flex items-center justify-center gap-2">
            <Send size={14} /> Senden
          </button>
        </div>
      </div>
    </div>
  );
}
