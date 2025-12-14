/**
 * Resilient Fetch Utility
 *
 * Provides fetch with automatic retry, exponential backoff, and timeout support.
 * Handles transient errors (429, 5xx, network) gracefully.
 */

export interface ResilientFetchOptions extends RequestInit {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in ms before first retry (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in ms between retries (default: 10000) */
  maxDelay?: number;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Whether to retry on rate limit (429) errors (default: true) */
  retryOnRateLimit?: boolean;
  /** Callback for retry attempts */
  onRetry?: (attempt: number, error: Error, delay: number) => void;
}

export interface ResilientFetchResult<T> {
  data: T | null;
  error: Error | null;
  status: number | null;
  retries: number;
}

/**
 * Errors that should trigger a retry
 */
function isRetryableError(error: Error, status: number | null): boolean {
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }

  // Timeout errors
  if (error.name === 'AbortError') {
    return true;
  }

  // Server errors (5xx)
  if (status !== null && status >= 500 && status < 600) {
    return true;
  }

  // Rate limiting (429)
  if (status === 429) {
    return true;
  }

  return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, initialDelay: number, maxDelay: number): number {
  // Exponential backoff: delay = initialDelay * 2^attempt
  const exponentialDelay = initialDelay * Math.pow(2, attempt);

  // Add jitter (±25%) to prevent thundering herd
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);

  // Cap at maximum delay
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with automatic retry and exponential backoff
 */
export async function resilientFetch<T = any>(
  url: string,
  options: ResilientFetchOptions = {}
): Promise<ResilientFetchResult<T>> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    timeout = 30000,
    retryOnRateLimit = true,
    onRetry,
    ...fetchOptions
  } = options;

  let lastError: Error = new Error('Unknown error');
  let lastStatus: number | null = null;
  let retries = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      lastStatus = response.status;

      // Handle rate limiting
      if (response.status === 429) {
        if (!retryOnRateLimit || attempt === maxRetries) {
          return {
            data: null,
            error: new Error(`Rate limited (429) after ${attempt} retries`),
            status: 429,
            retries: attempt,
          };
        }

        // Get retry-after header if available
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : calculateDelay(attempt, initialDelay * 2, maxDelay); // Longer delay for rate limits

        if (onRetry) {
          onRetry(attempt + 1, new Error('Rate limited'), delay);
        }

        console.warn(`⚠️ Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
        retries++;
        continue;
      }

      // Handle server errors
      if (response.status >= 500) {
        if (attempt === maxRetries) {
          return {
            data: null,
            error: new Error(`Server error (${response.status}) after ${attempt} retries`),
            status: response.status,
            retries: attempt,
          };
        }

        const delay = calculateDelay(attempt, initialDelay, maxDelay);

        if (onRetry) {
          onRetry(attempt + 1, new Error(`Server error: ${response.status}`), delay);
        }

        console.warn(`⚠️ Server error ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
        retries++;
        continue;
      }

      // Success or client error (4xx except 429)
      if (!response.ok) {
        return {
          data: null,
          error: new Error(`HTTP error: ${response.status} ${response.statusText}`),
          status: response.status,
          retries,
        };
      }

      // Parse JSON response
      const data = await response.json();
      return {
        data,
        error: null,
        status: response.status,
        retries,
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      if (!isRetryableError(lastError, lastStatus) || attempt === maxRetries) {
        return {
          data: null,
          error: lastError,
          status: lastStatus,
          retries: attempt,
        };
      }

      const delay = calculateDelay(attempt, initialDelay, maxDelay);

      if (onRetry) {
        onRetry(attempt + 1, lastError, delay);
      }

      console.warn(`⚠️ Fetch error: ${lastError.message}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await sleep(delay);
      retries++;
    }
  }

  return {
    data: null,
    error: lastError,
    status: lastStatus,
    retries,
  };
}

/**
 * Convenience wrapper for JSON POST requests
 */
export async function resilientPost<T = any>(
  url: string,
  body: object,
  options: ResilientFetchOptions = {}
): Promise<ResilientFetchResult<T>> {
  return resilientFetch<T>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
    ...options,
  });
}

/**
 * Convenience wrapper for JSON-RPC requests (used by Alchemy)
 */
export async function resilientJsonRpc<T = any>(
  url: string,
  method: string,
  params: any[],
  options: ResilientFetchOptions = {}
): Promise<ResilientFetchResult<T>> {
  const result = await resilientPost<{ result?: T; error?: any }>(
    url,
    {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    },
    options
  );

  if (result.error) {
    return {
      data: null,
      error: result.error,
      status: result.status,
      retries: result.retries,
    };
  }

  if (result.data?.error) {
    return {
      data: null,
      error: new Error(result.data.error.message || 'JSON-RPC error'),
      status: result.status,
      retries: result.retries,
    };
  }

  return {
    data: result.data?.result ?? null,
    error: null,
    status: result.status,
    retries: result.retries,
  };
}

export default resilientFetch;
