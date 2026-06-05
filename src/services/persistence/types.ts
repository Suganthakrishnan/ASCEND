export type MutationOperation = 'insert' | 'update' | 'delete' | 'upsert';

export interface QueuedMutation {
  id: string;
  table: string;
  operation: MutationOperation;
  payload: Record<string, unknown>;
  /** For update/delete: column filters */
  filters?: Record<string, string | number | boolean>;
  onConflict?: string;
  createdAt: number;
  retryCount: number;
}

export interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttlMs: number;
}

export interface PersistFetchResult<T> {
  data: T;
  error: Error | null;
  fromCache: boolean;
}

export interface PersistMutateResult<T> {
  data: T | null;
  error: Error | null;
  queued: boolean;
}

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error';
