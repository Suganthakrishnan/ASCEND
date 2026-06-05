-- ============================================================
-- SystemFit: Supabase Database Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. PROFILES TABLE
--    Stores user profile information and onboarding status
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  onboarding_complete boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- 2. AUTO-CREATE PROFILE ON SIGN-UP
--    Fires server-side whenever a new auth.users row is inserted.
--    This handles both email/password and OAuth sign-ups reliably.
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


-- 2. RLS POLICIES
--    RLS is already enabled on the profiles table.
--    These policies ensure each user can only access their own row.

-- Allow users to read their own profile
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Allow users to update their own profile
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Allow users to insert their own profile (fallback for edge cases)
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);


-- 3. USER PREFERENCES TABLE
--    Stores user fitness preferences and settings
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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Safe migration for existing databases
alter table public.user_preferences add column if not exists age integer;
alter table public.user_preferences add column if not exists weight decimal(5,2);
alter table public.user_preferences add column if not exists height decimal(5,2);
alter table public.user_preferences add column if not exists gender text;

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


-- 4. NOTIFICATION PREFERENCES TABLE
--    Stores notification settings for each user
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


-- 5. NOTIFICATIONS TABLE
--    Stores all notifications for users
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

-- Create index for faster queries
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_read_idx on public.notifications(read);
create index if not exists notifications_created_at_idx on public.notifications(created_at desc);


-- 6. DAILY TASKS TABLE
--    Stores user-customizable daily tasks with difficulty levels and XP rewards
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

-- Create indexes for faster queries
create index if not exists daily_tasks_user_id_idx on public.daily_tasks(user_id);
create index if not exists daily_tasks_task_date_idx on public.daily_tasks(task_date);
create index if not exists daily_tasks_completed_idx on public.daily_tasks(completed);

drop trigger if exists update_daily_tasks_updated_at on public.daily_tasks;
create trigger update_daily_tasks_updated_at
  before update on public.daily_tasks
  for each row execute procedure public.update_updated_at_column();


-- 7. USER STATS TABLE
--    Stores user character stats, level, and attribute points
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
  day_streak integer default 0 not null,
  total_days_active integer default 0 not null,
  last_active_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Safe migration for existing databases
alter table public.user_stats add column if not exists day_streak integer default 0;
alter table public.user_stats add column if not exists total_days_active integer default 0;
alter table public.user_stats add column if not exists last_active_date date;

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


-- 8. ACHIEVEMENTS TABLE
--    Stores available achievements
create table if not exists public.achievements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  icon text,
  xp_reward integer default 0 not null,
  requirement_type text not null, -- 'total_xp', 'level', 'tasks_completed', 'streak_days', etc.
  requirement_value integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on achievements (public read)
alter table public.achievements enable row level security;

drop policy if exists "Public can view achievements" on public.achievements;
create policy "Public can view achievements"
  on public.achievements for select
  using (true);


-- 9. USER ACHIEVEMENTS TABLE
--    Tracks which achievements users have unlocked
create table if not exists public.user_achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  achievement_id uuid references public.achievements(id) on delete cascade not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, achievement_id)
);

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

-- Create indexes
create index if not exists user_achievements_user_id_idx on public.user_achievements(user_id);
create index if not exists user_achievements_achievement_id_idx on public.user_achievements(achievement_id);


-- 10. SLEEP LOGS TABLE
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

create index if not exists sleep_logs_user_date_idx on public.sleep_logs(user_id, log_date desc);


-- 11. SCREEN TIME LOGS TABLE
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

create index if not exists screen_time_logs_user_date_idx on public.screen_time_logs(user_id, log_date desc);


-- 12. DAILY PROGRESS TABLE
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

create index if not exists daily_progress_user_date_idx on public.daily_progress(user_id, date desc);


-- 13. CUSTOM WORKOUT PLANS (cloud backup)
create table if not exists public.custom_workout_plans (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  plan jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.custom_workout_plans enable row level security;

drop policy if exists "Users can manage own workout plans" on public.custom_workout_plans;
create policy "Users can manage own workout plans"
  on public.custom_workout_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists custom_workout_plans_user_idx on public.custom_workout_plans(user_id);


-- 14. WORKOUT SESSION LOGS (cloud backup)
create table if not exists public.workout_session_logs (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  session jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.workout_session_logs enable row level security;

drop policy if exists "Users can manage own workout sessions" on public.workout_session_logs;
create policy "Users can manage own workout sessions"
  on public.workout_session_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists workout_session_logs_user_idx on public.workout_session_logs(user_id, created_at desc);
