'use client';

import { format } from 'date-fns';
import { Calendar, Bell, Search, Sun } from 'lucide-react';

interface TopBarProps {
  calendarConnected: boolean;
}

export default function TopBar({ calendarConnected }: TopBarProps) {
  const now = new Date();
  const greeting = getGreeting();
  const dateStr = format(now, 'EEEE, MMMM d, yyyy');

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-20">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{greeting}</h2>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Calendar size={12} />
          <span>{dateStr}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <button className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors">
          <Search size={18} />
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
        </button>

        {/* Theme toggle placeholder */}
        <button className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors">
          <Sun size={18} />
        </button>

        {/* Calendar status */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          calendarConnected
            ? 'bg-success/10 text-success border border-success/20'
            : 'bg-warning/10 text-warning border border-warning/20'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${calendarConnected ? 'bg-success' : 'bg-warning'} animate-pulse-dot`} />
          {calendarConnected ? 'Calendar Synced' : 'Calendar Offline'}
        </div>
      </div>
    </header>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Burning the midnight oil';
  if (hour < 12) return 'Good morning, Founder';
  if (hour < 17) return 'Good afternoon, Founder';
  if (hour < 21) return 'Good evening, Founder';
  return 'Winding down, Founder';
}
