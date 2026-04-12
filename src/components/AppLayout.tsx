import { ReactNode, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, TrendingUp, GitBranch, CheckSquare, Calendar, LogOut, Bot, FileText, FolderKanban, Mail, Menu, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/crm', icon: Users, label: 'Kunden' },
  { to: '/projekte', icon: FolderKanban, label: 'Projekte' },
  { to: '/mail', icon: Mail, label: 'Mail' },
  { to: '/finanzen', icon: TrendingUp, label: 'Finanzen' },
  { to: '/pipeline', icon: GitBranch, label: 'Pipeline' },
  { to: '/aufgaben', icon: CheckSquare, label: 'Aufgaben' },
  { to: '/kalender', icon: Calendar, label: 'Kalender' },
  { to: '/agents', icon: Bot, label: 'Agents' },
  { to: '/rechnungen', icon: FileText, label: 'Rechnungen' },
];

export default function AppLayout({ children, onLogout }: { children: ReactNode; onLogout: () => void }) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebar = (
    <aside className={`${isMobile ? 'fixed inset-y-0 left-0 z-50 w-64' : 'w-64 shrink-0'} bg-card border-r border-border flex flex-col`}>
      <div className="p-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Servl Cloud</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Business Manager</p>
        </div>
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:bg-secondary">
            <X size={20} />
          </button>
        )}
      </div>
      <nav className="flex-1 px-3 space-y-0.5 overflow-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          return (
            <NavLink
              key={to}
              to={to}
              onClick={() => isMobile && setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                active
                  ? 'bg-foreground text-primary-foreground font-medium shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-secondary hover:text-foreground w-full transition-all duration-150"
        >
          <LogOut size={18} />
          Abmelden
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {isMobile ? (
        <>
          {sidebarOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
              {sidebar}
            </>
          )}
        </>
      ) : (
        sidebar
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isMobile && (
          <header className="h-12 flex items-center px-4 border-b border-border bg-card shrink-0">
            <button onClick={() => setSidebarOpen(true)} className="p-1 rounded-lg text-muted-foreground hover:bg-secondary">
              <Menu size={22} />
            </button>
            <span className="ml-3 text-sm font-semibold text-foreground">Servl Cloud</span>
          </header>
        )}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
