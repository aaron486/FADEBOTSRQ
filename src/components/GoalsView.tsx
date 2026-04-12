'use client';

import { useState } from 'react';
import { AppState, Goal, GoalCategory, KeyResult } from '@/lib/types';
import { addGoal, updateGoal, deleteGoal, saveState, generateId } from '@/lib/store';
import {
  Target,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit3,
  X,
  Check,
  TrendingUp,
  Eye,
} from 'lucide-react';

interface GoalsViewProps {
  state: AppState;
  setState: (state: AppState) => void;
}

const timeframeLabels: Record<string, string> = {
  vision: '10-Year Vision',
  yearly: 'Annual Goals',
  quarterly: 'Quarterly OKRs',
  monthly: 'Monthly Targets',
  weekly: 'This Week',
};

const timeframeOrder = ['vision', 'yearly', 'quarterly', 'monthly', 'weekly'];

const categoryConfig: Record<GoalCategory, { label: string; color: string }> = {
  business: { label: 'Business', color: 'bg-accent/15 text-accent-light border-accent/30' },
  product: { label: 'Product', color: 'bg-info/15 text-info border-info/30' },
  team: { label: 'Team', color: 'bg-success/15 text-success border-success/30' },
  personal: { label: 'Personal', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  finance: { label: 'Finance', color: 'bg-warning/15 text-warning border-warning/30' },
  health: { label: 'Health', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  not_started: { label: 'Not Started', color: 'text-muted' },
  in_progress: { label: 'In Progress', color: 'text-info' },
  completed: { label: 'Completed', color: 'text-success' },
  blocked: { label: 'Blocked', color: 'text-danger' },
};

export default function GoalsView({ state, setState }: GoalsViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['yearly', 'quarterly', 'monthly']));
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function toggleGroup(group: string) {
    const next = new Set(expandedGroups);
    if (next.has(group)) next.delete(group);
    else next.add(group);
    setExpandedGroups(next);
  }

  function handleAddGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) {
    const next = addGoal(state, goal);
    setState(next);
    saveState(next);
    setShowAddForm(false);
  }

  function handleUpdateGoal(id: string, updates: Partial<Goal>) {
    const next = updateGoal(state, id, updates);
    setState(next);
    saveState(next);
    setEditingId(null);
  }

  function handleDeleteGoal(id: string) {
    const next = deleteGoal(state, id);
    setState(next);
    saveState(next);
  }

  const grouped = timeframeOrder.reduce((acc, tf) => {
    acc[tf] = state.goals.filter(g => g.timeframe === tf);
    return acc;
  }, {} as Record<string, Goal[]>);

  // Compute overall progress
  const activeGoals = state.goals.filter(g => g.status !== 'completed');
  const avgProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Target size={24} className="text-accent-light" />
            Goals & Vision
          </h2>
          <p className="text-sm text-muted mt-1">Set direction. Track progress. Achieve greatness.</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-light transition-colors"
        >
          <Plus size={16} /> New Goal
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">Total Goals</p>
          <p className="text-2xl font-bold text-foreground">{state.goals.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">In Progress</p>
          <p className="text-2xl font-bold text-info">{state.goals.filter(g => g.status === 'in_progress').length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">Completed</p>
          <p className="text-2xl font-bold text-success">{state.goals.filter(g => g.status === 'completed').length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">Avg Progress</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-accent-light">{avgProgress}%</p>
            <TrendingUp size={16} className="text-accent-light" />
          </div>
        </div>
      </div>

      {/* Goal Groups */}
      {timeframeOrder.map(tf => {
        const goals = grouped[tf];
        const isExpanded = expandedGroups.has(tf);

        return (
          <section key={tf} className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => toggleGroup(tf)}
              className="w-full flex items-center justify-between p-4 hover:bg-card-hover transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronDown size={18} className="text-muted" /> : <ChevronRight size={18} className="text-muted" />}
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-accent-light" />
                  <h3 className="text-sm font-semibold text-foreground">{timeframeLabels[tf]}</h3>
                </div>
                <span className="text-xs text-muted bg-surface px-2 py-0.5 rounded-full">{goals.length}</span>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-border p-4 space-y-3">
                {goals.length === 0 ? (
                  <p className="text-sm text-muted text-center py-4">No goals yet. Add one to get started.</p>
                ) : (
                  goals.map(goal => (
                    <GoalRow
                      key={goal.id}
                      goal={goal}
                      isEditing={editingId === goal.id}
                      onEdit={() => setEditingId(goal.id)}
                      onSave={(updates) => handleUpdateGoal(goal.id, updates)}
                      onDelete={() => handleDeleteGoal(goal.id)}
                      onCancel={() => setEditingId(null)}
                    />
                  ))
                )}
              </div>
            )}
          </section>
        );
      })}

      {/* Add Goal Modal */}
      {showAddForm && (
        <AddGoalModal
          onAdd={handleAddGoal}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}

function GoalRow({
  goal,
  isEditing,
  onEdit,
  onSave,
  onDelete,
  onCancel,
}: {
  goal: Goal;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<Goal>) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [progress, setProgress] = useState(goal.progress);
  const [status, setStatus] = useState(goal.status);

  if (isEditing) {
    return (
      <div className="bg-surface border border-accent/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground">{goal.title}</h4>
          <div className="flex gap-2">
            <button onClick={() => onSave({ progress, status })} className="p-1.5 bg-success/20 text-success rounded hover:bg-success/30">
              <Check size={14} />
            </button>
            <button onClick={onCancel} className="p-1.5 bg-danger/20 text-danger rounded hover:bg-danger/30">
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-xs text-muted">Progress:</label>
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(parseInt(e.target.value))}
            className="flex-1 accent-accent"
          />
          <span className="text-xs text-foreground w-8">{progress}%</span>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-xs text-muted">Status:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Goal['status'])}
            className="bg-card border border-border rounded px-2 py-1 text-xs text-foreground"
          >
            {Object.entries(statusConfig).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg p-4 card-interactive border border-transparent group">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-foreground">{goal.title}</h4>
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${categoryConfig[goal.category].color}`}>
              {categoryConfig[goal.category].label}
            </span>
            <span className={`text-[10px] font-medium ${statusConfig[goal.status].color}`}>
              {statusConfig[goal.status].label}
            </span>
          </div>
          <p className="text-xs text-muted mb-2">{goal.description}</p>

          {/* Key Results */}
          {goal.keyResults.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {goal.keyResults.map(kr => (
                <div key={kr.id} className="flex items-center gap-2">
                  <div className="w-24 h-1 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-light rounded-full"
                      style={{ width: `${Math.min(100, (kr.current / kr.target) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-muted">
                    {kr.title}: {kr.current}/{kr.target} {kr.unit}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-accent-light rounded-full" style={{ width: `${goal.progress}%` }} />
            </div>
            <span className="text-xs text-muted">{goal.progress}%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1.5 text-muted hover:text-accent-light rounded hover:bg-accent/10">
            <Edit3 size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 text-muted hover:text-danger rounded hover:bg-danger/10">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddGoalModal({
  onAdd,
  onClose,
}: {
  onAdd: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeframe, setTimeframe] = useState<Goal['timeframe']>('quarterly');
  const [category, setCategory] = useState<GoalCategory>('business');
  const [krTitle, setKrTitle] = useState('');
  const [krTarget, setKrTarget] = useState('');
  const [krUnit, setKrUnit] = useState('');
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);

  function addKeyResult() {
    if (!krTitle || !krTarget) return;
    setKeyResults([...keyResults, {
      id: generateId(),
      title: krTitle,
      current: 0,
      target: parseFloat(krTarget),
      unit: krUnit,
      completed: false,
    }]);
    setKrTitle('');
    setKrTarget('');
    setKrUnit('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    onAdd({
      title,
      description,
      timeframe,
      category,
      status: 'not_started',
      progress: 0,
      keyResults,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">New Goal</h3>
          <button onClick={onClose} className="p-1 text-muted hover:text-foreground"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
              placeholder="e.g. Scale to $1M ARR"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
              rows={2}
              placeholder="Why is this goal important?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">Timeframe</label>
              <select
                value={timeframe}
                onChange={e => setTimeframe(e.target.value as Goal['timeframe'])}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              >
                {Object.entries(timeframeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as GoalCategory)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              >
                {Object.entries(categoryConfig).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Key Results */}
          <div>
            <label className="block text-xs text-muted mb-2">Key Results</label>
            {keyResults.map(kr => (
              <div key={kr.id} className="flex items-center gap-2 text-xs text-foreground bg-surface rounded px-2 py-1.5 mb-1">
                <span>{kr.title}: 0/{kr.target} {kr.unit}</span>
              </div>
            ))}
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                placeholder="KR title"
                value={krTitle}
                onChange={e => setKrTitle(e.target.value)}
                className="flex-1 bg-surface border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
              />
              <input
                type="number"
                placeholder="Target"
                value={krTarget}
                onChange={e => setKrTarget(e.target.value)}
                className="w-20 bg-surface border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
              />
              <input
                type="text"
                placeholder="Unit"
                value={krUnit}
                onChange={e => setKrUnit(e.target.value)}
                className="w-16 bg-surface border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
              />
              <button type="button" onClick={addKeyResult} className="p-1.5 bg-accent/20 text-accent-light rounded hover:bg-accent/30">
                <Plus size={14} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-light transition-colors"
          >
            Create Goal
          </button>
        </form>
      </div>
    </div>
  );
}
