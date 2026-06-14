import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Security utilities for Ascend app
 * Provides input sanitization, rate limiting, secure storage, session management, and debug detection
 */

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/**
 * Sanitizes text input by stripping HTML tags, trimming whitespace, and limiting length
 * @param input - Raw input string
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Sanitized string
 */
export function sanitizeText(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';
  
  // Strip HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Sanitizes and clamps a numeric input
 * @param input - Raw input (any type)
 * @param min - Minimum allowed value (default: 0)
 * @param max - Maximum allowed value (default: Number.MAX_SAFE_INTEGER)
 * @returns Clamped number
 */
export function sanitizeNumber(input: any, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number {
  const parsed = Number(input);
  
  if (isNaN(parsed)) return min;
  
  return Math.max(min, Math.min(max, parsed));
}

/**
 * Validates email format using RFC-compliant regex
 * @param email - Email address to validate
 * @returns True if email is valid format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  // RFC 5322 compliant email regex (simplified but robust)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailRegex.test(email);
}

// ============================================================================
// RATE LIMITING (Client-side, in-memory)
// ============================================================================

interface RateLimitEntry {
  attempts: number;
  windowStart: number;
}

/**
 * Client-side rate limiter using in-memory Map
 * Tracks attempts per key within a time window
 */
export class RateLimiter {
  private static instance: RateLimiter;
  private limits: Map<string, RateLimitEntry> = new Map();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Check if action is allowed under rate limit
   * @param key - Unique identifier for the action (e.g., 'login', 'register')
   * @param maxAttempts - Maximum allowed attempts
   * @param windowMs - Time window in milliseconds
   * @returns True if action is allowed, false if rate limit exceeded
   */
  check(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry) {
      // First attempt
      this.limits.set(key, { attempts: 1, windowStart: now });
      return true;
    }

    // Check if window has expired
    if (now - entry.windowStart > windowMs) {
      // Reset window
      this.limits.set(key, { attempts: 1, windowStart: now });
      return true;
    }

    // Check if attempts exceeded
    if (entry.attempts >= maxAttempts) {
      return false;
    }

    // Increment attempts
    entry.attempts++;
    this.limits.set(key, entry);
    return true;
  }

  /**
   * Reset rate limit for a specific key
   * @param key - Key to reset
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits (useful for testing)
   */
  clearAll(): void {
    this.limits.clear();
  }
}

// ============================================================================
// SECURE STORAGE WRAPPER
// ============================================================================

const STORAGE_PREFIX = 'systemfit_secure_';

/**
 * Securely retrieve a value from AsyncStorage
 * @param key - Storage key (without prefix)
 * @returns Stored value or null if not found
 */
export async function secureGet(key: string): Promise<string | null> {
  try {
    const prefixedKey = STORAGE_PREFIX + key;
    return await AsyncStorage.getItem(prefixedKey);
  } catch (error) {
    console.warn('[Security] Error reading from secure storage:', error);
    return null;
  }
}

/**
 * Securely store a value in AsyncStorage
 * @param key - Storage key (without prefix)
 * @param value - Value to store
 */
export async function secureSet(key: string, value: string): Promise<void> {
  try {
    const prefixedKey = STORAGE_PREFIX + key;
    await AsyncStorage.setItem(prefixedKey, value);
  } catch (error) {
    console.warn('[Security] Error writing to secure storage:', error);
    throw error;
  }
}

/**
 * Securely delete a value from AsyncStorage
 * @param key - Storage key (without prefix)
 */
export async function secureDelete(key: string): Promise<void> {
  try {
    const prefixedKey = STORAGE_PREFIX + key;
    await AsyncStorage.removeItem(prefixedKey);
  } catch (error) {
    console.warn('[Security] Error deleting from secure storage:', error);
  }
}

// ============================================================================
// SESSION TIMEOUT
// ============================================================================

/**
 * Session timer for automatic sign-out after inactivity
 */
export class SessionTimer {
  private timerId: NodeJS.Timeout | null = null;
  private onTimeoutCallback: (() => void) | null = null;
  private timeoutMs: number = 30 * 60 * 1000; // Default 30 minutes

  /**
   * Start the session timer
   * @param timeoutMs - Timeout in milliseconds
   * @param onTimeout - Callback function when timeout occurs
   */
  start(timeoutMs: number, onTimeout: () => void): void {
    this.clear();
    this.timeoutMs = timeoutMs;
    this.onTimeoutCallback = onTimeout;
    
    this.timerId = setInterval(() => {
      if (this.onTimeoutCallback) {
        this.onTimeoutCallback();
        this.clear();
      }
    }, this.timeoutMs);
  }

  /**
   * Reset the timer (call on user interaction)
   */
  reset(): void {
    if (this.onTimeoutCallback && this.timeoutMs) {
      this.start(this.timeoutMs, this.onTimeoutCallback);
    }
  }

  /**
   * Clear the timer
   */
  clear(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.onTimeoutCallback = null;
  }
}

// ============================================================================
// ROOT/DEBUG DETECTION
// ============================================================================

/**
 * Check if app is running in development mode
 * @returns True if __DEV__ flag is true
 */
export function isDevMode(): boolean {
  // @ts-ignore - __DEV__ is a global in React Native
  return typeof __DEV__ !== 'undefined' && __DEV__ === true;
}

/**
 * Log security warning if running in dev mode with production Supabase URL
 */
export function checkDevModeSecurity(): void {
  if (isDevMode()) {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    
    // Check if using production-like URL in dev mode
    if (supabaseUrl && !supabaseUrl.includes('localhost') && !supabaseUrl.includes('127.0.0.1')) {
      console.warn(
        '[Security] WARNING: Running in development mode with production Supabase URL. ' +
        'Ensure this is intentional for testing purposes.'
      );
    }
  }
}
