import { supabase } from './supabase';
import { DailyProgressService } from './statsService';
import { persistedFetch, persistedMutate } from './persistence/persistenceService';
import { CacheKeys } from './persistence/cacheKeys';

export interface SleepLog {
  id: string;
  user_id: string;
  log_date: string;
  bedtime: string;
  wake_time: string;
  duration_hours: number;
  quality: number;
  notes: string | null;
  created_at: string;
}

export interface SleepStats {
  avgDuration: number;
  avgQuality: number;
  nightsLogged: number;
  goalHours: number;
}

const DEFAULT_GOAL_HOURS = 8;

/** Parse HH:MM to minutes from midnight */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

/** Duration in hours when wake may be the next calendar day */
export function calculateSleepHours(bedtime: string, wakeTime: string): number {
  let bed = toMinutes(bedtime);
  let wake = toMinutes(wakeTime);
  if (wake <= bed) wake += 24 * 60;
  return Math.round((wake - bed) / 60 * 10) / 10;
}

export class SleepService {
  static async getSleepGoal(userId: string): Promise<number> {
    const { data } = await DailyProgressService.getTodayProgress(userId);
    return data?.sleep_hours_goal ?? DEFAULT_GOAL_HOURS;
  }

  static async setSleepGoal(userId: string, hours: number): Promise<{ error: any }> {
    return DailyProgressService.updateTodayProgress(userId, {
      sleep_hours_goal: hours,
    });
  }

  static async logSleep(
    userId: string,
    payload: {
      log_date?: string;
      bedtime: string;
      wake_time: string;
      quality: number;
      notes?: string;
    },
  ): Promise<{ data: SleepLog | null; error: any }> {
    const logDate = payload.log_date ?? new Date().toISOString().split('T')[0];
    const duration = calculateSleepHours(payload.bedtime, payload.wake_time);

    const row = {
      user_id: userId,
      log_date: logDate,
      bedtime: payload.bedtime,
      wake_time: payload.wake_time,
      duration_hours: duration,
      quality: payload.quality,
      notes: payload.notes ?? null,
    };

    const result = await persistedMutate<SleepLog>({
      mutation: async () => {
        const { data, error } = await supabase
          .from('sleep_logs')
          .upsert(row, { onConflict: 'user_id,log_date' })
          .select()
          .single();
        if (error) throw error;
        return { data, error: null };
      },
      queueItem: {
        table: 'sleep_logs',
        operation: 'upsert',
        payload: row,
        onConflict: 'user_id,log_date',
      },
      invalidateKeys: [CacheKeys.sleepPrefix(userId)],
    });

    if (!result.error && result.data) {
      await DailyProgressService.updateTodayProgress(userId, {
        sleep_hours_actual: duration,
        sleep_quality: payload.quality * 2,
      });
    }

    return { data: result.data, error: result.error, queued: result.queued };
  }

  static async getLogForDate(
    userId: string,
    date: string,
  ): Promise<{ data: SleepLog | null; error: any }> {
    try {
      const result = await persistedFetch<SleepLog | null>(
        CacheKeys.sleepDay(userId, date),
        async () => {
          const { data, error } = await supabase
            .from('sleep_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('log_date', date)
            .maybeSingle();
          if (error) throw error;
          return { data: data ?? null, error: null };
        },
        { ttlMs: 2 * 60 * 1000 },
      );
      return { data: result.data, error: result.error };
    } catch (error) {
      return { data: null, error };
    }
  }

  static async getHistory(
    userId: string,
    days = 14,
  ): Promise<{ data: SleepLog[]; error: any }> {
    try {
      const start = new Date();
      start.setDate(start.getDate() - days);
      const startStr = start.toISOString().split('T')[0];

      const result = await persistedFetch<SleepLog[]>(
        CacheKeys.sleepHistory(userId, days),
        async () => {
          const { data, error } = await supabase
            .from('sleep_logs')
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

  static async deleteLog(id: string): Promise<{ error: any }> {
    const { error } = await supabase.from('sleep_logs').delete().eq('id', id);
    return { error };
  }

  static computeStats(logs: SleepLog[], goalHours: number): SleepStats {
    if (logs.length === 0) {
      return { avgDuration: 0, avgQuality: 0, nightsLogged: 0, goalHours };
    }
    const avgDuration =
      logs.reduce((s, l) => s + Number(l.duration_hours), 0) / logs.length;
    const avgQuality = logs.reduce((s, l) => s + l.quality, 0) / logs.length;
    return {
      avgDuration: Math.round(avgDuration * 10) / 10,
      avgQuality: Math.round(avgQuality * 10) / 10,
      nightsLogged: logs.length,
      goalHours,
    };
  }
}
