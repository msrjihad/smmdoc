'use client';

import { FaExclamationTriangle, FaTimes, FaRedo } from 'react-icons/fa';
import { getUserFriendlyErrorMessage } from '@/lib/utils/frontend-error-handler';

interface ApiErrorDisplayProps {
  error: unknown;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showRetry?: boolean;
}

export function ApiErrorDisplay({
  error,
  onRetry,
  onDismiss,
  className = '',
  showRetry = true,
}: ApiErrorDisplayProps) {
  if (!error) return null;

  const errorMessage = getUserFriendlyErrorMessage(error);

  return (
    <div
      className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <FaExclamationTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-red-800 dark:text-red-200 font-semibold mb-1">
            Error
          </h3>
          <p className="text-red-700 dark:text-red-300 text-sm">
            {errorMessage}
          </p>
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
            >
              <FaRedo className="w-3 h-3" />
              Try Again
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors"
            aria-label="Dismiss error"
          >
            <FaTimes className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        )}
      </div>
    </div>
  );
}

export function DatabaseErrorDisplay({
  error,
  onRetry,
  onDismiss,
  className = '',
}: Omit<ApiErrorDisplayProps, 'showRetry'>) {
  if (!error) return null;

  const errorMessage = getUserFriendlyErrorMessage(error);

  const isDatabaseError =
    errorMessage.includes('database') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('record') ||
    errorMessage.includes('constraint');

  if (!isDatabaseError) {
    return <ApiErrorDisplay error={error} onRetry={onRetry} onDismiss={onDismiss} className={className} />;
  }

  return (
    <div
      className={`bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <FaExclamationTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-orange-800 dark:text-orange-200 font-semibold mb-1">
            Database Error
          </h3>
          <p className="text-orange-700 dark:text-orange-300 text-sm">
            {errorMessage}
          </p>
          <p className="text-orange-600 dark:text-orange-400 text-xs mt-2">
            If this problem persists, please contact support.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition-colors"
            >
              <FaRedo className="w-3 h-3" />
              Retry
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 hover:bg-orange-100 dark:hover:bg-orange-900/40 rounded transition-colors"
            aria-label="Dismiss error"
          >
            <FaTimes className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </button>
        )}
      </div>
    </div>
  );
}

