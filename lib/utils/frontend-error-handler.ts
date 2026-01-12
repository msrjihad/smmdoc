/**
 * Frontend Error Handler Utility
 * Provides consistent error handling and display for frontend components
 */

import { logger } from './logger';

export interface ApiError {
  message: string;
  code?: string;
  details?: string;
  statusCode?: number;
}

/**
 * Extract user-friendly error message from API response
 */
export function extractErrorMessage(error: unknown): string {
  // Handle Response object
  if (error instanceof Response) {
    return `HTTP ${error.status}: ${error.statusText}`;
  }

  // Handle Error object
  if (error instanceof Error) {
    return error.message;
  }

  // Handle API error response
  if (error && typeof error === 'object') {
    const apiError = error as any;
    
    // Check for standardized error response
    if (apiError.error) {
      return apiError.error;
    }
    
    // Check for message field
    if (apiError.message) {
      return apiError.message;
    }
    
    // Check for error details
    if (apiError.details) {
      return apiError.details;
    }
    
    // Check for response.data (axios style)
    if (apiError.response?.data) {
      const data = apiError.response.data;
      if (data.error) return data.error;
      if (data.message) return data.message;
      if (data.details) return data.details;
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Default fallback
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Extract database error message (user-friendly)
 */
export function extractDatabaseErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const dbError = error as any;
    
    // Prisma errors
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
    
    // Database connection errors
    if (dbError.name === 'PrismaClientInitializationError') {
      return 'Database connection failed. Please try again later.';
    }
    
    // Check for meta information
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

/**
 * Handle API error and return user-friendly message
 */
export function handleApiErrorResponse(error: unknown): {
  message: string;
  code?: string;
  statusCode?: number;
} {
  logger.error('Frontend API Error', error);
  
  if (error && typeof error === 'object') {
    const apiError = error as any;
    
    // Check for standardized error response
    if (apiError.error || apiError.message) {
      return {
        message: apiError.error || apiError.message,
        code: apiError.code,
        statusCode: apiError.statusCode || apiError.status,
      };
    }
    
    // Check for response.data (axios/fetch style)
    if (apiError.response?.data) {
      const data = apiError.response.data;
      return {
        message: data.error || data.message || 'Request failed',
        code: data.code,
        statusCode: apiError.response.status,
      };
    }
    
    // Check for status (fetch Response)
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

/**
 * Check if error is a network error
 */
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

/**
 * Check if error is a timeout error
 */
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

/**
 * Get user-friendly error message based on error type
 */
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

