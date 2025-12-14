/**
 * Production Logger Utility
 *
 * Provides logging that respects production mode:
 * - Filters sensitive data (wallet addresses, API keys)
 * - Reduces noise in production
 * - Integrates with Sentry for errors
 */

import { captureException, captureMessage, addBreadcrumb } from './sentry';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// Log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Configuration
const config = {
  // Only show debug logs in development
  minLevel: IS_PRODUCTION ? 'info' : 'debug',
  // Filter sensitive data in production
  filterSensitive: IS_PRODUCTION,
  // Send errors to Sentry in production
  sentryErrors: IS_PRODUCTION,
};

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Check if a log level should be shown
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[config.minLevel as LogLevel];
}

/**
 * Filter sensitive data from a string
 */
function filterSensitive(message: string): string {
  if (!config.filterSensitive) {
    return message;
  }

  let filtered = message;

  // Filter wallet addresses (0x followed by 40 hex chars)
  filtered = filtered.replace(
    /0x[a-fA-F0-9]{40}/g,
    (match) => `${match.slice(0, 6)}...${match.slice(-4)}`
  );

  // Filter potential API keys (long alphanumeric strings)
  filtered = filtered.replace(
    /[a-zA-Z0-9_-]{32,}/g,
    '[REDACTED]'
  );

  // Filter URLs with API keys
  filtered = filtered.replace(
    /(api[_-]?key|apikey|key|token)=[^&\s]+/gi,
    '$1=[REDACTED]'
  );

  return filtered;
}

/**
 * Filter sensitive data from objects
 */
function filterObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return filterSensitive(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(filterObject);
  }

  if (typeof obj === 'object') {
    const filtered: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Redact known sensitive keys
      if (/key|token|secret|password|credential|auth/i.test(key)) {
        filtered[key] = '[REDACTED]';
      } else {
        filtered[key] = filterObject(value);
      }
    }
    return filtered;
  }

  return obj;
}

/**
 * Format arguments for logging
 */
function formatArgs(args: any[]): any[] {
  if (!config.filterSensitive) {
    return args;
  }

  return args.map(arg => {
    if (typeof arg === 'string') {
      return filterSensitive(arg);
    }
    if (typeof arg === 'object') {
      return filterObject(arg);
    }
    return arg;
  });
}

/**
 * Debug log (development only)
 */
export function debug(message: string, ...args: any[]): void {
  if (!shouldLog('debug')) return;

  console.debug(
    `🔍 ${filterSensitive(message)}`,
    ...formatArgs(args)
  );
}

/**
 * Info log
 */
export function info(message: string, ...args: any[]): void {
  if (!shouldLog('info')) return;

  console.log(
    `ℹ️ ${filterSensitive(message)}`,
    ...formatArgs(args)
  );

  // Add breadcrumb for Sentry
  addBreadcrumb(filterSensitive(message), 'log', 'info');
}

/**
 * Warning log
 */
export function warn(message: string, ...args: any[]): void {
  if (!shouldLog('warn')) return;

  console.warn(
    `⚠️ ${filterSensitive(message)}`,
    ...formatArgs(args)
  );

  // Add breadcrumb for Sentry
  addBreadcrumb(filterSensitive(message), 'log', 'warning');
}

/**
 * Error log
 */
export function error(message: string, error?: Error, ...args: any[]): void {
  if (!shouldLog('error')) return;

  console.error(
    `❌ ${filterSensitive(message)}`,
    error || '',
    ...formatArgs(args)
  );

  // Send to Sentry in production
  if (config.sentryErrors && error) {
    captureException(error, {
      message: filterSensitive(message),
      extra: formatArgs(args),
    });
  } else if (config.sentryErrors) {
    captureMessage(filterSensitive(message), 'error');
  }
}

/**
 * Log a group of related messages
 */
export function group(label: string, fn: () => void): void {
  if (IS_PRODUCTION) {
    fn(); // No grouping in production
    return;
  }

  console.group(filterSensitive(label));
  try {
    fn();
  } finally {
    console.groupEnd();
  }
}

/**
 * Time a function execution
 */
export async function time<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (IS_PRODUCTION) {
    return fn();
  }

  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    debug(`${label} completed in ${duration.toFixed(2)}ms`);
    return result;
  } catch (err) {
    const duration = performance.now() - start;
    error(`${label} failed after ${duration.toFixed(2)}ms`, err as Error);
    throw err;
  }
}

/**
 * Create a scoped logger with a prefix
 */
export function createLogger(scope: string) {
  return {
    debug: (message: string, ...args: any[]) => debug(`[${scope}] ${message}`, ...args),
    info: (message: string, ...args: any[]) => info(`[${scope}] ${message}`, ...args),
    warn: (message: string, ...args: any[]) => warn(`[${scope}] ${message}`, ...args),
    error: (message: string, err?: Error, ...args: any[]) => error(`[${scope}] ${message}`, err, ...args),
  };
}

// Default export
const logger = {
  debug,
  info,
  warn,
  error,
  group,
  time,
  createLogger,
};

export default logger;
