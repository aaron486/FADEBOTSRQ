export interface Goal {
  id: string;
  title: string;
  description: string;
  timeframe: 'vision' | 'yearly' | 'quarterly' | 'monthly' | 'weekly';
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  progress: number; // 0-100
  parentId?: string;
  keyResults: KeyResult[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  category: GoalCategory;
}

export type GoalCategory = 'business' | 'product' | 'team' | 'personal' | 'finance' | 'health';

export interface KeyResult {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  goalId?: string;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  tags: string[];
  energyLevel: 'high' | 'medium' | 'low';
}

export interface FocusBlock {
  id: string;
  title: string;
  type: 'deep_work' | 'meetings' | 'admin' | 'creative' | 'exercise' | 'learning' | 'personal';
  startTime: string;
  endTime: string;
  completed: boolean;
  notes?: string;
}

export interface KPI {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  target: number;
  unit: string;
  category: 'revenue' | 'growth' | 'product' | 'team' | 'personal';
  trend: 'up' | 'down' | 'flat';
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  colorId?: string;
  status?: string;
}

export interface DailyReflection {
  id: string;
  date: string;
  energyLevel: number; // 1-10
  topWin: string;
  topChallenge: string;
  tomorrowFocus: string;
  gratitude: string;
}

export interface AppState {
  goals: Goal[];
  tasks: Task[];
  focusBlocks: FocusBlock[];
  kpis: KPI[];
  reflections: DailyReflection[];
  calendarEvents: CalendarEvent[];
  calendarConnected: boolean;
  activeView: ViewType;
  currentDate: string;
}

export type ViewType = 'dashboard' | 'goals' | 'tasks' | 'calendar' | 'metrics' | 'reflect';
