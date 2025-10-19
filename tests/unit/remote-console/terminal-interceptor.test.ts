import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TerminalInterceptor } from '../../../src/terminal-interceptor';
import { createMockLogEntry } from '../../setup';

describe('TerminalInterceptor', () => {
  let interceptor: TerminalInterceptor;
  let originalStdoutWrite: typeof process.stdout.write;
  let originalStderrWrite: typeof process.stderr.write;

  beforeEach(() => {
    originalStdoutWrite = process.stdout.write;
    originalStderrWrite = process.stderr.write;
    interceptor = new TerminalInterceptor();
  });

  afterEach(() => {
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      expect(interceptor).toBeDefined();
      expect(interceptor['logs']).toEqual([]);
      expect(interceptor['isRunning']).toBe(false);
    });
  });

  describe('start and stop', () => {
    it('should start intercepting terminal output', () => {
      interceptor.start();

      expect(interceptor['isRunning']).toBe(true);
      expect(typeof process.stdout.write).toBe('function');
      expect(typeof process.stderr.write).toBe('function');
    });

    it('should stop intercepting and restore original methods', () => {
      interceptor.start();
      interceptor.stop();

      expect(interceptor['isRunning']).toBe(false);
      expect(process.stdout.write).toBe(originalStdoutWrite);
      expect(process.stderr.write).toBe(originalStderrWrite);
    });

    it('should not start if already running', () => {
      interceptor.start();
      const stdoutSpy = vi.spyOn(process.stdout, 'write');
      const stderrSpy = vi.spyOn(process.stderr, 'write');

      interceptor.start();

      expect(interceptor['isRunning']).toBe(true);
      stdoutSpy.mockRestore();
      stderrSpy.mockRestore();
    });

    it('should not stop if not running', () => {
      expect(() => {
        interceptor.stop();
      }).not.toThrow();
      expect(interceptor['isRunning']).toBe(false);
    });
  });

  describe('log capture functionality', () => {
    beforeEach(() => {
      interceptor.start();
    });

    it('should capture stdout output', () => {
      const testMessage = 'Test stdout message\n';
      const result = process.stdout.write(testMessage);

      expect(result).toBe(true);
      expect(interceptor['logs']).toHaveLength(1);
      expect(interceptor['logs'][0]).toMatchObject({
        level: 'info',
        message: 'Test stdout message',
        source: 'stdout'
      });
    });

    it('should capture stderr output', () => {
      const testMessage = 'Test stderr message\n';
      const result = process.stderr.write(testMessage);

      expect(result).toBe(true);
      expect(interceptor['logs']).toHaveLength(1);
      expect(interceptor['logs'][0]).toMatchObject({
        level: 'error',
        message: 'Test stderr message',
        source: 'stderr'
      });
    });

    it('should handle empty lines', () => {
      process.stdout.write('\n');

      expect(interceptor['logs']).toHaveLength(1);
      expect(interceptor['logs'][0].message).toBe('');
    });

    it('should handle multiple lines in single write', () => {
      const multiLineMessage = 'Line 1\nLine 2\nLine 3\n';
      process.stdout.write(multiLineMessage);

      expect(interceptor['logs']).toHaveLength(3);
      expect(interceptor['logs'][0].message).toBe('Line 1');
      expect(interceptor['logs'][1].message).toBe('Line 2');
      expect(interceptor['logs'][2].message).toBe('Line 3');
    });

    it('should preserve ANSI color codes', () => {
      const coloredMessage = '\u001b[32mSuccess\u001b[0m message\n';
      process.stdout.write(coloredMessage);

      expect(interceptor['logs']).toHaveLength(1);
      expect(interceptor['logs'][0].message).toContain('\u001b[32m');
      expect(interceptor['logs'][0].message).toContain('\u001b[0m');
    });

    it('should handle binary data gracefully', () => {
      const binaryData = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
      const result = process.stdout.write(binaryData);

      expect(result).toBe(true);
    });
  });

  describe('log level detection', () => {
    beforeEach(() => {
      interceptor.start();
    });

    it('should detect info level', () => {
      process.stdout.write('[INFO] Test message\n');
      expect(interceptor['logs'][0].level).toBe('info');
    });

    it('should detect warn level', () => {
      process.stdout.write('[WARN] Test message\n');
      expect(interceptor['logs'][0].level).toBe('warn');
    });

    it('should detect error level', () => {
      process.stdout.write('[ERROR] Test message\n');
      expect(interceptor['logs'][0].level).toBe('error');
    });

    it('should detect debug level', () => {
      process.stdout.write('[DEBUG] Test message\n');
      expect(interceptor['logs'][0].level).toBe('debug');
    });

    it('should default to info level', () => {
      process.stdout.write('Plain message\n');
      expect(interceptor['logs'][0].level).toBe('info');
    });

    it('should detect vite-specific log levels', () => {
      process.stdout.write('vite:info Test message\n');
      expect(interceptor['logs'][0].level).toBe('info');

      process.stdout.write('vite:warn Test message\n');
      expect(interceptor['logs'][1].level).toBe('warn');

      process.stdout.write('vite:error Test message\n');
      expect(interceptor['logs'][2].level).toBe('error');
    });

    it('should handle case-insensitive level detection', () => {
      process.stdout.write('[info] Test message\n');
      expect(interceptor['logs'][0].level).toBe('info');

      process.stdout.write('[WARN] Test message\n');
      expect(interceptor['logs'][1].level).toBe('warn');
    });
  });

  describe('log parsing', () => {
    beforeEach(() => {
      interceptor.start();
    });

    it('should parse log entries with timestamp', () => {
      const messageWithTimestamp = '[2023-12-01 10:30:45] Test message\n';
      process.stdout.write(messageWithTimestamp);

      expect(interceptor['logs'][0]).toMatchObject({
        level: 'info',
        message: '[2023-12-01 10:30:45] Test message',
        source: 'stdout'
      });
      expect(interceptor['logs'][0].timestamp).toBeTypeOf('number');
    });

    it('should extract file and line information from stack traces', () => {
      const stackTrace = 'Error: Test error\n    at testFunction (/src/test.js:10:5)\n';
      process.stdout.write(stackTrace);

      expect(interceptor['logs'][0].message).toContain('testFunction');
      expect(interceptor['logs'][0].message).toContain('/src/test.js:10:5');
    });

    it('should handle JSON-formatted logs', () => {
      const jsonLog = '{"level":"info","message":"Test","timestamp":1701423045}\n';
      process.stdout.write(jsonLog);

      const parsedLog = interceptor['logs'][0];
      expect(parsedLog.level).toBe('info');
      expect(parsedLog.message).toContain('Test');
    });

    it('should strip ANSI codes for text processing', () => {
      const messageWithANSI = '\u001b[32m\u001b[1mSuccess\u001b[0m message\n';
      process.stdout.write(messageWithANSI);

      expect(interceptor['logs'][0].message).toContain('\u001b[32m');
      expect(interceptor['logs'][0].message).toContain('Success');
    });
  });

  describe('log management', () => {
    beforeEach(() => {
      interceptor.start();
    });

    it('should add logs correctly', () => {
      const logEntry = createMockLogEntry({ message: 'Test log' });
      interceptor.addLog(logEntry);

      expect(interceptor['logs']).toHaveLength(1);
      expect(interceptor['logs'][0]).toEqual(logEntry);
    });

    it('should get all logs', () => {
      const log1 = createMockLogEntry({ message: 'Log 1' });
      const log2 = createMockLogEntry({ message: 'Log 2' });

      interceptor.addLog(log1);
      interceptor.addLog(log2);

      const allLogs = interceptor.getLogs();
      expect(allLogs).toHaveLength(2);
      expect(allLogs[0]).toEqual(log1);
      expect(allLogs[1]).toEqual(log2);
    });

    it('should get recent logs with limit', () => {
      // Add 10 logs
      for (let i = 0; i < 10; i++) {
        interceptor.addLog(createMockLogEntry({ message: `Log ${i}` }));
      }

      const recentLogs = interceptor.getRecentLogs(5);
      expect(recentLogs).toHaveLength(5);
      expect(recentLogs[0].message).toBe('Log 5');
      expect(recentLogs[4].message).toBe('Log 9');
    });

    it('should clear logs', () => {
      interceptor.addLog(createMockLogEntry({ message: 'Test' }));
      expect(interceptor['logs']).toHaveLength(1);

      interceptor.clearLogs();
      expect(interceptor['logs']).toHaveLength(0);
    });

    it('should limit maximum log count', () => {
      const maxLogs = 1000;
      interceptor = new TerminalInterceptor({ maxLogs });

      // Add more logs than the limit
      for (let i = 0; i < maxLogs + 10; i++) {
        interceptor.addLog(createMockLogEntry({ message: `Log ${i}` }));
      }

      expect(interceptor['logs']).toHaveLength(maxLogs);
      expect(interceptor['logs'][0].message).toBe('Log 10'); // First 10 should be removed
      expect(interceptor['logs'][maxLogs - 1].message).toBe(`Log ${maxLogs + 9}`);
    });
  });

  describe('log filtering', () => {
    beforeEach(() => {
      interceptor.start();

      // Add logs with different levels
      process.stdout.write('[INFO] Info message\n');
      process.stdout.write('[WARN] Warning message\n');
      process.stdout.write('[ERROR] Error message\n');
      process.stdout.write('[DEBUG] Debug message\n');
    });

    it('should filter logs by level', () => {
      const errorLogs = interceptor.getLogsByLevel('error');
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe('error');

      const warnLogs = interceptor.getLogsByLevel('warn');
      expect(warnLogs).toHaveLength(1);
      expect(warnLogs[0].level).toBe('warn');
    });

    it('should filter logs by multiple levels', () => {
      const importantLogs = interceptor.getLogsByLevels(['error', 'warn']);
      expect(importantLogs).toHaveLength(2);
      expect(importantLogs.map(log => log.level)).toContain('error');
      expect(importantLogs.map(log => log.level)).toContain('warn');
    });

    it('should filter logs by source', () => {
      process.stderr.write('[ERROR] Stderr error\n');

      const stdoutLogs = interceptor.getLogsBySource('stdout');
      const stderrLogs = interceptor.getLogsBySource('stderr');

      expect(stdoutLogs).toHaveLength(4);
      expect(stderrLogs).toHaveLength(1);
    });

    it('should filter logs by time range', () => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);

      const recentLogs = interceptor.getLogsByTimeRange(oneHourAgo, now);
      expect(recentLogs).toHaveLength(4);

      const futureLogs = interceptor.getLogsByTimeRange(now + 1000, now + 2000);
      expect(futureLogs).toHaveLength(0);
    });

    it('should search logs by content', () => {
      const matchingLogs = interceptor.searchLogs('Warning');
      expect(matchingLogs).toHaveLength(1);
      expect(matchingLogs[0].message).toContain('Warning');

      const allLogs = interceptor.searchLogs('message');
      expect(allLogs).toHaveLength(4);
    });
  });

  describe('statistics', () => {
    beforeEach(() => {
      interceptor.start();

      // Add logs with different levels
      process.stdout.write('[INFO] Info message\n');
      process.stdout.write('[WARN] Warning message\n');
      process.stdout.write('[ERROR] Error message\n');
      process.stdout.write('[INFO] Another info\n');
    });

    it('should get log count', () => {
      expect(interceptor.getLogCount()).toBe(4);
    });

    it('should get log count by level', () => {
      expect(interceptor.getLogCountByLevel('info')).toBe(2);
      expect(interceptor.getLogCountByLevel('warn')).toBe(1);
      expect(interceptor.getLogCountByLevel('error')).toBe(1);
      expect(interceptor.getLogCountByLevel('debug')).toBe(0);
    });

    it('should get log statistics', () => {
      const stats = interceptor.getStatistics();

      expect(stats).toMatchObject({
        total: 4,
        byLevel: {
          info: 2,
          warn: 1,
          error: 1,
          debug: 0,
        },
        bySource: {
          stdout: 4,
          stderr: 0,
        }
      });
      expect(stats.oldestLog).toBeTypeOf('number');
      expect(stats.newestLog).toBeTypeOf('number');
    });

    it('should handle empty statistics', () => {
      interceptor.clearLogs();
      const stats = interceptor.getStatistics();

      expect(stats.total).toBe(0);
      expect(stats.byLevel).toEqual({ info: 0, warn: 0, error: 0, debug: 0 });
      expect(stats.bySource).toEqual({ stdout: 0, stderr: 0 });
    });
  });

  describe('configuration', () => {
    it('should accept custom configuration', () => {
      const customConfig = {
        maxLogs: 500,
        bufferSize: 1024,
        enableColors: false,
      };

      const customInterceptor = new TerminalInterceptor(customConfig);

      expect(customInterceptor).toBeDefined();
      expect(customInterceptor['config']).toEqual(customConfig);
    });

    it('should use default configuration when none provided', () => {
      expect(interceptor['config']).toMatchObject({
        maxLogs: 2000,
        bufferSize: 8192,
        enableColors: true,
      });
    });

    it('should handle invalid configuration gracefully', () => {
      expect(() => {
        const invalidInterceptor = new TerminalInterceptor({
          maxLogs: -1,
          bufferSize: 'invalid' as any,
        });
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      interceptor.start();
    });

    it('should handle write errors gracefully', () => {
      // Mock a write error
      const mockWrite = vi.fn(() => {
        throw new Error('Write error');
      });
      process.stdout.write = mockWrite;

      expect(() => {
        process.stdout.write('Test message\n');
      }).not.toThrow();
    });

    it('should handle parsing errors gracefully', () => {
      // Test with malformed JSON
      const malformedJson = '{"invalid": json}\n';

      expect(() => {
        process.stdout.write(malformedJson);
      }).not.toThrow();

      expect(interceptor['logs']).toHaveLength(1);
      expect(interceptor['logs'][0].message).toContain('{"invalid": json}');
    });

    it('should handle buffer overflow gracefully', () => {
      const largeMessage = 'x'.repeat(10000) + '\n';

      expect(() => {
        process.stdout.write(largeMessage);
      }).not.toThrow();

      expect(interceptor['logs']).toHaveLength(1);
      expect(interceptor['logs'][0].message.length).toBeGreaterThan(9000);
    });
  });

  describe('integration with original process methods', () => {
    it('should preserve original write behavior', () => {
      interceptor.start();

      // Test that the write still returns the expected value
      const result1 = process.stdout.write('Test 1\n');
      const result2 = process.stderr.write('Test 2\n');

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it('should handle multiple arguments correctly', () => {
      interceptor.start();

      const result = process.stdout.write('Test', 'utf8');

      expect(result).toBe(true);
      expect(interceptor['logs']).toHaveLength(1);
    });

    it('should handle buffer arguments', () => {
      interceptor.start();

      const buffer = Buffer.from('Buffer test\n');
      const result = process.stdout.write(buffer);

      expect(result).toBe(true);
    });
  });
});