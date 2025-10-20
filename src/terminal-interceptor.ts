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
  private isRunning = false; // 添加运行状态属性
  private originalStdoutWrite?: any;
  private originalStderrWrite?: any;
  private originalConsoleMethods?: {
    log?: any;
    warn?: any;
    error?: any;
    info?: any;
    debug?: any;
  };

  constructor(config: RemoteConsoleConfig = {}) {
    this.config = {
      enabled: false,
      port: 3001,
      persistLogs: false,
      maxLogs: 2000,
      logLevels: ['info', 'warn', 'error', 'debug'],
      debug: false,
      ...config
    };
  }

  /**
   * 启动终端日志拦截
   */
  start() {
    if (this.isRunning) return;

    this.isEnabled = true;
    this.isRunning = true;
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
    this.isRunning = false;

    // 恢复原始方法
    if (this.originalStdoutWrite) {
      process.stdout.write = this.originalStdoutWrite;
    }
    if (this.originalStderrWrite) {
      process.stderr.write = this.originalStderrWrite;
    }
    if (this.originalConsoleMethods) {
      console.log = this.originalConsoleMethods.log!;
      console.warn = this.originalConsoleMethods.warn!;
      console.error = this.originalConsoleMethods.error!;
      console.info = this.originalConsoleMethods.info!;
      console.debug = this.originalConsoleMethods.debug!;
    }

    if (this.config.debug) {
      console.log('[Terminal Interceptor] 终端日志拦截已停止');
    }
  }

  /**
   * 设置进程输出拦截
   */
  private setupProcessInterception() {
    // 保存原始方法
    this.originalStdoutWrite = process.stdout.write.bind(process.stdout);
    this.originalStderrWrite = process.stderr.write.bind(process.stderr);

    // 拦截 stdout
    process.stdout.write = (chunk: any, encoding?: any, callback?: any) => {
      try {
        if (typeof chunk === 'string' && this.isEnabled) {
          // 处理多行日志
          const lines = chunk.split('\n').filter(line => line.trim());
          lines.forEach(line => {
            const level = this.detectLogLevel(line);
            this.addLog({
              level,
              message: line.trim(),
              timestamp: Date.now(),
              source: 'stdout'
            });
          });
        }
        return this.originalStdoutWrite!(chunk, encoding, callback);
      } catch (error) {
        // 如果拦截过程中出错，仍然调用原始方法
        return this.originalStdoutWrite!(chunk, encoding, callback);
      }
    };

    // 拦截 stderr
    process.stderr.write = (chunk: any, encoding?: any, callback?: any) => {
      try {
        if (typeof chunk === 'string' && this.isEnabled) {
          // 处理多行日志
          const lines = chunk.split('\n').filter(line => line.trim());
          lines.forEach(line => {
            const level = this.detectLogLevel(line);
            this.addLog({
              level,
              message: line.trim(),
              timestamp: Date.now(),
              source: 'stderr'
            });
          });
        }
        return this.originalStderrWrite!(chunk, encoding, callback);
      } catch (error) {
        // 如果拦截过程中出错，仍然调用原始方法
        return this.originalStderrWrite!(chunk, encoding, callback);
      }
    };
  }

  /**
   * 检测日志级别
   */
  private detectLogLevel(message: string): string {
    const lowerMessage = message.toLowerCase();

    // 检测标准日志级别
    if (lowerMessage.includes('[error]') || lowerMessage.includes('error:')) {
      return 'error';
    }
    if (lowerMessage.includes('[warn]') || lowerMessage.includes('warning:')) {
      return 'warn';
    }
    if (lowerMessage.includes('[debug]') || lowerMessage.includes('debug:')) {
      return 'debug';
    }
    if (lowerMessage.includes('[info]') || lowerMessage.includes('info:')) {
      return 'info';
    }

    // 检测 Vite 特定的日志级别
    if (lowerMessage.includes('vite:error')) {
      return 'error';
    }
    if (lowerMessage.includes('vite:warn')) {
      return 'warn';
    }
    if (lowerMessage.includes('vite:debug')) {
      return 'debug';
    }
    if (lowerMessage.includes('vite:info')) {
      return 'info';
    }

    // 默认级别
    return 'info';
  }

  /**
   * 设置控制台方法拦截
   */
  private setupConsoleInterception() {
    // 保存原始方法
    this.originalConsoleMethods = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console)
    };

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

      this.originalConsoleMethods!.log!(...args);
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

      this.originalConsoleMethods!.warn!(...args);
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

      this.originalConsoleMethods!.error!(...args);
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

      this.originalConsoleMethods!.info!(...args);
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

      this.originalConsoleMethods!.debug!(...args);
    };
  }

  /**
   * 添加日志（公开方法）
   */
  addLog(log: RemoteLogEntry) {
    // 检查日志级别过滤
    if (this.config.logLevels && !this.config.logLevels.includes(log.level)) {
      return;
    }

    // 如果 persistLogs 为 false，只保留最新的一条日志
    if (!this.config.persistLogs) {
      this.logs = [log];
    } else {
      // 添加到日志数组
      this.logs.push(log);

      // 限制日志数量
      if (this.logs.length > this.config.maxLogs) {
        this.logs = this.logs.slice(-this.config.maxLogs);
      }
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
      byLevel: {
        info: 0,
        warn: 0,
        error: 0,
        debug: 0
      },
      bySource: {
        stdout: 0,
        stderr: 0
      },
      recentCount: 0
    };

    // 统计按级别分组
    this.logs.forEach(log => {
      const level = log.level || 'info';
      const source = log.source || 'stdout';

      if (stats.byLevel.hasOwnProperty(level)) {
        stats.byLevel[level]++;
      }
      if (stats.bySource.hasOwnProperty(source)) {
        stats.bySource[source]++;
      }

      // 统计最近5分钟的日志
      if (Date.now() - log.timestamp < 5 * 60 * 1000) {
        stats.recentCount++;
      }
    });

    return stats;
  }

  /**
   * 获取最近的日志
   */
  getRecentLogs(limit: number): RemoteLogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * 按级别获取日志
   */
  getLogsByLevel(level: string): RemoteLogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * 按多个级别获取日志
   */
  getLogsByLevels(levels: string[]): RemoteLogEntry[] {
    return this.logs.filter(log => levels.includes(log.level));
  }

  /**
   * 按来源获取日志
   */
  getLogsBySource(source: string): RemoteLogEntry[] {
    return this.logs.filter(log => log.source === source);
  }

  /**
   * 按时间范围获取日志
   */
  getLogsByTimeRange(startTime: number, endTime: number): RemoteLogEntry[] {
    return this.logs.filter(log => log.timestamp >= startTime && log.timestamp <= endTime);
  }

  /**
   * 搜索日志内容
   */
  searchLogs(searchTerm: string): RemoteLogEntry[] {
    const term = searchTerm.toLowerCase();
    return this.logs.filter(log => log.message.toLowerCase().includes(term));
  }

  /**
   * 获取日志总数
   */
  getLogCount(): number {
    return this.logs.length;
  }

  /**
   * 按级别获取日志数量
   */
  getLogCountByLevel(level: string): number {
    return this.logs.filter(log => log.level === level).length;
  }

  /**
   * 获取统计信息（别名方法）
   */
  getStatistics() {
    return this.getStats();
  }
}
