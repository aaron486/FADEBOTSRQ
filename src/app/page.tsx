'use client';

import { useState, useEffect } from 'react';
import { AppState } from '@/lib/types';
import { loadState, saveState, setCalendarEvents } from '@/lib/store';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import Dashboard from '@/components/Dashboard';
import GoalsView from '@/components/GoalsView';
import TasksView from '@/components/TasksView';
import CalendarView from '@/components/CalendarView';
import MetricsView from '@/components/MetricsView';
import ReflectView from '@/components/ReflectView';

export default function Home() {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    const loaded = loadState();

    // Check URL params for calendar connection
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendar_connected') === 'true') {
      loaded.calendarConnected = true;
      // Fetch events
      fetch('/api/calendar')
        .then(res => res.json())
        .then(data => {
          if (data.events) {
            const next = setCalendarEvents(loaded, data.events);
            setState(next);
            saveState(next);
          }
        })
        .catch(() => {});
      // Clean URL
      window.history.replaceState({}, '', '/');
    }

    setState(loaded);
  }, []);

  if (!state) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-light">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <p className="text-sm text-muted">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  function handleViewChange(view: AppState['activeView']) {
    if (!state) return;
    const next = { ...state, activeView: view };
    setState(next);
    saveState(next);
  }

  function renderView() {
    if (!state) return null;
    switch (state.activeView) {
      case 'dashboard':
        return <Dashboard state={state} setState={setState} onNavigate={handleViewChange} />;
      case 'goals':
        return <GoalsView state={state} setState={setState} />;
      case 'tasks':
        return <TasksView state={state} setState={setState} />;
      case 'calendar':
        return <CalendarView state={state} setState={setState} />;
      case 'metrics':
        return <MetricsView state={state} setState={setState} />;
      case 'reflect':
        return <ReflectView state={state} setState={setState} />;
      default:
        return <Dashboard state={state} setState={setState} onNavigate={handleViewChange} />;
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar activeView={state.activeView} onViewChange={handleViewChange} />
      <main className="flex-1 ml-64 flex flex-col">
        <TopBar calendarConnected={state.calendarConnected} />
        <div className="flex-1 p-6 overflow-y-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
}
