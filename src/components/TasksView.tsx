'use client';

import { useState } from 'react';
import { AppState, Task } from '@/lib/types';
import { addTask, updateTask, deleteTask, saveState } from '@/lib/store';
import {
  ListTodo,
  Plus,
  X,
  Trash2,
  GripVertical,
  AlertTriangle,
  Flame,
  Minus,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Zap,
  Filter,
} from 'lucide-react';

interface TasksViewProps {
  state: AppState;
  setState: (state: AppState) => void;
}

const columns: { key: Task['status']; label: string; color: string }[] = [
  { key: 'backlog', label: 'Backlog', color: 'border-border-light' },
  { key: 'todo', label: 'To Do', color: 'border-warning' },
  { key: 'in_progress', label: 'In Progress', color: 'border-info' },
  { key: 'review', label: 'Review', color: 'border-accent' },
  { key: 'done', label: 'Done', color: 'border-success' },
];

const priorityConfig: Record<Task['priority'], { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  urgent: { label: 'Urgent', icon: <AlertTriangle size={12} />, color: 'text-danger', bgColor: 'bg-danger/10' },
  high: { label: 'High', icon: <Flame size={12} />, color: 'text-warning', bgColor: 'bg-warning/10' },
  medium: { label: 'Medium', icon: <Minus size={12} />, color: 'text-info', bgColor: 'bg-info/10' },
  low: { label: 'Low', icon: <Minus size={12} />, color: 'text-muted', bgColor: 'bg-surface' },
};

export default function TasksView({ state, setState }: TasksViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterPriority, setFilterPriority] = useState<Task['priority'] | 'all'>('all');

  function handleAddTask(task: Omit<Task, 'id' | 'createdAt'>) {
    const next = addTask(state, task);
    setState(next);
    saveState(next);
    setShowAddForm(false);
  }

  function handleMoveTask(id: string, newStatus: Task['status']) {
    const updates: Partial<Task> = { status: newStatus };
    if (newStatus === 'done') updates.completedAt = new Date().toISOString();
    const next = updateTask(state, id, updates);
    setState(next);
    saveState(next);
  }

  function handleDeleteTask(id: string) {
    const next = deleteTask(state, id);
    setState(next);
    saveState(next);
  }

  const filteredTasks = filterPriority === 'all'
    ? state.tasks
    : state.tasks.filter(t => t.priority === filterPriority);

  const totalOpen = state.tasks.filter(t => t.status !== 'done').length;
  const totalDone = state.tasks.filter(t => t.status === 'done').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ListTodo size={24} className="text-accent-light" />
            Task Pipeline
          </h2>
          <p className="text-sm text-muted mt-1">
            {totalOpen} open &middot; {totalDone} completed
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter */}
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
            <Filter size={14} className="text-muted" />
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value as Task['priority'] | 'all')}
              className="bg-transparent text-sm text-foreground focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-light transition-colors"
          >
            <Plus size={16} /> New Task
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-4 min-h-[60vh]">
        {columns.map(col => {
          const colTasks = filteredTasks
            .filter(t => t.status === col.key)
            .sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority));

          return (
            <div key={col.key} className={`bg-card/50 border-t-2 ${col.color} rounded-xl p-3`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">{col.label}</h3>
                <span className="text-xs text-muted bg-surface px-2 py-0.5 rounded-full">{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onMove={handleMoveTask}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showAddForm && (
        <AddTaskModal
          onAdd={handleAddTask}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}

function TaskCard({
  task,
  onMove,
  onDelete,
}: {
  task: Task;
  onMove: (id: string, status: Task['status']) => void;
  onDelete: (id: string) => void;
}) {
  const config = priorityConfig[task.priority];
  const statusFlow: Record<string, Task['status'] | null> = {
    backlog: 'todo',
    todo: 'in_progress',
    in_progress: 'review',
    review: 'done',
    done: null,
  };
  const nextStatus = statusFlow[task.status];

  return (
    <div className="bg-surface border border-border rounded-lg p-3 group card-interactive">
      <div className="flex items-start gap-2 mb-2">
        <GripVertical size={14} className="text-border-light mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-tight">{task.title}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${config.color} ${config.bgColor}`}>
          {config.icon} {config.label}
        </span>
        {task.energyLevel && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface text-muted">
            <Zap size={10} /> {task.energyLevel}
          </span>
        )}
      </div>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.map(tag => (
            <span key={tag} className="text-[10px] text-muted">#{tag}</span>
          ))}
        </div>
      )}

      {task.dueDate && (
        <div className="flex items-center gap-1 text-[10px] text-muted mb-2">
          <Clock size={10} />
          {task.dueDate}
        </div>
      )}

      <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        {nextStatus ? (
          <button
            onClick={() => onMove(task.id, nextStatus)}
            className="flex items-center gap-1 text-[10px] text-accent-light hover:text-accent font-medium"
          >
            {task.status === 'review' ? <CheckCircle2 size={12} /> : <ArrowRight size={12} />}
            {task.status === 'review' ? 'Complete' : 'Advance'}
          </button>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-success">
            <CheckCircle2 size={12} /> Done
          </span>
        )}
        <button
          onClick={() => onDelete(task.id)}
          className="p-1 text-muted hover:text-danger transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

function AddTaskModal({
  onAdd,
  onClose,
}: {
  onAdd: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [status, setStatus] = useState<Task['status']>('todo');
  const [energyLevel, setEnergyLevel] = useState<Task['energyLevel']>('medium');
  const [tagsInput, setTagsInput] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    onAdd({
      title,
      priority,
      status,
      energyLevel,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">New Task</h3>
          <button onClick={onClose} className="p-1 text-muted hover:text-foreground"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
              placeholder="What needs to be done?"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as Task['priority'])} className="w-full bg-surface border border-border rounded-lg px-2 py-2 text-xs text-foreground">
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as Task['status'])} className="w-full bg-surface border border-border rounded-lg px-2 py-2 text-xs text-foreground">
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Energy</label>
              <select value={energyLevel} onChange={e => setEnergyLevel(e.target.value as Task['energyLevel'])} className="w-full bg-surface border border-border rounded-lg px-2 py-2 text-xs text-foreground">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
              placeholder="e.g. product, engineering, urgent"
            />
          </div>
          <button type="submit" className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-light transition-colors">
            Create Task
          </button>
        </form>
      </div>
    </div>
  );
}

function priorityOrder(p: string): number {
  const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  return order[p] ?? 4;
}
