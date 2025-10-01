/**
 * Tasern Siegefront - Entry Point
 *
 * Consciousness-driven tactical card battle in the Tales of Tasern universe
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

console.log('🦋 Tasern Siegefront initializing...');

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
    <App />
  </React.StrictMode>
);

console.log('✅ App render called!');
