import React, { useState } from 'react';
import { useErrorHandler, useComponentErrorHandler } from '../hooks/useErrorHandler';
import { ErrorCode, createAppError, withRetry } from '../utils/errorHandler';
import ErrorDisplay from '../components/ErrorDisplay';
import { ComponentErrorBoundary } from '../components/ErrorBoundary';

/**
 * Composant de démonstration pour illustrer l'utilisation du nouveau système de gestion d'erreurs
 * Ce fichier sert de documentation vivante et d'exemple d'implémentation
 */
const ErrorHandlingDemo: React.FC = () => {
  const [demoError, setDemoError] = useState<any>(null);
  const { 
    error, 
    handleError, 
    retryOperation, 
    clearError, 
    isRetrying,
    getUserFriendlyMessage,
    isRetryableError 
  } = useComponentErrorHandler('ErrorHandlingDemo');

  // Exemple 1: Gestion d'erreur basique
  const simulateBasicError = () => {
    try {
      throw new Error('This is a simulated network error');
    } catch (error) {
      const appError = handleError(error as Error, {
        action: 'simulate_basic_error',
        additionalData: { demo: true }
      });
      setDemoError(appError);
    }
  };

  // Exemple 2: Gestion d'erreur avec retry automatique
  const simulateRetryableError = async () => {
    let attemptCount = 0;
    
    const unreliableOperation = async () => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error('Network timeout - temporary issue');
      }
      return `Success after ${attemptCount} attempts!`;
    };

    const result = await retryOperation(
      unreliableOperation,
      {
        maxRetries: 3,
        baseDelay: 1000,
        retryableErrors: [ErrorCode.NETWORK_ERROR, ErrorCode.API_TIMEOUT]
      },
      {
        action: 'retry_demo'
      }
    );

    if (result.success) {
      alert(result.data);
      clearError();
    }
  };

  // Exemple 3: Erreur avec code spécifique
  const simulateSpecificError = () => {
    const specificError = createAppError(
      ErrorCode.API_RATE_LIMIT,
      'Rate limit exceeded for demo purposes',
      {
        component: 'ErrorHandlingDemo',
        action: 'specific_error_demo',
        additionalData: {
          requestsPerMinute: 120,
          limit: 100
        }
      }
    );
    setDemoError(specificError);
  };

  // Exemple 4: Erreur qui cause un crash du composant (pour tester Error Boundary)
  const simulateComponentCrash = () => {
    // Cette erreur sera capturée par ComponentErrorBoundary
    throw new Error('Component crash simulation - Error Boundary should catch this');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        🛡️ Error Handling System Demo
      </h1>
      
      <div className="space-y-6">
        {/* Section 1: Error Handling Basics */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">1. Basic Error Handling</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Demonstrates basic error capturing and user-friendly display.
          </p>
          
          <button
            onClick={simulateBasicError}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded mr-4"
          >
            Simulate Basic Error
          </button>

          {demoError && (
            <div className="mt-4">
              <ErrorDisplay
                error={demoError}
                variant="inline"
                onDismiss={() => setDemoError(null)}
                showDetails={true}
              />
            </div>
          )}
        </section>

        {/* Section 2: Retry Logic */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">2. Retry Logic with Exponential Backoff</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Shows automatic retry with exponential backoff for temporary failures.
          </p>
          
          <button
            onClick={simulateRetryableError}
            disabled={isRetrying}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded mr-4"
          >
            {isRetrying ? 'Retrying...' : 'Simulate Retryable Error'}
          </button>

          {error && (
            <div className="mt-4">
              <ErrorDisplay
                error={error}
                variant="banner"
                onRetry={() => simulateRetryableError()}
                onDismiss={clearError}
                showRetry={isRetryableError(error)}
              />
            </div>
          )}
        </section>

        {/* Section 3: Specific Error Codes */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">3. Specific Error Codes</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Shows how different error codes produce different user messages and behaviors.
          </p>
          
          <div className="space-x-2 mb-4">
            <button
              onClick={simulateSpecificError}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
            >
              Rate Limit Error
            </button>
            
            <button
              onClick={() => setDemoError(createAppError(
                ErrorCode.CHANNEL_NOT_FOUND,
                'Channel not found in demo',
                { component: 'ErrorHandlingDemo' }
              ))}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
            >
              Channel Not Found
            </button>

            <button
              onClick={() => setDemoError(createAppError(
                ErrorCode.AUTH_TOKEN_EXPIRED,
                'Authentication token expired',
                { component: 'ErrorHandlingDemo' }
              ))}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            >
              Auth Error
            </button>
          </div>

          {demoError && (
            <div className="mt-4">
              <ErrorDisplay
                error={demoError}
                variant="toast"
                onDismiss={() => setDemoError(null)}
                showDetails={true}
              />
            </div>
          )}
        </section>

        {/* Section 4: Error Boundary Demo */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">4. Error Boundary Protection</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Demonstrates Error Boundary catching component crashes.
          </p>
          
          <ComponentErrorBoundary>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                This section is protected by an Error Boundary. The crash will be caught gracefully.
              </p>
              <button
                onClick={simulateComponentCrash}
                className="bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded"
              >
                💥 Simulate Component Crash
              </button>
            </div>
          </ComponentErrorBoundary>
        </section>

        {/* Section 5: Error Code Reference */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">5. Error Code Reference</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-green-600 mb-2">Network Errors</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• NETWORK_ERROR - Connection issues</li>
                <li>• API_TIMEOUT - Request timeout</li>
                <li>• API_RATE_LIMIT - Too many requests</li>
                <li>• API_SERVER_ERROR - Server error</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-blue-600 mb-2">Authentication Errors</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• AUTH_ERROR - General auth error</li>
                <li>• AUTH_TOKEN_EXPIRED - Token expired</li>
                <li>• API_UNAUTHORIZED - Not authorized</li>
                <li>• API_FORBIDDEN - Access denied</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-purple-600 mb-2">Business Logic Errors</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• CHANNEL_NOT_FOUND - Channel missing</li>
                <li>• VIDEO_NOT_AVAILABLE - Video unavailable</li>
                <li>• FAVORITES_LIMIT_EXCEEDED - Too many favorites</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-orange-600 mb-2">System Errors</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• MEMORY_ERROR - Out of memory</li>
                <li>• STORAGE_QUOTA_EXCEEDED - Storage full</li>
                <li>• BROWSER_NOT_SUPPORTED - Browser incompatible</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ErrorHandlingDemo; 