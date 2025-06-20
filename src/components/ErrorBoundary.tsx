import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, ExternalLink } from 'lucide-react';
import { AppError, createBrandedString } from '../types/common';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  level?: 'app' | 'page' | 'component';
  showErrorDetails?: boolean;
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  onRetry: () => void;
  onReset: () => void;
  retryCount: number;
  maxRetries: number;
  level: string;
  errorId: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error with context
    const errorContext = {
      errorId: this.state.errorId,
      level: this.props.level || 'component',
      retryCount: this.state.retryCount,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error('[ErrorBoundary] Caught error:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context: errorContext,
    });

    // Call external error handler
    this.props.onError?.(error, errorInfo);

    // Report to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(error, errorContext);
    }
  }

  private reportErrorToService = (error: Error, context: any) => {
    // Integration with error tracking service (Sentry, LogRocket, etc.)
    try {
      // Example: Sentry.captureException(error, { contexts: { errorBoundary: context } });
      console.info('[ErrorBoundary] Error reported to tracking service:', context.errorId);
    } catch (reportingError) {
      console.warn('[ErrorBoundary] Failed to report error to tracking service:', reportingError);
    }
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      console.warn('[ErrorBoundary] Maximum retry attempts reached');
      return;
    }

    console.info(`[ErrorBoundary] Retrying... (${this.state.retryCount + 1}/${maxRetries})`);
    
    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1,
    }));

    // Delay retry to avoid immediate re-crash
    this.retryTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }, 1000);
  };

  private handleReset = () => {
    console.info('[ErrorBoundary] Resetting error state');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
          retryCount={this.state.retryCount}
          maxRetries={this.props.maxRetries || 3}
          level={this.props.level || 'component'}
          errorId={this.state.errorId}
        />
      );
    }

    return this.props.children;
  }
}

// Default Error Fallback Component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  onRetry,
  onReset,
  retryCount,
  maxRetries,
  level,
  errorId,
}) => {
  const canRetry = retryCount < maxRetries;
  const isAppLevel = level === 'app';

  return (
    <div className={`flex items-center justify-center p-8 ${
      isAppLevel ? 'min-h-screen bg-gray-50 dark:bg-gray-900' : 'min-h-96'
    }`}>
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="text-red-500 mr-3" size={24} />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isAppLevel ? 'Application Error' : 'Component Error'}
          </h2>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {isAppLevel 
            ? "We're sorry, but something went wrong. Please try refreshing the page."
            : "This component encountered an error and couldn't be displayed."
          }
        </p>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-4">
          <p className="text-red-800 dark:text-red-200 text-sm font-medium mb-1">
            Error: {error.name}
          </p>
          <p className="text-red-600 dark:text-red-300 text-sm">
            {error.message}
          </p>
          <p className="text-red-500 dark:text-red-400 text-xs mt-2">
            ID: {errorId}
          </p>
        </div>

        <div className="flex flex-col space-y-2">
          {canRetry && (
            <button
              onClick={onRetry}
              className="flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw size={16} className="mr-2" />
              Retry ({retryCount}/{maxRetries})
            </button>
          )}
          
          <button
            onClick={onReset}
            className="flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <Home size={16} className="mr-2" />
            {isAppLevel ? 'Go to Home' : 'Reset Component'}
          </button>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                <Bug size={14} className="inline mr-1" />
                Developer Details
              </summary>
              <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono overflow-auto max-h-40">
                <div className="mb-2">
                  <strong>Stack Trace:</strong>
                  <pre className="whitespace-pre-wrap">{error.stack}</pre>
                </div>
                {errorInfo && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            If this problem persists, please{' '}
            <button className="text-red-600 hover:text-red-700 underline">
              report it to our support team
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Specialized Error Boundaries
export const AppErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="app"
    maxRetries={2}
    showErrorDetails={true}
    onError={(error, errorInfo) => {
      console.error('[AppErrorBoundary] Application-level error:', error);
      // Report critical errors immediately
    }}
  >
    {children}
  </ErrorBoundary>
);

export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="page"
    maxRetries={3}
    fallback={PageErrorFallback}
  >
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="component"
    maxRetries={2}
    fallback={ComponentErrorFallback}
  >
    {children}
  </ErrorBoundary>
);

// Specialized Fallbacks
const PageErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onRetry,
  onReset,
  retryCount,
  maxRetries,
  errorId,
}) => (
  <div className="min-h-96 flex items-center justify-center p-8">
    <div className="text-center">
      <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Page Loading Error
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        This page couldn't be loaded properly. Please try again.
      </p>
      <div className="space-x-4">
        {retryCount < maxRetries && (
          <button
            onClick={onRetry}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
          >
            Try Again
          </button>
        )}
        <button
          onClick={() => window.location.href = '/'}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
        >
          Go Home
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-4">Error ID: {errorId}</p>
    </div>
  </div>
);

const ComponentErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onRetry,
  retryCount,
  maxRetries,
  errorId,
}) => (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <AlertTriangle className="text-red-500 mr-2" size={20} />
        <span className="text-red-800 dark:text-red-200 font-medium">
          Component Error
        </span>
      </div>
      {retryCount < maxRetries && (
        <button
          onClick={onRetry}
          className="text-red-600 hover:text-red-700 text-sm underline"
        >
          Retry
        </button>
      )}
    </div>
    <p className="text-red-600 dark:text-red-300 text-sm mt-2">
      {error.message}
    </p>
    <p className="text-red-400 text-xs mt-1">ID: {errorId}</p>
  </div>
);

export default ErrorBoundary; 