import { supabase } from './supabase';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'workout' | 'streak' | 'xp' | 'social' | 'milestone';
  requirementType: 'total_workouts' | 'day_streak' | 'total_xp' | 'completed_quests' | 'special';
  requirementValue: number;
  xpReward: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export interface RankTier {
  id: string;
  name: string;
  description: string;
  minXP: number;
  maxXP: number;
  icon: string;
  color: string;
  benefits: string[];
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  achieved: boolean;
  achievedAt?: string;
  icon: string;
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: string;
  achievement?: Achievement;
}

export class AchievementsService {
  // Rank tiers based on XP
  static readonly RANK_TIERS: RankTier[] = [
    {
      id: 'novice',
      name: 'Novice',
      description: 'Beginning your fitness journey',
      minXP: 0,
      maxXP: 999,
      icon: '🌱',
      color: '#6dddff',
      benefits: ['Access to basic workouts', 'Daily quests available'],
    },
    {
      id: 'warrior',
      name: 'Warrior',
      description: 'Proven dedication to fitness',
      minXP: 1000,
      maxXP: 4999,
      icon: '⚔️',
      color: '#ac89ff',
      benefits: ['Advanced workout plans', 'Weekly challenges', 'Custom workout creation'],
    },
    {
      id: 'elite',
      name: 'Elite',
      description: 'Exceptional fitness achievement',
      minXP: 5000,
      maxXP: 14999,
      icon: '👑',
      color: '#ffd93d',
      benefits: ['Elite workout library', 'Priority support', 'Exclusive badges'],
    },
    {
      id: 'legend',
      name: 'Legend',
      description: 'Fitness mastery attained',
      minXP: 15000,
      maxXP: Infinity,
      icon: '🏆',
      color: '#ff716c',
      benefits: ['All features unlocked', 'Mentor status', 'Legendary rewards'],
    },
  ];

  // Achievement definitions
  static readonly ACHIEVEMENTS: Achievement[] = [
    // Workout achievements
    {
      id: 'first_workout',
      name: 'First Steps',
      description: 'Complete your first workout',
      icon: '🎯',
      category: 'workout',
      requirementType: 'total_workouts',
      requirementValue: 1,
      xpReward: 50,
      isUnlocked: false,
    },
    {
      id: 'ten_workouts',
      name: 'Getting Started',
      description: 'Complete 10 workouts',
      icon: '💪',
      category: 'workout',
      requirementType: 'total_workouts',
      requirementValue: 10,
      xpReward: 100,
      isUnlocked: false,
    },
    {
      id: 'fifty_workouts',
      name: 'Dedicated',
      description: 'Complete 50 workouts',
      icon: '🔥',
      category: 'workout',
      requirementType: 'total_workouts',
      requirementValue: 50,
      xpReward: 250,
      isUnlocked: false,
    },
    {
      id: 'hundred_workouts',
      name: 'Fitness Master',
      description: 'Complete 100 workouts',
      icon: '🏅',
      category: 'workout',
      requirementType: 'total_workouts',
      requirementValue: 100,
      xpReward: 500,
      isUnlocked: false,
    },
    // Streak achievements
    {
      id: 'three_day_streak',
      name: 'On Fire',
      description: 'Maintain a 3-day streak',
      icon: '🔥',
      category: 'streak',
      requirementType: 'day_streak',
      requirementValue: 3,
      xpReward: 75,
      isUnlocked: false,
    },
    {
      id: 'seven_day_streak',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '⚡',
      category: 'streak',
      requirementType: 'day_streak',
      requirementValue: 7,
      xpReward: 150,
      isUnlocked: false,
    },
    {
      id: 'thirty_day_streak',
      name: 'Unstoppable',
      description: 'Maintain a 30-day streak',
      icon: '💎',
      category: 'streak',
      requirementType: 'day_streak',
      requirementValue: 30,
      xpReward: 500,
      isUnlocked: false,
    },
    // XP achievements
    {
      id: 'first_xp',
      name: 'XP Hunter',
      description: 'Earn your first 100 XP',
      icon: '✨',
      category: 'xp',
      requirementType: 'total_xp',
      requirementValue: 100,
      xpReward: 25,
      isUnlocked: false,
    },
    {
      id: 'thousand_xp',
      name: 'XP Master',
      description: 'Earn 1,000 XP',
      icon: '🌟',
      category: 'xp',
      requirementType: 'total_xp',
      requirementValue: 1000,
      xpReward: 200,
      isUnlocked: false,
    },
    {
      id: 'five_thousand_xp',
      name: 'XP Legend',
      description: 'Earn 5,000 XP',
      icon: '🚀',
      category: 'xp',
      requirementType: 'total_xp',
      requirementValue: 5000,
      xpReward: 500,
      isUnlocked: false,
    },
    // Quest achievements
    {
      id: 'first_quest',
      name: 'Quest Initiate',
      description: 'Complete your first quest',
      icon: '📜',
      category: 'milestone',
      requirementType: 'completed_quests',
      requirementValue: 1,
      xpReward: 50,
      isUnlocked: false,
    },
    {
      id: 'ten_quests',
      name: 'Quest Hunter',
      description: 'Complete 10 quests',
      icon: '🗡️',
      category: 'milestone',
      requirementType: 'completed_quests',
      requirementValue: 10,
      xpReward: 150,
      isUnlocked: false,
    },
    {
      id: 'fifty_quests',
      name: 'Quest Master',
      description: 'Complete 50 quests',
      icon: '🛡️',
      category: 'milestone',
      requirementType: 'completed_quests',
      requirementValue: 50,
      xpReward: 400,
      isUnlocked: false,
    },
  ];

  // Get user's current rank tier based on XP
  static getCurrentRank(totalXP: number): RankTier {
    for (let i = this.RANK_TIERS.length - 1; i >= 0; i--) {
      const tier = this.RANK_TIERS[i];
      if (totalXP >= tier.minXP) {
        return tier;
      }
    }
    return this.RANK_TIERS[0];
  }

  // Get progress to next rank
  static getRankProgress(totalXP: number): { currentRank: RankTier; nextRank: RankTier | null; progress: number; xpNeeded: number } {
    const currentRank = this.getCurrentRank(totalXP);
    const currentIndex = this.RANK_TIERS.findIndex(t => t.id === currentRank.id);
    const nextRank = currentIndex < this.RANK_TIERS.length - 1 ? this.RANK_TIERS[currentIndex + 1] : null;

    if (!nextRank) {
      return {
        currentRank,
        nextRank: null,
        progress: 100,
        xpNeeded: 0,
      };
    }

    const xpInCurrentTier = totalXP - currentRank.minXP;
    const xpNeededForNextTier = nextRank.minXP - currentRank.minXP;
    const progress = Math.min(100, (xpInCurrentTier / xpNeededForNextTier) * 100);
    const xpNeeded = nextRank.minXP - totalXP;

    return {
      currentRank,
      nextRank,
      progress,
      xpNeeded,
    };
  }

  // Get user's achievements with unlock status
  static async getUserAchievements(userId: string): Promise<{ data: Achievement[]; error: any }> {
    try {
      // Get user stats
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('id', userId)
        .single();

      if (statsError || !userStats) {
        return { data: [], error: statsError };
      }

      // Get completed quests count
      const { count: completedQuests, error: questsError } = await supabase
        .from('user_quests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed');

      // Get unlocked achievements from database (if table exists)
      const { data: unlockedAchievements, error: unlockedError } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', userId);

      const unlockedIds = new Set((unlockedAchievements || []).map(ua => ua.achievement_id));

      // Calculate unlock status for each achievement
      const achievementsWithStatus = this.ACHIEVEMENTS.map(achievement => {
        let isUnlocked = unlockedIds.has(achievement.id);
        let unlockedAt = unlockedAchievements?.find(ua => ua.achievement_id === achievement.id)?.unlocked_at;

        // Calculate unlock status based on user stats
        if (!isUnlocked) {
          switch (achievement.requirementType) {
            case 'total_workouts':
              isUnlocked = (userStats.total_days_active || 0) >= achievement.requirementValue;
              break;
            case 'day_streak':
              isUnlocked = (userStats.day_streak || 0) >= achievement.requirementValue;
              break;
            case 'total_xp':
              isUnlocked = (userStats.total_xp || 0) >= achievement.requirementValue;
              break;
            case 'completed_quests':
              isUnlocked = (completedQuests || 0) >= achievement.requirementValue;
              break;
          }
        }

        return {
          ...achievement,
          isUnlocked,
          unlockedAt,
        };
      });

      return { data: achievementsWithStatus, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  // Unlock achievement
  static async unlockAchievement(userId: string, achievementId: string): Promise<{ error: any }> {
    try {
      // Check if already unlocked
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .single();

      if (existing) {
        return { error: null }; // Already unlocked
      }

      // Get achievement details
      const achievement = this.ACHIEVEMENTS.find(a => a.id === achievementId);
      if (!achievement) {
        return { error: 'Achievement not found' };
      }

      // Insert unlock record
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievementId,
          unlocked_at: new Date().toISOString(),
        });

      // Grant XP reward
      if (achievement.xpReward > 0) {
        const { StatsService } = await import('./statsService');
        await StatsService.addXP(userId, achievement.xpReward);
      }

      return { error };
    } catch (error) {
      return { error };
    }
  }

  // Get user milestones
  static async getUserMilestones(userId: string): Promise<{ data: Milestone[]; error: any }> {
    try {
      // Get user stats
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('id', userId)
        .single();

      if (statsError || !userStats) {
        return { data: [], error: statsError };
      }

      // Define milestones
      const milestones: Milestone[] = [
        {
          id: 'first_login',
          name: 'First Login',
          description: 'Logged in for the first time',
          achieved: true,
          achievedAt: userStats.last_active_date || undefined,
          icon: '🚪',
        },
        {
          id: 'first_workout',
          name: 'First Workout',
          description: 'Completed your first workout',
          achieved: (userStats.total_days_active || 0) >= 1,
          achievedAt: (userStats.total_days_active || 0) >= 1 ? userStats.last_active_date : undefined,
          icon: '💪',
        },
        {
          id: 'level_5',
          name: 'Level 5',
          description: 'Reached level 5',
          achieved: (userStats.level || 0) >= 5,
          achievedAt: (userStats.level || 0) >= 5 ? userStats.last_active_date : undefined,
          icon: '⭐',
        },
        {
          id: 'level_10',
          name: 'Level 10',
          description: 'Reached level 10',
          achieved: (userStats.level || 0) >= 10,
          achievedAt: (userStats.level || 0) >= 10 ? userStats.last_active_date : undefined,
          icon: '🌟',
        },
        {
          id: 'streak_7',
          name: '7-Day Streak',
          description: 'Maintained a 7-day streak',
          achieved: (userStats.day_streak || 0) >= 7,
          achievedAt: (userStats.day_streak || 0) >= 7 ? userStats.last_active_date : undefined,
          icon: '🔥',
        },
        {
          id: 'streak_30',
          name: '30-Day Streak',
          description: 'Maintained a 30-day streak',
          achieved: (userStats.day_streak || 0) >= 30,
          achievedAt: (userStats.day_streak || 0) >= 30 ? userStats.last_active_date : undefined,
          icon: '💎',
        },
      ];

      return { data: milestones, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  // Get achievement statistics
  static async getAchievementStats(userId: string): Promise<{
    totalAchievements: number;
    unlockedAchievements: number;
    completionRate: number;
    totalXPRewards: number;
    error: any;
  }> {
    try {
      const { data: achievements, error } = await this.getUserAchievements(userId);
      if (error) {
        return { totalAchievements: 0, unlockedAchievements: 0, completionRate: 0, totalXPRewards: 0, error };
      }

      const totalAchievements = achievements.length;
      const unlockedAchievements = achievements.filter(a => a.isUnlocked).length;
      const completionRate = totalAchievements > 0 ? (unlockedAchievements / totalAchievements) * 100 : 0;
      const totalXPRewards = achievements.filter(a => a.isUnlocked).reduce((sum, a) => sum + a.xpReward, 0);

      return {
        totalAchievements,
        unlockedAchievements,
        completionRate: Math.round(completionRate),
        totalXPRewards,
        error: null,
      };
    } catch (error) {
      return { totalAchievements: 0, unlockedAchievements: 0, completionRate: 0, totalXPRewards: 0, error };
    }
  }
}
