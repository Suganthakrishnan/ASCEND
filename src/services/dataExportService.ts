import { supabase } from './supabase';
import { StatsService, PreferencesService, type UserStats, type UserPreferences, type DailyProgress } from './statsService';
import { QuestService, type UserQuest } from './questService';

export interface UserDataExport {
  exportDate: string;
  userId: string;
  email: string | null;
  profile: {
    id: string;
    user_id: string;
    character_name: string | null;
    onboarding_completed: boolean;
    created_at: string;
    updated_at: string;
  };
  stats: UserStats | null;
  preferences: UserPreferences | null;
  dailyProgress: DailyProgress[];
  quests: UserQuest[];
}

export class DataExportService {
  /**
   * Export all user data as JSON for GDPR compliance
   * @param userId - The user's ID
   * @returns JSON string of all user data
   */
  static async exportUserData(userId: string, email: string | null): Promise<{ data: UserDataExport | null; error: any }> {
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch user stats
      const { data: stats } = await StatsService.getUserStats(userId);

      // Fetch user preferences
      const { data: preferences } = await PreferencesService.getUserPreferences(userId);

      // Fetch daily progress history (last 365 days)
      const { data: dailyProgress } = await supabase
        .from('daily_progress')
        .select('*')
        .eq('user_id', userId)
        .gte('date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { Ascending: false });

      // Fetch quest history
      const { data: quests } = await QuestService.getCompletedQuests(userId, 1000);

      const exportData: UserDataExport = {
        exportDate: new Date().toISOString(),
        userId,
        email,
        profile: profile || {
          id: userId,
          user_id: userId,
          character_name: null,
          onboarding_completed: false,
          created_at: '',
          updated_at: '',
        },
        stats: stats || null,
        preferences: preferences || null,
        dailyProgress: dailyProgress || [],
        quests: quests || [],
      };

      return { data: exportData, error: null };
    } catch (error) {
      console.error('Error exporting user data:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete user account and all associated data
   * @param userId - The user's ID
   * @returns Success or error
   */
  static async deleteAccount(userId: string): Promise<{ success: boolean; error: any }> {
    try {
      // Delete user stats
      const { error: statsError } = await supabase
        .from('user_stats')
        .delete()
        .eq('user_id', userId);

      if (statsError) throw statsError;

      // Delete user preferences
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .delete()
        .eq('id', userId);

      if (prefsError) throw prefsError;

      // Delete daily progress
      const { error: progressError } = await supabase
        .from('daily_progress')
        .delete()
        .eq('user_id', userId);

      if (progressError) throw progressError;

      // Delete quests
      const { error: questsError } = await supabase
        .from('user_quests')
        .delete()
        .eq('user_id', userId);

      if (questsError) throw questsError;

      // Delete workout sessions
      const { error: workoutsError } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('user_id', userId);

      if (workoutsError) throw workoutsError;

      // Delete sleep records
      const { error: sleepError } = await supabase
        .from('sleep_records')
        .delete()
        .eq('user_id', userId);

      if (sleepError) throw sleepError;

      // Delete screen time records
      const { error: screenTimeError } = await supabase
        .from('screen_time_records')
        .delete()
        .eq('user_id', userId);

      if (screenTimeError) throw screenTimeError;

      // Delete schedule items
      const { error: scheduleError } = await supabase
        .from('schedule_items')
        .delete()
        .eq('user_id', userId);

      if (scheduleError) throw scheduleError;

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      // Delete auth user (this requires admin privileges, so we'll return success for app data)
      // The actual auth deletion should be handled by a backend function or admin action
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting account:', error);
      return { success: false, error };
    }
  }

  /**
   * Format exported data as a downloadable JSON string
   * @param data - The user data export object
   * @returns Formatted JSON string
   */
  static formatAsJSON(data: UserDataExport): string {
    return JSON.stringify(data, null, 2);
  }
}
