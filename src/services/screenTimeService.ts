import { supabase } from './supabase';
import { DailyProgressService } from './statsService';
import { persistedFetch, persistedMutate } from './persistence/persistenceService';
import { CacheKeys } from './persistence/cacheKeys';

export type ScreenTimeCategory =
  | 'social'
  | 'entertainment'
  | 'productivity'
  | 'gaming'
  | 'other';

export const SCREEN_TIME_CATEGORIES: {
  id: ScreenTimeCategory;
  label: string;
  color: string;
}[] = [
  { id: 'social', label: 'Social', color: '#AC89FF' },
  { id: 'entertainment', label: 'Entertainment', color: '#FF6B6B' },
  { id: 'productivity', label: 'Productivity', color: '#6DDDFF' },
  { id: 'gaming', label: 'Gaming', color: '#FFD93D' },
  { id: 'other', label: 'Other', color: '#00FF99' },
];

export interface ScreenTimeLog {
  id: string;
  user_id: string;
  log_date: string;
  category: ScreenTimeCategory;
  hours: number;
  notes: string | null;
  created_at: string;
}

export interface ScreenTimeDaySummary {
  date: string;
  totalHours: number;
  byCategory: Record<ScreenTimeCategory, number>;
}

export interface ScreenTimeStats {
  avgDailyHours: number;
  daysLogged: number;
  goalHours: number;
  topCategory: ScreenTimeCategory | null;
}

const DEFAULT_GOAL_HOURS = 4;

export class ScreenTimeService {
  static async getDailyLimit(userId: string): Promise<number> {
    const { data } = await DailyProgressService.getTodayProgress(userId);
    return data?.screen_time_goal_hours ?? DEFAULT_GOAL_HOURS;
  }

  static async setDailyLimit(userId: string, hours: number): Promise<{ error: any }> {
    return DailyProgressService.updateTodayProgress(userId, {
      screen_time_goal_hours: hours,
    });
  }

  static async logCategoryTime(
    userId: string,
    payload: {
      log_date?: string;
      category: ScreenTimeCategory;
      hours: number;
      notes?: string;
    },
  ): Promise<{ data: ScreenTimeLog | null; error: any }> {
    const logDate = payload.log_date ?? new Date().toISOString().split('T')[0];

    const row = {
      user_id: userId,
      log_date: logDate,
      category: payload.category,
      hours: payload.hours,
      notes: payload.notes ?? null,
    };

    const result = await persistedMutate<ScreenTimeLog>({
      mutation: async () => {
        const { data, error } = await supabase
          .from('screen_time_logs')
          .upsert(row, { onConflict: 'user_id,log_date,category' })
          .select()
          .single();
        if (error) throw error;
        return { data, error: null };
      },
      queueItem: {
        table: 'screen_time_logs',
        operation: 'upsert',
        payload: row,
        onConflict: 'user_id,log_date,category',
      },
      invalidateKeys: [CacheKeys.screenPrefix(userId)],
    });

    if (!result.error) {
      await this.syncDailyTotal(userId, logDate);
    }

    return { data: result.data, error: result.error, queued: result.queued };
  }

  static async syncDailyTotal(userId: string, date: string): Promise<void> {
    const { data: logs } = await this.getLogsForDate(userId, date);
    const total = logs.reduce((s, l) => s + Number(l.hours), 0);
    const rounded = Math.round(total * 10) / 10;

    if (date === new Date().toISOString().split('T')[0]) {
      await DailyProgressService.updateTodayProgress(userId, {
        screen_time_actual_hours: rounded,
      });
    }
  }

  static async getLogsForDate(
    userId: string,
    date: string,
  ): Promise<{ data: ScreenTimeLog[]; error: any }> {
    try {
      const result = await persistedFetch<ScreenTimeLog[]>(
        CacheKeys.screenDay(userId, date),
        async () => {
          const { data, error } = await supabase
            .from('screen_time_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('log_date', date)
            .order('category');
          if (error) throw error;
          return { data: data ?? [], error: null };
        },
        { ttlMs: 2 * 60 * 1000 },
      );
      return { data: result.data, error: result.error };
    } catch (error) {
      return { data: [], error };
    }
  }

  static async getHistory(
    userId: string,
    days = 7,
  ): Promise<{ data: ScreenTimeLog[]; error: any }> {
    try {
      const start = new Date();
      start.setDate(start.getDate() - days);
      const startStr = start.toISOString().split('T')[0];

      const result = await persistedFetch<ScreenTimeLog[]>(
        CacheKeys.screenHistory(userId, days),
        async () => {
          const { data, error } = await supabase
            .from('screen_time_logs')
            .select('*')
            .eq('user_id', userId)
            .gte('log_date', startStr)
            .order('log_date', { ascending: false });
          if (error) throw error;
          return { data: data ?? [], error: null };
        },
      );
      return { data: result.data, error: result.error };
    } catch (error) {
      return { data: [], error };
    }
  }

  static async addFocusTime(userId: string, minutes: number): Promise<{ error: any }> {
    const { data: progress } = await DailyProgressService.getTodayProgress(userId);
    const addedHours = minutes / 60;
    const current = progress?.focus_time_hours ?? 0;
    return DailyProgressService.updateTodayProgress(userId, {
      focus_time_hours: Math.round((current + addedHours) * 10) / 10,
    });
  }

  static summarizeDay(logs: ScreenTimeLog[], date: string): ScreenTimeDaySummary {
    const byCategory: Record<ScreenTimeCategory, number> = {
      social: 0,
      entertainment: 0,
      productivity: 0,
      gaming: 0,
      other: 0,
    };
    logs
      .filter(l => l.log_date === date)
      .forEach(l => {
        byCategory[l.category] = Number(l.hours);
      });
    const totalHours = Object.values(byCategory).reduce((s, h) => s + h, 0);
    return { date, totalHours: Math.round(totalHours * 10) / 10, byCategory };
  }

  static buildWeeklySummaries(logs: ScreenTimeLog[], days = 7): ScreenTimeDaySummary[] {
    const summaries: ScreenTimeDaySummary[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      summaries.push(this.summarizeDay(logs, dateStr));
    }
    return summaries;
  }

  static computeStats(logs: ScreenTimeLog[], goalHours: number): ScreenTimeStats {
    const summaries = this.buildWeeklySummaries(logs, 7);
    const daysWithData = summaries.filter(s => s.totalHours > 0);
    const avgDailyHours =
      daysWithData.length > 0
        ? daysWithData.reduce((s, d) => s + d.totalHours, 0) / daysWithData.length
        : 0;

    const categoryTotals: Record<ScreenTimeCategory, number> = {
      social: 0,
      entertainment: 0,
      productivity: 0,
      gaming: 0,
      other: 0,
    };
    logs.forEach(l => {
      categoryTotals[l.category] += Number(l.hours);
    });
    const topCategory = (Object.entries(categoryTotals).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0] ?? null) as ScreenTimeCategory | null;

    return {
      avgDailyHours: Math.round(avgDailyHours * 10) / 10,
      daysLogged: daysWithData.length,
      goalHours,
      topCategory: topCategory && categoryTotals[topCategory] > 0 ? topCategory : null,
    };
  }
}
