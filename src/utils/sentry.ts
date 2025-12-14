/**
 * Sentry Error Tracking Integration
 *
 * Provides centralized error tracking for production.
 * Only initializes if REACT_APP_SENTRY_DSN is configured.
 */

import * as Sentry from '@sentry/react';

// Check if Sentry is configured
const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

let isInitialized = false;

/**
 * Initialize Sentry error tracking
 */
export function initSentry(): void {
  if (isInitialized) {
    return;
  }

  if (!SENTRY_DSN) {
    console.log('ℹ️ Sentry DSN not configured - error tracking disabled');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: IS_PRODUCTION ? 'production' : 'development',

      // Only send errors in production
      enabled: IS_PRODUCTION,

      // Sample rate for performance monitoring (10% of transactions)
      tracesSampleRate: 0.1,

      // Sample rate for error events (100% in production)
      sampleRate: IS_PRODUCTION ? 1.0 : 0.1,

      // Don't send PII
      sendDefaultPii: false,

      // Before sending, filter out sensitive data
      beforeSend(event) {
        // Remove wallet addresses from error messages
        if (event.message) {
          event.message = sanitizeMessage(event.message);
        }

        // Remove wallet addresses from breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map(breadcrumb => ({
            ...breadcrumb,
            message: breadcrumb.message ? sanitizeMessage(breadcrumb.message) : undefined,
          }));
        }

        return event;
      },

      // Ignore common non-actionable errors
      ignoreErrors: [
        // Browser extensions
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',

        // Network errors (handled by retry logic)
        'Failed to fetch',
        'NetworkError',
        'Load failed',

        // User aborted
        'AbortError',
        'The operation was aborted',

        // Third-party
        'Non-Error promise rejection captured',
      ],

      // Only capture errors from our code
      allowUrls: [
        /https?:\/\/.*\.vercel\.app/,
        /https?:\/\/localhost/,
      ],

      // Integration settings
      integrations: [
        // Capture console errors as breadcrumbs
        Sentry.breadcrumbsIntegration({
          console: true,
          dom: true,
          fetch: true,
          xhr: true,
        }),
      ],
    });

    isInitialized = true;
    console.log('✅ Sentry initialized for error tracking');
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
}

/**
 * Remove wallet addresses and other sensitive data from messages
 */
function sanitizeMessage(message: string): string {
  // Replace wallet addresses (0x followed by 40 hex chars)
  return message.replace(/0x[a-fA-F0-9]{40}/g, '0x[REDACTED]');
}

/**
 * Set the current user context (anonymized)
 */
export function setUserContext(walletAddress?: string): void {
  if (!isInitialized) return;

  if (walletAddress) {
    // Use a hash of the wallet address, not the address itself
    const userId = hashAddress(walletAddress);
    Sentry.setUser({
      id: userId,
      // Store truncated address for correlation
      username: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Simple hash function for anonymizing addresses
 */
function hashAddress(address: string): string {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    const char = address.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `user_${Math.abs(hash).toString(16)}`;
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (!isInitialized) {
    console.error('Sentry not initialized, logging error:', error);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message manually
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  if (!isInitialized) {
    console.log(`[${level}] ${message}`);
    return;
  }

  Sentry.captureMessage(message, level);
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string = 'app',
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
): void {
  if (!isInitialized) return;

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}

/**
 * Set extra context data
 */
export function setContext(name: string, context: Record<string, any>): void {
  if (!isInitialized) return;

  Sentry.setContext(name, context);
}

/**
 * Set a tag for filtering
 */
export function setTag(key: string, value: string): void {
  if (!isInitialized) return;

  Sentry.setTag(key, value);
}

/**
 * Check if Sentry is enabled
 */
export function isSentryEnabled(): boolean {
  return isInitialized;
}

// Export Sentry for direct access if needed
export { Sentry };

export default {
  initSentry,
  setUserContext,
  captureException,
  captureMessage,
  addBreadcrumb,
  setContext,
  setTag,
  isSentryEnabled,
};
