'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppState, CalendarEvent, FocusBlock } from '@/lib/types';
import { addFocusBlock, updateFocusBlock, deleteFocusBlock, setCalendarEvents, saveState } from '@/lib/store';
import { format, parseISO, startOfWeek, addDays, isToday, isSameDay } from 'date-fns';
import {
  Calendar,
  Plus,
  X,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
} from 'lucide-react';

interface CalendarViewProps {
  state: AppState;
  setState: (state: AppState) => void;
}

const blockTypeConfig: Record<FocusBlock['type'], { label: string; color: string; bg: string }> = {
  deep_work: { label: 'Deep Work', color: 'text-accent-light', bg: 'bg-accent/10 border-accent/30' },
  meetings: { label: 'Meetings', color: 'text-warning', bg: 'bg-warning/10 border-warning/30' },
  admin: { label: 'Admin', color: 'text-muted', bg: 'bg-surface border-border' },
  creative: { label: 'Creative', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  exercise: { label: 'Exercise', color: 'text-success', bg: 'bg-success/10 border-success/30' },
  learning: { label: 'Learning', color: 'text-info', bg: 'bg-info/10 border-info/30' },
  personal: { label: 'Personal', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
};

export default function CalendarView({ state, setState }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      if (data.connected && data.events) {
        const next = setCalendarEvents(state, data.events);
        setState(next);
        saveState(next);
      }
    } catch {
      // Calendar not connected
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Week view
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const todayEvents = state.calendarEvents.filter(e => {
    const start = e.start.dateTime || e.start.date;
    return start && isSameDay(parseISO(start), selectedDate);
  });

  function handleAddBlock(block: Omit<FocusBlock, 'id'>) {
    const next = addFocusBlock(state, block);
    setState(next);
    saveState(next);
    setShowAddBlock(false);
  }

  function handleToggleBlock(id: string) {
    const block = state.focusBlocks.find(b => b.id === id);
    if (!block) return;
    const next = updateFocusBlock(state, id, { completed: !block.completed });
    setState(next);
    saveState(next);
  }

  function handleDeleteBlock(id: string) {
    const next = deleteFocusBlock(state, id);
    setState(next);
    saveState(next);
  }

  const deepWorkHours = state.focusBlocks
    .filter(b => b.type === 'deep_work')
    .reduce((sum, b) => {
      const [sh, sm] = b.startTime.split(':').map(Number);
      const [eh, em] = b.endTime.split(':').map(Number);
      return sum + (eh - sh) + (em - sm) / 60;
    }, 0);

  const meetingHours = state.focusBlocks
    .filter(b => b.type === 'meetings')
    .reduce((sum, b) => {
      const [sh, sm] = b.startTime.split(':').map(Number);
      const [eh, em] = b.endTime.split(':').map(Number);
      return sum + (eh - sh) + (em - sm) / 60;
    }, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Calendar size={24} className="text-accent-light" />
            Calendar & Time Blocks
          </h2>
          <p className="text-sm text-muted mt-1">Protect your time. Own your schedule.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-muted hover:text-foreground transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Sync Calendar
          </button>
          {!state.calendarConnected && (
            <a
              href="/api/auth/google"
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-light transition-colors"
            >
              <ExternalLink size={14} /> Connect Google Calendar
            </a>
          )}
          <button
            onClick={() => setShowAddBlock(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-light transition-colors"
          >
            <Plus size={16} /> Add Block
          </button>
        </div>
      </div>

      {/* Time Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">Deep Work</p>
          <p className="text-2xl font-bold text-accent-light">{deepWorkHours}h</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">Meetings</p>
          <p className="text-2xl font-bold text-warning">{meetingHours}h</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">Focus Blocks</p>
          <p className="text-2xl font-bold text-foreground">{state.focusBlocks.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">Calendar Events</p>
          <p className="text-2xl font-bold text-info">{todayEvents.length}</p>
        </div>
      </div>

      {/* Week Selector */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex gap-2">
          {weekDays.map(day => (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`flex-1 py-3 rounded-lg text-center transition-all ${
                isSameDay(day, selectedDate)
                  ? 'bg-accent/15 border border-accent/30 text-accent-light'
                  : isToday(day)
                    ? 'bg-surface border border-border text-foreground'
                    : 'text-muted hover:bg-surface border border-transparent'
              }`}
            >
              <p className="text-xs font-medium">{format(day, 'EEE')}</p>
              <p className="text-lg font-bold mt-0.5">{format(day, 'd')}</p>
              {isToday(day) && (
                <div className="w-1.5 h-1.5 rounded-full bg-accent mx-auto mt-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Focus Blocks */}
        <section className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
            Focus Blocks
          </h3>
          <div className="space-y-2">
            {state.focusBlocks.map(block => {
              const config = blockTypeConfig[block.type];
              return (
                <div
                  key={block.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${config.bg} group`}
                >
                  <button onClick={() => handleToggleBlock(block.id)}>
                    {block.completed ? (
                      <CheckCircle2 size={18} className="text-success" />
                    ) : (
                      <Circle size={18} className="text-muted" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${block.completed ? 'line-through text-muted' : 'text-foreground'}`}>
                      {block.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock size={11} className="text-muted" />
                      <span className="text-[11px] text-muted font-mono">{block.startTime} - {block.endTime}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${config.color} ${config.bg}`}>
                        {config.label}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteBlock(block.id)}
                    className="p-1 text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
            {state.focusBlocks.length === 0 && (
              <p className="text-sm text-muted text-center py-8">No focus blocks. Design your ideal day.</p>
            )}
          </div>
        </section>

        {/* Calendar Events */}
        <section className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Google Calendar
            </h3>
            {state.calendarConnected && (
              <span className="flex items-center gap-1.5 text-xs text-success">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
                Connected
              </span>
            )}
          </div>
          <div className="space-y-2">
            {!state.calendarConnected ? (
              <div className="text-center py-8">
                <Calendar size={32} className="text-muted mx-auto mb-3" />
                <p className="text-sm text-muted mb-3">Connect your Google Calendar to see events here.</p>
                <a
                  href="/api/auth/google"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-light transition-colors"
                >
                  <ExternalLink size={14} /> Connect Google Calendar
                </a>
              </div>
            ) : todayEvents.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">No events for {format(selectedDate, 'MMMM d')}.</p>
            ) : (
              todayEvents.map(event => (
                <CalendarEventCard key={event.id} event={event} />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Add Block Modal */}
      {showAddBlock && (
        <AddBlockModal onAdd={handleAddBlock} onClose={() => setShowAddBlock(false)} />
      )}
    </div>
  );
}

function CalendarEventCard({ event }: { event: CalendarEvent }) {
  const startTime = event.start.dateTime
    ? format(parseISO(event.start.dateTime), 'h:mm a')
    : 'All day';
  const endTime = event.end.dateTime
    ? format(parseISO(event.end.dateTime), 'h:mm a')
    : '';

  return (
    <div className="calendar-event bg-surface rounded-lg p-3 pl-4">
      <p className="text-sm font-medium text-foreground">{event.summary}</p>
      <div className="flex items-center gap-3 mt-1">
        <div className="flex items-center gap-1 text-xs text-muted">
          <Clock size={11} />
          {startTime}{endTime ? ` - ${endTime}` : ''}
        </div>
        {event.location && (
          <span className="text-xs text-muted truncate">{event.location}</span>
        )}
      </div>
    </div>
  );
}

function AddBlockModal({
  onAdd,
  onClose,
}: {
  onAdd: (block: Omit<FocusBlock, 'id'>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<FocusBlock['type']>('deep_work');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    onAdd({ title, type, startTime, endTime, completed: false });
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">New Focus Block</h3>
          <button onClick={onClose} className="p-1 text-muted hover:text-foreground"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1">Block Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
              placeholder="e.g. Morning Deep Work"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as FocusBlock['type'])}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            >
              {Object.entries(blockTypeConfig).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">Start Time</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">End Time</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-light transition-colors">
            Create Block
          </button>
        </form>
      </div>
    </div>
  );
}
