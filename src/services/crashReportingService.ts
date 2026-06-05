/**
 * Crash Reporting Service
 * Lightweight stub (Sentry removed - can be added back later)
 */

export interface CrashContext {
  userId?: string;
  screen?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export class CrashReportingService {
  static captureError(error: Error | unknown, context?: CrashContext): void {
    console.error('[CrashReporting]', error, context);
  }

  static captureMessage(
    message: string,
    level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
    context?: CrashContext
  ): void {
    console.log(`[CrashReporting] ${level.toUpperCase()}:`, message, context);
  }

  static addBreadcrumb(message: string, category: string = 'user', data?: Record<string, any>): void {
    console.log('[CrashReporting] Breadcrumb:', category, message, data);
  }

  static setUser(userId: string, email?: string, username?: string): void {
    console.log('[CrashReporting] Set user:', userId);
  }

  static clearUser(): void {
    console.log('[CrashReporting] Cleared user');
  }

  static setTag(key: string, value: string): void {
    console.log('[CrashReporting] Tag:', key, value);
  }

  static setContext(key: string, value: Record<string, any>): void {
    console.log('[CrashReporting] Context:', key, value);
  }

  static startTransaction(name: string, operation: string = 'custom') {
    return null;
  }

  static withErrorTracking<T extends (...args: any[]) => Promise<any>>(fn: T, context?: CrashContext): T {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.captureError(error, context);
        throw error;
      }
    }) as T;
  }

  static reportFatal(error: Error | unknown, context?: CrashContext): void {
    this.captureError(error, {
      ...context,
      metadata: { ...(context?.metadata || {}), fatal: true },
    });
  }
}

export default CrashReportingService;