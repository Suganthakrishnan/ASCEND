/**
 * Error Service
 * Lightweight error handling (Sentry removed - can be added back later)
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

export class ErrorService {
  static initialize() {
    console.log('[ErrorService] Initialized');
  }

  static captureError(error: Error | unknown, context?: ErrorContext) {
    console.error('[ErrorService]', error, context);
  }

  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
    console.log(`[ErrorService] ${level.toUpperCase()}:`, message, context);
  }

  static setUser(userId: string, email?: string, username?: string) {
    console.log('[ErrorService] Set user:', userId);
  }

  static clearUser() {
    console.log('[ErrorService] Cleared user');
  }

  static addBreadcrumb(message: string, category: string = 'user', data?: Record<string, any>) {
    console.log('[ErrorService] Breadcrumb:', category, message, data);
  }

  static withErrorTracking<T extends (...args: any[]) => any>(fn: T, context?: ErrorContext): T {
    return ((...args: Parameters<T>) => {
      try {
        const result = fn(...args);
        if (result instanceof Promise) {
          return result.catch((error) => {
            this.captureError(error, context);
            throw error;
          });
        }
        return result;
      } catch (error) {
        this.captureError(error, context);
        throw error;
      }
    }) as T;
  }
}

export default ErrorService;