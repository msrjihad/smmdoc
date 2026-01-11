/**
 * Centralized logging utility
 * Replaces console.log/error/warn with production-safe logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext | Error | unknown): void {
    if (this.shouldLog('warn')) {
      // Handle Error objects and unknown types
      const logContext = context instanceof Error
        ? { message: context.message, stack: context.stack, name: context.name }
        : context as LogContext | undefined;
      console.warn(this.formatMessage('warn', message, logContext));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorDetails = error instanceof Error 
        ? { message: error.message, stack: error.stack, name: error.name }
        : { error };
      
      console.error(
        this.formatMessage('error', message, { ...context, ...errorDetails })
      );
    }
  }

  // API request logging
  apiRequest(method: string, url: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.debug(`API Request: ${method.toUpperCase()} ${url}`, context);
    }
  }

  apiResponse(status: number, url: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.info(`API Response: ${status} ${url}`, context);
    }
  }

  apiError(method: string, url: string, error: Error | unknown, context?: LogContext): void {
    this.error(`API Error: ${method.toUpperCase()} ${url}`, error, context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for convenience
export default logger;

