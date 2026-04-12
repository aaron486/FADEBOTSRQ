'use client';

import { AppState, Goal, Task, FocusBlock, KPI, CalendarEvent } from '@/lib/types';
import { updateTask, updateFocusBlock, saveState } from '@/lib/store';
import { format, parseISO, isToday } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Flame,
  AlertTriangle,
  Calendar as CalendarIcon,
  ExternalLink,
  Zap,
  Trophy,
} from 'lucide-react';

interface DashboardProps {
  state: AppState;
  setState: (state: AppState) => void;
  onNavigate: (view: AppState['activeView']) => void;
}

export default function Dashboard({ state, setState, onNavigate }: DashboardProps) {
  const topGoals = state.goals.filter(g => g.timeframe === 'yearly' || g.timeframe === 'quarterly').slice(0, 3);
  const urgentTasks = state.tasks.filter(t => t.status !== 'done').sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority)).slice(0, 5);
  const todayEvents = state.calendarEvents.filter(e => {
    const start = e.start.dateTime || e.start.date;
    return start && isToday(parseISO(start));
  });
  const topKPIs = state.kpis.slice(0, 4);

  const completedTasks = state.tasks.filter(t => t.status === 'done').length;
  const totalTasks = state.tasks.length;
  const completedBlocks = state.focusBlocks.filter(b => b.completed).length;
  const totalBlocks = state.focusBlocks.length;

  function toggleBlockComplete(id: string) {
    const block = state.focusBlocks.find(b => b.id === id);
    if (!block) return;
    const next = updateFocusBlock(state, id, { completed: !block.completed });
    setState(next);
    saveState(next);
  }

  function moveTaskStatus(id: string) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    const flow: Record<string, Task['status']> = { backlog: 'todo', todo: 'in_progress', in_progress: 'review', review: 'done' };
    const nextStatus = flow[task.status];
    if (!nextStatus) return;
    const next = updateTask(state, id, { status: nextStatus, ...(nextStatus === 'done' ? { completedAt: new Date().toISOString() } : {}) });
    setState(next);
    saveState(next);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Scoreboard Row */}
      <div className="grid grid-cols-4 gap-4">
        <ScoreCard
          label="Goals on Track"
          value={`${state.goals.filter(g => g.status === 'in_progress').length}/${state.goals.length}`}
          icon={<Target size={18} />}
          color="accent"
        />
        <ScoreCard
          label="Tasks Completed"
          value={`${completedTasks}/${totalTasks}`}
          icon={<Trophy size={18} />}
          color="success"
        />
        <ScoreCard
          label="Focus Blocks Done"
          value={`${completedBlocks}/${totalBlocks}`}
          icon={<Flame size={18} />}
          color="warning"
        />
        <ScoreCard
          label="Today's Meetings"
          value={`${todayEvents.length}`}
          icon={<CalendarIcon size={18} />}
          color="info"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Column 1: Goals + KPIs */}
        <div className="space-y-6">
          {/* Big Picture Goals */}
          <section className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Big Picture Goals</h3>
              <button onClick={() => onNavigate('goals')} className="text-xs text-accent-light hover:underline flex items-center gap-1">
                View All <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-3">
              {topGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          </section>

          {/* KPIs */}
          <section className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Key Metrics</h3>
              <button onClick={() => onNavigate('metrics')} className="text-xs text-accent-light hover:underline flex items-center gap-1">
                View All <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-3">
              {topKPIs.map(kpi => (
                <KPIRow key={kpi.id} kpi={kpi} />
              ))}
            </div>
          </section>
        </div>

        {/* Column 2: Today's Schedule */}
        <div className="space-y-6">
          {/* Focus Blocks */}
          <section className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Today&apos;s Schedule</h3>
              <span className="text-xs text-muted">{completedBlocks}/{totalBlocks} completed</span>
            </div>
            <div className="space-y-2">
              {state.focusBlocks.map(block => (
                <FocusBlockRow key={block.id} block={block} onToggle={toggleBlockComplete} />
              ))}
            </div>
          </section>

          {/* Calendar Events */}
          {todayEvents.length > 0 && (
            <section className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Calendar Events</h3>
                <button onClick={() => onNavigate('calendar')} className="text-xs text-accent-light hover:underline flex items-center gap-1">
                  View All <ArrowRight size={12} />
                </button>
              </div>
              <div className="space-y-2">
                {todayEvents.slice(0, 5).map(event => (
                  <CalendarEventRow key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Column 3: Priority Tasks */}
        <div className="space-y-6">
          <section className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Priority Tasks</h3>
              <button onClick={() => onNavigate('tasks')} className="text-xs text-accent-light hover:underline flex items-center gap-1">
                View All <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {urgentTasks.map(task => (
                <TaskRow key={task.id} task={task} onAdvance={moveTaskStatus} />
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <QuickAction label="Add Goal" icon={<Target size={16} />} onClick={() => onNavigate('goals')} />
              <QuickAction label="Add Task" icon={<Zap size={16} />} onClick={() => onNavigate('tasks')} />
              <QuickAction label="Daily Reflect" icon={<Flame size={16} />} onClick={() => onNavigate('reflect')} />
              <QuickAction label="View Metrics" icon={<TrendingUp size={16} />} onClick={() => onNavigate('metrics')} />
            </div>
          </section>

          {/* Connect Calendar CTA */}
          {!state.calendarConnected && (
            <section className="bg-accent/5 border border-accent/20 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <CalendarIcon size={20} className="text-accent-light mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Connect Google Calendar</h3>
                  <p className="text-xs text-muted mb-3">Sync your calendar to see meetings and manage your time.</p>
                  <a
                    href="/api/auth/google"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent-light transition-colors"
                  >
                    <ExternalLink size={12} />
                    Connect Now
                  </a>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    accent: 'bg-accent/10 text-accent-light border-accent/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    info: 'bg-info/10 text-info border-info/20',
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-xs opacity-75">{label}</p>
    </div>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const categoryColors: Record<string, string> = {
    business: 'bg-accent/10 text-accent-light',
    product: 'bg-info/10 text-info',
    team: 'bg-success/10 text-success',
    personal: 'bg-purple-500/10 text-purple-400',
    finance: 'bg-warning/10 text-warning',
    health: 'bg-emerald-500/10 text-emerald-400',
  };

  return (
    <div className="bg-surface rounded-lg p-3 card-interactive border border-transparent">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-foreground">{goal.title}</h4>
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium mt-1 ${categoryColors[goal.category]}`}>
            {goal.category}
          </span>
        </div>
        <span className="text-xs text-muted">{goal.progress}%</span>
      </div>
      <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-accent-light rounded-full animate-progress"
          style={{ '--progress': `${goal.progress}%`, width: `${goal.progress}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

function KPIRow({ kpi }: { kpi: KPI }) {
  const change = kpi.value - kpi.previousValue;
  const changePercent = kpi.previousValue > 0 ? ((change / kpi.previousValue) * 100).toFixed(1) : '0';
  const isPositive = kpi.trend === 'up';

  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <div>
        <p className="text-sm text-foreground font-medium">{kpi.name}</p>
        <p className="text-xs text-muted">{kpi.unit}{kpi.value.toLocaleString()}</p>
      </div>
      <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
        {kpi.trend === 'up' ? <TrendingUp size={14} /> : kpi.trend === 'down' ? <TrendingDown size={14} /> : <Minus size={14} />}
        {changePercent}%
      </div>
    </div>
  );
}

function FocusBlockRow({ block, onToggle }: { block: FocusBlock; onToggle: (id: string) => void }) {
  const typeColors: Record<string, string> = {
    deep_work: 'border-accent',
    meetings: 'border-warning',
    admin: 'border-muted',
    creative: 'border-purple-400',
    exercise: 'border-success',
    learning: 'border-info',
    personal: 'border-emerald-400',
  };

  return (
    <button
      onClick={() => onToggle(block.id)}
      className={`w-full flex items-center gap-3 p-2.5 rounded-lg border-l-3 transition-all ${typeColors[block.type]} ${
        block.completed ? 'opacity-50 bg-surface/50' : 'bg-surface hover:bg-card-hover'
      }`}
    >
      {block.completed ? (
        <CheckCircle2 size={16} className="text-success shrink-0" />
      ) : (
        <Circle size={16} className="text-muted shrink-0" />
      )}
      <div className="flex-1 text-left">
        <p className={`text-sm ${block.completed ? 'line-through text-muted' : 'text-foreground'}`}>
          {block.title}
        </p>
      </div>
      <span className="text-[11px] text-muted font-mono">
        {block.startTime}-{block.endTime}
      </span>
    </button>
  );
}

function CalendarEventRow({ event }: { event: CalendarEvent }) {
  const startTime = event.start.dateTime
    ? format(parseISO(event.start.dateTime), 'h:mm a')
    : 'All day';

  return (
    <div className="calendar-event bg-surface rounded-lg p-2.5 pl-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-foreground">{event.summary}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Clock size={11} className="text-muted" />
            <span className="text-[11px] text-muted">{startTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task, onAdvance }: { task: Task; onAdvance: (id: string) => void }) {
  const priorityConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    urgent: { icon: <AlertTriangle size={14} />, color: 'text-danger' },
    high: { icon: <Flame size={14} />, color: 'text-warning' },
    medium: { icon: <Minus size={14} />, color: 'text-info' },
    low: { icon: <Minus size={14} />, color: 'text-muted' },
  };

  const config = priorityConfig[task.priority];

  const statusLabels: Record<string, string> = {
    backlog: 'Backlog',
    todo: 'To Do',
    in_progress: 'Working',
    review: 'Review',
    done: 'Done',
  };

  return (
    <div className="flex items-center gap-3 p-2.5 bg-surface rounded-lg card-interactive border border-transparent">
      <span className={config.color}>{config.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] px-1.5 py-0.5 bg-border/50 rounded text-muted">
            {statusLabels[task.status]}
          </span>
          {task.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] text-muted">#{tag}</span>
          ))}
        </div>
      </div>
      {task.status !== 'done' && (
        <button
          onClick={() => onAdvance(task.id)}
          className="p-1 rounded hover:bg-accent/10 text-muted hover:text-accent-light transition-colors"
          title="Advance task"
        >
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

function QuickAction({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2.5 bg-surface rounded-lg text-sm text-muted hover:text-foreground hover:bg-card-hover transition-all border border-transparent hover:border-accent/20"
    >
      {icon}
      {label}
    </button>
  );
}

function priorityOrder(p: string): number {
  const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  return order[p] ?? 4;
}
