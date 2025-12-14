/**
 * Feature Flags System
 *
 * Centralized feature availability based on configuration.
 * Features are automatically disabled when required configuration is missing.
 */

import { getValidationResult } from './envValidator';

/**
 * Available features in the application
 */
export interface FeatureFlags {
  /** NFT scanning via Alchemy API */
  nftScanning: boolean;
  /** Multiplayer via WebRTC/WalletConnect */
  multiplayer: boolean;
  /** LP token enhancement scanning */
  lpEnhancement: boolean;
  /** Sentry error tracking */
  sentry: boolean;
  /** Campaign mode */
  campaign: boolean;
  /** Tutorial */
  tutorial: boolean;
  /** AI vs AI battles */
  aiVsAi: boolean;
}

/**
 * Get current feature availability
 */
export function getFeatureFlags(): FeatureFlags {
  const validation = getValidationResult();

  return {
    // Configuration-dependent features
    nftScanning: validation.features.nftScanning,
    multiplayer: validation.features.multiplayer,
    lpEnhancement: validation.features.lpEnhancement,
    sentry: validation.features.sentry,

    // Always-available features
    campaign: true,
    tutorial: true,
    aiVsAi: true,
  };
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature] ?? false;
}

/**
 * Get a human-readable reason why a feature is disabled
 */
export function getFeatureDisabledReason(feature: keyof FeatureFlags): string | null {
  const flags = getFeatureFlags();

  if (flags[feature]) {
    return null; // Feature is enabled
  }

  switch (feature) {
    case 'nftScanning':
      return 'NFT scanning requires a valid Alchemy API key';
    case 'multiplayer':
      return 'Multiplayer requires WalletConnect to be configured';
    case 'lpEnhancement':
      return 'LP enhancement requires RPC access';
    case 'sentry':
      return 'Error tracking requires Sentry DSN to be configured';
    default:
      return 'This feature is currently disabled';
  }
}

/**
 * Feature guard - returns children if feature is enabled, fallback otherwise
 */
export function requireFeature<T>(
  feature: keyof FeatureFlags,
  enabledValue: T,
  disabledValue: T
): T {
  return isFeatureEnabled(feature) ? enabledValue : disabledValue;
}

/**
 * Log current feature status
 */
export function logFeatureStatus(): void {
  const flags = getFeatureFlags();

  console.group('🚩 Feature Flags');
  Object.entries(flags).forEach(([feature, enabled]) => {
    const icon = enabled ? '✅' : '❌';
    const reason = enabled ? '' : ` - ${getFeatureDisabledReason(feature as keyof FeatureFlags)}`;
    console.log(`${icon} ${feature}${reason}`);
  });
  console.groupEnd();
}

/**
 * React hook for feature flags (simple version)
 */
export function useFeatureFlag(feature: keyof FeatureFlags): boolean {
  // In a more complex app, this could use React context or state
  // For now, it's a simple synchronous check
  return isFeatureEnabled(feature);
}

/**
 * Check multiple features at once
 */
export function areAllFeaturesEnabled(features: (keyof FeatureFlags)[]): boolean {
  return features.every(feature => isFeatureEnabled(feature));
}

/**
 * Check if any of the features are enabled
 */
export function isAnyFeatureEnabled(features: (keyof FeatureFlags)[]): boolean {
  return features.some(feature => isFeatureEnabled(feature));
}

export default {
  getFeatureFlags,
  isFeatureEnabled,
  getFeatureDisabledReason,
  requireFeature,
  logFeatureStatus,
  useFeatureFlag,
  areAllFeaturesEnabled,
  isAnyFeatureEnabled,
};
