'use client';

import { ViewType } from '@/lib/types';
import {
  LayoutDashboard,
  Target,
  ListTodo,
  Calendar,
  BarChart3,
  BookHeart,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const navItems: { view: ViewType; label: string; icon: React.ReactNode }[] = [
  { view: 'dashboard', label: 'Command Center', icon: <LayoutDashboard size={20} /> },
  { view: 'goals', label: 'Goals & Vision', icon: <Target size={20} /> },
  { view: 'tasks', label: 'Pipeline', icon: <ListTodo size={20} /> },
  { view: 'calendar', label: 'Calendar', icon: <Calendar size={20} /> },
  { view: 'metrics', label: 'KPIs & Metrics', icon: <BarChart3 size={20} /> },
  { view: 'reflect', label: 'Daily Reflect', icon: <BookHeart size={20} /> },
];

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-full fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
            <Zap size={20} className="text-accent-light" />
          </div>
          <div>
            <h1 className="text-base font-bold gradient-text">Command Center</h1>
            <p className="text-[11px] text-muted tracking-wider uppercase">CEO / Founder</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ view, label, icon }) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeView === view
                ? 'bg-accent/15 text-accent-light border border-accent/30'
                : 'text-muted hover:text-foreground hover:bg-surface border border-transparent'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="bg-surface rounded-lg p-3">
          <p className="text-xs text-muted mb-1">Today&apos;s Focus</p>
          <p className="text-sm font-medium text-foreground">Build. Ship. Scale.</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
            <span className="text-xs text-success">In the zone</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
