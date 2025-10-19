import type { RemoteConsoleConfig, RemoteLogEntry } from './types';

/**
 * 终端日志拦截器
 * 捕获完整的终端输出并支持远程控制台
 */
export class TerminalInterceptor {
  private config: RemoteConsoleConfig;
  private logs: RemoteLogEntry[] = [];
  private subscribers: ((log: RemoteLogEntry) => void)[] = [];
  private isEnabled = false;

  constructor(config: RemoteConsoleConfig = {}) {
    this.config = {
      enabled: false,
      port: 3001,
      persistLogs: false,
      maxLogs: 1000,
      logLevels: ['info', 'warn', 'error', 'debug'],
      ...config
    };
  }

  /**
   * 启动终端日志拦截
   */
  start() {
    if (this.isEnabled || !this.config.enabled) return;

    this.isEnabled = true;
    this.setupProcessInterception();
    this.setupConsoleInterception();

    if (this.config.debug) {
      console.log('[Terminal Interceptor] 终端日志拦截已启用');
    }
  }

  /**
   * 停止终端日志拦截
   */
  stop() {
    this.isEnabled = false;

    if (this.config.debug) {
      console.log('[Terminal Interceptor] 终端日志拦截已停止');
    }
  }

  /**
   * 设置进程输出拦截
   */
  private setupProcessInterception() {
    // 拦截 stdout
    const originalStdoutWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk: any, encoding?: any, callback?: any) => {
      if (typeof chunk === 'string' && this.isEnabled) {
        this.addLog({
          level: 'info',
          message: chunk.trim(),
          timestamp: Date.now(),
          source: 'stdout'
        });
      }
      return originalStdoutWrite(chunk, encoding, callback);
    };

    // 拦截 stderr
    const originalStderrWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = (chunk: any, encoding?: any, callback?: any) => {
      if (typeof chunk === 'string' && this.isEnabled) {
        this.addLog({
          level: 'error',
          message: chunk.trim(),
          timestamp: Date.now(),
          source: 'stderr'
        });
      }
      return originalStderrWrite(chunk, encoding, callback);
    };
  }

  /**
   * 设置控制台方法拦截
   */
  private setupConsoleInterception() {
    // 保存原始方法
    const originalLog = console.log.bind(console);
    const originalWarn = console.warn.bind(console);
    const originalError = console.error.bind(console);
    const originalInfo = console.info.bind(console);
    const originalDebug = console.debug.bind(console);

    // 拦截 console.log
    console.log = (...args: any[]) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      this.addLog({
        level: 'info',
        message,
        timestamp: Date.now(),
        source: 'console.log',
        data: args.length > 1 ? args : undefined
      });

      originalLog(...args);
    };

    // 拦截 console.warn
    console.warn = (...args: any[]) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      this.addLog({
        level: 'warn',
        message,
        timestamp: Date.now(),
        source: 'console.warn',
        data: args.length > 1 ? args : undefined
      });

      originalWarn(...args);
    };

    // 拦截 console.error
    console.error = (...args: any[]) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      this.addLog({
        level: 'error',
        message,
        timestamp: Date.now(),
        source: 'console.error',
        data: args.length > 1 ? args : undefined
      });

      originalError(...args);
    };

    // 拦截 console.info
    console.info = (...args: any[]) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      this.addLog({
        level: 'info',
        message,
        timestamp: Date.now(),
        source: 'console.info',
        data: args.length > 1 ? args : undefined
      });

      originalInfo(...args);
    };

    // 拦截 console.debug
    console.debug = (...args: any[]) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      this.addLog({
        level: 'debug',
        message,
        timestamp: Date.now(),
        source: 'console.debug',
        data: args.length > 1 ? args : undefined
      });

      originalDebug(...args);
    };
  }

  /**
   * 添加日志
   */
  private addLog(log: RemoteLogEntry) {
    // 检查日志级别过滤
    if (this.config.logLevels && !this.config.logLevels.includes(log.level)) {
      return;
    }

    // 添加到日志数组
    this.logs.push(log);

    // 限制日志数量
    if (this.logs.length > this.config.maxLogs) {
      this.logs = this.logs.slice(-this.config.maxLogs);
    }

    // 通知订阅者
    this.subscribers.forEach(callback => callback(log));

    // 持久化日志（如果启用）
    if (this.config.persistLogs) {
      this.persistLog(log);
    }
  }

  /**
   * 持久化日志到 LocalStorage
   */
  private persistLog(log: RemoteLogEntry) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = 'xagi-terminal-logs';
        const existingLogs = JSON.parse(localStorage.getItem(key) || '[]');
        existingLogs.push(log);

        // 限制存储的日志数量
        if (existingLogs.length > 5000) {
          existingLogs.splice(0, existingLogs.length - 5000);
        }

        localStorage.setItem(key, JSON.stringify(existingLogs));
      }
    } catch (error) {
      console.error('[Terminal Interceptor] 持久化日志失败:', error);
    }
  }

  /**
   * 订阅日志更新
   */
  subscribe(callback: (log: RemoteLogEntry) => void) {
    this.subscribers.push(callback);

    // 返回取消订阅函数
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * 获取所有日志
   */
  getLogs(): RemoteLogEntry[] {
    return [...this.logs];
  }

  /**
   * 获取过滤后的日志
   */
  getFilteredLogs(filter: {
    level?: string;
    source?: string;
    startTime?: number;
    endTime?: number;
    search?: string;
  }): RemoteLogEntry[] {
    return this.logs.filter(log => {
      if (filter.level && log.level !== filter.level) return false;
      if (filter.source && log.source !== filter.source) return false;
      if (filter.startTime && log.timestamp < filter.startTime) return false;
      if (filter.endTime && log.timestamp > filter.endTime) return false;
      if (filter.search && !log.message.toLowerCase().includes(filter.search.toLowerCase())) return false;
      return true;
    });
  }

  /**
   * 清除日志
   */
  clearLogs() {
    this.logs = [];

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('xagi-terminal-logs');
    }
  }

  /**
   * 导出日志
   */
  exportLogs(format: 'json' | 'txt' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    } else {
      return this.logs.map(log =>
        `[${new Date(log.timestamp).toISOString()}] ${log.level.toUpperCase()} [${log.source}] ${log.message}`
      ).join('\n');
    }
  }

  /**
   * 获取日志统计
   */
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      recentCount: 0
    };

    // 统计按级别分组
    this.logs.forEach(log => {
      const level = log.level || 'unknown';
      const source = log.source || 'unknown';

      stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;
      stats.bySource[source] = (stats.bySource[source] || 0) + 1;

      // 统计最近5分钟的日志
      if (Date.now() - log.timestamp < 5 * 60 * 1000) {
        stats.recentCount++;
      }
    });

    return stats;
  }
}