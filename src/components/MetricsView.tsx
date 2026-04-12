'use client';

import { useState } from 'react';
import { AppState, KPI } from '@/lib/types';
import { updateKPI, saveState } from '@/lib/store';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Edit3,
  Check,
  X,
  DollarSign,
  Users,
  Package,
  Heart,
  Target,
} from 'lucide-react';

interface MetricsViewProps {
  state: AppState;
  setState: (state: AppState) => void;
}

const categoryConfig: Record<KPI['category'], { label: string; icon: React.ReactNode; color: string }> = {
  revenue: { label: 'Revenue', icon: <DollarSign size={16} />, color: 'text-success' },
  growth: { label: 'Growth', icon: <TrendingUp size={16} />, color: 'text-accent-light' },
  product: { label: 'Product', icon: <Package size={16} />, color: 'text-info' },
  team: { label: 'Team', icon: <Users size={16} />, color: 'text-warning' },
  personal: { label: 'Personal', icon: <Heart size={16} />, color: 'text-purple-400' },
};

export default function MetricsView({ state, setState }: MetricsViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<KPI['category'] | 'all'>('all');

  function handleUpdateKPI(id: string, updates: Partial<KPI>) {
    const kpi = state.kpis.find(k => k.id === id);
    if (!kpi) return;
    const newValue = updates.value ?? kpi.value;
    const trend: KPI['trend'] = newValue > kpi.value ? 'up' : newValue < kpi.value ? 'down' : 'flat';
    const next = updateKPI(state, id, { ...updates, previousValue: kpi.value, trend });
    setState(next);
    saveState(next);
    setEditingId(null);
  }

  const filtered = filterCategory === 'all'
    ? state.kpis
    : state.kpis.filter(k => k.category === filterCategory);

  // Health score: how many KPIs are on track (value >= 80% of target)
  const onTrack = state.kpis.filter(k => (k.value / k.target) >= 0.8).length;
  const healthScore = state.kpis.length > 0 ? Math.round((onTrack / state.kpis.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 size={24} className="text-accent-light" />
            KPIs & Metrics
          </h2>
          <p className="text-sm text-muted mt-1">Track what matters. Data-driven decisions.</p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
          <Target size={14} className="text-muted" />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value as KPI['category'] | 'all')}
            className="bg-transparent text-sm text-foreground focus:outline-none"
          >
            <option value="all">All Categories</option>
            {Object.entries(categoryConfig).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Health Score */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted mb-1">Overall Health Score</p>
            <p className="text-4xl font-bold gradient-text">{healthScore}%</p>
            <p className="text-xs text-muted mt-1">{onTrack} of {state.kpis.length} KPIs on track</p>
          </div>
          <div className="w-32 h-32 relative">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="var(--border)" strokeWidth="8" fill="none" />
              <circle
                cx="50" cy="50" r="40"
                stroke="var(--accent)"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${healthScore * 2.51} 251`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-accent-light">{healthScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Summary */}
      <div className="grid grid-cols-5 gap-4">
        {Object.entries(categoryConfig).map(([key, config]) => {
          const catKPIs = state.kpis.filter(k => k.category === key);
          const catOnTrack = catKPIs.filter(k => (k.value / k.target) >= 0.8).length;
          return (
            <div
              key={key}
              className={`bg-card border border-border rounded-xl p-4 cursor-pointer card-interactive ${
                filterCategory === key ? 'border-accent glow-accent' : ''
              }`}
              onClick={() => setFilterCategory(filterCategory === key ? 'all' : key as KPI['category'])}
            >
              <div className={`mb-2 ${config.color}`}>{config.icon}</div>
              <p className="text-sm font-medium text-foreground">{config.label}</p>
              <p className="text-xs text-muted">{catOnTrack}/{catKPIs.length} on track</p>
            </div>
          );
        })}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(kpi => (
          <KPICard
            key={kpi.id}
            kpi={kpi}
            isEditing={editingId === kpi.id}
            onEdit={() => setEditingId(kpi.id)}
            onSave={(updates) => handleUpdateKPI(kpi.id, updates)}
            onCancel={() => setEditingId(null)}
          />
        ))}
      </div>
    </div>
  );
}

function KPICard({
  kpi,
  isEditing,
  onEdit,
  onSave,
  onCancel,
}: {
  kpi: KPI;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<KPI>) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(kpi.value);
  const [target, setTarget] = useState(kpi.target);

  const change = kpi.value - kpi.previousValue;
  const changePercent = kpi.previousValue > 0 ? ((change / kpi.previousValue) * 100).toFixed(1) : '0';
  const progressPercent = Math.min(100, (kpi.value / kpi.target) * 100);
  const isOnTrack = progressPercent >= 80;
  const config = categoryConfig[kpi.category];

  if (isEditing) {
    return (
      <div className="bg-card border border-accent/30 rounded-xl p-5 glow-accent">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-foreground">{kpi.name}</h4>
          <div className="flex gap-2">
            <button onClick={() => onSave({ value, target })} className="p-1.5 bg-success/20 text-success rounded hover:bg-success/30">
              <Check size={14} />
            </button>
            <button onClick={onCancel} className="p-1.5 bg-danger/20 text-danger rounded hover:bg-danger/30">
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-muted mb-1">Current Value ({kpi.unit})</label>
            <input
              type="number"
              value={value}
              onChange={e => setValue(parseFloat(e.target.value) || 0)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Target ({kpi.unit})</label>
            <input
              type="number"
              value={target}
              onChange={e => setTarget(parseFloat(e.target.value) || 0)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 card-interactive group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={config.color}>{config.icon}</span>
          <h4 className="text-sm font-semibold text-foreground">{kpi.name}</h4>
        </div>
        <button
          onClick={onEdit}
          className="p-1.5 text-muted hover:text-accent-light opacity-0 group-hover:opacity-100 transition-all rounded hover:bg-accent/10"
        >
          <Edit3 size={14} />
        </button>
      </div>

      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-2xl font-bold text-foreground">
            {kpi.unit === '$' || kpi.unit === '$/mo' ? '$' : ''}{kpi.value.toLocaleString()}
            {kpi.unit && kpi.unit !== '$' && kpi.unit !== '$/mo' ? <span className="text-sm text-muted ml-1">{kpi.unit}</span> : ''}
          </p>
          <p className="text-xs text-muted">Target: {kpi.unit === '$' || kpi.unit === '$/mo' ? '$' : ''}{kpi.target.toLocaleString()} {kpi.unit !== '$' && kpi.unit !== '$/mo' ? kpi.unit : ''}</p>
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${
          kpi.trend === 'up' ? 'text-success' : kpi.trend === 'down' ? 'text-danger' : 'text-muted'
        }`}>
          {kpi.trend === 'up' ? <TrendingUp size={16} /> : kpi.trend === 'down' ? <TrendingDown size={16} /> : <Minus size={16} />}
          {changePercent}%
        </div>
      </div>

      {/* Progress to Target */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Progress to target</span>
          <span className={isOnTrack ? 'text-success' : 'text-warning'}>{progressPercent.toFixed(0)}%</span>
        </div>
        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isOnTrack ? 'bg-success' : 'bg-warning'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
