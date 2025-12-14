/**
 * Error Boundary Component
 *
 * Catches React render errors and displays a friendly fallback UI
 * instead of crashing the entire app with a blank page.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showRetry?: boolean;
  onRetry?: () => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to Sentry if available
    if (typeof window !== 'undefined' && (window as any).__SENTRY__) {
      try {
        const Sentry = (window as any).__SENTRY__;
        Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
      } catch (e) {
        console.warn('Failed to report error to Sentry:', e);
      }
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleReturnToMenu = (): void => {
    // Clear error state and reload to menu
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI with Tasern styling
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <h2 style={styles.title}>Something Went Wrong</h2>
            <p style={styles.subtitle}>
              {this.props.componentName
                ? `An error occurred in ${this.props.componentName}`
                : 'An unexpected error occurred'}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={styles.errorDetails}>
                <p style={styles.errorMessage}>{this.state.error.message}</p>
                {this.state.errorInfo && (
                  <pre style={styles.stack}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div style={styles.buttons}>
              {this.props.showRetry !== false && (
                <button style={styles.retryButton} onClick={this.handleRetry}>
                  Try Again
                </button>
              )}
              <button style={styles.menuButton} onClick={this.handleReturnToMenu}>
                Return to Menu
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Tasern-themed styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#1a1a2e',
    padding: '20px',
  },
  card: {
    backgroundColor: '#16213e',
    border: '2px solid #D4AF37',
    borderRadius: '12px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center' as const,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
  title: {
    color: '#D4AF37',
    fontFamily: "'Cinzel', serif",
    fontSize: '24px',
    marginBottom: '16px',
    textTransform: 'uppercase' as const,
    letterSpacing: '2px',
  },
  subtitle: {
    color: '#F4E4C1',
    fontFamily: "'Crimson Text', serif",
    fontSize: '16px',
    marginBottom: '24px',
    opacity: 0.9,
  },
  errorDetails: {
    backgroundColor: 'rgba(139, 0, 0, 0.2)',
    border: '1px solid rgba(139, 0, 0, 0.4)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
    textAlign: 'left' as const,
  },
  errorMessage: {
    color: '#ff6b6b',
    fontFamily: 'monospace',
    fontSize: '14px',
    marginBottom: '12px',
    wordBreak: 'break-word' as const,
  },
  stack: {
    color: '#aaa',
    fontFamily: 'monospace',
    fontSize: '11px',
    maxHeight: '150px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap' as const,
    margin: 0,
  },
  buttons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  retryButton: {
    backgroundColor: '#D4AF37',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 24px',
    fontFamily: "'Cinzel', serif",
    fontSize: '14px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  menuButton: {
    backgroundColor: 'transparent',
    color: '#F4E4C1',
    border: '2px solid #8B6914',
    borderRadius: '6px',
    padding: '12px 24px',
    fontFamily: "'Cinzel', serif",
    fontSize: '14px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    transition: 'background-color 0.2s',
  },
};

export default ErrorBoundary;
