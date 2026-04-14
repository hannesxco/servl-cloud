import { ReactNode, useState, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, GitBranch, CheckSquare, Calendar, LogOut, Menu, X, GripVertical, Wallet } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavOrder } from '@/lib/cloud-store';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const allNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/crm', icon: Users, label: 'Kunden' },
  { to: '/pipeline', icon: GitBranch, label: 'Pipeline' },
  { to: '/aufgaben', icon: CheckSquare, label: 'Aufgaben' },
  { to: '/kalender', icon: Calendar, label: 'Kalender' },
  { to: '/ausgaben', icon: Wallet, label: 'Ausgaben' },
];

function SortableNavItem({ item, active, isMobile, closeSidebar }: {
  item: typeof allNavItems[0];
  active: boolean;
  isMobile: boolean;
  closeSidebar: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.to });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center group">
      <button {...attributes} {...listeners} className="p-1 opacity-0 group-hover:opacity-60 cursor-grab touch-none shrink-0">
        <GripVertical size={14} />
      </button>
      <NavLink
        to={item.to}
        onClick={() => isMobile && closeSidebar()}
        className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
          active
            ? 'bg-foreground text-primary-foreground font-medium shadow-sm'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        }`}
      >
        <item.icon size={18} />
        {item.label}
      </NavLink>
    </div>
  );
}

export default function AppLayout({ children, onLogout }: { children: ReactNode; onLogout: () => void }) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { navOrder, saveNavOrder } = useNavOrder();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const sortedNavItems = useMemo(() => {
    if (!navOrder || navOrder.length === 0) return allNavItems;
    const ordered: typeof allNavItems = [];
    for (const path of navOrder) {
      const item = allNavItems.find(n => n.to === path);
      if (item) ordered.push(item);
    }
    // Add any new items not in saved order
    for (const item of allNavItems) {
      if (!ordered.find(o => o.to === item.to)) ordered.push(item);
    }
    return ordered;
  }, [navOrder]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sortedNavItems.findIndex(n => n.to === active.id);
    const newIdx = sortedNavItems.findIndex(n => n.to === over.id);
    const reordered = arrayMove(sortedNavItems, oldIdx, newIdx);
    saveNavOrder(reordered.map(n => n.to));
  };

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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedNavItems.map(n => n.to)} strategy={verticalListSortingStrategy}>
            {sortedNavItems.map(item => {
              const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <SortableNavItem
                  key={item.to}
                  item={item}
                  active={active}
                  isMobile={isMobile}
                  closeSidebar={() => setSidebarOpen(false)}
                />
              );
            })}
          </SortableContext>
        </DndContext>
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
