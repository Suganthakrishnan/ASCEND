-- ============================================================
-- Migration 002: Schema Expansion - Quests and Workouts
-- Description: Adds quest system, workout templates, and expanded tracking capabilities
-- Created: 2026-05-29
-- ============================================================

-- ============================================================
-- 1. QUESTS TABLE
-- Description: Available quests in the system with various categories and difficulties
-- ============================================================
create table if not exists public.quests (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text,
    category text check (category in ('fitness', 'nutrition', 'sleep', 'wellness', 'productivity', 'social')),
    difficulty text check (difficulty in ('easy', 'medium', 'hard', 'epic')),
    xp_reward integer not null check (xp_reward > 0),
    
    -- Quest Requirements
    required_level integer default 1 check (required_level between 1 and 100),
    prerequisite_quest_id uuid references public.quests(id),
    
    -- Quest Parameters (for different quest types)
    quest_type text check (quest_type in ('daily', 'weekly', 'one_time', 'recurring')),
    target_value integer, -- e.g., "do 50 pushups"
    target_unit text, -- e.g., "reps", "minutes", "hours"
    
    -- Status
    is_active boolean default true,
    is_seasonal boolean default false,
    season_start_date date,
    season_end_date date,
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for quests
create index if not exists quests_category_idx on public.quests(category);
create index if not exists quests_difficulty_idx on public.quests(difficulty);
create index if not exists quests_quest_type_idx on public.quests(quest_type);
create index if not exists quests_created_at_idx on public.quests(created_at desc);

-- Enable RLS on quests (public read for active quests)
alter table public.quests enable row level security;

drop policy if exists "Public can view active quests" on public.quests;
create policy "Public can view active quests"
  on public.quests for select
  using (is_active = true);

-- ============================================================
-- 2. USER QUESTS TABLE
-- Description: Tracks user's quest progress and completion status
-- ============================================================
create table if not exists public.user_quests (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    quest_id uuid references public.quests(id) on delete cascade not null,
    
    -- Progress Tracking
    current_progress integer default 0 check (current_progress >= 0),
    target_progress integer not null check (target_progress > 0),
    
    -- Status
    status text check (status in ('assigned', 'in_progress', 'completed', 'expired')) default 'assigned',
    assigned_at timestamp with time zone default timezone('utc'::text, now()) not null,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    expires_at timestamp with time zone,
    
    -- Rewards
    xp_granted integer default 0 check (xp_granted >= 0),
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    unique(user_id, quest_id)
);

-- Indexes for user_quests
create index if not exists user_quests_user_id_idx on public.user_quests(user_id);
create index if not exists user_quests_quest_id_idx on public.user_quests(quest_id);
create index if not exists user_quests_status_idx on public.user_quests(status);
create index if not exists user_quests_user_status_idx on public.user_quests(user_id, status);
create index if not exists user_quests_created_at_idx on public.user_quests(created_at desc);
create index if not exists user_quests_completed_at_idx on public.user_quests(completed_at desc);

-- Enable RLS on user_quests
alter table public.user_quests enable row level security;

drop policy if exists "Users can view own quests" on public.user_quests;
create policy "Users can view own quests"
  on public.user_quests for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own quests" on public.user_quests;
create policy "Users can insert own quests"
  on public.user_quests for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own quests" on public.user_quests;
create policy "Users can update own quests"
  on public.user_quests for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own quests" on public.user_quests;
create policy "Users can delete own quests"
  on public.user_quests for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at timestamp for user_quests
drop trigger if exists update_user_quests_updated_at on public.user_quests;
create trigger update_user_quests_updated_at
  before update on public.user_quests
  for each row execute procedure public.update_updated_at_column();

-- ============================================================
-- 3. WORKOUTS TABLE
-- Description: Workout templates and plans
-- ============================================================
create table if not exists public.workouts (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    description text,
    category text check (category in ('strength', 'cardio', 'flexibility', 'sports', 'functional')),
    difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
    duration_minutes integer check (duration_minutes > 0),
    
    -- Workout Details
    equipment_needed text[], -- Array of equipment items
    muscle_groups text[], -- Array of muscle groups worked
    calories_estimate integer check (calories_estimate > 0),
    
    -- Creator Info
    created_by uuid references auth.users(id),
    is_public boolean default false,
    is_system_template boolean default false,
    
    -- Status
    is_active boolean default true,
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for workouts
create index if not exists workouts_category_idx on public.workouts(category);
create index if not exists workouts_difficulty_idx on public.workouts(difficulty);
create index if not exists workouts_created_by_idx on public.workouts(created_by);
create index if not exists workouts_is_active_idx on public.workouts(is_active);
create index if not exists workouts_created_at_idx on public.workouts(created_at desc);

-- Enable RLS on workouts
alter table public.workouts enable row level security;

drop policy if exists "Public can view active workouts" on public.workouts;
create policy "Public can view active workouts"
  on public.workouts for select
  using (is_active = true and is_public = true);

drop policy if exists "Users can view own workouts" on public.workouts;
create policy "Users can view own workouts"
  on public.workouts for select
  using (auth.uid() = created_by);

drop policy if exists "Users can insert own workouts" on public.workouts;
create policy "Users can insert own workouts"
  on public.workouts for insert
  with check (auth.uid() = created_by);

drop policy if exists "Users can update own workouts" on public.workouts;
create policy "Users can update own workouts"
  on public.workouts for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

drop policy if exists "Users can delete own workouts" on public.workouts;
create policy "Users can delete own workouts"
  on public.workouts for delete
  using (auth.uid() = created_by);

-- Auto-update updated_at timestamp for workouts
drop trigger if exists update_workouts_updated_at on public.workouts;
create trigger update_workouts_updated_at
  before update on public.workouts
  for each row execute procedure public.update_updated_at_column();

-- ============================================================
-- 4. WORKOUT EXERCISES TABLE
-- Description: Individual exercises within workouts
-- ============================================================
create table if not exists public.workout_exercises (
    id uuid default gen_random_uuid() primary key,
    workout_id uuid references public.workouts(id) on delete cascade not null,
    
    -- Exercise Info
    exercise_name text not null,
    exercise_type text check (exercise_type in ('strength', 'cardio', 'flexibility', 'balance')),
    
    -- Sets/Reps/Duration
    sets integer check (sets > 0),
    reps integer check (reps > 0),
    duration_seconds integer check (duration_seconds > 0),
    rest_seconds integer default 60 check (rest_seconds >= 0),
    
    -- Intensity
    weight decimal(6,2) check (weight >= 0), -- in kg or lbs
    intensity_level text check (intensity_level in ('low', 'medium', 'high', 'max')),
    
    -- Order
    exercise_order integer check (exercise_order > 0),
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for workout_exercises
create index if not exists workout_exercises_workout_id_idx on public.workout_exercises(workout_id);
create index if not exists workout_exercises_exercise_type_idx on public.workout_exercises(exercise_type);
create index if not exists workout_exercises_created_at_idx on public.workout_exercises(created_at desc);

-- Enable RLS on workout_exercises
alter table public.workout_exercises enable row level security;

drop policy if exists "Public can view workout exercises" on public.workout_exercises;
create policy "Public can view workout exercises"
  on public.workout_exercises for select
  using (true);

-- ============================================================
-- 5. USER WORKOUT SESSIONS TABLE
-- Description: Tracks completed workout sessions
-- ============================================================
create table if not exists public.user_workout_sessions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    workout_id uuid references public.workouts(id),
    
    -- Session Info
    session_date date default current_date not null,
    start_time timestamp with time zone default timezone('utc'::text, now()) not null,
    end_time timestamp with time zone,
    duration_minutes integer check (duration_minutes >= 0),
    
    -- Performance
    calories_burned integer check (calories_burned >= 0),
    completion_percentage decimal(5,2) default 100.0 check (completion_percentage between 0 and 100),
    difficulty_rating integer check (difficulty_rating between 1 and 5),
    notes text,
    
    -- Status
    status text check (status in ('in_progress', 'completed', 'abandoned')) default 'in_progress',
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for user_workout_sessions
create index if not exists user_workout_sessions_user_id_idx on public.user_workout_sessions(user_id);
create index if not exists user_workout_sessions_workout_id_idx on public.user_workout_sessions(workout_id);
create index if not exists user_workout_sessions_session_date_idx on public.user_workout_sessions(session_date);
create index if not exists user_workout_sessions_status_idx on public.user_workout_sessions(status);
create index if not exists user_workout_sessions_user_date_idx on public.user_workout_sessions(user_id, session_date desc);
create index if not exists user_workout_sessions_created_at_idx on public.user_workout_sessions(created_at desc);

-- Enable RLS on user_workout_sessions
alter table public.user_workout_sessions enable row level security;

drop policy if exists "Users can view own workout sessions" on public.user_workout_sessions;
create policy "Users can view own workout sessions"
  on public.user_workout_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own workout sessions" on public.user_workout_sessions;
create policy "Users can insert own workout sessions"
  on public.user_workout_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own workout sessions" on public.user_workout_sessions;
create policy "Users can update own workout sessions"
  on public.user_workout_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own workout sessions" on public.user_workout_sessions;
create policy "Users can delete own workout sessions"
  on public.user_workout_sessions for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at timestamp for user_workout_sessions
drop trigger if exists update_user_workout_sessions_updated_at on public.user_workout_sessions;
create trigger update_user_workout_sessions_updated_at
  before update on public.user_workout_sessions
  for each row execute procedure public.update_updated_at_column();

-- ============================================================
-- 6. AUTO-CREATE TRIGGERS FOR NEW TABLES
-- Description: Automatically create user stats and preferences when profile is created
-- ============================================================

-- Auto-create user stats when profile is created
create or replace function public.create_user_stats()
returns trigger as $$
begin
    insert into public.user_stats (user_id) values (new.id)
    on conflict (user_id) do nothing;
    return new;
end;
$$ language plpgsql;

drop trigger if exists create_user_stats_trigger on public.profiles;
create trigger create_user_stats_trigger
    after insert on public.profiles
    for each row
    execute function public.create_user_stats();

-- Auto-create user preferences when profile is created
create or replace function public.create_user_preferences()
returns trigger as $$
begin
    insert into public.user_preferences (id) values (new.id)
    on conflict (id) do nothing;
    return new;
end;
$$ language plpgsql;

drop trigger if exists create_user_preferences_trigger on public.profiles;
create trigger create_user_preferences_trigger
    after insert on public.profiles
    for each row
    execute function public.create_user_preferences();

-- Auto-create daily progress record
create or replace function public.create_daily_progress()
returns trigger as $$
begin
    insert into public.daily_progress (user_id, date) 
    values (new.id, current_date)
    on conflict (user_id, date) do nothing;
    return new;
end;
$$ language plpgsql;

drop trigger if exists create_daily_progress_trigger on public.profiles;
create trigger create_daily_progress_trigger
    after insert on public.profiles
    for each row
    execute function public.create_daily_progress();

-- ============================================================
-- 7. INITIAL QUEST DATA
-- Description: Seed the quests table with initial quest templates
-- ============================================================

insert into public.quests (title, description, category, difficulty, xp_reward, quest_type, target_value, target_unit) values
-- Daily Quests
('Morning Movement', 'Start your day with 10 minutes of light exercise', 'fitness', 'easy', 25, 'daily', 10, 'minutes'),
('Hydration Hero', 'Drink 8 glasses of water throughout the day', 'nutrition', 'easy', 20, 'daily', 8, 'glasses'),
('Protein Power', 'Consume at least 50g of protein today', 'nutrition', 'medium', 30, 'daily', 50, 'grams'),
('Sleep Champion', 'Get 8+ hours of quality sleep', 'sleep', 'medium', 35, 'daily', 8, 'hours'),
('Focus Master', 'Complete 2 hours of focused work', 'productivity', 'medium', 30, 'daily', 2, 'hours'),
('Digital Detox', 'Limit screen time to under 4 hours', 'wellness', 'hard', 40, 'daily', 4, 'hours'),

-- Weekly Quests
('Workout Warrior', 'Complete 5 workouts this week', 'fitness', 'medium', 80, 'weekly', 5, 'workouts'),
('Consistency King', 'Log your progress every day this week', 'wellness', 'medium', 60, 'weekly', 7, 'days'),
('Strength Seeker', 'Increase your strength stat by 5 points', 'fitness', 'hard', 100, 'weekly', 5, 'points'),

-- One-time Quests
('First Workout', 'Complete your first workout session', 'fitness', 'easy', 50, 'one_time', 1, 'workout'),
('Profile Complete', 'Fill out your entire profile', 'social', 'easy', 40, 'one_time', 100, 'percent'),
('Week Warrior', 'Maintain a 7-day workout streak', 'fitness', 'hard', 150, 'one_time', 7, 'days'),
('Level Up', 'Reach level 5 in SystemFit', 'wellness', 'medium', 200, 'one_time', 5, 'level')

on conflict do nothing;
