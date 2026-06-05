import { supabase } from './supabase';

export interface ScheduledWorkout {
  id: string;
  user_id: string;
  workout_id: string;
  workout_name: string;
  scheduled_date: string;
  scheduled_time: string;
  duration: number;
  completed: boolean;
  reminder_sent: boolean;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  type: 'workout' | 'water' | 'sleep' | 'meal' | 'quest';
  title: string;
  description: string;
  scheduled_time: string;
  repeat_pattern: 'none' | 'daily' | 'weekly' | 'monthly';
  days_of_week?: number[];
  enabled: boolean;
  last_triggered: string | null;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  type: 'workout' | 'reminder' | 'milestone';
  color: string;
  completed: boolean;
}

export class ScheduleService {
  // Get scheduled workouts for a date range
  static async getScheduledWorkouts(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{ data: ScheduledWorkout[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('scheduled_workouts')
        .select('*')
        .eq('user_id', userId)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      return { data: data || [], error };
    } catch (error) {
      return { data: [], error };
    }
  }

  // Schedule a workout
  static async scheduleWorkout(
    userId: string,
    workoutId: string,
    workoutName: string,
    scheduledDate: string,
    scheduledTime: string,
    duration: number
  ): Promise<{ data: ScheduledWorkout | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('scheduled_workouts')
        .insert({
          user_id: userId,
          workout_id: workoutId,
          workout_name: workoutName,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          duration,
          completed: false,
          reminder_sent: false,
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Update scheduled workout
  static async updateScheduledWorkout(
    scheduledWorkoutId: string,
    updates: Partial<ScheduledWorkout>
  ): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('scheduled_workouts')
        .update(updates)
        .eq('id', scheduledWorkoutId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  // Mark workout as completed
  static async completeWorkout(scheduledWorkoutId: string): Promise<{ error: any }> {
    return this.updateScheduledWorkout(scheduledWorkoutId, {
      completed: true,
    });
  }

  // Delete scheduled workout
  static async deleteScheduledWorkout(scheduledWorkoutId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('scheduled_workouts')
        .delete()
        .eq('id', scheduledWorkoutId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  // Get reminders for user
  static async getReminders(userId: string): Promise<{ data: Reminder[]; error: any }> {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_time', { ascending: true });

      return { data: data || [], error };
    } catch (error) {
      return { data: [], error };
    }
  }

  // Create reminder
  static async createReminder(
    userId: string,
    reminder: Omit<Reminder, 'id' | 'user_id' | 'last_triggered' | 'created_at'>
  ): Promise<{ data: Reminder | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .insert({
          user_id: userId,
          ...reminder,
          last_triggered: null,
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Update reminder
  static async updateReminder(
    reminderId: string,
    updates: Partial<Reminder>
  ): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('reminders')
        .update(updates)
        .eq('id', reminderId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  // Delete reminder
  static async deleteReminder(reminderId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminderId);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  // Get calendar events for a date range
  static async getCalendarEvents(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ data: CalendarEvent[]; error: any }> {
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Get scheduled workouts
      const { data: workouts, error: workoutError } = await this.getScheduledWorkouts(
        userId,
        startDateStr,
        endDateStr
      );

      if (workoutError) {
        return { data: [], error: workoutError };
      }

      // Get reminders
      const { data: reminders, error: reminderError } = await this.getReminders(userId);

      if (reminderError) {
        return { data: [], error: reminderError };
      }

      // Convert to calendar events
      const events: CalendarEvent[] = [];

      // Add workout events
      (workouts || []).forEach(workout => {
        const [hours, minutes] = workout.scheduled_time.split(':');
        const start = new Date(workout.scheduled_date);
        start.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + workout.duration);

        events.push({
          id: workout.id,
          title: workout.workout_name,
          description: `Scheduled workout - ${workout.duration} min`,
          start,
          end,
          type: 'workout',
          color: '#6dddff',
          completed: workout.completed,
        });
      });

      // Add reminder events
      (reminders || []).forEach(reminder => {
        if (!reminder.enabled) return;

        const [hours, minutes] = reminder.scheduled_time.split(':');
        const start = new Date();
        start.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 30);

        events.push({
          id: reminder.id,
          title: reminder.title,
          description: reminder.description,
          start,
          end,
          type: 'reminder',
          color: '#ac89ff',
          completed: false,
        });
      });

      return { data: events, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }

  // Get upcoming workouts (next 7 days)
  static async getUpcomingWorkouts(userId: string): Promise<{ data: ScheduledWorkout[]; error: any }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('scheduled_workouts')
        .select('*')
        .eq('user_id', userId)
        .gte('scheduled_date', today)
        .lte('scheduled_date', nextWeekStr)
        .eq('completed', false)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true })
        .limit(10);

      return { data: data || [], error };
    } catch (error) {
      return { data: [], error };
    }
  }

  // Get workout completion rate for date range
  static async getCompletionRate(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{ rate: number; error: any }> {
    try {
      const { data, error } = await supabase
        .from('scheduled_workouts')
        .select('completed')
        .eq('user_id', userId)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate);

      if (error) {
        return { rate: 0, error };
      }

      const total = data?.length || 0;
      const completed = data?.filter(w => w.completed).length || 0;
      const rate = total > 0 ? (completed / total) * 100 : 0;

      return { rate, error: null };
    } catch (error) {
      return { rate: 0, error };
    }
  }

  // Auto-schedule workouts based on user preferences
  static async autoScheduleWorkouts(
    userId: string,
    workoutId: string,
    workoutName: string,
    duration: number,
    frequency: 'daily' | 'weekly' | 'biweekly',
    preferredTime: string,
    startDate: string,
    endDate?: string
  ): Promise<{ data: ScheduledWorkout[]; error: any }> {
    try {
      const scheduledWorkouts: ScheduledWorkout[] = [];
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date(start);
      end.setMonth(end.getMonth() + 1); // Default to 1 month if no end date

      let currentDate = new Date(start);

      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        const { data, error } = await this.scheduleWorkout(
          userId,
          workoutId,
          workoutName,
          dateStr,
          preferredTime,
          duration
        );

        if (!error && data) {
          scheduledWorkouts.push(data);
        }

        // Move to next date based on frequency
        switch (frequency) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'biweekly':
            currentDate.setDate(currentDate.getDate() + 14);
            break;
        }
      }

      return { data: scheduledWorkouts, error: null };
    } catch (error) {
      return { data: [], error };
    }
  }
}
