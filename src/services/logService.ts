import api from './api';

interface LogEntry {
  level: 'debug' | 'info' | 'warning' | 'error';
  message: string;
  context?: Record<string, any>;
  timestamp: string;
  source: 'frontend' | 'react';
  component?: string;
  user_id?: number;
  session_id?: string;
}

class LogService {
  private logQueue: LogEntry[] = [];
  private batchSize = 10;
  private flushInterval = 5000; // 5 seconds
  private sessionId: string;
  private userId?: number;
  private isOnline = navigator.onLine;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupBatchLogging();
    this.setupOnlineStatusListener();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupBatchLogging() {
    // Flush logs periodically
    setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);

    // Flush logs before page unload
    window.addEventListener('beforeunload', () => {
      this.flushLogs(true);
    });
  }

  private setupOnlineStatusListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushLogs();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  setUserId(userId: number | undefined) {
    this.userId = userId;
  }

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    context?: Record<string, any>,
    component?: string
  ): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      source: 'react',
      component,
      user_id: this.userId,
      session_id: this.sessionId
    };
  }

  debug(message: string, context?: Record<string, any>, component?: string) {
    const logEntry = this.createLogEntry('debug', message, context, component);
    this.addToQueue(logEntry);
    console.debug(`[${component || 'App'}] ${message}`, context);
  }

  info(message: string, context?: Record<string, any>, component?: string) {
    const logEntry = this.createLogEntry('info', message, context, component);
    this.addToQueue(logEntry);
    console.info(`[${component || 'App'}] ${message}`, context);
  }

  warning(message: string, context?: Record<string, any>, component?: string) {
    const logEntry = this.createLogEntry('warning', message, context, component);
    this.addToQueue(logEntry);
    console.warn(`[${component || 'App'}] ${message}`, context);
  }

  error(message: string, context?: Record<string, any>, component?: string) {
    const logEntry = this.createLogEntry('error', message, context, component);
    this.addToQueue(logEntry);
    console.error(`[${component || 'App'}] ${message}`, context);
    
    // Send error logs immediately
    this.sendLogToBackend(logEntry);
  }

  private addToQueue(logEntry: LogEntry) {
    this.logQueue.push(logEntry);
    
    // Flush if queue is full
    if (this.logQueue.length >= this.batchSize) {
      this.flushLogs();
    }
  }

  private async flushLogs(isSync = false) {
    if (this.logQueue.length === 0 || !this.isOnline) {
      return;
    }

    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      if (logsToSend.length === 1) {
        await this.sendLogToBackend(logsToSend[0], isSync);
      } else {
        await this.sendBatchLogsToBackend(logsToSend, isSync);
      }
    } catch (error) {
      // If sending fails, add logs back to queue (but limit queue size)
      this.logQueue = [...logsToSend.slice(-this.batchSize), ...this.logQueue];
      console.error('Failed to send logs to backend:', error);
    }
  }

  private async sendLogToBackend(logEntry: LogEntry, isSync = false) {
    try {
      if (isSync && navigator.sendBeacon) {
        // Use sendBeacon for synchronous requests (page unload)
        const data = JSON.stringify(logEntry);
        navigator.sendBeacon('/api/logs/frontend', data);
      } else {
        await api.post('/logs/frontend', logEntry);
      }
    } catch (error) {
      console.error('Failed to send log to backend:', error);
      throw error;
    }
  }

  private async sendBatchLogsToBackend(logs: LogEntry[], isSync = false) {
    try {
      if (isSync && navigator.sendBeacon) {
        // Use sendBeacon for synchronous requests (page unload)
        const data = JSON.stringify({ logs });
        navigator.sendBeacon('/api/logs/frontend/batch', data);
      } else {
        await api.post('/logs/frontend/batch', { logs });
      }
    } catch (error) {
      console.error('Failed to send batch logs to backend:', error);
      throw error;
    }
  }

  // Manual flush method
  async flush() {
    await this.flushLogs();
  }

  // Get current session info
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      queueSize: this.logQueue.length,
      isOnline: this.isOnline
    };
  }
}

// Create singleton instance
export const logService = new LogService();

// Export types for use in other files
export type { LogEntry };