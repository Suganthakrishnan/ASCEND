import { supabase } from './supabase';
import { persistedFetch, persistedMutate } from './persistence/persistenceService';
import { CacheKeys } from './persistence/cacheKeys';

export interface UserStats {
  user_id: string;
  character_name: string;
  level: number;
  current_xp: number;
  xp_to_next_level: number;
  rank: string;
  points_available: number;
  strength: number;
  intelligence: number;
  stamina: number;
  code_knowledge: number;
  agility: number;
  communication: number;
  total_xp_earned: number;
  day_streak: number;
  total_days_active: number;
  last_active_date: string | null;
}

export interface UserPreferences {
  id: string;
  primary_goal?: string;
  fitness_level?: string;
  workout_frequency?: number;
  workout_reminders?: boolean;
  nutrition_reminders?: boolean;
  sleep_reminders?: boolean;
  achievement_notifications?: boolean;
  weight_unit?: string;
  height_unit?: string;
  distance_unit?: string;
  profile_public?: boolean;
  share_achievements?: boolean;
  age?: number;
  weight?: number;
  height?: number;
  gender?: string;
  // New fields for updated onboarding
  goals?: string[];
  notifications_enabled?: boolean;
  reminder_time?: string;
  quest_reminders_enabled?: boolean;
}

export interface DailyProgress {
  id: string;
  user_id: string;
  date: string;
  calories_goal: number;
  calories_current: number;
  protein_goal: number;
  protein_current: number;
  water_goal: number;
  water_current: number;
  workout_minutes_goal: number;
  workout_minutes_current: number;
  workouts_completed: number;
  sleep_hours_goal: number;
  sleep_hours_actual: number;
  sleep_quality: number;
  screen_time_goal_hours: number;
  screen_time_actual_hours: number;
  focus_time_hours: number;
  daily_goals_completed: boolean;
  completion_percentage: number;
}

// Stats Service
export class StatsService {
  // Get user stats
  static async getUserStats(userId: string): Promise<{ data: UserStats | null; error: any }> {
    try {
      const result = await persistedFetch<UserStats | null>(
        CacheKeys.userStats(userId),
        async () => {
          const { data, error } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', userId)
            .single();
          if (error) throw error;
          return { data, error: null };
        },
      );
      return { data: result.data, error: result.error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Subtract XP from user stats (used for penalty systems)
  static async subtractXP(userId: string, xpAmount: number): Promise<{ data: UserStats | null; error: any }> {
    try {
      const penaltyAmount = Math.max(0, Math.floor(xpAmount));
      if (penaltyAmount === 0) {
        return await this.getUserStats(userId);
      }

      const { data: currentStats, error: fetchError } = await this.getUserStats(userId);
      if (fetchError || !currentStats) {
        return { data: null, error: fetchError };
      }

      const updates: Partial<UserStats> = {
        current_xp: Math.max(0, currentStats.current_xp - penaltyAmount),
        total_xp_earned: Math.max(0, currentStats.total_xp_earned - penaltyAmount),
      };

      const { error } = await this.updateUserStats(userId, updates);
      if (error) {
        return { data: null, error };
      }

      return await this.getUserStats(userId);
    } catch (error) {
      return { data: null, error };
    }
  }

  static async updateUserStats(userId: string, updates: Partial<UserStats>): Promise<{ error: any }> {
    const result = await persistedMutate<null>({
      mutation: async () => {
        const { error } = await supabase.from('user_stats').update(updates).eq('user_id', userId);
        if (error) throw error;
        return { data: null, error: null };
      },
      queueItem: {
        table: 'user_stats',
        operation: 'update',
        payload: updates as Record<string, unknown>,
        filters: { user_id: userId },
      },
      invalidateKeys: [CacheKeys.userStats(userId)],
    });
    return { error: result.error };
  }

  // Add XP to user stats
  static async addXP(userId: string, xpAmount: number): Promise<{ data: UserStats | null; error: any }> {
    try {
      // First get current stats
      const { data: currentStats, error: fetchError } = await this.getUserStats(userId);
      if (fetchError || !currentStats) {
        return { data: null, error: fetchError };
      }

      // Calculate new XP and level
      let newTotalXPEarned = currentStats.total_xp_earned + xpAmount;
      let newLevel = currentStats.level;
      let currentXP = currentStats.current_xp + xpAmount;
      let xpToNext = currentStats.xp_to_next_level;

      // Level up logic
      while (currentXP >= xpToNext) {
        currentXP -= xpToNext;
        newLevel++;
        xpToNext = Math.floor(xpToNext * 1.2); // Increase XP requirement by 20% per level
      }

      // Update rank based on level
      let newRank = 'Novice';
      if (newLevel >= 50) newRank = 'S-RANK';
      else if (newLevel >= 40) newRank = 'A-RANK';
      else if (newLevel >= 30) newRank = 'B-RANK';
      else if (newLevel >= 20) newRank = 'C-RANK';
      else if (newLevel >= 10) newRank = 'D-RANK';
      else if (newLevel >= 5) newRank = 'E-RANK';

      // Award points on level up
      let pointsAvailable = currentStats.points_available;
      if (newLevel > currentStats.level) {
        pointsAvailable += 3; // Award 3 points per level up
      }

      // Update stats
      const updates: Partial<UserStats> = {
        total_xp_earned: newTotalXPEarned,
        level: newLevel,
        current_xp: currentXP,
        xp_to_next_level: xpToNext,
        rank: newRank,
        points_available: pointsAvailable,
      };

      const { error } = await this.updateUserStats(userId, updates);
      if (error) {
        return { data: null, error };
      }

      // Return updated stats
      return await this.getUserStats(userId);
    } catch (error) {
      return { data: null, error };
    }
  }

  // Update stat value
  static async updateStat(userId: string, statName: keyof Omit<UserStats, 'user_id' | 'level' | 'current_xp' | 'xp_to_next_level' | 'rank' | 'points_available' | 'total_xp_earned' | 'day_streak' | 'total_days_active' | 'last_active_date'>, value: number): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('user_stats')
        .update({ [statName]: value })
        .eq('user_id', userId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  // Allocate points to attribute
  static async allocatePoint(userId: string, attribute: keyof Omit<UserStats, 'user_id' | 'character_name' | 'level' | 'current_xp' | 'xp_to_next_level' | 'rank' | 'points_available' | 'total_xp_earned' | 'day_streak' | 'total_days_active' | 'last_active_date'>): Promise<{ data: UserStats | null; error: any }> {
    try {
      const { data: currentStats, error: fetchError } = await this.getUserStats(userId);
      if (fetchError || !currentStats) {
        return { data: null, error: fetchError };
      }

      if (currentStats.points_available <= 0) {
        return { data: null, error: { message: 'No points available' } };
      }

      const newValue = currentStats[attribute] + 1;
      const { error } = await this.updateStat(userId, attribute, newValue);
      
      if (error) {
        return { data: null, error };
      }

      // Decrease points available
      const { error: updateError } = await this.updateUserStats(userId, { points_available: currentStats.points_available - 1 });
      if (updateError) {
        return { data: null, error: updateError };
      }

      return await this.getUserStats(userId);
    } catch (error) {
      return { data: null, error };
    }
  }

  // Update character name
  static async updateCharacterName(userId: string, name: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('user_stats')
        .update({ character_name: name })
        .eq('user_id', userId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  // Create user_stats row if missing (e.g. before onboarding completes)
  static async ensureUserStats(userId: string, characterName = 'Agent'): Promise<{ error: any }> {
    try {
      const { data } = await this.getUserStats(userId);
      if (data) {
        if (characterName && data.character_name !== characterName) {
          return this.updateCharacterName(userId, characterName);
        }
        return { error: null };
      }

      const { error } = await supabase.from('user_stats').insert({
        user_id: userId,
        character_name: characterName,
      });

      return { error };
    } catch (error) {
      return { error };
    }
  }

  // Update daily streak
  static async updateDailyStreak(userId: string): Promise<{ data: UserStats | null; error: any }> {
    try {
      const { data: currentStats, error: fetchError } = await this.getUserStats(userId);
      if (fetchError || !currentStats) {
        return { data: null, error: fetchError };
      }

      const today = new Date().toISOString().split('T')[0];
      const lastActive = currentStats.last_active_date;
      
      let newStreak = currentStats.day_streak;
      let totalDays = currentStats.total_days_active;

      if (lastActive === today) {
        // Already active today, no change
        return { data: currentStats, error: null };
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastActive === yesterdayStr) {
        // Consecutive day
        newStreak++;
      } else {
        // Streak broken, start new one
        newStreak = 1;
      }

      totalDays++;

      const updates: Partial<UserStats> = {
        day_streak: newStreak,
        total_days_active: totalDays,
        last_active_date: today,
      };

      const { error } = await this.updateUserStats(userId, updates);
      if (error) {
        return { data: null, error };
      }

      return await this.getUserStats(userId);
    } catch (error) {
      return { data: null, error };
    }
  }
}

// Preferences Service
export class PreferencesService {
  // Get user preferences
  static async getUserPreferences(userId: string): Promise<{ data: UserPreferences | null; error: any }> {
    try {
      const result = await persistedFetch<UserPreferences | null>(
        CacheKeys.userPreferences(userId),
        async () => {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('id', userId)
            .single();
          if (error) throw error;
          return { data, error: null };
        },
      );
      return { data: result.data, error: result.error };
    } catch (error) {
      return { data: null, error };
    }
  }

  static async updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<{ error: any }> {
    const result = await persistedMutate<null>({
      mutation: async () => {
        const { error } = await supabase.from('user_preferences').update(updates).eq('id', userId);
        if (error) throw error;
        return { data: null, error: null };
      },
      queueItem: {
        table: 'user_preferences',
        operation: 'update',
        payload: updates as Record<string, unknown>,
        filters: { id: userId },
      },
      invalidateKeys: [CacheKeys.userPreferences(userId)],
    });
    return { error: result.error };
  }

  static async upsertUserPreferences(
    userId: string,
    updates: Partial<UserPreferences>,
  ): Promise<{ error: any }> {
    const payload = { id: userId, ...updates };
    const result = await persistedMutate<null>({
      mutation: async () => {
        const { error } = await supabase
          .from('user_preferences')
          .upsert(payload, { onConflict: 'id' });
        if (error) throw error;
        return { data: null, error: null };
      },
      queueItem: {
        table: 'user_preferences',
        operation: 'upsert',
        payload: payload as Record<string, unknown>,
        onConflict: 'id',
      },
      invalidateKeys: [CacheKeys.userPreferences(userId)],
    });
    return { error: result.error };
  }
}

// Daily Progress Service
export class DailyProgressService {
  // Get today's progress
  static async getTodayProgress(userId: string): Promise<{ data: DailyProgress | null; error: any }> {
    const today = new Date().toISOString().split('T')[0];
    try {
      const result = await persistedFetch<DailyProgress | null>(
        CacheKeys.dailyProgress(userId, today),
        async () => {
          const { data, error } = await supabase
            .from('daily_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .maybeSingle();
          if (error) throw error;
          return { data: data ?? null, error: null };
        },
        { ttlMs: 60 * 1000 },
      );
      return { data: result.data, error: result.error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Create or update today's progress
  static async updateTodayProgress(userId: string, updates: Partial<DailyProgress>): Promise<{ data: DailyProgress | null; error: any }> {
    const today = new Date().toISOString().split('T')[0];
    const payload = { user_id: userId, date: today, ...updates };

    const result = await persistedMutate<DailyProgress>({
      mutation: async () => {
        const { data, error } = await supabase
          .from('daily_progress')
          .upsert(payload, { onConflict: 'user_id,date' })
          .select()
          .single();
        if (error) throw error;
        if (data) await this.recalculateCompletion(data.id);
        return { data, error: null };
      },
      queueItem: {
        table: 'daily_progress',
        operation: 'upsert',
        payload: payload as Record<string, unknown>,
        onConflict: 'user_id,date',
      },
      invalidateKeys: [CacheKeys.progressPrefix(userId)],
    });

    if (!result.error) {
      return this.getTodayProgress(userId);
    }
    return { data: result.data, error: result.error };
  }

  // Update specific progress metric
  static async updateProgressMetric(
    userId: string, 
    metric: keyof Omit<DailyProgress, 'id' | 'user_id' | 'date' | 'daily_goals_completed' | 'completion_percentage'>, 
    value: number
  ): Promise<{ data: DailyProgress | null; error: any }> {
    return this.updateTodayProgress(userId, { [metric]: value });
  }

  // Recalculate completion percentage
  private static async recalculateCompletion(progressId: string): Promise<{ error: any }> {
    try {
      // Get current progress
      const { data: progress, error: fetchError } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('id', progressId)
        .single();

      if (fetchError || !progress) {
        return { error: fetchError };
      }

      // Calculate completion percentages for each category
      const caloriesPercent = (progress.calories_current / progress.calories_goal) * 100;
      const workoutPercent = (progress.workout_minutes_current / progress.workout_minutes_goal) * 100;
      const waterPercent = (progress.water_current / progress.water_goal) * 100;
      const sleepPercent = progress.sleep_hours_actual > 0 ? (progress.sleep_hours_actual / progress.sleep_hours_goal) * 100 : 0;

      // Overall completion (average of all categories)
      const overallCompletion = Math.min(100, (caloriesPercent + workoutPercent + waterPercent + sleepPercent) / 4);

      // Check if all goals are met
      const goalsCompleted = caloriesPercent >= 100 && workoutPercent >= 100 && waterPercent >= 100 && sleepPercent >= 100;

      // Update completion status
      const { error } = await supabase
        .from('daily_progress')
        .update({
          completion_percentage: overallCompletion,
          daily_goals_completed: goalsCompleted,
        })
        .eq('id', progressId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  // Get progress history
  static async getProgressHistory(userId: string, days: number = 30): Promise<{ data: DailyProgress[]; error: any }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDateStr)
        .order('date', { ascending: true });

      return { data: data || [], error };
    } catch (error) {
      return { data: [], error };
    }
  }
}
