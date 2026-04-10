import { useState, DragEvent } from 'react';
import { Plus, Tag, CheckCircle2, Circle, Trash2, ChevronRight, ChevronDown, BarChart3, X, LayoutList, Columns3, GripVertical } from 'lucide-react';
import { useProjects, useProjectTags } from '@/lib/cloud-store';
import { Project, ProjectTask, ProjectTag, TaskStatus } from '@/types';

const KANBAN_COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'todo', label: 'Zu erledigen', color: 'hsl(var(--color-yellow))' },
  { status: 'in_progress', label: 'In Arbeit', color: 'hsl(var(--color-blue))' },
  { status: 'done', label: 'Erledigt', color: 'hsl(var(--color-green))' },
];

export default function Projects() {
  const [projects, setProjects] = useState(getProjects());
  const [tags, setTags] = useState(getProjectTags());
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const update = (p: Project[]) => { setProjects(p); saveProjects(p); };
  const updateTags = (t: ProjectTag[]) => { setTags(t); saveProjectTags(t); };

  const filtered = filterTag
    ? projects.filter(p => p.tags.includes(filterTag))
    : projects;

  const activeProject = projects.find(p => p.id === selectedProject);

  const toggleTask = (projectId: string, taskId: string) => {
    update(projects.map(p =>
      p.id === projectId
        ? {
            ...p, tasks: p.tasks.map(t => t.id === taskId
              ? { ...t, completed: !t.completed, status: (!t.completed ? 'done' : 'todo') as TaskStatus }
              : t)
          }
        : p
    ));
  };

  const addTask = (projectId: string, title: string) => {
    const task: ProjectTask = { id: crypto.randomUUID(), title, completed: false, status: 'todo', createdAt: new Date().toISOString() };
    update(projects.map(p => p.id === projectId ? { ...p, tasks: [...p.tasks, task] } : p));
  };

  const deleteTask = (projectId: string, taskId: string) => {
    update(projects.map(p => p.id === projectId ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) } : p));
  };

  const moveTask = (projectId: string, taskId: string, newStatus: TaskStatus) => {
    update(projects.map(p =>
      p.id === projectId
        ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, status: newStatus, completed: newStatus === 'done' } : t) }
        : p
    ));
  };

  const deleteProject = (id: string) => {
    if (confirm('Projekt wirklich löschen?')) {
      update(projects.filter(p => p.id !== id));
      if (selectedProject === id) setSelectedProject(null);
    }
  };

  const progress = (p: Project) => {
    if (p.tasks.length === 0) return 0;
    return Math.round((p.tasks.filter(t => t.completed).length / p.tasks.length) * 100);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projekte</h1>
          <p className="text-sm text-muted-foreground mt-1">{projects.length} Projekte</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddTag(true)} className="flex items-center gap-2 border border-border text-foreground px-4 py-2 rounded-md text-sm hover:bg-secondary transition-colors">
            <Tag size={16} /> Tags
          </button>
          <button onClick={() => setShowAddProject(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus size={16} /> Neues Projekt
          </button>
        </div>
      </div>

      {/* Tag Filter */}
      {tags.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilterTag(null)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${!filterTag ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-muted'}`}
          >
            Alle
          </button>
          {tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${filterTag === tag.id ? 'text-white' : 'text-muted-foreground hover:opacity-80'}`}
              style={filterTag === tag.id ? { backgroundColor: tag.color } : { backgroundColor: tag.color + '20', color: tag.color }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project List */}
        <div className="lg:col-span-1 space-y-3">
          {filtered.map(p => {
            const prog = progress(p);
            const isActive = selectedProject === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedProject(isActive ? null : p.id)}
                className={`glass-card p-4 cursor-pointer transition-colors ${isActive ? 'border-primary/40 bg-primary/5' : 'hover:border-primary/20'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {isActive ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                      <h3 className="font-semibold text-foreground text-sm">{p.name}</h3>
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground mt-1 ml-6">{p.description}</p>}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                </div>

                {p.tags.length > 0 && (
                  <div className="flex gap-1 ml-6 mb-2 flex-wrap">
                    {p.tags.map(tagId => {
                      const tag = tags.find(t => t.id === tagId);
                      return tag ? (
                        <span key={tagId} className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: tag.color }}>{tag.name}</span>
                      ) : null;
                    })}
                  </div>
                )}

                <div className="ml-6 flex items-center gap-3">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${prog}%`, backgroundColor: prog === 100 ? 'hsl(var(--color-green))' : 'hsl(var(--color-blue))' }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium w-10 text-right">{prog}%</span>
                </div>
                <p className="text-[10px] text-muted-foreground ml-6 mt-1">{p.tasks.filter(t => t.completed).length}/{p.tasks.length} Aufgaben</p>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Keine Projekte vorhanden</p>}
        </div>

        {/* Project Detail */}
        <div className="lg:col-span-2">
          {activeProject ? (
            <div>
              {/* View toggle */}
              <div className="flex gap-1 mb-4 bg-secondary rounded-lg p-1 w-fit">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <LayoutList size={14} /> Liste
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'kanban' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Columns3 size={14} /> Kanban
                </button>
              </div>

              {viewMode === 'list' ? (
                <ProjectDetail
                  project={activeProject}
                  tags={tags}
                  onToggleTask={(taskId) => toggleTask(activeProject.id, taskId)}
                  onAddTask={(title) => addTask(activeProject.id, title)}
                  onDeleteTask={(taskId) => deleteTask(activeProject.id, taskId)}
                />
              ) : (
                <KanbanBoard
                  project={activeProject}
                  onAddTask={(title) => addTask(activeProject.id, title)}
                  onDeleteTask={(taskId) => deleteTask(activeProject.id, taskId)}
                  onMoveTask={(taskId, status) => moveTask(activeProject.id, taskId, status)}
                  onToggleTask={(taskId) => toggleTask(activeProject.id, taskId)}
                />
              )}
            </div>
          ) : (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
              <BarChart3 size={48} className="text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Wähle ein Projekt aus der Liste</p>
            </div>
          )}
        </div>
      </div>

      {showAddProject && <AddProjectModal tags={tags} onClose={() => setShowAddProject(false)} onSave={(p) => { update([...projects, p]); setShowAddProject(false); }} />}
      {showAddTag && <TagManager tags={tags} onClose={() => setShowAddTag(false)} onUpdate={updateTags} />}
    </div>
  );
}

/* ─── Kanban Board ─── */
function KanbanBoard({ project, onAddTask, onDeleteTask, onMoveTask, onToggleTask }: {
  project: Project;
  onAddTask: (title: string) => void;
  onDeleteTask: (id: string) => void;
  onMoveTask: (taskId: string, status: TaskStatus) => void;
  onToggleTask: (id: string) => void;
}) {
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [newTaskCol, setNewTaskCol] = useState<TaskStatus | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const prog = project.tasks.length === 0 ? 0 : Math.round((project.tasks.filter(t => t.completed).length / project.tasks.length) * 100);

  const handleDragStart = (e: DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(status);
  };

  const handleDrop = (e: DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) onMoveTask(taskId, status);
    setDragOverCol(null);
  };

  const handleAddInColumn = (status: TaskStatus) => {
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle.trim());
    // The task is added as 'todo' by default, so move it if needed
    // We'll handle this by adding with correct status via a slight delay
    setNewTaskTitle('');
    setNewTaskCol(null);
    // For non-todo columns, we move it after creation
    if (status !== 'todo') {
      setTimeout(() => {
        const projects = getProjects();
        const p = projects.find(pr => pr.id === project.id);
        if (p) {
          const lastTask = p.tasks[p.tasks.length - 1];
          if (lastTask) onMoveTask(lastTask.id, status);
        }
      }, 50);
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-foreground">{project.name}</h2>
        <span className="text-sm font-semibold" style={{ color: prog === 100 ? 'hsl(var(--color-green))' : 'hsl(var(--color-blue))' }}>{prog}%</span>
      </div>
      {project.description && <p className="text-sm text-muted-foreground mb-4">{project.description}</p>}

      <div className="h-3 bg-secondary rounded-full overflow-hidden mb-6">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${prog}%`, backgroundColor: prog === 100 ? 'hsl(var(--color-green))' : 'hsl(var(--color-blue))' }}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {KANBAN_COLUMNS.map(col => {
          const tasks = project.tasks.filter(t => (t.status || (t.completed ? 'done' : 'todo')) === col.status);
          const isDragOver = dragOverCol === col.status;

          return (
            <div
              key={col.status}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`rounded-xl p-3 min-h-[200px] transition-colors ${isDragOver ? 'bg-primary/10 ring-2 ring-primary/30' : 'bg-secondary/50'}`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-xs font-semibold text-foreground">{col.label}</span>
                  <span className="text-[10px] text-muted-foreground bg-background rounded-full px-1.5 py-0.5">{tasks.length}</span>
                </div>
                <button
                  onClick={() => setNewTaskCol(newTaskCol === col.status ? null : col.status)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add task inline */}
              {newTaskCol === col.status && (
                <form
                  onSubmit={(e) => { e.preventDefault(); handleAddInColumn(col.status); }}
                  className="mb-2"
                >
                  <input
                    autoFocus
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onBlur={() => { if (!newTaskTitle.trim()) setNewTaskCol(null); }}
                    placeholder="Aufgabe..."
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </form>
              )}

              {/* Task cards */}
              <div className="space-y-2">
                {tasks.map(t => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, t.id)}
                    className="bg-background rounded-lg p-3 border border-border shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors group"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical size={12} className="text-muted-foreground/40 mt-0.5 shrink-0" />
                      <button onClick={() => onToggleTask(t.id)} className="shrink-0 mt-0.5">
                        {t.completed
                          ? <CheckCircle2 size={14} className="text-brand-green" />
                          : <Circle size={14} className="text-muted-foreground" />
                        }
                      </button>
                      <span className={`flex-1 text-xs ${t.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{t.title}</span>
                      <button onClick={() => onDeleteTask(t.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── List Detail ─── */
function ProjectDetail({ project, tags, onToggleTask, onAddTask, onDeleteTask }: {
  project: Project; tags: ProjectTag[];
  onToggleTask: (id: string) => void; onAddTask: (title: string) => void; onDeleteTask: (id: string) => void;
}) {
  const [newTask, setNewTask] = useState('');
  const prog = project.tasks.length === 0 ? 0 : Math.round((project.tasks.filter(t => t.completed).length / project.tasks.length) * 100);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-foreground">{project.name}</h2>
        <span className="text-sm font-semibold" style={{ color: prog === 100 ? 'hsl(var(--color-green))' : 'hsl(var(--color-blue))' }}>{prog}%</span>
      </div>
      {project.description && <p className="text-sm text-muted-foreground mb-4">{project.description}</p>}

      <div className="h-3 bg-secondary rounded-full overflow-hidden mb-6">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${prog}%`, backgroundColor: prog === 100 ? 'hsl(var(--color-green))' : 'hsl(var(--color-blue))' }}
        />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (newTask.trim()) { onAddTask(newTask.trim()); setNewTask(''); } }} className="flex gap-2 mb-4">
        <input
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          placeholder="Neue Aufgabe..."
          className="flex-1 bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">Hinzufügen</button>
      </form>

      <div className="space-y-2">
        {project.tasks.map(t => (
          <div key={t.id} className="flex items-center gap-3 p-3 rounded-md bg-secondary/50 group">
            <button onClick={() => onToggleTask(t.id)} className="shrink-0">
              {t.completed
                ? <CheckCircle2 size={18} className="text-brand-green" />
                : <Circle size={18} className="text-muted-foreground" />
              }
            </button>
            <span className={`flex-1 text-sm ${t.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{t.title}</span>
            <button onClick={() => onDeleteTask(t.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 size={14} /></button>
          </div>
        ))}
        {project.tasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Noch keine Aufgaben</p>}
      </div>
    </div>
  );
}

function AddProjectModal({ tags, onClose, onSave }: { tags: ProjectTag[]; onClose: () => void; onSave: (p: Project) => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTagSel = (id: string) => setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-foreground mb-4">Neues Projekt</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Beschreibung</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </div>
          {tags.length > 0 && (
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Tags</label>
              <div className="flex gap-2 flex-wrap">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTagSel(tag.id)}
                    className={`text-xs px-3 py-1.5 rounded-full transition-colors ${selectedTags.includes(tag.id) ? 'text-white' : ''}`}
                    style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color } : { backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-md text-sm border border-border text-foreground hover:bg-accent transition-colors">Abbrechen</button>
          <button onClick={() => {
            if (!name.trim()) return;
            onSave({ id: crypto.randomUUID(), name: name.trim(), description: desc.trim(), tags: selectedTags, tasks: [], createdAt: new Date().toISOString() });
          }} className="flex-1 py-2 rounded-md text-sm bg-primary text-primary-foreground font-medium hover:opacity-90">Erstellen</button>
        </div>
      </div>
    </div>
  );
}

function TagManager({ tags, onClose, onUpdate }: { tags: ProjectTag[]; onClose: () => void; onUpdate: (t: ProjectTag[]) => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const colors = ['#22c55e', '#eab308', '#3b82f6', '#a855f7', '#ef4444', '#f97316', '#06b6d4', '#ec4899'];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-foreground mb-4">Tags verwalten</h2>

        <div className="space-y-2 mb-4">
          {tags.map(tag => (
            <div key={tag.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                <span className="text-sm text-foreground">{tag.name}</span>
              </div>
              <button onClick={() => onUpdate(tags.filter(t => t.id !== tag.id))} className="text-muted-foreground hover:text-destructive"><X size={14} /></button>
            </div>
          ))}
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Neuer Tag..." className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          <div className="flex gap-2">
            {colors.map(c => (
              <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-ring' : ''}`} style={{ backgroundColor: c }} />
            ))}
          </div>
          <button onClick={() => {
            if (!name.trim()) return;
            onUpdate([...tags, { id: crypto.randomUUID(), name: name.trim(), color }]);
            setName('');
          }} className="w-full py-2 rounded-md text-sm bg-primary text-primary-foreground font-medium hover:opacity-90">Tag erstellen</button>
        </div>

        <button onClick={onClose} className="w-full py-2 rounded-md text-sm border border-border text-foreground hover:bg-accent mt-3">Schließen</button>
      </div>
    </div>
  );
}