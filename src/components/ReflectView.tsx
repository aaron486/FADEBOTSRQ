'use client';

import { useState } from 'react';
import { AppState, DailyReflection } from '@/lib/types';
import { addReflection, saveState } from '@/lib/store';
import { format, parseISO } from 'date-fns';
import {
  BookHeart,
  Zap,
  Trophy,
  AlertCircle,
  Target,
  Heart,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface ReflectViewProps {
  state: AppState;
  setState: (state: AppState) => void;
}

export default function ReflectView({ state, setState }: ReflectViewProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todaysReflection = state.reflections.find(r => r.date === today);
  const pastReflections = state.reflections
    .filter(r => r.date !== today)
    .sort((a, b) => b.date.localeCompare(a.date));

  const [energyLevel, setEnergyLevel] = useState(todaysReflection?.energyLevel ?? 7);
  const [topWin, setTopWin] = useState(todaysReflection?.topWin ?? '');
  const [topChallenge, setTopChallenge] = useState(todaysReflection?.topChallenge ?? '');
  const [tomorrowFocus, setTomorrowFocus] = useState(todaysReflection?.tomorrowFocus ?? '');
  const [gratitude, setGratitude] = useState(todaysReflection?.gratitude ?? '');
  const [saved, setSaved] = useState(false);
  const [expandedPast, setExpandedPast] = useState<Set<string>>(new Set());

  function handleSave() {
    const reflection: Omit<DailyReflection, 'id'> = {
      date: today,
      energyLevel,
      topWin,
      topChallenge,
      tomorrowFocus,
      gratitude,
    };
    // Remove existing reflection for today if any
    const filtered = { ...state, reflections: state.reflections.filter(r => r.date !== today) };
    const next = addReflection(filtered, reflection);
    setState(next);
    saveState(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function togglePast(id: string) {
    const next = new Set(expandedPast);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedPast(next);
  }

  // Streak calculation
  const sortedDates = state.reflections.map(r => r.date).sort().reverse();
  let streak = 0;
  const checkDate = new Date();
  for (const dateStr of sortedDates) {
    const expected = format(checkDate, 'yyyy-MM-dd');
    if (dateStr === expected) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Average energy
  const avgEnergy = state.reflections.length > 0
    ? (state.reflections.reduce((sum, r) => sum + r.energyLevel, 0) / state.reflections.length).toFixed(1)
    : '-';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BookHeart size={24} className="text-accent-light" />
            Daily Reflection
          </h2>
          <p className="text-sm text-muted mt-1">Reflect. Learn. Grow. Every day counts.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">Current Streak</p>
          <p className="text-2xl font-bold text-warning flex items-center gap-2">
            {streak} <Sparkles size={18} className="text-warning" />
          </p>
          <p className="text-xs text-muted">days</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">Total Reflections</p>
          <p className="text-2xl font-bold text-accent-light">{state.reflections.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted mb-1">Avg Energy Level</p>
          <p className="text-2xl font-bold text-success">{avgEnergy}/10</p>
        </div>
      </div>

      {/* Today's Reflection Form */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            {format(new Date(), 'EEEE, MMMM d')}
          </h3>
          {todaysReflection && (
            <span className="text-xs text-success bg-success/10 px-2 py-1 rounded-full">Already reflected today</span>
          )}
        </div>

        <div className="space-y-5">
          {/* Energy Level */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Zap size={16} className="text-warning" />
              Energy Level
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={10}
                value={energyLevel}
                onChange={e => setEnergyLevel(parseInt(e.target.value))}
                className="flex-1 accent-accent"
              />
              <span className={`text-lg font-bold w-8 text-center ${
                energyLevel >= 7 ? 'text-success' : energyLevel >= 4 ? 'text-warning' : 'text-danger'
              }`}>
                {energyLevel}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-muted mt-1">
              <span>Drained</span>
              <span>Energized</span>
            </div>
          </div>

          {/* Top Win */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Trophy size={16} className="text-success" />
              Top Win Today
            </label>
            <textarea
              value={topWin}
              onChange={e => setTopWin(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent resize-none"
              rows={2}
              placeholder="What was your biggest win today?"
            />
          </div>

          {/* Top Challenge */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <AlertCircle size={16} className="text-danger" />
              Biggest Challenge
            </label>
            <textarea
              value={topChallenge}
              onChange={e => setTopChallenge(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent resize-none"
              rows={2}
              placeholder="What challenged you most?"
            />
          </div>

          {/* Tomorrow's Focus */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Target size={16} className="text-accent-light" />
              Tomorrow&apos;s #1 Focus
            </label>
            <textarea
              value={tomorrowFocus}
              onChange={e => setTomorrowFocus(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent resize-none"
              rows={2}
              placeholder="If you could only accomplish one thing tomorrow, what would it be?"
            />
          </div>

          {/* Gratitude */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Heart size={16} className="text-pink-400" />
              Gratitude
            </label>
            <textarea
              value={gratitude}
              onChange={e => setGratitude(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent resize-none"
              rows={2}
              placeholder="What are you grateful for today?"
            />
          </div>

          <button
            onClick={handleSave}
            className={`w-full py-3 rounded-lg text-sm font-medium transition-all ${
              saved
                ? 'bg-success/20 text-success border border-success/30'
                : 'bg-accent text-white hover:bg-accent-light'
            }`}
          >
            {saved ? 'Saved!' : todaysReflection ? 'Update Reflection' : 'Save Reflection'}
          </button>
        </div>
      </div>

      {/* Past Reflections */}
      {pastReflections.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Past Reflections</h3>
          <div className="space-y-2">
            {pastReflections.map(reflection => {
              const isExpanded = expandedPast.has(reflection.id);
              return (
                <div key={reflection.id} className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => togglePast(reflection.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-surface transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown size={14} className="text-muted" /> : <ChevronRight size={14} className="text-muted" />}
                      <span className="text-sm text-foreground">{format(parseISO(reflection.date), 'EEEE, MMM d')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap size={12} className="text-warning" />
                      <span className="text-xs text-muted">{reflection.energyLevel}/10</span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                      {reflection.topWin && (
                        <div>
                          <p className="text-[10px] text-success uppercase tracking-wider mb-0.5">Win</p>
                          <p className="text-sm text-foreground">{reflection.topWin}</p>
                        </div>
                      )}
                      {reflection.topChallenge && (
                        <div>
                          <p className="text-[10px] text-danger uppercase tracking-wider mb-0.5">Challenge</p>
                          <p className="text-sm text-foreground">{reflection.topChallenge}</p>
                        </div>
                      )}
                      {reflection.tomorrowFocus && (
                        <div>
                          <p className="text-[10px] text-accent-light uppercase tracking-wider mb-0.5">Focus</p>
                          <p className="text-sm text-foreground">{reflection.tomorrowFocus}</p>
                        </div>
                      )}
                      {reflection.gratitude && (
                        <div>
                          <p className="text-[10px] text-pink-400 uppercase tracking-wider mb-0.5">Gratitude</p>
                          <p className="text-sm text-foreground">{reflection.gratitude}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
