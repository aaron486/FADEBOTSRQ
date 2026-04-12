'use client';

import { AppState, Goal, Task, FocusBlock, KPI, DailyReflection, CalendarEvent } from './types';

const STORAGE_KEY = 'life-command-center';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getDefaultState(): AppState {
  const today = new Date().toISOString().split('T')[0];
  return {
    goals: [
      {
        id: generateId(),
        title: 'Scale to $1M ARR',
        description: 'Grow monthly recurring revenue through product-led growth and strategic partnerships',
        timeframe: 'yearly',
        status: 'in_progress',
        progress: 35,
        category: 'business',
        keyResults: [
          { id: generateId(), title: 'Monthly revenue', current: 29000, target: 83000, unit: '$/mo', completed: false },
          { id: generateId(), title: 'Active customers', current: 120, target: 500, unit: 'customers', completed: false },
          { id: generateId(), title: 'Churn rate', current: 4.2, target: 2.0, unit: '%', completed: false },
        ],
        dueDate: '2026-12-31',
        createdAt: today,
        updatedAt: today,
      },
      {
        id: generateId(),
        title: 'Build world-class team',
        description: 'Hire key leadership and build culture of excellence',
        timeframe: 'quarterly',
        status: 'in_progress',
        progress: 50,
        category: 'team',
        keyResults: [
          { id: generateId(), title: 'Key hires made', current: 2, target: 4, unit: 'people', completed: false },
          { id: generateId(), title: 'Team NPS', current: 72, target: 85, unit: 'score', completed: false },
        ],
        dueDate: '2026-06-30',
        createdAt: today,
        updatedAt: today,
      },
      {
        id: generateId(),
        title: 'Launch V2 product',
        description: 'Ship the complete redesign with new feature set',
        timeframe: 'quarterly',
        status: 'in_progress',
        progress: 65,
        category: 'product',
        keyResults: [
          { id: generateId(), title: 'Features shipped', current: 13, target: 20, unit: 'features', completed: false },
          { id: generateId(), title: 'Beta users', current: 45, target: 100, unit: 'users', completed: false },
        ],
        dueDate: '2026-06-30',
        createdAt: today,
        updatedAt: today,
      },
      {
        id: generateId(),
        title: 'Maintain peak performance',
        description: 'Stay healthy and energized as a founder',
        timeframe: 'monthly',
        status: 'in_progress',
        progress: 70,
        category: 'health',
        keyResults: [
          { id: generateId(), title: 'Workouts per week', current: 4, target: 5, unit: 'sessions', completed: false },
          { id: generateId(), title: 'Sleep hours avg', current: 7.2, target: 7.5, unit: 'hours', completed: false },
        ],
        dueDate: '2026-04-30',
        createdAt: today,
        updatedAt: today,
      },
    ],
    tasks: [
      { id: generateId(), title: 'Review Q2 board deck', status: 'in_progress', priority: 'urgent', tags: ['board', 'finance'], createdAt: today, energyLevel: 'high' },
      { id: generateId(), title: 'Finalize Series A term sheet review', status: 'todo', priority: 'urgent', tags: ['fundraising'], createdAt: today, energyLevel: 'high' },
      { id: generateId(), title: 'Weekly 1:1s with direct reports', status: 'todo', priority: 'high', tags: ['team', 'leadership'], createdAt: today, energyLevel: 'medium' },
      { id: generateId(), title: 'Review product analytics dashboard', status: 'todo', priority: 'high', tags: ['product', 'data'], createdAt: today, energyLevel: 'medium' },
      { id: generateId(), title: 'Customer discovery calls (3)', status: 'backlog', priority: 'high', tags: ['customers', 'research'], createdAt: today, energyLevel: 'high' },
      { id: generateId(), title: 'Update investor update email', status: 'backlog', priority: 'medium', tags: ['investors', 'comms'], createdAt: today, energyLevel: 'low' },
      { id: generateId(), title: 'Architect new API endpoints', status: 'todo', priority: 'medium', tags: ['engineering', 'product'], createdAt: today, energyLevel: 'high' },
      { id: generateId(), title: 'Plan team offsite for Q2', status: 'backlog', priority: 'low', tags: ['team', 'culture'], createdAt: today, energyLevel: 'low' },
    ],
    focusBlocks: [
      { id: generateId(), title: 'Morning Deep Work', type: 'deep_work', startTime: '06:00', endTime: '09:00', completed: false },
      { id: generateId(), title: 'Team Standup & 1:1s', type: 'meetings', startTime: '09:30', endTime: '11:00', completed: false },
      { id: generateId(), title: 'Strategic Thinking', type: 'creative', startTime: '11:00', endTime: '12:00', completed: false },
      { id: generateId(), title: 'Lunch + Exercise', type: 'exercise', startTime: '12:00', endTime: '13:30', completed: false },
      { id: generateId(), title: 'Customer / External Calls', type: 'meetings', startTime: '13:30', endTime: '15:00', completed: false },
      { id: generateId(), title: 'Afternoon Build Block', type: 'deep_work', startTime: '15:00', endTime: '17:00', completed: false },
      { id: generateId(), title: 'Admin & Email', type: 'admin', startTime: '17:00', endTime: '17:30', completed: false },
      { id: generateId(), title: 'Learning / Reading', type: 'learning', startTime: '21:00', endTime: '22:00', completed: false },
    ],
    kpis: [
      { id: generateId(), name: 'MRR', value: 29000, previousValue: 26500, target: 83000, unit: '$', category: 'revenue', trend: 'up', updatedAt: today },
      { id: generateId(), name: 'Active Users', value: 1240, previousValue: 1100, target: 5000, unit: '', category: 'growth', trend: 'up', updatedAt: today },
      { id: generateId(), name: 'Burn Rate', value: 45000, previousValue: 48000, target: 40000, unit: '$/mo', category: 'revenue', trend: 'up', updatedAt: today },
      { id: generateId(), name: 'Runway', value: 14, previousValue: 15, target: 18, unit: 'months', category: 'revenue', trend: 'down', updatedAt: today },
      { id: generateId(), name: 'NPS Score', value: 62, previousValue: 58, target: 70, unit: '', category: 'product', trend: 'up', updatedAt: today },
      { id: generateId(), name: 'Team Size', value: 8, previousValue: 7, target: 12, unit: 'people', category: 'team', trend: 'up', updatedAt: today },
      { id: generateId(), name: 'Weekly Commits', value: 47, previousValue: 38, target: 50, unit: '', category: 'product', trend: 'up', updatedAt: today },
      { id: generateId(), name: 'CAC', value: 120, previousValue: 145, target: 100, unit: '$', category: 'growth', trend: 'up', updatedAt: today },
    ],
    reflections: [],
    calendarEvents: [],
    calendarConnected: false,
    activeView: 'dashboard',
    currentDate: today,
  };
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return getDefaultState();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AppState;
      return { ...getDefaultState(), ...parsed };
    }
  } catch {
    // ignore parse errors
  }
  return getDefaultState();
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function addGoal(state: AppState, goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): AppState {
  const now = new Date().toISOString().split('T')[0];
  const newGoal: Goal = { ...goal, id: generateId(), createdAt: now, updatedAt: now };
  return { ...state, goals: [...state.goals, newGoal] };
}

export function updateGoal(state: AppState, id: string, updates: Partial<Goal>): AppState {
  return {
    ...state,
    goals: state.goals.map(g => g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : g),
  };
}

export function deleteGoal(state: AppState, id: string): AppState {
  return { ...state, goals: state.goals.filter(g => g.id !== id) };
}

export function addTask(state: AppState, task: Omit<Task, 'id' | 'createdAt'>): AppState {
  const newTask: Task = { ...task, id: generateId(), createdAt: new Date().toISOString().split('T')[0] };
  return { ...state, tasks: [...state.tasks, newTask] };
}

export function updateTask(state: AppState, id: string, updates: Partial<Task>): AppState {
  return {
    ...state,
    tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
  };
}

export function deleteTask(state: AppState, id: string): AppState {
  return { ...state, tasks: state.tasks.filter(t => t.id !== id) };
}

export function addFocusBlock(state: AppState, block: Omit<FocusBlock, 'id'>): AppState {
  return { ...state, focusBlocks: [...state.focusBlocks, { ...block, id: generateId() }] };
}

export function updateFocusBlock(state: AppState, id: string, updates: Partial<FocusBlock>): AppState {
  return {
    ...state,
    focusBlocks: state.focusBlocks.map(b => b.id === id ? { ...b, ...updates } : b),
  };
}

export function deleteFocusBlock(state: AppState, id: string): AppState {
  return { ...state, focusBlocks: state.focusBlocks.filter(b => b.id !== id) };
}

export function updateKPI(state: AppState, id: string, updates: Partial<KPI>): AppState {
  return {
    ...state,
    kpis: state.kpis.map(k => k.id === id ? { ...k, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : k),
  };
}

export function addReflection(state: AppState, reflection: Omit<DailyReflection, 'id'>): AppState {
  return { ...state, reflections: [...state.reflections, { ...reflection, id: generateId() }] };
}

export function setCalendarEvents(state: AppState, events: CalendarEvent[]): AppState {
  return { ...state, calendarEvents: events, calendarConnected: true };
}

export { generateId };
