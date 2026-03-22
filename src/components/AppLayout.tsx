import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, TrendingUp, GitBranch, CheckSquare, Calendar, LogOut } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/crm', icon: Users, label: 'Kunden' },
  { to: '/finanzen', icon: TrendingUp, label: 'Finanzen' },
  { to: '/pipeline', icon: GitBranch, label: 'Pipeline' },
  { to: '/aufgaben', icon: CheckSquare, label: 'Aufgaben' },
  { to: '/kalender', icon: Calendar, label: 'Kalender' },
];

export default function AppLayout({ children, onLogout }: { children: ReactNode; onLogout: () => void }) {
  const location = useLocation();
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-lg font-bold text-foreground tracking-tight">HS Voice</h1>
          <p className="text-xs text-muted-foreground mt-1">Business Manager</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  active
                    ? 'bg-sidebar-accent text-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground'
                }`}
              >
                <Icon size={18} className={active ? 'text-primary' : ''} />
                {label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground w-full transition-colors"
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
