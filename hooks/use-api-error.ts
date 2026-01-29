

import { useState, useCallback } from 'react';
import { getUserFriendlyErrorMessage, handleApiErrorResponse } from '@/lib/utils/frontend-error-handler';
import { logger } from '@/lib/utils/logger';

export function useApiError() {
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);

  const handleError = useCallback((error: unknown) => {
    const errorInfo = handleApiErrorResponse(error);
    setError(errorInfo.message);
    setErrorCode(errorInfo.code);
    logger.error('API Error in component', error, { code: errorInfo.code });
    return errorInfo.message;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setErrorCode(undefined);
  }, []);

  return {
    error,
    errorCode,
    handleError,
    clearError,
    setError,
  };
}

export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  onError?: (error: string) => void
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (error) {
    const errorMessage = getUserFriendlyErrorMessage(error);
    if (onError) {
      onError(errorMessage);
    }
    return { data: null, error: errorMessage };
  }
}

