/**
 * Logger utility for consistent logging across the application
 * Follows best practices for development and production environments
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private shouldLog(level: LogLevel): boolean {
    if (!this.isDevelopment) {
      // In production, only log errors and warnings
      return level === 'error' || level === 'warn'
    }
    return true
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`🐛 ${message}`, ...args)
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(`ℹ️ ${message}`, ...args)
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`⚠️ ${message}`, ...args)
    }
  }

  error(message: string, error?: unknown, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(`❌ ${message}`, error, ...args)
    }
  }

  // Specific methods for common use cases
  apiCall(endpoint: string, method: string = 'GET'): void {
    this.debug(`API Call: ${method} ${endpoint}`)
  }

  apiResponse(endpoint: string, status: number, duration?: number): void {
    const durationText = duration ? ` (${duration}ms)` : ''
    if (status >= 400) {
      this.warn(`API Response: ${endpoint} - ${status}${durationText}`)
    } else {
      this.debug(`API Response: ${endpoint} - ${status}${durationText}`)
    }
  }

  userAction(action: string, details?: Record<string, unknown>): void {
    this.info(`User Action: ${action}`, details)
  }

  featureUsage(feature: string, details?: Record<string, unknown>): void {
    this.debug(`Feature Usage: ${feature}`, details)
  }
}

export const logger = new Logger()