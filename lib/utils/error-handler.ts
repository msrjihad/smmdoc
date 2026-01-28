/**
 * Centralized error handling utility
 * Provides consistent error handling across the application
 */

import { logger } from './logger';
import { formatError } from '../utils';

export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: string;
  code?: string;
  statusCode: number;
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: string
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: string) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

/**
 * Handle errors and return standardized API response
 */
export function handleApiError(error: unknown): ApiErrorResponse {

  logger.error('API Error occurred', error);


  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
      statusCode: error.statusCode,
    };
  }


  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any;

    if (prismaError.code === 'P2002') {
      return {
        success: false,
        error: 'A record with this value already exists',
        code: 'DUPLICATE_ENTRY',
        statusCode: 409,
      };
    }

    if (prismaError.code === 'P2025') {
      return {
        success: false,
        error: 'Record not found',
        code: 'NOT_FOUND',
        statusCode: 404,
      };
    }
  }


  if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
    const zodError = error as any;
    const messages = zodError.errors?.map((e: any) => e.message).join(', ') || 'Validation failed';
    return {
      success: false,
      error: messages,
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    };
  }


  const errorMessage = formatError(error);

  return {
    success: false,
    error: errorMessage,
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  };
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      const errorResponse = handleApiError(error);
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: errorResponse.statusCode,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }) as T;
}

