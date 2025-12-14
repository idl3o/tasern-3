/**
 * Environment Validation Utility
 *
 * Validates required environment variables at startup and logs warnings
 * for missing or invalid configuration. Does not crash the app but
 * sets feature flags for graceful degradation.
 */

export interface EnvValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  features: {
    nftScanning: boolean;
    multiplayer: boolean;
    lpEnhancement: boolean;
    sentry: boolean;
  };
}

/**
 * Validate all environment variables and return feature availability
 */
export function validateEnvironment(): EnvValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Feature flags based on available configuration
  const features = {
    nftScanning: true,
    multiplayer: true,
    lpEnhancement: true,
    sentry: true,
  };

  // Check Alchemy API Key
  const alchemyKey = process.env.REACT_APP_ALCHEMY_API_KEY;
  if (!alchemyKey || alchemyKey === 'demo') {
    warnings.push(
      'REACT_APP_ALCHEMY_API_KEY is not configured or set to "demo". ' +
      'NFT scanning will have limited rate limits.'
    );
    // Still functional but degraded
  }

  // Check WalletConnect Project ID
  const walletConnectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID;
  if (!walletConnectId || walletConnectId === 'YOUR_PROJECT_ID') {
    warnings.push(
      'REACT_APP_WALLETCONNECT_PROJECT_ID is not configured. ' +
      'Wallet connection may not work properly.'
    );
    features.multiplayer = false;
  }

  // Check Polygon RPC URL (optional, has fallback)
  const polygonRpc = process.env.REACT_APP_POLYGON_RPC_URL;
  if (!polygonRpc) {
    // This is fine - we have fallbacks
    console.log('ℹ️ Using default Polygon RPC endpoint');
  }

  // Check Sentry DSN (optional)
  const sentryDsn = process.env.REACT_APP_SENTRY_DSN;
  if (!sentryDsn) {
    // Sentry is optional
    features.sentry = false;
  }

  // Log results
  if (warnings.length > 0 || errors.length > 0) {
    console.group('🔧 Environment Configuration');

    if (errors.length > 0) {
      console.error('❌ Errors:');
      errors.forEach(err => console.error(`   - ${err}`));
    }

    if (warnings.length > 0) {
      console.warn('⚠️ Warnings:');
      warnings.forEach(warn => console.warn(`   - ${warn}`));
    }

    console.log('📦 Feature Availability:');
    console.log(`   - NFT Scanning: ${features.nftScanning ? '✅' : '❌'}`);
    console.log(`   - Multiplayer: ${features.multiplayer ? '✅' : '❌'}`);
    console.log(`   - LP Enhancement: ${features.lpEnhancement ? '✅' : '❌'}`);
    console.log(`   - Error Tracking: ${features.sentry ? '✅' : '❌'}`);

    console.groupEnd();
  } else {
    console.log('✅ Environment configuration validated successfully');
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    features,
  };
}

/**
 * Get a specific environment variable with type safety
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    console.warn(`⚠️ Environment variable ${key} is not set`);
    return '';
  }
  return value || defaultValue || '';
}

/**
 * Check if we're running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if we're running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

// Run validation on module load (in browser only)
let validationResult: EnvValidationResult | null = null;

export function getValidationResult(): EnvValidationResult {
  if (!validationResult) {
    validationResult = validateEnvironment();
  }
  return validationResult;
}

// Export features for easy access
export function getFeatures() {
  return getValidationResult().features;
}
