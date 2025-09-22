/**
 * System-level logger utility
 * Simple logger for infrastructure layer
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  data?: unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatEntry(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Human-readable format for development
      return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${
        entry.data ? `\n${JSON.stringify(entry.data, null, 2)}` : ''
      }`
    }

    // JSON format for production
    return JSON.stringify(entry)
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data
    }

    const formattedEntry = this.formatEntry(entry)

    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formattedEntry)
        }
        break
      case 'info':
        console.info(formattedEntry)
        break
      case 'warn':
        console.warn(formattedEntry)
        break
      case 'error':
        console.error(formattedEntry)
        break
    }
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data)
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data)
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data)
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data)
  }
}

// Singleton instance
export const logger = new Logger()

// Export convenience functions
export const logDebug = (message: string, data?: unknown) => logger.debug(message, data)
export const logInfo = (message: string, data?: unknown) => logger.info(message, data)
export const logWarn = (message: string, data?: unknown) => logger.warn(message, data)
export const logError = (message: string, data?: unknown) => logger.error(message, data)