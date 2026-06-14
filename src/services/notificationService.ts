import { supabase } from './supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: 'workout_reminder' | 'quest_complete' | 'achievement_unlocked' | 'streak_milestone' | 'level_up' | 'system';
  title: string;
  body: string;
  data?: any;
  read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  workout_reminders: boolean;
  quest_notifications: boolean;
  achievement_notifications: boolean;
  streak_alerts: boolean;
  level_up_notifications: boolean;
  system_notifications: boolean;
  reminder_time: string; // HH:MM format
  quiet_hours_start: string; // HH:MM format
  quiet_hours_end: string; // HH:MM format
}

export class NotificationService {
  // Get user notifications
  static async getUserNotifications(
    userId: string,
    limit: number = 20
  ): Promise<{ data: Notification[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { Ascending: false })
        .limit(limit);

      return { data: data || [], error };
    } catch (error) {
      return { data: [], error };
    }
  }

  // Get unread notifications count
  static async getUnreadCount(userId: string): Promise<{ count: number; error: any }> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      return { count: count || 0, error };
    } catch (error) {
      return { count: 0, error };
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  // Create notification
  static async createNotification(
    userId: string,
    notification: Omit<Notification, 'id' | 'user_id' | 'read' | 'created_at'>
  ): Promise<{ data: Notification | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          ...notification,
          read: false,
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Get notification preferences
  static async getNotificationPreferences(
    userId: string
  ): Promise<{ data: NotificationPreferences | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        // Return default preferences if none exist
        const defaultPrefs: NotificationPreferences = {
          user_id: userId,
          workout_reminders: true,
          quest_notifications: true,
          achievement_notifications: true,
          streak_alerts: true,
          level_up_notifications: true,
          system_notifications: true,
          reminder_time: '09:00',
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
        };
        return { data: defaultPrefs, error: null };
      }

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Update notification preferences
  static async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
        });

      return { error };
    } catch (error) {
      return { error };
    }
  }

  // Send workout reminder notification
  static async sendWorkoutReminder(
    userId: string,
    workoutName: string,
    scheduledTime: string
  ): Promise<{ error: any }> {
    try {
      const prefs = await this.getNotificationPreferences(userId);
      if (!prefs.data?.workout_reminders) {
        return { error: null }; // User has disabled workout reminders
      }

      await this.createNotification(userId, {
        type: 'workout_reminder',
        title: 'Workout Reminder',
        body: `Time for your workout: ${workoutName} at ${scheduledTime}`,
        data: { workoutName, scheduledTime },
      });

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  // Send quest completion notification
  static async sendQuestCompleteNotification(
    userId: string,
    questTitle: string,
    xpReward: number
  ): Promise<{ error: any }> {
    try {
      const prefs = await this.getNotificationPreferences(userId);
      if (!prefs.data?.quest_notifications) {
        return { error: null };
      }

      await this.createNotification(userId, {
        type: 'quest_complete',
        title: 'Quest Complete!',
        body: `You completed "${questTitle}" and earned ${xpReward} XP`,
        data: { questTitle, xpReward },
      });

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  // Send achievement unlocked notification
  static async sendAchievementNotification(
    userId: string,
    achievementName: string,
    xpReward: number
  ): Promise<{ error: any }> {
    try {
      const prefs = await this.getNotificationPreferences(userId);
      if (!prefs.data?.achievement_notifications) {
        return { error: null };
      }

      await this.createNotification(userId, {
        type: 'achievement_unlocked',
        title: 'Achievement Unlocked!',
        body: `You unlocked "${achievementName}" and earned ${xpReward} XP`,
        data: { achievementName, xpReward },
      });

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  // Send streak milestone notification
  static async sendStreakNotification(
    userId: string,
    streakDays: number
  ): Promise<{ error: any }> {
    try {
      const prefs = await this.getNotificationPreferences(userId);
      if (!prefs.data?.streak_alerts) {
        return { error: null };
      }

      await this.createNotification(userId, {
        type: 'streak_milestone',
        title: `${streakDays} Day Streak!`,
        body: `Amazing! You've maintained a ${streakDays}-day streak`,
        data: { streakDays },
      });

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  // Send level up notification
  static async sendLevelUpNotification(
    userId: string,
    newLevel: number
  ): Promise<{ error: any }> {
    try {
      const prefs = await this.getNotificationPreferences(userId);
      if (!prefs.data?.level_up_notifications) {
        return { error: null };
      }

      await this.createNotification(userId, {
        type: 'level_up',
        title: 'Level Up!',
        body: `Congratulations! You reached level ${newLevel}`,
        data: { newLevel },
      });

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  // Check if current time is in quiet hours
  static isInQuietHours(prefs: NotificationPreferences): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHours, startMinutes] = prefs.quiet_hours_start.split(':').map(Number);
    const [endHours, endMinutes] = prefs.quiet_hours_end.split(':').map(Number);
    
    const startTime = startHours * 60 + startMinutes;
    const endTime = endHours * 60 + endMinutes;
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }
    
    return currentTime >= startTime && currentTime < endTime;
  }

  // Clean up old notifications (older than 30 days)
  static async cleanupOldNotifications(userId: string): Promise<{ error: any }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', thirtyDaysAgoStr);

      return { error };
    } catch (error) {
      return { error };
    }
  }
}
