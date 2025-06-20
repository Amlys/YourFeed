import React from 'react';
import { AlertTriangle, RefreshCw, X, Info, AlertCircle, XCircle } from 'lucide-react';
import { AppError } from '../types/common';
import { ErrorCode, getUserFriendlyMessage } from '../utils/errorHandler';

interface ErrorDisplayProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'inline' | 'banner' | 'modal' | 'toast';
  showRetry?: boolean;
  showDetails?: boolean;
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  variant = 'inline',
  showRetry = true,
  showDetails = false,
  className = '',
}) => {
  const userMessage = getUserFriendlyMessage(error);
  const severity = getSeverityFromErrorCode(error.code);
  const Icon = getIconForSeverity(severity);

  const baseClasses = getBaseClasses(variant, severity);
  const iconColor = getIconColor(severity);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  if (variant === 'toast') {
    return (
      <div className={`fixed top-4 right-4 z-50 max-w-sm ${baseClasses} ${className}`}>
        <div className="flex items-start">
          <Icon className={`${iconColor} mt-0.5 flex-shrink-0`} size={20} />
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Error
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {userMessage}
            </p>
            {showRetry && onRetry && (
              <button
                onClick={handleRetry}
                className="mt-2 text-xs text-red-600 hover:text-red-700 underline"
              >
                Try again
              </button>
            )}
          </div>
          {onDismiss && (
            <button
              onClick={handleDismiss}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`${baseClasses} ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Icon className={`${iconColor} flex-shrink-0`} size={20} />
            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
              {userMessage}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {showRetry && onRetry && (
              <button
                onClick={handleRetry}
                className="text-sm text-red-600 hover:text-red-700 underline"
              >
                Retry
              </button>
            )}
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center mb-4">
            <Icon className={`${iconColor} mr-3`} size={24} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Error Occurred
            </h3>
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {userMessage}
          </p>

          {showDetails && (
            <details className="mb-4">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                <p><strong>Code:</strong> {error.code}</p>
                <p><strong>Message:</strong> {error.message}</p>
                <p><strong>Timestamp:</strong> {error.timestamp}</p>
              </div>
            </details>
          )}

          <div className="flex justify-end space-x-3">
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
              >
                Close
              </button>
            )}
            {showRetry && onRetry && (
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center"
              >
                <RefreshCw size={16} className="mr-2" />
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default inline variant
  return (
    <div className={`${baseClasses} ${className}`}>
      <div className="flex items-start">
        <Icon className={`${iconColor} mt-0.5 flex-shrink-0`} size={20} />
        <div className="ml-3 flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {userMessage}
          </p>
          
          {showDetails && (
            <details className="mt-2">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                Details
              </summary>
              <div className="mt-1 text-xs text-gray-500">
                <p>Code: {error.code}</p>
                <p>Time: {new Date(error.timestamp).toLocaleString()}</p>
              </div>
            </details>
          )}

          {showRetry && onRetry && (
            <button
              onClick={handleRetry}
              className="mt-2 text-xs text-red-600 hover:text-red-700 underline flex items-center"
            >
              <RefreshCw size={12} className="mr-1" />
              Try again
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

// Helper functions
function getSeverityFromErrorCode(code: string): 'low' | 'medium' | 'high' | 'critical' {
  const highSeverityErrors = [
    ErrorCode.API_UNAUTHORIZED,
    ErrorCode.API_FORBIDDEN,
    ErrorCode.API_SERVER_ERROR,
    ErrorCode.AUTH_ERROR,
    ErrorCode.MEMORY_ERROR,
  ];

  const mediumSeverityErrors = [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.API_TIMEOUT,
    ErrorCode.API_NOT_FOUND,
    ErrorCode.AUTH_TOKEN_EXPIRED,
    ErrorCode.STORAGE_QUOTA_EXCEEDED,
    ErrorCode.BROWSER_NOT_SUPPORTED,
  ];

  const lowSeverityErrors = [
    ErrorCode.API_RATE_LIMIT,
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.INVALID_INPUT,
    ErrorCode.MISSING_REQUIRED_FIELD,
    ErrorCode.CHANNEL_NOT_FOUND,
    ErrorCode.VIDEO_NOT_AVAILABLE,
    ErrorCode.FAVORITES_LIMIT_EXCEEDED,
  ];

  if (highSeverityErrors.includes(code as ErrorCode)) return 'high';
  if (mediumSeverityErrors.includes(code as ErrorCode)) return 'medium';
  if (lowSeverityErrors.includes(code as ErrorCode)) return 'low';
  
  return 'medium';
}

function getIconForSeverity(severity: 'low' | 'medium' | 'high' | 'critical') {
  switch (severity) {
    case 'low': return Info;
    case 'medium': return AlertCircle;
    case 'high': return AlertTriangle;
    case 'critical': return XCircle;
    default: return AlertCircle;
  }
}

function getIconColor(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (severity) {
    case 'low': return 'text-blue-500';
    case 'medium': return 'text-yellow-500';
    case 'high': return 'text-red-500';
    case 'critical': return 'text-red-600';
    default: return 'text-yellow-500';
  }
}

function getBaseClasses(
  variant: 'inline' | 'banner' | 'modal' | 'toast',
  severity: 'low' | 'medium' | 'high' | 'critical'
): string {
  const severityClasses = {
    low: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    medium: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    high: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    critical: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
  };

  const baseClass = 'border rounded-lg p-4';
  
  if (variant === 'banner') {
    return `${baseClass} ${severityClasses[severity]}`;
  }
  
  if (variant === 'toast') {
    return `${baseClass} ${severityClasses[severity]} shadow-lg`;
  }
  
  return `${baseClass} ${severityClasses[severity]}`;
}

export default ErrorDisplay; 