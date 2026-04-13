-- =====================================================================
-- Postgame Executive Dashboard — Supabase Schema
-- Project: pstgm.com Mission Control
-- Run in: Supabase SQL Editor
-- =====================================================================

-- Extensions --------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enums -------------------------------------------------------------------
do $$ begin
  create type goal_category as enum (
    'revenue',
    'partnerships',
    'product',
    'content',
    'brand',
    'personal'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type goal_status as enum ('not_started', 'in_progress', 'blocked', 'shipped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type goal_horizon as enum ('long_term', 'weekly_sprint');
exception when duplicate_object then null; end $$;

do $$ begin
  create type idea_status as enum ('raw', 'refining', 'refined', 'published');
exception when duplicate_object then null; end $$;

do $$ begin
  create type priority_level as enum ('P0', 'P1', 'P2', 'P3');
exception when duplicate_object then null; end $$;

-- profiles ----------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role_at_pstgm text default 'Strategic Sports Tech Executive',
  avatar_url text,
  timezone text default 'America/New_York',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- goals -------------------------------------------------------------------
create table if not exists public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category goal_category not null default 'revenue',
  horizon goal_horizon not null default 'long_term',
  status goal_status not null default 'not_started',
  deadline date,
  progress_pct integer not null default 0 check (progress_pct between 0 and 100),
  ai_milestones jsonb default '[]'::jsonb,
  parent_goal_id uuid references public.goals(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists goals_horizon_idx on public.goals(horizon);

-- tasks -------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete cascade,
  title text not null,
  notes text,
  priority_level priority_level not null default 'P2',
  is_done boolean not null default false,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_goal_id_idx on public.tasks(goal_id);
create index if not exists tasks_due_idx on public.tasks(due_date);

-- content_ideas -----------------------------------------------------------
create table if not exists public.content_ideas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  raw_notes text,
  ai_refined_version text,
  target_channel text default 'linkedin',
  tags text[] default array[]::text[],
  status idea_status not null default 'raw',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists content_ideas_user_id_idx on public.content_ideas(user_id);

-- email_news_feed (cache for the Email Intelligence Hub) -------------------
create table if not exists public.email_news_feed (
  id uuid primary key default uuid_generate_v4(),
  headline text not null,
  source text,
  url text,
  summary text,
  topic text check (topic in ('bimi', 'deliverability', 'ai_personalization', 'general')),
  published_at timestamptz,
  fetched_at timestamptz not null default now()
);

-- email_drafts (AI-generated drafts) --------------------------------------
create table if not exists public.email_drafts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  brain_dump text not null,
  context text,
  draft text not null,
  model text default 'claude-opus-4-6',
  created_at timestamptz not null default now()
);

-- updated_at trigger ------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists trg_goals_touch on public.goals;
create trigger trg_goals_touch before update on public.goals
for each row execute function public.touch_updated_at();

drop trigger if exists trg_tasks_touch on public.tasks;
create trigger trg_tasks_touch before update on public.tasks
for each row execute function public.touch_updated_at();

drop trigger if exists trg_ideas_touch on public.content_ideas;
create trigger trg_ideas_touch before update on public.content_ideas
for each row execute function public.touch_updated_at();

-- Row Level Security ------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.goals          enable row level security;
alter table public.tasks          enable row level security;
alter table public.content_ideas  enable row level security;
alter table public.email_drafts   enable row level security;
alter table public.email_news_feed enable row level security;

-- Policies: users can only see/edit their own data
drop policy if exists "profiles self" on public.profiles;
create policy "profiles self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "goals self" on public.goals;
create policy "goals self" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "tasks self" on public.tasks;
create policy "tasks self" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ideas self" on public.content_ideas;
create policy "ideas self" on public.content_ideas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "drafts self" on public.email_drafts;
create policy "drafts self" on public.email_drafts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- The news feed is read-only to all authenticated users
drop policy if exists "news read" on public.email_news_feed;
create policy "news read" on public.email_news_feed
  for select using (auth.role() = 'authenticated');

-- Auto-create profile row on signup ---------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
