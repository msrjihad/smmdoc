

import { logger } from './logger';

export interface ApiError {
  message: string;
  code?: string;
  details?: string;
  statusCode?: number;
}

export function extractErrorMessage(error: unknown): string {

  if (error instanceof Response) {
    return `HTTP ${error.status}: ${error.statusText}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const apiError = error as any;

    if (apiError.error) {
      return apiError.error;
    }

    if (apiError.message) {
      return apiError.message;
    }

    if (apiError.details) {
      return apiError.details;
    }

    if (apiError.response?.data) {
      const data = apiError.response.data;
      if (data.error) return data.error;
      if (data.message) return data.message;
      if (data.details) return data.details;
    }
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred. Please try again.';
}

export function extractDatabaseErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const dbError = error as any;

    if (dbError.code) {
      switch (dbError.code) {
        case 'P2002':
          return 'This record already exists. Please use a different value.';
        case 'P2025':
          return 'The requested record was not found.';
        case 'P2003':
          return 'Invalid reference. Please check your input.';
        case 'P2011':
          return 'Required field is missing.';
        case 'P2012':
          return 'A required value is missing.';
        case 'P2014':
          return 'Invalid ID provided.';
        case 'P2015':
          return 'Related record not found.';
        default:
          return extractErrorMessage(error);
      }
    }

    if (dbError.name === 'PrismaClientInitializationError') {
      return 'Database connection failed. Please try again later.';
    }

    if (dbError.meta) {
      if (dbError.meta.target) {
        const field = Array.isArray(dbError.meta.target)
          ? dbError.meta.target[0]
          : dbError.meta.target;
        return `The ${field} field has an invalid value.`;
      }
    }
  }

  return extractErrorMessage(error);
}

export function handleApiErrorResponse(error: unknown): {
  message: string;
  code?: string;
  statusCode?: number;
} {
  logger.error('Frontend API Error', error);

  if (error && typeof error === 'object') {
    const apiError = error as any;

    if (apiError.error || apiError.message) {
      return {
        message: apiError.error || apiError.message,
        code: apiError.code,
        statusCode: apiError.statusCode || apiError.status,
      };
    }

    if (apiError.response?.data) {
      const data = apiError.response.data;
      return {
        message: data.error || data.message || 'Request failed',
        code: data.code,
        statusCode: apiError.response.status,
      };
    }

    if (apiError.status) {
      return {
        message: extractErrorMessage(error),
        statusCode: apiError.status,
      };
    }
  }

  return {
    message: extractDatabaseErrorMessage(error),
  };
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch') ||
      error.name === 'NetworkError' ||
      error.name === 'TypeError'
    );
  }
  return false;
}

export function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('timeout') ||
      error.name === 'TimeoutError' ||
      error.name === 'AbortError'
    );
  }
  return false;
}

export function getUserFriendlyErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }

  if (isTimeoutError(error)) {
    return 'Request timed out. Please try again.';
  }

  const handled = handleApiErrorResponse(error);
  return handled.message;
}

