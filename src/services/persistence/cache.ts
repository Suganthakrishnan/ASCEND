import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CacheEntry } from './types';

const CACHE_PREFIX = '@systemfit/cache/';

export function cacheKey(...parts: string[]): string {
  return CACHE_PREFIX + parts.join(':');
}

export async function getCached<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, data: T, ttlMs: number): Promise<void> {
  const entry: CacheEntry<T> = { data, cachedAt: Date.now(), ttlMs };
  await AsyncStorage.setItem(key, JSON.stringify(entry));
}

export function isCacheValid<T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() - entry.cachedAt < entry.ttlMs;
}

export async function getValidCache<T>(key: string): Promise<T | null> {
  const entry = await getCached<T>(key);
  if (!isCacheValid(entry)) return null;
  return entry.data;
}

/** Return cached data even if TTL expired (for offline fallback). */
export async function getStaleCache<T>(key: string): Promise<T | null> {
  const entry = await getCached<T>(key);
  return entry?.data ?? null;
}

export async function invalidateCache(prefixOrKey: string): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const toRemove = keys.filter(k =>
    k === prefixOrKey || k.startsWith(prefixOrKey.endsWith('/') ? prefixOrKey : prefixOrKey + ':'),
  );
  if (toRemove.length > 0) await AsyncStorage.multiRemove(toRemove);
}
