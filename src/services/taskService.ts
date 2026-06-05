import { supabase } from './supabase';
import { persistedFetch, persistedMutate, invalidateCache } from './persistence/persistenceService';
import { CacheKeys } from './persistence/cacheKeys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatsService } from './statsService';

export type TaskDifficulty = 'easy' | 'medium' | 'hard';
export type TaskType = 'daily' | 'deadline';

export interface DailyTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  difficulty: TaskDifficulty;
  xp_reward: number;
  completed: boolean;
  completed_at: string | null;
  task_date: string;
  deadline_date: string | null;
  task_type: TaskType;
  created_at: string;
  updated_at: string;
}

export const XP_REWARDS = {
  easy: 10,
  medium: 25,
  hard: 50,
};

export const XP_PENALTIES = {
  easy: 5,
  medium: 12,
  hard: 25,
};

const PENALTY_LAST_CHECK_PREFIX = 'daily_tasks_penalty_last_check';

function taskDateKey(userId: string, date: string) {
  return CacheKeys.tasks(userId, date);
}

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

export class TaskService {
  static async getUserTasks(
    userId: string,
    date: string = new Date().toISOString().split('T')[0],
  ): Promise<{ data: DailyTask[]; error: any; fromCache?: boolean }> {
    try {
      const result = await persistedFetch<DailyTask[]>(
        taskDateKey(userId, date),
        async () => {
          const { data, error } = await supabase
            .from('daily_tasks')
            .select('*')
            .eq('user_id', userId)
            .eq('task_date', date)
            .order('created_at', { ascending: false });
          if (error) throw error;
          return { data: data || [], error: null };
        },
      );
      return { data: result.data, error: result.error, fromCache: result.fromCache };
    } catch (error) {
      return { data: [], error };
    }
  }

  static async getDeadlineTasks(
    userId: string,
  ): Promise<{ data: DailyTask[]; error: any; fromCache?: boolean }> {
    try {
      const cacheKey = CacheKeys.tasks(userId, 'deadline');
      const result = await persistedFetch<DailyTask[]>(
        cacheKey,
        async () => {
          const { data, error } = await supabase
            .from('daily_tasks')
            .select('*')
            .eq('user_id', userId)
            .eq('task_type', 'deadline')
            .order('deadline_date', { ascending: true });
          if (error) throw error;
          return { data: data || [], error: null };
        },
      );
      return { data: result.data, error: result.error, fromCache: result.fromCache };
    } catch (error) {
      return { data: [], error };
    }
  }

  static async getCompletedTasksCount(
    userId: string,
    date: string = new Date().toISOString().split('T')[0],
  ): Promise<{ count: number; error: any }> {
    const { data } = await this.getUserTasks(userId, date);
    return { count: data.filter(t => t.completed).length, error: null };
  }

  static async getTotalXPEarned(
    userId: string,
    date: string = new Date().toISOString().split('T')[0],
  ): Promise<{ totalXP: number; error: any }> {
    const { data } = await this.getUserTasks(userId, date);
    const totalXP = data.filter(t => t.completed).reduce((sum, t) => sum + t.xp_reward, 0);
    return { totalXP, error: null };
  }

  static async ensureDefaultLoginTask(
    userId: string,
    date: string = new Date().toISOString().split('T')[0],
  ): Promise<{ data: DailyTask | null; error: any }> {
    try {
      const { data: tasks, error } = await this.getUserTasks(userId, date);
      if (error) {
        return { data: null, error };
      }

      const hasDefaultTask = tasks.some(task => task.title.trim().toLowerCase() === 'logging in');
      if (hasDefaultTask) {
        return { data: null, error: null };
      }

      const { data, error: createError } = await this.createTask(userId, {
        title: 'Logging in',
        description: 'Open SystemFit today to keep your streak alive.',
        difficulty: 'easy',
        xp_reward: XP_REWARDS.easy,
        task_date: date,
        deadline_date: null,
        task_type: 'daily',
      });

      return { data, error: createError };
    } catch (error) {
      return { data: null, error };
    }
  }

  static async processOverdueTaskPenalties(
    userId: string,
  ): Promise<{ totalPenalty: number; penalizedDates: string[]; error: any }> {
    try {
      const today = toDateString(new Date());
      const storageKey = `${PENALTY_LAST_CHECK_PREFIX}:${userId}`;
      const lastCheckedDate = await AsyncStorage.getItem(storageKey);

      if (!lastCheckedDate) {
        await AsyncStorage.setItem(storageKey, today);
        return { totalPenalty: 0, penalizedDates: [], error: null };
      }

      if (lastCheckedDate >= today) {
        return { totalPenalty: 0, penalizedDates: [], error: null };
      }

      const lastDateToProcess = addDays(today, -1);
      let processDate = addDays(lastCheckedDate, 1);
      let totalPenalty = 0;
      const penalizedDates: string[] = [];

      while (processDate <= lastDateToProcess) {
        const { penaltyApplied, error } = await this.applyIncompleteTaskPenaltyForDate(userId, processDate);
        if (error) {
          return { totalPenalty, penalizedDates, error };
        }

        if (penaltyApplied > 0) {
          totalPenalty += penaltyApplied;
          penalizedDates.push(processDate);
        }

        processDate = addDays(processDate, 1);
      }

      await AsyncStorage.setItem(storageKey, today);
      return { totalPenalty, penalizedDates, error: null };
    } catch (error) {
      return { totalPenalty: 0, penalizedDates: [], error };
    }
  }

  static async applyIncompleteTaskPenaltyForDate(
    userId: string,
    date: string,
  ): Promise<{ penaltyApplied: number; tasksPenalized: number; error: any }> {
    try {
      const { data: tasks, error } = await this.getUserTasks(userId, date);
      if (error) {
        return { penaltyApplied: 0, tasksPenalized: 0, error };
      }

      const incompleteTasks = tasks.filter(task => !task.completed);
      if (incompleteTasks.length === 0) {
        return { penaltyApplied: 0, tasksPenalized: 0, error: null };
      }

      const penaltyApplied = incompleteTasks.reduce(
        (total, task) => total + XP_PENALTIES[task.difficulty],
        0,
      );

      const { error: xpError } = await StatsService.subtractXP(userId, penaltyApplied);
      if (xpError) {
        return { penaltyApplied: 0, tasksPenalized: incompleteTasks.length, error: xpError };
      }

      return { penaltyApplied, tasksPenalized: incompleteTasks.length, error: null };
    } catch (error) {
      return { penaltyApplied: 0, tasksPenalized: 0, error };
    }
  }

  static async createTask(
    userId: string,
    task: Omit<DailyTask, 'id' | 'user_id' | 'completed' | 'completed_at' | 'created_at' | 'updated_at'>,
  ): Promise<{ data: DailyTask | null; error: any; queued?: boolean }> {
    const payload = { user_id: userId, ...task, completed: false };
    const result = await persistedMutate<DailyTask>({
      mutation: async () => {
        const { data, error } = await supabase.from('daily_tasks').insert(payload).select().single();
        if (error) throw error;
        return { data, error: null };
      },
      queueItem: { table: 'daily_tasks', operation: 'insert', payload },
      invalidateKeys: [CacheKeys.tasksPrefix(userId)],
    });
    return { data: result.data, error: result.error, queued: result.queued };
  }

  static async updateTask(
    taskId: string,
    updates: Partial<Omit<DailyTask, 'id' | 'user_id' | 'created_at'>>,
    userId?: string,
  ): Promise<{ data: DailyTask | null; error: any; queued?: boolean }> {
    const result = await persistedMutate<DailyTask>({
      mutation: async () => {
        const { data, error } = await supabase
          .from('daily_tasks')
          .update(updates)
          .eq('id', taskId)
          .select()
          .single();
        if (error) throw error;
        return { data, error: null };
      },
      queueItem: {
        table: 'daily_tasks',
        operation: 'update',
        payload: updates as Record<string, unknown>,
        filters: { id: taskId },
      },
      invalidateKeys: userId ? [CacheKeys.tasksPrefix(userId)] : undefined,
    });
    return { data: result.data, error: result.error, queued: result.queued };
  }

  static async completeTask(
    taskId: string,
    userId?: string,
  ): Promise<{ data: DailyTask | null; error: any; queued?: boolean }> {
    return this.updateTask(
      taskId,
      { completed: true, completed_at: new Date().toISOString() },
      userId,
    );
  }

  static async uncompleteTask(
    taskId: string,
    userId?: string,
  ): Promise<{ data: DailyTask | null; error: any; queued?: boolean }> {
    return this.updateTask(taskId, { completed: false, completed_at: null }, userId);
  }

  static async deleteTask(
    taskId: string,
    userId?: string,
  ): Promise<{ error: any; queued?: boolean }> {
    const result = await persistedMutate<null>({
      mutation: async () => {
        const { error } = await supabase.from('daily_tasks').delete().eq('id', taskId);
        if (error) throw error;
        return { data: null, error: null };
      },
      queueItem: {
        table: 'daily_tasks',
        operation: 'delete',
        payload: {},
        filters: { id: taskId },
      },
      invalidateKeys: userId ? [CacheKeys.tasksPrefix(userId)] : undefined,
    });
    return { error: result.error, queued: result.queued };
  }

  static async deleteTasksForDate(userId: string, date: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('user_id', userId)
        .eq('task_date', date);
      if (!error) {
        await invalidateCache(CacheKeys.tasksPrefix(userId));
      }
      return { error };
    } catch (error) {
      return { error };
    }
  }
}
