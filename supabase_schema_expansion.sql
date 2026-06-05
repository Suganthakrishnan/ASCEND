-- ============================================================
-- SystemFit: Expanded Database Schema
-- Run this after initial setup.sql to add user preferences and stats
-- ============================================================

-- 1. USER PREFERENCES TABLE
-- Stores user settings and preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID REFERENCES public.profiles(id) PRIMARY KEY,
    -- Fitness Goals
    primary_goal TEXT CHECK (primary_goal IN ('weight_loss', 'muscle_gain', 'endurance', 'general_fitness', 'strength')),
    fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
    workout_frequency INTEGER CHECK (workout_frequency BETWEEN 1 AND 7), -- days per week
    
    -- Notification Preferences
    workout_reminders BOOLEAN DEFAULT true,
    nutrition_reminders BOOLEAN DEFAULT true,
    sleep_reminders BOOLEAN DEFAULT true,
    achievement_notifications BOOLEAN DEFAULT true,
    
    -- Units & Display
    weight_unit TEXT CHECK (weight_unit IN ('kg', 'lbs')) DEFAULT 'kg',
    height_unit TEXT CHECK (height_unit IN ('cm', 'ft')) DEFAULT 'cm',
    distance_unit TEXT CHECK (distance_unit IN ('km', 'miles')) DEFAULT 'km',
    
    -- Privacy Settings
    profile_public BOOLEAN DEFAULT false,
    share_achievements BOOLEAN DEFAULT true,
    
    -- Personal Info
    age INTEGER CHECK (age BETWEEN 13 AND 120),
    weight DECIMAL(5,2), -- in kg or lbs based on preference
    height DECIMAL(5,2), -- in cm or ft based on preference
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. USER STATS TABLE
-- Stores RPG-style stats and progression
CREATE TABLE IF NOT EXISTS public.user_stats (
    id UUID REFERENCES public.profiles(id) PRIMARY KEY,
    
    -- RPG Stats (0-100)
    strength INTEGER DEFAULT 10 CHECK (strength BETWEEN 0 AND 100),
    intelligence INTEGER DEFAULT 10 CHECK (intelligence BETWEEN 0 AND 100),
    stamina INTEGER DEFAULT 10 CHECK (stamina BETWEEN 0 AND 100),
    code_knowledge INTEGER DEFAULT 10 CHECK (code_knowledge BETWEEN 0 AND 100),
    agility INTEGER DEFAULT 10 CHECK (agility BETWEEN 0 AND 100),
    communication INTEGER DEFAULT 10 CHECK (communication BETWEEN 0 AND 100),
    
    -- Level & XP
    level INTEGER DEFAULT 1 CHECK (level BETWEEN 1 AND 100),
    total_xp INTEGER DEFAULT 0 CHECK (total_xp >= 0),
    current_level_xp INTEGER DEFAULT 0 CHECK (current_level_xp >= 0),
    xp_to_next_level INTEGER DEFAULT 100 CHECK (xp_to_next_level > 0),
    
    -- Streaks
    day_streak INTEGER DEFAULT 0 CHECK (day_streak >= 0),
    total_days_active INTEGER DEFAULT 0 CHECK (total_days_active >= 0),
    last_active_date DATE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. DAILY PROGRESS TABLE
-- Tracks daily goals and progress
CREATE TABLE IF NOT EXISTS public.daily_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    
    -- Nutrition Goals
    calories_goal INTEGER DEFAULT 2000 CHECK (calories_goal > 0),
    calories_current INTEGER DEFAULT 0 CHECK (calories_current >= 0),
    protein_goal DECIMAL(5,2) DEFAULT 50.0 CHECK (protein_goal >= 0),
    protein_current DECIMAL(5,2) DEFAULT 0.0 CHECK (protein_current >= 0),
    water_goal INTEGER DEFAULT 8 CHECK (water_goal > 0),
    water_current INTEGER DEFAULT 0 CHECK (water_current >= 0),
    
    -- Workout Goals
    workout_minutes_goal INTEGER DEFAULT 60 CHECK (workout_minutes_goal >= 0),
    workout_minutes_current INTEGER DEFAULT 0 CHECK (workout_minutes_current >= 0),
    workouts_completed INTEGER DEFAULT 0 CHECK (workouts_completed >= 0),
    
    -- Sleep Goals
    sleep_hours_goal DECIMAL(3,1) DEFAULT 8.0 CHECK (sleep_hours_goal > 0),
    sleep_hours_actual DECIMAL(3,1) DEFAULT 0.0 CHECK (sleep_hours_actual >= 0),
    sleep_quality INTEGER DEFAULT 0 CHECK (sleep_quality BETWEEN 0 AND 10),
    
    -- Screen Time Goals
    screen_time_goal_hours INTEGER DEFAULT 4 CHECK (screen_time_goal_hours >= 0),
    screen_time_actual_hours DECIMAL(4,2) DEFAULT 0.0 CHECK (screen_time_actual_hours >= 0),
    focus_time_hours DECIMAL(4,2) DEFAULT 0.0 CHECK (focus_time_hours >= 0),
    
    -- Completion Status
    daily_goals_completed BOOLEAN DEFAULT false,
    completion_percentage DECIMAL(5,2) DEFAULT 0.0 CHECK (completion_percentage BETWEEN 0 AND 100),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, date) -- One record per user per day
);

-- 4. QUESTS TABLE
-- Available quests in the system
CREATE TABLE IF NOT EXISTS public.quests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('fitness', 'nutrition', 'sleep', 'wellness', 'productivity', 'social')),
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'epic')),
    xp_reward INTEGER NOT NULL CHECK (xp_reward > 0),
    
    -- Quest Requirements
    required_level INTEGER DEFAULT 1 CHECK (required_level BETWEEN 1 AND 100),
    prerequisite_quest_id UUID REFERENCES public.quests(id),
    
    -- Quest Parameters (for different quest types)
    quest_type TEXT CHECK (quest_type IN ('daily', 'weekly', 'one_time', 'recurring')),
    target_value INTEGER, -- e.g., "do 50 pushups"
    target_unit TEXT, -- e.g., "reps", "minutes", "hours"
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_seasonal BOOLEAN DEFAULT false,
    season_start_date DATE,
    season_end_date DATE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. USER QUESTS TABLE
-- Tracks user's quest progress and completion
CREATE TABLE IF NOT EXISTS public.user_quests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    quest_id UUID REFERENCES public.quests(id) ON DELETE CASCADE,
    
    -- Progress Tracking
    current_progress INTEGER DEFAULT 0 CHECK (current_progress >= 0),
    target_progress INTEGER NOT NULL CHECK (target_progress > 0),
    
    -- Status
    status TEXT CHECK (status IN ('assigned', 'in_progress', 'completed', 'expired')) DEFAULT 'assigned',
    assigned_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    expires_at TIMESTAMP,
    
    -- Rewards
    xp_granted INTEGER DEFAULT 0 CHECK (xp_granted >= 0),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, quest_id) -- One assignment per user per quest
);

-- 6. WORKOUTS TABLE
-- Workout templates and plans
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('strength', 'cardio', 'flexibility', 'sports', 'functional')),
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    duration_minutes INTEGER CHECK (duration_minutes > 0),
    
    -- Workout Details
    equipment_needed TEXT[], -- Array of equipment items
    muscle_groups TEXT[], -- Array of muscle groups worked
    calories_estimate INTEGER CHECK (calories_estimate > 0),
    
    -- Creator Info
    created_by UUID REFERENCES public.profiles(id),
    is_public BOOLEAN DEFAULT false,
    is_system_template BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. WORKOUT EXERCISES TABLE
-- Individual exercises within workouts
CREATE TABLE IF NOT EXISTS public.workout_exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
    
    -- Exercise Info
    exercise_name TEXT NOT NULL,
    exercise_type TEXT CHECK (exercise_type IN ('strength', 'cardio', 'flexibility', 'balance')),
    
    -- Sets/Reps/Duration
    sets INTEGER CHECK (sets > 0),
    reps INTEGER CHECK (reps > 0),
    duration_seconds INTEGER CHECK (duration_seconds > 0),
    rest_seconds INTEGER DEFAULT 60 CHECK (rest_seconds >= 0),
    
    -- Intensity
    weight DECIMAL(6,2) CHECK (weight >= 0), -- in kg or lbs
    intensity_level TEXT CHECK (intensity_level IN ('low', 'medium', 'high', 'max')),
    
    -- Order
    exercise_order INTEGER CHECK (exercise_order > 0),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. USER WORKOUT SESSIONS TABLE
-- Tracks completed workout sessions
CREATE TABLE IF NOT EXISTS public.user_workout_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES public.workouts(id),
    
    -- Session Info
    session_date DATE DEFAULT CURRENT_DATE,
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    duration_minutes INTEGER CHECK (duration_minutes >= 0),
    
    -- Performance
    calories_burned INTEGER CHECK (calories_burned >= 0),
    completion_percentage DECIMAL(5,2) DEFAULT 100.0 CHECK (completion_percentage BETWEEN 0 AND 100),
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
    notes TEXT,
    
    -- Status
    status TEXT CHECK (status IN ('in_progress', 'completed', 'abandoned')) DEFAULT 'in_progress',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_preferences_id ON public.user_preferences(id);
CREATE INDEX IF NOT EXISTS idx_user_stats_id ON public.user_stats(id);
CREATE INDEX IF NOT EXISTS idx_daily_progress_user_date ON public.daily_progress(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_quests_user_status ON public.user_quests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_workouts_category ON public.workouts(category);
CREATE INDEX IF NOT EXISTS idx_user_workout_sessions_user_date ON public.user_workout_sessions(user_id, session_date);

-- ============================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================

-- User Preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = id);

-- User Stats
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own stats" ON public.user_stats FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own stats" ON public.user_stats FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own stats" ON public.user_stats FOR INSERT WITH CHECK (auth.uid() = id);

-- Daily Progress
ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own daily progress" ON public.daily_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own daily progress" ON public.daily_progress FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily progress" ON public.daily_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Quests
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quests" ON public.user_quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own quests" ON public.user_quests FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert own quests" ON public.user_quests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Workout Sessions
ALTER TABLE public.user_workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own workout sessions" ON public.user_workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own workout sessions" ON public.user_workout_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert own workout sessions" ON public.user_workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================

-- Update updated_at timestamp for user_preferences
CREATE OR REPLACE FUNCTION public.update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_preferences_updated_at();

-- Update updated_at timestamp for user_stats
CREATE OR REPLACE FUNCTION public.update_user_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_stats_updated_at
    BEFORE UPDATE ON public.user_stats
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_stats_updated_at();

-- Auto-create user stats when profile is created
CREATE OR REPLACE FUNCTION public.create_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_stats (id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_stats_trigger
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_user_stats();

-- Auto-create user preferences when profile is created
CREATE OR REPLACE FUNCTION public.create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_preferences (id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_preferences_trigger
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_user_preferences();

-- Auto-create daily progress record
CREATE OR REPLACE FUNCTION public.create_daily_progress()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.daily_progress (user_id, date) 
    VALUES (NEW.id, CURRENT_DATE)
    ON CONFLICT (user_id, date) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_daily_progress_trigger
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_daily_progress();

-- ============================================================
-- INITIAL QUEST DATA
-- ============================================================

INSERT INTO public.quests (title, description, category, difficulty, xp_reward, quest_type, target_value, target_unit) VALUES
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

ON CONFLICT DO NOTHING;
