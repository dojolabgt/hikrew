/**
 * Logger utility for frontend
 * Automatically respects NODE_ENV to control log output
 */
type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

class Logger {
    private isDevelopment: boolean;

    constructor() {
        this.isDevelopment = process.env.NODE_ENV !== 'production';
    }

    private shouldLog(level: LogLevel): boolean {
        // In production, only log warnings and errors
        if (!this.isDevelopment) {
            return level === 'warn' || level === 'error';
        }
        return true;
    }

    log(...args: unknown[]): void {
        if (this.shouldLog('log')) {
            console.log('[LOG]', ...args);
        }
    }

    info(...args: unknown[]): void {
        if (this.shouldLog('info')) {
            console.info('[INFO]', ...args);
        }
    }

    warn(...args: unknown[]): void {
        if (this.shouldLog('warn')) {
            console.warn('[WARN]', ...args);
        }
    }

    error(...args: unknown[]): void {
        if (this.shouldLog('error')) {
            console.error('[ERROR]', ...args);
        }
    }

    debug(...args: unknown[]): void {
        if (this.shouldLog('debug')) {
            console.debug('[DEBUG]', ...args);
        }
    }
}

export const logger = new Logger();