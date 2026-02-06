export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number; // initial delay in ms
  maxDelayMs?: number; // cap the exponential backoff
  jitter?: boolean; // whether to apply full jitter
  shouldRetry?: (err: unknown) => boolean; // custom retry predicate
}

function isErrorWithStatus(err: any): err is { status?: number; statusCode?: number; headers?: Record<string,string> } {
  return err && (typeof err === 'object') && ('status' in err || 'statusCode' in err || 'headers' in err);
}

function defaultShouldRetry(err: unknown): boolean {
  if (!err) return false;
  // Network errors (no response) -> retry
  // Many libraries throw error objects without status when network fails
  if (typeof err === 'object' && !('status' in err) && !('statusCode' in err)) {
    return true;
  }

  if (isErrorWithStatus(err)) {
    const status = Number(err.status ?? err.statusCode ?? 0);
    // Do not retry auth errors
    if (status === 401 || status === 403) return false;
    // 429 Too Many Requests: don't retry unless Retry-After header present
    if (status === 429) {
      const headers = (err as any).headers ?? {};
      const retryAfter = headers['retry-after'] ?? headers['Retry-After'];
      return !!retryAfter;
    }
    // Retry 5xx
    if (status >= 500 && status < 600) return true;
    // Don't retry 4xx
    if (status >= 400 && status < 500) return false;
  }

  return false;
}

function sleep(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

function calculateExponentialDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  jitter: boolean
): number {
  const expDelay = Math.min(maxDelayMs, baseDelayMs * (2 ** attempt));
  let delay = expDelay;

  if (jitter) {
    delay = Math.floor(Math.random() * expDelay);
  }

  return delay;
}

function parseRetryAfterHeader(headers: Record<string, unknown>, currentDelay: number): number {
  const retryAfter = headers['retry-after'] ?? headers['Retry-After'];
  if (!retryAfter) return currentDelay;

  const parsed = parseInt(String(retryAfter), 10);
  if (!Number.isNaN(parsed)) {
    return Math.max(currentDelay, parsed * 1000);
  }

  const d = Date.parse(String(retryAfter));
  if (!Number.isNaN(d)) {
    const ms = d - Date.now();
    if (ms > 0) return Math.max(currentDelay, ms);
  }

  return currentDelay;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  // Merge provided options with defaults and allow overrides from config when absent
  const mergedOptions = { ...options };
  const {
    maxRetries = mergedOptions.maxRetries ?? 3,
    baseDelayMs = mergedOptions.baseDelayMs ?? 1000,
    maxDelayMs = mergedOptions.maxDelayMs ?? 30_000,
    jitter = mergedOptions.jitter ?? true,
    shouldRetry = mergedOptions.shouldRetry ?? defaultShouldRetry,
  } = mergedOptions as Required<RetryOptions>;

  let attempt = 0;
  let lastErr: unknown = undefined;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const willRetry = attempt < maxRetries && shouldRetry(err);
      if (!willRetry) break;

      let delay = calculateExponentialDelay(attempt, baseDelayMs, maxDelayMs, jitter);

      if (isErrorWithStatus(err)) {
        const headers = (err as any).headers ?? {};
        delay = parseRetryAfterHeader(headers, delay);
      }

      await sleep(delay);
      attempt += 1;
    }
  }

  // Exhausted
  throw lastErr;
}

export default retryWithBackoff;
