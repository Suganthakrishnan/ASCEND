import { AppState } from 'react-native';
import { supabase } from '../supabase';
import { cacheKey, getValidCache, getStaleCache, setCached, invalidateCache } from './cache';
import { withRetry, isNetworkError } from './retry';
import { enqueueMutation, flushQueue, getQueueLength } from './offlineQueue';
import type {
  PersistFetchResult,
  PersistMutateResult,
  QueuedMutation,
  SyncStatus,
} from './types';

export { cacheKey, invalidateCache } from './cache';
export type { QueuedMutation, SyncStatus } from './types';

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

let syncStatus: SyncStatus = 'idle';
let pendingQueueCount = 0;
let lastSyncAt: number | null = null;
let lastSyncError: string | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

export function subscribePersistence(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPersistenceState() {
  return { syncStatus, pendingQueueCount, lastSyncAt, lastSyncError };
}

async function refreshQueueCount() {
  pendingQueueCount = await getQueueLength();
  notifyListeners();
}

/** Probe connectivity with a lightweight Supabase request */
export async function checkIsOnline(): Promise<boolean> {
  try {
    await withRetry(
      async () => {
        const { error } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
        if (error) throw error;
      },
      { retries: 1, delayMs: 200 },
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch with local cache + retry. Returns stale cache on network failure.
 */
export async function persistedFetch<T>(
  key: string,
  fetcher: () => Promise<{ data: T; error: unknown }>,
  options?: { ttlMs?: number; forceRefresh?: boolean },
): Promise<PersistFetchResult<T>> {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;

  if (!options?.forceRefresh) {
    const cached = await getValidCache<T>(key);
    if (cached !== null) {
      return { data: cached, error: null, fromCache: true };
    }
  }

  try {
    const { data, error } = await withRetry(fetcher);
    if (error) throw error;
    await setCached(key, data, ttlMs);
    return { data, error: null, fromCache: false };
  } catch (error) {
    const stale = (await getValidCache<T>(key)) ?? (await getStaleCache<T>(key));
    if (stale !== null) {
      return { data: stale, error: error instanceof Error ? error : new Error(String(error)), fromCache: true };
    }
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Run a mutation with retry; queue for offline sync if network fails.
 */
export async function persistedMutate<T>(options: {
  mutation: () => Promise<{ data: T | null; error: unknown }>;
  queueItem?: Omit<QueuedMutation, 'id' | 'createdAt' | 'retryCount'>;
  invalidateKeys?: string[];
}): Promise<PersistMutateResult<T>> {
  try {
    const { data, error } = await withRetry(options.mutation);
    if (error) throw error;

    if (options.invalidateKeys) {
      await Promise.all(options.invalidateKeys.map(k => invalidateCache(k)));
    }

    return { data, error: null, queued: false };
  } catch (error) {
    console.log('persistedMutate caught error:', error);
    console.log('Error type:', typeof error);
    console.log('Error keys:', error ? Object.keys(error) : 'null');
    console.log('Error message:', (error as any)?.message);
    console.log('Error details:', (error as any)?.details);
    
    if (options.queueItem && isNetworkError(error)) {
      await enqueueMutation(options.queueItem);
      await refreshQueueCount();
      syncStatus = 'offline';

      if (options.invalidateKeys) {
        await Promise.all(options.invalidateKeys.map(k => invalidateCache(k)));
      }

      notifyListeners();
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
        queued: true,
      };
    }

    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      queued: false,
    };
  }
}

/** Flush offline queue and refresh sync state */
export async function syncPendingChanges(): Promise<{ processed: number; failed: number }> {
  syncStatus = 'syncing';
  lastSyncError = null;
  notifyListeners();

  const online = await checkIsOnline();
  if (!online) {
    syncStatus = 'offline';
    notifyListeners();
    return { processed: 0, failed: 0 };
  }

  const result = await flushQueue();
  await refreshQueueCount();
  lastSyncAt = Date.now();
  syncStatus = result.failed > 0 ? 'error' : 'idle';
  if (result.failed > 0) lastSyncError = `${result.failed} change(s) could not sync`;
  notifyListeners();
  return result;
}

let appStateSubscribed = false;

export function initPersistenceSync(): void {
  if (appStateSubscribed) return;
  appStateSubscribed = true;

  AppState.addEventListener('change', state => {
    if (state === 'active') {
      void syncPendingChanges();
    }
  });

  void refreshQueueCount();
}
