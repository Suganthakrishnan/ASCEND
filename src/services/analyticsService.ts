import { supabase } from './supabase';

/**
 * Analytics Service
 * Uses Supabase for data analytics
 */

export const AnalyticsEvents = {
  LOGIN: 'login',
  SIGNUP: 'signup',
  LOGOUT: 'logout',
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_STEP: 'onboarding_step',
  TASK_COMPLETE: 'task_complete',
  TASK_CREATED: 'task_created',
  TASK_DELETED: 'task_deleted',
  WORKOUT_START: 'workout_start',
  WORKOUT_COMPLETE: 'workout_complete',
  WORKOUT_CANCEL: 'workout_cancel',
  ACHIEVEMENT_UNLOCK: 'achievement_unlock',
  LEVEL_UP: 'level_up',
  QUEST_ACCEPTED: 'quest_accepted',
  QUEST_COMPLETED: 'quest_completed',
  PROFILE_UPDATED: 'profile_updated',
  STATS_UPDATED: 'stats_updated',
  SCREEN_VIEW: 'screen_view',
  BUTTON_TAP: 'button_tap',
} as const;

export type AnalyticsEventName = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];

export async function trackEvent(name: AnalyticsEventName, params?: Record<string, any>) {
  console.log('[Analytics]', name, params);
}

export async function trackScreenView(screenName: string, screenClass?: string) {
  console.log('[Analytics] Screen view:', screenName);
}

export async function setAnalyticsUserId(userId: string) {
  console.log('[Analytics] Set user ID:', userId);
}

export async function setUserProperties(properties: Record<string, any>) {
  console.log('[Analytics] Set user properties:', properties);
}

export async function trackLogin(method: string = 'email') {
  await trackEvent(AnalyticsEvents.LOGIN, { method });
}

export async function trackSignup(method: string = 'email') {
  await trackEvent(AnalyticsEvents.SIGNUP, { method });
}

export async function trackTaskComplete(taskId: string, difficulty: string, xpReward: number) {
  await trackEvent(AnalyticsEvents.TASK_COMPLETE, { task_id: taskId, difficulty, xp_reward: xpReward });
}

export async function trackWorkoutStart(workoutType: string, duration?: number) {
  await trackEvent(AnalyticsEvents.WORKOUT_START, { workout_type: workoutType, duration_minutes: duration });
}

export async function trackAchievementUnlock(achievementId: string, achievementTitle: string, xpReward: number) {
  await trackEvent(AnalyticsEvents.ACHIEVEMENT_UNLOCK, { achievement_id: achievementId, achievement_title: achievementTitle, xp_reward: xpReward });
}

// --- All the Supabase data analytics below is unchanged ---

export interface WorkoutFrequencyData {
  date: string;
  workoutsCompleted: number;
  workoutMinutes: number;
}

export interface XPTrendData {
  date: string;
  xpEarned: number;
  totalXP: number;
}

export interface GoalCompletionData {
  date: string;
  completionRate: number;
  goalsCompleted: boolean;
}

export interface PersonalRecord {
  id: string;
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
  category: 'strength' | 'cardio' | 'flexibility';
}

export interface AnalyticsSummary {
  totalWorkouts: number;
  totalWorkoutMinutes: number;
  averageWorkoutDuration: number;
  totalXPEarned: number;
  goalCompletionRate: number;
  currentStreak: number;
  personalRecordsCount: number;
}

export class AnalyticsService {
  static async getWorkoutFrequency(userId: string, days: number = 30): Promise<{ data: WorkoutFrequencyData[]; error: any }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_progress')
        .select('date, workouts_completed, workout_minutes_current')
        .eq('user_id', userId)
        .gte('date', startDateStr)
        .order('date', { Ascending: true });
      if (error) return { data: [], error };
      const formattedData: WorkoutFrequencyData[] = (data || []).map(item => ({
        date: item.date,
        workoutsCompleted: item.workouts_completed || 0,
        workoutMinutes: item.workout_minutes_current || 0,
      }));
      return { data: formattedData, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  static async getXPTrends(userId: string, days: number = 30): Promise<{ data: XPTrendData[]; error: any }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];
      const { data: questData, error: questError } = await supabase
        .from('user_quests')
        .select('completed_at, xp_granted')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', startDateStr)
        .order('completed_at', { Ascending: true });
      if (questError) return { data: [], error: questError };
      const xpByDate = new Map<string, number>();
      (questData || []).forEach(quest => {
        const date = quest.completed_at?.split('T')[0] || '';
        const xp = quest.xp_granted || 0;
        xpByDate.set(date, (xpByDate.get(date) || 0) + xp);
      });
      const { data: userStats } = await supabase.from('user_stats').select('total_xp').eq('id', userId).single();
      const currentTotalXP = userStats?.total_xp || 0;
      const formattedData: XPTrendData[] = [];
      const sortedDates = Array.from(xpByDate.keys()).sort();
      const totalXPEarnedInPeriod = sortedDates.reduce((sum, date) => sum + (xpByDate.get(date) || 0), 0);
      let runningTotal = currentTotalXP - totalXPEarnedInPeriod;
      sortedDates.forEach(date => {
        const xpEarned = xpByDate.get(date) || 0;
        runningTotal += xpEarned;
        formattedData.push({ date, xpEarned, totalXP: runningTotal });
      });
      return { data: formattedData, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  static async getGoalCompletionRate(userId: string, days: number = 30): Promise<{ data: GoalCompletionData[]; error: any }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_progress')
        .select('date, completion_percentage, daily_goals_completed')
        .eq('user_id', userId)
        .gte('date', startDateStr)
        .order('date', { Ascending: true });
      if (error) return { data: [], error };
      const formattedData: GoalCompletionData[] = (data || []).map(item => ({
        date: item.date,
        completionRate: item.completion_percentage || 0,
        goalsCompleted: item.daily_goals_completed || false,
      }));
      return { data: formattedData, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  static async getPersonalRecords(userId: string): Promise<{ data: PersonalRecord[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('daily_progress')
        .select('date, workout_minutes_current, workouts_completed')
        .eq('user_id', userId)
        .order('date', { Ascending: false })
        .limit(30);
      if (error) return { data: [], error };
      const records: PersonalRecord[] = (data || [])
        .filter(item => item.workout_minutes_current > 0)
        .slice(0, 10)
        .map((item, index) => ({
          id: `pr-${index}`,
          exerciseName: 'Daily Workout',
          weight: item.workout_minutes_current,
          reps: item.workouts_completed || 1,
          date: item.date,
          category: 'cardio',
        }));
      return { data: records, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  static async getAnalyticsSummary(userId: string, days: number = 30): Promise<{ data: AnalyticsSummary; error: any }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];
      const { data: progressData, error: progressError } = await supabase
        .from('daily_progress').select('*').eq('user_id', userId).gte('date', startDateStr);
      if (progressError) return { data: {} as AnalyticsSummary, error: progressError };
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats').select('*').eq('id', userId).single();
      if (statsError) return { data: {} as AnalyticsSummary, error: statsError };
      const totalWorkouts = (progressData || []).reduce((sum, day) => sum + (day.workouts_completed || 0), 0);
      const totalWorkoutMinutes = (progressData || []).reduce((sum, day) => sum + (day.workout_minutes_current || 0), 0);
      const averageWorkoutDuration = totalWorkouts > 0 ? totalWorkoutMinutes / totalWorkouts : 0;
      const totalXPEarned = userStats?.total_xp || 0;
      const goalsCompleted = (progressData || []).filter(day => day.daily_goals_completed).length;
      const goalCompletionRate = progressData && progressData.length > 0 ? (goalsCompleted / progressData.length) * 100 : 0;
      const currentStreak = userStats?.day_streak || 0;
      const { data: personalRecords } = await this.getPersonalRecords(userId);
      const summary: AnalyticsSummary = {
        totalWorkouts,
        totalWorkoutMinutes,
        averageWorkoutDuration: Math.round(averageWorkoutDuration),
        totalXPEarned,
        goalCompletionRate: Math.round(goalCompletionRate),
        currentStreak,
        personalRecordsCount: personalRecords?.length || 0,
      };
      return { data: summary, error: null };
    } catch (error) {
      return { data: {} as AnalyticsSummary, error };
    }
  }

  static async getWeeklyComparison(userId: string): Promise<{
    thisWeek: { workouts: number; minutes: number; xp: number };
    lastWeek: { workouts: number; minutes: number; xp: number };
    error: any;
  }> {
    try {
      const now = new Date();
      const startOfThisWeek = new Date(now);
      startOfThisWeek.setDate(now.getDate() - now.getDay());
      const startOfThisWeekStr = startOfThisWeek.toISOString().split('T')[0];
      const startOfLastWeek = new Date(startOfThisWeek);
      startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
      const startOfLastWeekStr = startOfLastWeek.toISOString().split('T')[0];
      const endOfLastWeek = new Date(startOfThisWeek);
      endOfLastWeek.setDate(startOfThisWeek.getDate() - 1);
      const endOfLastWeekStr = endOfLastWeek.toISOString().split('T')[0];
      const { data: thisWeekData } = await supabase.from('daily_progress').select('workouts_completed, workout_minutes_current').eq('user_id', userId).gte('date', startOfThisWeekStr);
      const { data: lastWeekData } = await supabase.from('daily_progress').select('workouts_completed, workout_minutes_current').eq('user_id', userId).gte('date', startOfLastWeekStr).lte('date', endOfLastWeekStr);
      const { data: thisWeekQuests } = await supabase.from('user_quests').select('xp_granted').eq('user_id', userId).eq('status', 'completed').gte('completed_at', startOfThisWeekStr);
      const { data: lastWeekQuests } = await supabase.from('user_quests').select('xp_granted').eq('user_id', userId).eq('status', 'completed').gte('completed_at', startOfLastWeekStr).lte('completed_at', endOfLastWeekStr);
      return {
        thisWeek: {
          workouts: (thisWeekData || []).reduce((sum, day) => sum + (day.workouts_completed || 0), 0),
          minutes: (thisWeekData || []).reduce((sum, day) => sum + (day.workout_minutes_current || 0), 0),
          xp: (thisWeekQuests || []).reduce((sum, q) => sum + (q.xp_granted || 0), 0),
        },
        lastWeek: {
          workouts: (lastWeekData || []).reduce((sum, day) => sum + (day.workouts_completed || 0), 0),
          minutes: (lastWeekData || []).reduce((sum, day) => sum + (day.workout_minutes_current || 0), 0),
          xp: (lastWeekQuests || []).reduce((sum, q) => sum + (q.xp_granted || 0), 0),
        },
        error: null,
      };
    } catch (error) {
      return { thisWeek: { workouts: 0, minutes: 0, xp: 0 }, lastWeek: { workouts: 0, minutes: 0, xp: 0 }, error };
    }
  }
}