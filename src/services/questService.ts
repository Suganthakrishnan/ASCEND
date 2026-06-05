import { supabase } from './supabase';
import { StatsService } from './statsService';

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: 'fitness' | 'nutrition' | 'sleep' | 'wellness' | 'productivity' | 'social';
  difficulty: 'easy' | 'medium' | 'hard' | 'epic';
  xp_reward: number;
  required_level: number;
  prerequisite_quest_id?: string;
  quest_type: 'daily' | 'weekly' | 'one_time' | 'recurring';
  target_value?: number;
  target_unit?: string;
  is_active: boolean;
  is_seasonal: boolean;
  season_start_date?: string;
  season_end_date?: string;
}

export interface UserQuest {
  id: string;
  user_id: string;
  quest_id: string;
  current_progress: number;
  target_progress: number;
  status: 'assigned' | 'in_progress' | 'completed' | 'expired';
  assigned_at: string;
  started_at?: string;
  completed_at?: string;
  expires_at?: string;
  xp_granted: number;
  quest?: Quest; // Joined quest data
}

export class QuestService {
  // Get available quests for user
  static async getAvailableQuests(userId: string, userLevel: number): Promise<{ data: Quest[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('is_active', true)
        .lte('required_level', userLevel)
        .order('difficulty', { ascending: true });

      // Filter out seasonal quests that are not currently active
      const filteredQuests = (data || []).filter(quest => {
        if (!quest.is_seasonal) return true;
        
        const now = new Date();
        const startDate = quest.season_start_date ? new Date(quest.season_start_date) : null;
        const endDate = quest.season_end_date ? new Date(quest.season_end_date) : null;
        
        if (startDate && now < startDate) return false;
        if (endDate && now > endDate) return false;
        
        return true;
      });

      return { data: filteredQuests, error };
    } catch (error) {
      return { data: [], error };
    }
  }

  // Get user's active quests
  static async getUserQuests(userId: string): Promise<{ data: UserQuest[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_quests')
        .select(`
          *,
          quest:quests(*)
        `)
        .eq('user_id', userId)
        .in('status', ['assigned', 'in_progress'])
        .order('assigned_at', { ascending: false });

      return { data: data || [], error };
    } catch (error) {
      return { data: [], error };
    }
  }

  // Get user's completed quests
  static async getCompletedQuests(userId: string, limit: number = 50): Promise<{ data: UserQuest[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_quests')
        .select(`
          *,
          quest:quests(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(limit);

      return { data: data || [], error };
    } catch (error) {
      return { data: [], error };
    }
  }

  // Assign quest to user
  static async assignQuest(userId: string, questId: string): Promise<{ data: UserQuest | null; error: any }> {
    try {
      // Get quest details
      const { data: quest, error: questError } = await supabase
        .from('quests')
        .select('*')
        .eq('id', questId)
        .single();

      if (questError || !quest) {
        return { data: null, error: questError };
      }

      // Check if already assigned
      const { data: existing, error: checkError } = await supabase
        .from('user_quests')
        .select('*')
        .eq('user_id', userId)
        .eq('quest_id', questId)
        .single();

      if (existing && !checkError) {
        return { data: existing, error: null };
      }

      // Create new user quest
      const { data, error } = await supabase
        .from('user_quests')
        .insert({
          user_id: userId,
          quest_id: questId,
          current_progress: 0,
          target_progress: quest.target_value || 1,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
          expires_at: this.calculateExpiryDate(quest.quest_type),
        })
        .select(`
          *,
          quest:quests(*)
        `)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Update quest progress
  static async updateQuestProgress(
    userId: string, 
    questId: string, 
    progress: number
  ): Promise<{ data: UserQuest | null; error: any; xpGranted?: number }> {
    try {
      // Get current quest
      const { data: currentQuest, error: fetchError } = await supabase
        .from('user_quests')
        .select(`
          *,
          quest:quests(*)
        `)
        .eq('user_id', userId)
        .eq('quest_id', questId)
        .single();

      if (fetchError || !currentQuest) {
        return { data: null, error: fetchError };
      }

      // Update progress
      const newProgress = Math.min(progress, currentQuest.target_progress);
      const isCompleted = newProgress >= currentQuest.target_progress;
      
      let xpGranted = 0;
      let status = currentQuest.status;

      if (isCompleted && currentQuest.status !== 'completed') {
        // Quest completed, grant XP
        status = 'completed';
        xpGranted = currentQuest.quest?.xp_reward || 0;

        // Add XP to user stats
        const { error: xpError } = await StatsService.addXP(userId, xpGranted);
        if (xpError) {
          console.error('Failed to grant XP:', xpError);
        }
      } else if (newProgress > 0 && currentQuest.status === 'assigned') {
        status = 'in_progress';
      }

      // Update quest
      const updates: Partial<UserQuest> = {
        current_progress: newProgress,
        status,
        xp_granted: xpGranted,
      };

      if (isCompleted) {
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('user_quests')
        .update(updates)
        .eq('user_id', userId)
        .eq('quest_id', questId)
        .select(`
          *,
          quest:quests(*)
        `)
        .single();

      return { data, error, xpGranted };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Auto-assign daily quests
  static async assignDailyQuests(userId: string): Promise<{ data: UserQuest[]; error: any }> {
    try {
      // Get user's current level
      const { data: userStats, error: statsError } = await StatsService.getUserStats(userId);
      if (statsError || !userStats) {
        return { data: [], error: statsError };
      }

      // Get available daily quests
      const { data: availableQuests, error: questsError } = await this.getAvailableQuests(userId, userStats.level);
      if (questsError) {
        return { data: [], error: questsError };
      }

      const dailyQuests = availableQuests.filter(quest => quest.quest_type === 'daily');
      const assignedQuests: UserQuest[] = [];

      // Assign daily quests (limit to 3 per day)
      for (const quest of dailyQuests.slice(0, 3)) {
        const { data: assignedQuest, error } = await this.assignQuest(userId, quest.id);
        if (!error && assignedQuest) {
          assignedQuests.push(assignedQuest);
        }
      }

      return { data: assignedQuests, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  // Complete quest by ID
  static async completeQuest(userId: string, questId: string): Promise<{ data: UserQuest | null; error: any; xpGranted?: number }> {
    return this.updateQuestProgress(userId, questId, Number.MAX_SAFE_INTEGER);
  }

  // Calculate expiry date for quests
  private static calculateExpiryDate(questType: string): string | undefined {
    const now = new Date();
    
    switch (questType) {
      case 'daily':
        // End of day
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        return endOfDay.toISOString();
      
      case 'weekly':
        // End of week (Sunday)
        const endOfWeek = new Date(now);
        const daysUntilSunday = (7 - endOfWeek.getDay()) % 7 || 7;
        endOfWeek.setDate(endOfWeek.getDate() + daysUntilSunday);
        endOfWeek.setHours(23, 59, 59, 999);
        return endOfWeek.toISOString();
      
      case 'one_time':
      case 'recurring':
        return undefined; // No expiry
      
      default:
        return undefined;
    }
  }

  // Check and expire overdue quests
  static async checkExpiredQuests(userId: string): Promise<{ data: UserQuest[]; error: any }> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('user_quests')
        .update({ status: 'expired' })
        .eq('user_id', userId)
        .in('status', ['assigned', 'in_progress'])
        .lt('expires_at', now)
        .select();

      return { data: data || [], error };
    } catch (error) {
      return { data: [], error };
    }
  }

  // Get quest statistics
  static async getQuestStats(userId: string): Promise<{
    totalCompleted: number;
    totalXP: number;
    completionRate: number;
    currentActive: number;
    error: any;
  }> {
    try {
      // Get completed quests
      const { data: completed, error: completedError } = await this.getCompletedQuests(userId, 1000);
      if (completedError) {
        return { totalCompleted: 0, totalXP: 0, completionRate: 0, currentActive: 0, error: completedError };
      }

      // Get active quests
      const { data: active, error: activeError } = await this.getUserQuests(userId);
      if (activeError) {
        return { totalCompleted: 0, totalXP: 0, completionRate: 0, currentActive: 0, error: activeError };
      }

      const totalCompleted = completed.length;
      const totalXP = completed.reduce((sum, quest) => sum + (quest.xp_granted || 0), 0);
      const currentActive = active.length;
      
      // Calculate completion rate (completed vs attempted)
      const totalAttempted = totalCompleted + currentActive;
      const completionRate = totalAttempted > 0 ? (totalCompleted / totalAttempted) * 100 : 0;

      return { totalCompleted, totalXP, completionRate, currentActive, error: null };
    } catch (error) {
      return { totalCompleted: 0, totalXP: 0, completionRate: 0, currentActive: 0, error };
    }
  }
}
