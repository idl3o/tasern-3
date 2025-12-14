/**
 * Tasern Siegefront - Entry Point
 *
 * Consciousness-driven tactical card battle in the Tales of Tasern universe
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { App } from './App';
import { Web3Provider } from './providers/Web3Provider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { validateEnvironment } from './utils/envValidator';
import { initSentry } from './utils/sentry';
import { logFeatureStatus } from './utils/features';

console.log('🦋 Tasern Siegefront initializing...');

// Initialize error tracking first
initSentry();

// Validate environment configuration on startup
validateEnvironment();

// Log feature availability
logFeatureStatus();

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
  throw new Error('Root element #root not found in DOM');
}

console.log('✅ Root element found, creating React root...');

const root = ReactDOM.createRoot(rootElement as HTMLElement);

console.log('✅ React root created, rendering App...');

root.render(
  <React.StrictMode>
    <ErrorBoundary componentName="Tasern Siegefront">
      <Web3Provider>
        <App />
      </Web3Provider>
    </ErrorBoundary>
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>
);

console.log('✅ App render called!');
