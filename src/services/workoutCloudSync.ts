import { supabase } from './supabase';
import type { CustomWorkoutPlan, WorkoutSession } from './workoutPlannerService';
import { persistedFetch } from './persistence/persistenceService';
import { CacheKeys } from './persistence/cacheKeys';

/** Pull user's workout plans from Supabase into local array */
export async function fetchCloudWorkouts(userId: string): Promise<CustomWorkoutPlan[]> {
  try {
    const result = await persistedFetch<CustomWorkoutPlan[]>(
      CacheKeys.workouts(userId),
      async () => {
        const { data, error } = await supabase
          .from('custom_workout_plans')
          .select('plan')
          .eq('user_id', userId);
        if (error) throw error;
        const plans = (data ?? []).map(row => row.plan as CustomWorkoutPlan);
        return { data: plans, error: null };
      },
      { ttlMs: 3 * 60 * 1000 },
    );
    return result.data;
  } catch {
    return [];
  }
}

/** Upsert a single workout plan to Supabase (non-blocking) */
export async function pushWorkoutToCloud(workout: CustomWorkoutPlan): Promise<void> {
  try {
    await supabase.from('custom_workout_plans').upsert({
      id: workout.id,
      user_id: workout.userId,
      plan: workout,
      updated_at: workout.updatedAt,
    });
  } catch (e) {
    console.warn('[WorkoutCloudSync] push plan failed:', e);
  }
}

/** Remove workout from cloud */
export async function deleteWorkoutFromCloud(workoutId: string): Promise<void> {
  try {
    await supabase.from('custom_workout_plans').delete().eq('id', workoutId);
  } catch (e) {
    console.warn('[WorkoutCloudSync] delete plan failed:', e);
  }
}

export async function fetchCloudSessions(userId: string): Promise<WorkoutSession[]> {
  try {
    const result = await persistedFetch<WorkoutSession[]>(
      CacheKeys.workoutSessions(userId),
      async () => {
        const { data, error } = await supabase
          .from('workout_session_logs')
          .select('session')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        const sessions = (data ?? []).map(row => row.session as WorkoutSession);
        return { data: sessions, error: null };
      },
    );
    return result.data;
  } catch {
    return [];
  }
}

export async function pushSessionToCloud(session: WorkoutSession, userId: string): Promise<void> {
  try {
    await supabase.from('workout_session_logs').upsert({
      id: session.id,
      user_id: userId,
      session,
    });
  } catch (e) {
    console.warn('[WorkoutCloudSync] push session failed:', e);
  }
}

/** Merge cloud + local workouts by id (newer updatedAt wins) */
export function mergeWorkouts(
  local: CustomWorkoutPlan[],
  cloud: CustomWorkoutPlan[],
): CustomWorkoutPlan[] {
  const map = new Map<string, CustomWorkoutPlan>();
  [...local, ...cloud].forEach(w => {
    const existing = map.get(w.id);
    if (!existing || new Date(w.updatedAt) > new Date(existing.updatedAt)) {
      map.set(w.id, w);
    }
  });
  return Array.from(map.values());
}
