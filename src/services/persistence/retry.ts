const DEFAULT_RETRIES = 3;
const DEFAULT_DELAY_MS = 400;

function isRetryableError(error: unknown): boolean {
  if (!error) return false;
  const msg =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: string }).message)
      : String(error);
  const lower = msg.toLowerCase();
  return (
    lower.includes('network') ||
    lower.includes('fetch') ||
    lower.includes('timeout') ||
    lower.includes('failed to connect') ||
    lower.includes('econnrefused') ||
    lower.includes('503') ||
    lower.includes('502')
  );
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: { retries?: number; delayMs?: number },
): Promise<T> {
  const retries = options?.retries ?? DEFAULT_RETRIES;
  const delayMs = options?.delayMs ?? DEFAULT_DELAY_MS;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !isRetryableError(error)) throw error;
      await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
    }
  }

  throw lastError;
}

export function isNetworkError(error: unknown): boolean {
  return isRetryableError(error);
}
