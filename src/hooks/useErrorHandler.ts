import { useCallback, useState, useEffect } from 'react';
import { AppError, Result } from '../types/common';
import { 
  ErrorCode, 
  ErrorContext, 
  RetryConfig, 
  createAppError, 
  withRetry, 
  getUserFriendlyMessage,
  errorHandler,
  DEFAULT_RETRY_CONFIG 
} from '../utils/errorHandler';

interface UseErrorHandlerReturn {
  error: AppError | null;
  hasError: boolean;
  isRetrying: boolean;
  retryCount: number;
  
  // Actions
  handleError: (error: Error | AppError, context?: ErrorContext) => AppError;
  clearError: () => void;
  retryOperation: <T>(
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>,
    context?: ErrorContext
  ) => Promise<Result<T>>;
  
  // Utils
  getUserFriendlyMessage: (error: AppError) => string;
  isRetryableError: (error: AppError) => boolean;
}

export const useErrorHandler = (
  componentName?: string,
  defaultContext?: Partial<ErrorContext>
): UseErrorHandlerReturn => {
  const [error, setError] = useState<AppError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  const handleError = useCallback((
    error: Error | AppError, 
    context?: ErrorContext
  ): AppError => {
    const enhancedContext: ErrorContext = {
      component: componentName,
      ...defaultContext,
      ...context,
    };

    let appError: AppError;
    
    if ('code' in error) {
      // Already an AppError
      appError = error;
    } else {
      // Convert Error to AppError
      appError = errorHandler.createError(
        errorHandler.categorizeError(error),
        error.message,
        enhancedContext,
        error
      );
    }

    setError(appError);
    return appError;
  }, [componentName, defaultContext]);

  const retryOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>,
    context?: ErrorContext
  ): Promise<Result<T>> => {
    setIsRetrying(true);
    setRetryCount(0);
    
    const enhancedContext: ErrorContext = {
      component: componentName,
      ...defaultContext,
      ...context,
    };

    try {
      const result = await withRetry(
        operation,
        config,
        enhancedContext
      );

      if (result.success) {
        clearError();
      } else {
        setError(result.error);
        setRetryCount((result.error.details as any)?.context?.retryCount || 0);
      }

      return result;
    } finally {
      setIsRetrying(false);
    }
  }, [componentName, defaultContext, clearError]);

  const isRetryableErrorFn = useCallback((error: AppError): boolean => {
    return errorHandler.isRetryableError(error);
  }, []);

  const getUserFriendlyMessageFn = useCallback((error: AppError): string => {
    return getUserFriendlyMessage(error);
  }, []);

  return {
    error,
    hasError: error !== null,
    isRetrying,
    retryCount,
    handleError,
    clearError,
    retryOperation,
    getUserFriendlyMessage: getUserFriendlyMessageFn,
    isRetryableError: isRetryableErrorFn,
  };
};

// Hook pour les erreurs spécifiques aux APIs
export const useApiErrorHandler = (apiName: string) => {
  return useErrorHandler(apiName, { 
    action: 'api_call',
    component: `${apiName}API` 
  });
};

// Hook pour les erreurs de composants React
export const useComponentErrorHandler = (componentName: string) => {
  return useErrorHandler(componentName, { 
    component: componentName 
  });
};

// Hook pour capturer et reporter automatiquement les erreurs non gérées
export const useGlobalErrorHandler = () => {
  useEffect(() => {
    const handleUnhandledError = (event: ErrorEvent) => {
      console.error('[GlobalErrorHandler] Unhandled error:', event.error);
      
      const appError = createAppError(
        ErrorCode.UNKNOWN_ERROR,
        event.message || 'Unhandled JavaScript error',
        {
          component: 'GlobalErrorHandler',
          action: 'unhandled_error',
          additionalData: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          }
        },
        event.error
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[GlobalErrorHandler] Unhandled promise rejection:', event.reason);
      
      const appError = createAppError(
        ErrorCode.UNKNOWN_ERROR,
        'Unhandled promise rejection',
        {
          component: 'GlobalErrorHandler',
          action: 'unhandled_promise_rejection',
          additionalData: {
            reason: event.reason,
          }
        }
      );
    };

    // Attach global error handlers
    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
};

export default useErrorHandler; 