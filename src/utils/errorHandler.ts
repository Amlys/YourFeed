import React from 'react';
import { AppError, Result, createSuccess, createError, createBrandedString } from '../types/common';

// Types d'erreurs standardisés
export enum ErrorCode {
  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_TIMEOUT = 'API_TIMEOUT',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  API_UNAUTHORIZED = 'API_UNAUTHORIZED',
  API_FORBIDDEN = 'API_FORBIDDEN',
  API_NOT_FOUND = 'API_NOT_FOUND',
  API_SERVER_ERROR = 'API_SERVER_ERROR',
  
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Authentication Errors
  AUTH_ERROR = 'AUTH_ERROR',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  
  // Business Logic Errors
  CHANNEL_NOT_FOUND = 'CHANNEL_NOT_FOUND',
  VIDEO_NOT_AVAILABLE = 'VIDEO_NOT_AVAILABLE',
  FAVORITES_LIMIT_EXCEEDED = 'FAVORITES_LIMIT_EXCEEDED',
  
  // System Errors
  MEMORY_ERROR = 'MEMORY_ERROR',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  BROWSER_NOT_SUPPORTED = 'BROWSER_NOT_SUPPORTED',
  
  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
  userAgent?: string;
  url?: string;
  retryCount?: number;
  additionalData?: Record<string, any>;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffFactor: number;
  retryableErrors: ErrorCode[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableErrors: [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.API_TIMEOUT,
    ErrorCode.API_RATE_LIMIT,
    ErrorCode.API_SERVER_ERROR,
  ],
};

// Centralized Error Handler Class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorReportingEnabled: boolean = process.env.NODE_ENV === 'production';
  private sessionId: string = this.generateSessionId();

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Creates a standardized AppError
   */
  createError(
    code: ErrorCode,
    message: string,
    context?: ErrorContext,
    originalError?: Error
  ): AppError {
    const enhancedContext: ErrorContext = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context,
    };

    const appError: AppError = {
      code,
      message,
      details: {
        context: enhancedContext,
        originalError: originalError ? {
          name: originalError.name,
          message: originalError.message,
          stack: originalError.stack,
        } : undefined,
      },
      timestamp: createBrandedString<'ISO8601Date'>(enhancedContext.timestamp!),
    };

    // Log error
    console.error(`[ErrorHandler] ${code}:`, {
      message,
      context: enhancedContext,
      originalError,
    });

    // Report to external service if enabled
    if (this.errorReportingEnabled) {
      this.reportError(appError);
    }

    return appError;
  }

  /**
   * Determines if an error is retryable
   */
  isRetryableError(error: AppError, config: RetryConfig = DEFAULT_RETRY_CONFIG): boolean {
    return config.retryableErrors.includes(error.code as ErrorCode);
  }

  /**
   * Calculates retry delay with exponential backoff
   */
  calculateRetryDelay(attemptCount: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
    const delay = config.baseDelay * Math.pow(config.backoffFactor, attemptCount - 1);
    return Math.min(delay, config.maxDelay);
  }

  /**
   * Executes a function with retry logic
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG,
    context?: ErrorContext
  ): Promise<Result<T>> {
    let lastError: AppError | null = null;
    
    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          console.info(`[ErrorHandler] Operation succeeded on attempt ${attempt}`);
        }
        
        return createSuccess(result);
      } catch (error) {
        const appError = error instanceof Error 
          ? this.createError(
              this.categorizeError(error),
              error.message,
              { ...context, retryCount: attempt - 1 },
              error
            )
          : this.createError(
              ErrorCode.UNKNOWN_ERROR,
              'Unknown error occurred',
              { ...context, retryCount: attempt - 1 }
            );

        lastError = appError;

        // Check if we should retry
        if (attempt <= config.maxRetries && this.isRetryableError(appError, config)) {
          const delay = this.calculateRetryDelay(attempt, config);
          console.warn(`[ErrorHandler] Attempt ${attempt} failed, retrying in ${delay}ms:`, appError.message);
          
          await this.delay(delay);
          continue;
        } else {
          console.error(`[ErrorHandler] Operation failed after ${attempt} attempts:`, appError);
          break;
        }
      }
    }

    return createError(lastError!);
  }

  /**
   * Categorizes unknown errors into standard error codes
   */
  categorizeError(error: Error): ErrorCode {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorCode.NETWORK_ERROR;
    }
    
    if (message.includes('timeout')) {
      return ErrorCode.API_TIMEOUT;
    }
    
    if (message.includes('unauthorized') || message.includes('401')) {
      return ErrorCode.API_UNAUTHORIZED;
    }
    
    if (message.includes('forbidden') || message.includes('403')) {
      return ErrorCode.API_FORBIDDEN;
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return ErrorCode.API_NOT_FOUND;
    }
    
    if (message.includes('rate limit') || message.includes('429')) {
      return ErrorCode.API_RATE_LIMIT;
    }
    
    if (message.includes('server error') || message.includes('500')) {
      return ErrorCode.API_SERVER_ERROR;
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCode.VALIDATION_ERROR;
    }
    
    return ErrorCode.UNKNOWN_ERROR;
  }

  /**
   * Reports error to external service
   */
  private async reportError(error: AppError): Promise<void> {
    try {
      // Integration with error reporting service
      // Example: Sentry, LogRocket, Bugsnag, etc.
      
      const errorReport = {
        errorId: `${error.code}_${Date.now()}`,
        code: error.code,
        message: error.message,
        timestamp: error.timestamp,
        context: error.details,
        severity: this.getErrorSeverity(error.code as ErrorCode),
        fingerprint: this.generateErrorFingerprint(error),
      };

      // Simulate API call to error reporting service
      console.info('[ErrorHandler] Error reported:', errorReport.errorId);
      
      // In production, this would be:
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // });
      
    } catch (reportingError) {
      console.warn('[ErrorHandler] Failed to report error:', reportingError);
    }
  }

  /**
   * Determines error severity for prioritization
   */
  private getErrorSeverity(errorCode: ErrorCode): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<ErrorCode, 'low' | 'medium' | 'high' | 'critical'> = {
      [ErrorCode.NETWORK_ERROR]: 'medium',
      [ErrorCode.API_TIMEOUT]: 'medium',
      [ErrorCode.API_RATE_LIMIT]: 'low',
      [ErrorCode.API_UNAUTHORIZED]: 'high',
      [ErrorCode.API_FORBIDDEN]: 'high',
      [ErrorCode.API_NOT_FOUND]: 'medium',
      [ErrorCode.API_SERVER_ERROR]: 'high',
      [ErrorCode.VALIDATION_ERROR]: 'low',
      [ErrorCode.INVALID_INPUT]: 'low',
      [ErrorCode.MISSING_REQUIRED_FIELD]: 'low',
      [ErrorCode.AUTH_ERROR]: 'high',
      [ErrorCode.AUTH_TOKEN_EXPIRED]: 'medium',
      [ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: 'medium',
      [ErrorCode.CHANNEL_NOT_FOUND]: 'low',
      [ErrorCode.VIDEO_NOT_AVAILABLE]: 'low',
      [ErrorCode.FAVORITES_LIMIT_EXCEEDED]: 'low',
      [ErrorCode.MEMORY_ERROR]: 'high',
      [ErrorCode.STORAGE_QUOTA_EXCEEDED]: 'medium',
      [ErrorCode.BROWSER_NOT_SUPPORTED]: 'medium',
      [ErrorCode.UNKNOWN_ERROR]: 'medium',
    };

    return severityMap[errorCode] || 'medium';
  }

  /**
   * Generates a fingerprint for error deduplication
   */
  private generateErrorFingerprint(error: AppError): string {
    const { code, message } = error;
    const component = (error.details as any)?.context?.component || 'unknown';
    return `${code}_${component}_${this.hashString(message)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gets user-friendly error messages
   */
  getUserFriendlyMessage(error: AppError): string {
    const messageMap: Partial<Record<ErrorCode, string>> = {
      [ErrorCode.NETWORK_ERROR]: 'Connection problem. Please check your internet connection.',
      [ErrorCode.API_TIMEOUT]: 'Request timed out. Please try again.',
      [ErrorCode.API_RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
      [ErrorCode.API_UNAUTHORIZED]: 'Please sign in to continue.',
      [ErrorCode.API_FORBIDDEN]: 'You don\'t have permission to perform this action.',
      [ErrorCode.API_NOT_FOUND]: 'The requested resource was not found.',
      [ErrorCode.API_SERVER_ERROR]: 'Server error. Our team has been notified.',
      [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
      [ErrorCode.CHANNEL_NOT_FOUND]: 'Channel not found. Please check the channel name.',
      [ErrorCode.VIDEO_NOT_AVAILABLE]: 'Video is not available at the moment.',
      [ErrorCode.FAVORITES_LIMIT_EXCEEDED]: 'You\'ve reached the maximum number of favorites.',
      [ErrorCode.STORAGE_QUOTA_EXCEEDED]: 'Storage is full. Please free up some space.',
      [ErrorCode.BROWSER_NOT_SUPPORTED]: 'Your browser is not supported. Please upgrade.',
    };

    return messageMap[error.code as ErrorCode] || 'An unexpected error occurred. Please try again.';
  }
}

// Convenience functions
export const errorHandler = ErrorHandler.getInstance();

export const createAppError = (
  code: ErrorCode,
  message: string,
  context?: ErrorContext,
  originalError?: Error
): AppError => errorHandler.createError(code, message, context, originalError);

export const withRetry = <T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>,
  context?: ErrorContext
): Promise<Result<T>> => errorHandler.withRetry(operation, { ...DEFAULT_RETRY_CONFIG, ...config }, context);

export const getUserFriendlyMessage = (error: AppError): string => 
  errorHandler.getUserFriendlyMessage(error);

// React Hook for Error Handling
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error | AppError, context?: ErrorContext) => {
    if ('code' in error) {
      // Already an AppError
      return error;
    } else {
      // Convert Error to AppError
      return errorHandler.createError(
        errorHandler.categorizeError(error),
        error.message,
        context,
        error
      );
    }
  }, []);

  const retryOperation = React.useCallback(<T>(
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>,
    context?: ErrorContext
  ) => {
    return withRetry(operation, config, context);
  }, []);

  return {
    handleError,
    retryOperation,
    getUserFriendlyMessage,
    isRetryableError: errorHandler.isRetryableError.bind(errorHandler),
  };
};

export default ErrorHandler; 