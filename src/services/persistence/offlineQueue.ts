import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import type { QueuedMutation, MutationOperation } from './types';
import { withRetry } from './retry';

const QUEUE_KEY = '@systemfit/offline_queue';

export async function getQueue(): Promise<QueuedMutation[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueuedMutation[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueueMutation(
  item: Omit<QueuedMutation, 'id' | 'createdAt' | 'retryCount'>,
): Promise<void> {
  const queue = await getQueue();
  queue.push({
    ...item,
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
    retryCount: 0,
  });
  await saveQueue(queue);
}

async function executeMutation(item: QueuedMutation): Promise<{ error: Error | null }> {
  try {
    await withRetry(async () => {
      const { table, operation, payload, filters, onConflict } = item;
      let query: any;

      switch (operation) {
        case 'insert':
          query = supabase.from(table).insert(payload);
          break;
        case 'update': {
          query = supabase.from(table).update(payload);
          if (filters) {
            Object.entries(filters).forEach(([k, v]) => {
              query = query.eq(k, v);
            });
          }
          break;
        }
        case 'delete': {
          query = supabase.from(table).delete();
          if (filters) {
            Object.entries(filters).forEach(([k, v]) => {
              query = query.eq(k, v);
            });
          }
          break;
        }
        case 'upsert':
          query = supabase.from(table).upsert(payload, onConflict ? { onConflict } : undefined);
          break;
        default:
          throw new Error(`Unknown operation: ${operation as MutationOperation}`);
      }

      const { error } = await query;
      if (error) throw error;
    });
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e : new Error(String(e)) };
  }
}

export async function flushQueue(): Promise<{ processed: number; failed: number }> {
  const queue = await getQueue();
  if (queue.length === 0) return { processed: 0, failed: 0 };

  const remaining: QueuedMutation[] = [];
  let processed = 0;
  let failed = 0;

  for (const item of queue) {
    const { error } = await executeMutation(item);
    if (error) {
      failed++;
      if (item.retryCount < 5) {
        remaining.push({ ...item, retryCount: item.retryCount + 1 });
      }
    } else {
      processed++;
    }
  }

  await saveQueue(remaining);
  return { processed, failed };
}

export async function getQueueLength(): Promise<number> {
  return (await getQueue()).length;
}
