-- ============================================================
-- Migration 001: Initial Database Schema
-- Description: Core tables for SystemFit including profiles, user preferences, 
--              notifications, daily tasks, user stats, achievements, and basic tracking
-- Created: 2026-05-29
-- ============================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES TABLE
-- Description: Stores user profile information and onboarding status
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  onboarding_complete boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index on profiles for faster lookups
create index if not exists profiles_id_idx on public.profiles(id);
create index if not exists profiles_created_at_idx on public.profiles(created_at desc);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- ============================================================
-- 2. AUTO-CREATE PROFILE ON SIGN-UP
-- Description: Fires server-side whenever a new auth.users row is inserted.
--              This handles both email/password and OAuth sign-ups reliably.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, onboarding_complete, created_at)
  values (
    new.id,
    new.email,
    false,
    now()
  )
  on conflict (id) do nothing;

  insert into public.user_preferences (id)
  values (new.id)
  on conflict (id) do nothing;

  insert into public.user_stats (user_id, character_name)
  values (new.id, 'Agent')
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Drop and recreate trigger (idempotent)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 3. RLS POLICIES FOR PROFILES
-- Description: Ensure each user can only access their own profile
-- ============================================================
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============================================================
-- 4. USER PREFERENCES TABLE
-- Description: Stores user fitness preferences and settings
-- ============================================================
create table if not exists public.user_preferences (
  id uuid primary key references auth.users(id) on delete cascade,
  primary_goal text,
  fitness_level text,
  workout_frequency integer default 3,
  workout_reminders boolean default true,
  nutrition_reminders boolean default true,
  sleep_reminders boolean default true,
  achievement_notifications boolean default true,
  weight_unit text default 'kg',
  height_unit text default 'cm',
  distance_unit text default 'km',
  profile_public boolean default false,
  share_achievements boolean default true,
  age integer check (age between 13 and 120),
  weight decimal(5,2),
  height decimal(5,2),
  gender text check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  goals text[],
  weight_kg decimal(5,2),
  height_cm decimal(5,2),
  notifications_enabled boolean default true,
  reminder_time text default '08:00',
  quest_reminders_enabled boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for user_preferences
create index if not exists user_preferences_id_idx on public.user_preferences(id);
create index if not exists user_preferences_created_at_idx on public.user_preferences(created_at desc);

-- Enable RLS on user_preferences
alter table public.user_preferences enable row level security;

-- RLS policies for user_preferences
drop policy if exists "Users can view own preferences" on public.user_preferences;
create policy "Users can view own preferences"
  on public.user_preferences for select
  using (auth.uid() = id);

drop policy if exists "Users can update own preferences" on public.user_preferences;
create policy "Users can update own preferences"
  on public.user_preferences for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert own preferences" on public.user_preferences;
create policy "Users can insert own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = id);

-- Auto-update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_user_preferences_updated_at on public.user_preferences;
create trigger update_user_preferences_updated_at
  before update on public.user_preferences
  for each row execute procedure public.update_updated_at_column();

-- ============================================================
-- 5. NOTIFICATION PREFERENCES TABLE
-- Description: Stores notification settings for each user
-- ============================================================
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  workout_reminders boolean default true,
  quest_notifications boolean default true,
  achievement_notifications boolean default true,
  streak_alerts boolean default true,
  level_up_notifications boolean default true,
  system_notifications boolean default true,
  reminder_time text default '09:00',
  quiet_hours_start text default '22:00',
  quiet_hours_end text default '08:00',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for notification_preferences
create index if not exists notification_preferences_user_id_idx on public.notification_preferences(user_id);
create index if not exists notification_preferences_created_at_idx on public.notification_preferences(created_at desc);

-- Enable RLS on notification_preferences
alter table public.notification_preferences enable row level security;

-- RLS policies for notification_preferences
drop policy if exists "Users can view own notification preferences" on public.notification_preferences;
create policy "Users can view own notification preferences"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own notification preferences" on public.notification_preferences;
create policy "Users can update own notification preferences"
  on public.notification_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can insert own notification preferences" on public.notification_preferences;
create policy "Users can insert own notification preferences"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

drop trigger if exists update_notification_preferences_updated_at on public.notification_preferences;
create trigger update_notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute procedure public.update_updated_at_column();

-- ============================================================
-- 6. NOTIFICATIONS TABLE
-- Description: Stores all notifications for users
-- ============================================================
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('workout_reminder', 'quest_complete', 'achievement_unlocked', 'streak_milestone', 'level_up', 'system')),
  title text not null,
  body text not null,
  data jsonb,
  read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for notifications
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_read_idx on public.notifications(read);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);

-- Enable RLS on notifications
alter table public.notifications enable row level security;

-- RLS policies for notifications
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own notifications" on public.notifications;
create policy "Users can insert own notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 7. DAILY TASKS TABLE
-- Description: Stores user-customizable daily tasks with difficulty levels and XP rewards
-- ============================================================
create table if not exists public.daily_tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  xp_reward integer not null,
  completed boolean default false not null,
  completed_at timestamp with time zone,
  task_date date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for daily_tasks
create index if not exists daily_tasks_user_id_idx on public.daily_tasks(user_id);
create index if not exists daily_tasks_task_date_idx on public.daily_tasks(task_date);
create index if not exists daily_tasks_completed_idx on public.daily_tasks(completed);
create index if not exists daily_tasks_created_at_idx on public.daily_tasks(created_at desc);

-- Enable RLS on daily_tasks
alter table public.daily_tasks enable row level security;

-- RLS policies for daily_tasks
drop policy if exists "Users can view own tasks" on public.daily_tasks;
create policy "Users can view own tasks"
  on public.daily_tasks for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own tasks" on public.daily_tasks;
create policy "Users can insert own tasks"
  on public.daily_tasks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own tasks" on public.daily_tasks;
create policy "Users can update own tasks"
  on public.daily_tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own tasks" on public.daily_tasks;
create policy "Users can delete own tasks"
  on public.daily_tasks for delete
  using (auth.uid() = user_id);

drop trigger if exists update_daily_tasks_updated_at on public.daily_tasks;
create trigger update_daily_tasks_updated_at
  before update on public.daily_tasks
  for each row execute procedure public.update_updated_at_column();

-- ============================================================
-- 8. USER STATS TABLE
-- Description: Stores user character stats, level, and attribute points
-- ============================================================
create table if not exists public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  character_name text default 'Agent',
  level integer default 1 not null,
  current_xp integer default 0 not null,
  xp_to_next_level integer default 100 not null,
  rank text default 'Novice' not null,
  points_available integer default 0 not null,
  strength integer default 5 not null,
  intelligence integer default 5 not null,
  stamina integer default 5 not null,
  code_knowledge integer default 5 not null,
  agility integer default 5 not null,
  communication integer default 5 not null,
  total_xp_earned integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for user_stats
create index if not exists user_stats_user_id_idx on public.user_stats(user_id);
create index if not exists user_stats_created_at_idx on public.user_stats(created_at desc);

-- Enable RLS on user_stats
alter table public.user_stats enable row level security;

-- RLS policies for user_stats
drop policy if exists "Users can view own stats" on public.user_stats;
create policy "Users can view own stats"
  on public.user_stats for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own stats" on public.user_stats;
create policy "Users can insert own stats"
  on public.user_stats for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own stats" on public.user_stats;
create policy "Users can update own stats"
  on public.user_stats for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists update_user_stats_updated_at on public.user_stats;
create trigger update_user_stats_updated_at
  before update on public.user_stats
  for each row execute procedure public.update_updated_at_column();

-- ============================================================
-- 9. ACHIEVEMENTS TABLE
-- Description: Stores available achievements
-- ============================================================
create table if not exists public.achievements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  icon text,
  xp_reward integer default 0 not null,
  requirement_type text not null,
  requirement_value integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for achievements
create index if not exists achievements_created_at_idx on public.achievements(created_at desc);

-- Enable RLS on achievements (public read)
alter table public.achievements enable row level security;

drop policy if exists "Public can view achievements" on public.achievements;
create policy "Public can view achievements"
  on public.achievements for select
  using (true);

-- ============================================================
-- 10. USER ACHIEVEMENTS TABLE
-- Description: Tracks which achievements users have unlocked
-- ============================================================
create table if not exists public.user_achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  achievement_id uuid references public.achievements(id) on delete cascade not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, achievement_id)
);

-- Indexes for user_achievements
create index if not exists user_achievements_user_id_idx on public.user_achievements(user_id);
create index if not exists user_achievements_achievement_id_idx on public.user_achievements(achievement_id);
create index if not exists user_achievements_created_at_idx on public.user_achievements(unlocked_at desc);

-- Enable RLS on user_achievements
alter table public.user_achievements enable row level security;

-- RLS policies for user_achievements
drop policy if exists "Users can view own achievements" on public.user_achievements;
create policy "Users can view own achievements"
  on public.user_achievements for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own achievements" on public.user_achievements;
create policy "Users can insert own achievements"
  on public.user_achievements for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- 11. SLEEP LOGS TABLE
-- Description: Tracks user sleep data
-- ============================================================
create table if not exists public.sleep_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  log_date date not null default current_date,
  bedtime text not null,
  wake_time text not null,
  duration_hours decimal(4,2) not null,
  quality integer not null check (quality between 1 and 5),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, log_date)
);

-- Indexes for sleep_logs
create index if not exists sleep_logs_user_id_idx on public.sleep_logs(user_id);
create index if not exists sleep_logs_created_at_idx on public.sleep_logs(created_at desc);
create index if not exists sleep_logs_user_date_idx on public.sleep_logs(user_id, log_date desc);

alter table public.sleep_logs enable row level security;

drop policy if exists "Users can view own sleep logs" on public.sleep_logs;
create policy "Users can view own sleep logs"
  on public.sleep_logs for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own sleep logs" on public.sleep_logs;
create policy "Users can insert own sleep logs"
  on public.sleep_logs for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own sleep logs" on public.sleep_logs;
create policy "Users can update own sleep logs"
  on public.sleep_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own sleep logs" on public.sleep_logs;
create policy "Users can delete own sleep logs"
  on public.sleep_logs for delete using (auth.uid() = user_id);

-- ============================================================
-- 12. SCREEN TIME LOGS TABLE
-- Description: Tracks user screen time data
-- ============================================================
create table if not exists public.screen_time_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  log_date date not null default current_date,
  category text not null check (category in ('social', 'entertainment', 'productivity', 'gaming', 'other')),
  hours decimal(4,2) not null check (hours >= 0 and hours <= 24),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, log_date, category)
);

-- Indexes for screen_time_logs
create index if not exists screen_time_logs_user_id_idx on public.screen_time_logs(user_id);
create index if not exists screen_time_logs_created_at_idx on public.screen_time_logs(created_at desc);
create index if not exists screen_time_logs_user_date_idx on public.screen_time_logs(user_id, log_date desc);

alter table public.screen_time_logs enable row level security;

drop policy if exists "Users can view own screen time logs" on public.screen_time_logs;
create policy "Users can view own screen time logs"
  on public.screen_time_logs for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own screen time logs" on public.screen_time_logs;
create policy "Users can insert own screen time logs"
  on public.screen_time_logs for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own screen time logs" on public.screen_time_logs;
create policy "Users can update own screen time logs"
  on public.screen_time_logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own screen time logs" on public.screen_time_logs;
create policy "Users can delete own screen time logs"
  on public.screen_time_logs for delete using (auth.uid() = user_id);

-- ============================================================
-- 13. DAILY PROGRESS TABLE
-- Description: Tracks daily goals and progress
-- ============================================================
create table if not exists public.daily_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default current_date,
  calories_goal integer default 2000,
  calories_current integer default 0,
  protein_goal decimal(5,2) default 50,
  protein_current decimal(5,2) default 0,
  water_goal integer default 8,
  water_current integer default 0,
  workout_minutes_goal integer default 60,
  workout_minutes_current integer default 0,
  workouts_completed integer default 0,
  sleep_hours_goal decimal(3,1) default 8,
  sleep_hours_actual decimal(3,1) default 0,
  sleep_quality integer default 0,
  screen_time_goal_hours integer default 4,
  screen_time_actual_hours decimal(4,2) default 0,
  focus_time_hours decimal(4,2) default 0,
  daily_goals_completed boolean default false,
  completion_percentage decimal(5,2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

-- Indexes for daily_progress
create index if not exists daily_progress_user_id_idx on public.daily_progress(user_id);
create index if not exists daily_progress_created_at_idx on public.daily_progress(created_at desc);
create index if not exists daily_progress_user_date_idx on public.daily_progress(user_id, date desc);

alter table public.daily_progress enable row level security;

drop policy if exists "Users can view own daily progress" on public.daily_progress;
create policy "Users can view own daily progress"
  on public.daily_progress for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own daily progress" on public.daily_progress;
create policy "Users can insert own daily progress"
  on public.daily_progress for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own daily progress" on public.daily_progress;
create policy "Users can update own daily progress"
  on public.daily_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 14. CUSTOM WORKOUT PLANS (cloud backup)
-- Description: Stores custom workout plans for cloud backup
-- ============================================================
create table if not exists public.custom_workout_plans (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  plan jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for custom_workout_plans
create index if not exists custom_workout_plans_user_id_idx on public.custom_workout_plans(user_id);
create index if not exists custom_workout_plans_created_at_idx on public.custom_workout_plans(updated_at desc);

alter table public.custom_workout_plans enable row level security;

drop policy if exists "Users can manage own workout plans" on public.custom_workout_plans;
create policy "Users can manage own workout plans"
  on public.custom_workout_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 15. WORKOUT SESSION LOGS (cloud backup)
-- Description: Stores workout session logs for cloud backup
-- ============================================================
create table if not exists public.workout_session_logs (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  session jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for workout_session_logs
create index if not exists workout_session_logs_user_id_idx on public.workout_session_logs(user_id);
create index if not exists workout_session_logs_created_at_idx on public.workout_session_logs(created_at desc);
create index if not exists workout_session_logs_user_created_idx on public.workout_session_logs(user_id, created_at desc);

alter table public.workout_session_logs enable row level security;

drop policy if exists "Users can manage own workout sessions" on public.workout_session_logs;
create policy "Users can manage own workout sessions"
  on public.workout_session_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
