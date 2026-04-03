import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, TrendingUp, GitBranch, CheckSquare, Calendar, LogOut, Bot, FileText } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/crm', icon: Users, label: 'Kunden' },
  { to: '/finanzen', icon: TrendingUp, label: 'Finanzen' },
  { to: '/pipeline', icon: GitBranch, label: 'Pipeline' },
  { to: '/aufgaben', icon: CheckSquare, label: 'Aufgaben' },
  { to: '/kalender', icon: Calendar, label: 'Kalender' },
  { to: '/agents', icon: Bot, label: 'Agents' },
  { to: '/rechnungen', icon: FileText, label: 'Rechnungen' },
];

export default function AppLayout({ children, onLogout }: { children: ReactNode; onLogout: () => void }) {
  const location = useLocation();
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0">
        <div className="p-6 pb-4">
          <h1 className="text-xl font-bold text-foreground tracking-tight">Servl Cloud</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Business Manager</p>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
            return (
              <NavLink
                key={to}
                to={to}
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
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
