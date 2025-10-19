import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import WebSocket from 'ws';
import { RemoteConsoleServer } from '../../../src/remote-console';
import { createMockViteServer, createMockLogEntry } from '../../setup';

// Mock WebSocket module
vi.mock('ws', () => ({
  default: class MockWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;

    readyState = MockWebSocket.OPEN;
    url = '';
    protocol = '';
    onopen: ((event: any) => void) | null = null;
    onclose: ((event: any) => void) | null = null;
    onmessage: ((event: any) => void) | null = null;
    onerror: ((event: any) => void) | null = null;

    constructor(url: string) {
      this.url = url;
      // Simulate connection established
      setTimeout(() => {
        if (this.onopen) {
          this.onopen({ type: 'open' });
        }
      }, 0);
    }

    send(data: string) {
      // Mock send method
    }

    close() {
      this.readyState = MockWebSocket.CLOSED;
      if (this.onclose) {
        this.onclose({ type: 'close', code: 1000, reason: '' });
      }
    }
  },
  WebSocketServer: class MockWebSocketServer {
    port = 0;
    onconnection: ((ws: any) => void) | null = null;

    constructor(options: any) {
      this.port = options.port;
      // Simulate server start
      setTimeout(() => {
        // Mock client connection
        const mockWs = new MockWebSocket('ws://localhost:' + options.port);
        if (this.onconnection) {
          this.onconnection(mockWs);
        }
      }, 0);
    }

    close() {
      // Mock server close
    }
  },
}));

describe('RemoteConsoleServer', () => {
  let mockServer: any;
  let consoleServer: RemoteConsoleServer;

  beforeEach(() => {
    mockServer = createMockViteServer();
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (consoleServer && consoleServer['isRunning']) {
      consoleServer.stop();
    }
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      consoleServer = new RemoteConsoleServer(mockServer, {});

      expect(consoleServer).toBeDefined();
      expect(consoleServer['isRunning']).toBe(false);
      expect(consoleServer['clients']).toEqual([]);
      expect(consoleServer['logs']).toEqual([]);
    });

    it('should initialize with custom config', () => {
      const customConfig = {
        port: 3002,
        persistLogs: false,
        maxLogs: 1000,
        logLevels: ['info', 'error'],
        debug: true,
      };

      consoleServer = new RemoteConsoleServer(mockServer, customConfig);

      expect(consoleServer['config']).toEqual(customConfig);
    });
  });

  describe('start and stop', () => {
    it('should start the WebSocket server', () => {
      consoleServer = new RemoteConsoleServer(mockServer, {
        port: 3001,
        enabled: true,
      });

      consoleServer.start();

      expect(consoleServer['isRunning']).toBe(true);
      expect(consoleServer['wss']).toBeDefined();
    });

    it('should stop the WebSocket server', () => {
      consoleServer = new RemoteConsoleServer(mockServer, {
        port: 3001,
        enabled: true,
      });

      consoleServer.start();
      expect(consoleServer['isRunning']).toBe(true);

      consoleServer.stop();
      expect(consoleServer['isRunning']).toBe(false);
      expect(consoleServer['clients']).toEqual([]);
    });

    it('should not start if already running', () => {
      consoleServer = new RemoteConsoleServer(mockServer, {
        port: 3001,
        enabled: true,
      });

      consoleServer.start();
      const wss = consoleServer['wss'];

      consoleServer.start();
      expect(consoleServer['wss']).toBe(wss);
    });

    it('should not start if disabled', () => {
      consoleServer = new RemoteConsoleServer(mockServer, {
        enabled: false,
      });

      consoleServer.start();

      expect(consoleServer['isRunning']).toBe(false);
    });

    it('should handle server start errors gracefully', () => {
      consoleServer = new RemoteConsoleServer(mockServer, {
        port: -1, // Invalid port
        enabled: true,
      });

      expect(() => {
        consoleServer.start();
      }).not.toThrow();
    });
  });

  describe('client connection management', () => {
    beforeEach(() => {
      consoleServer = new RemoteConsoleServer(mockServer, {
        port: 3001,
        enabled: true,
      });
      consoleServer.start();
    });

    it('should handle client connections', () => {
      const mockWs = new WebSocket('ws://localhost:3001');

      // Simulate connection
      setTimeout(() => {
        expect(consoleServer['clients']).toContain(mockWs);
      }, 10);
    });

    it('should handle client disconnections', () => {
      const mockWs = new WebSocket('ws://localhost:3001');

      setTimeout(() => {
        mockWs.close();
        expect(consoleServer['clients']).not.toContain(mockWs);
      }, 10);
    });

    it('should send initial logs to new clients', () => {
      // Add some logs first
      const logEntry = createMockLogEntry({ message: 'Test log' });
      consoleServer.addLog(logEntry);

      const mockWs = new WebSocket('ws://localhost:3001');
      const sendSpy = vi.spyOn(mockWs, 'send');

      setTimeout(() => {
        expect(sendSpy).toHaveBeenCalledWith(
          expect.stringContaining('initial-logs')
        );
        expect(sendSpy).toHaveBeenCalledWith(
          expect.stringContaining('Test log')
        );
      }, 10);
    });

    it('should handle multiple clients', () => {
      const client1 = new WebSocket('ws://localhost:3001');
      const client2 = new WebSocket('ws://localhost:3001');

      setTimeout(() => {
        expect(consoleServer['clients']).toHaveLength(2);
        expect(consoleServer['clients']).toContain(client1);
        expect(consoleServer['clients']).toContain(client2);
      }, 10);
    });
  });

  describe('log management', () => {
    beforeEach(() => {
      consoleServer = new RemoteConsoleServer(mockServer, {
        port: 3001,
        enabled: true,
        maxLogs: 5,
      });
      consoleServer.start();
    });

    it('should add logs', () => {
      const logEntry = createMockLogEntry({ message: 'Test log' });
      consoleServer.addLog(logEntry);

      expect(consoleServer['logs']).toHaveLength(1);
      expect(consoleServer['logs'][0]).toEqual(logEntry);
    });

    it('should broadcast logs to all clients', () => {
      const client1 = new WebSocket('ws://localhost:3001');
      const client2 = new WebSocket('ws://localhost:3001');
      const sendSpy1 = vi.spyOn(client1, 'send');
      const sendSpy2 = vi.spyOn(client2, 'send');

      setTimeout(() => {
        const logEntry = createMockLogEntry({ message: 'Broadcast test' });
        consoleServer.addLog(logEntry);

        expect(sendSpy1).toHaveBeenCalledWith(
          expect.stringContaining('Broadcast test')
        );
        expect(sendSpy2).toHaveBeenCalledWith(
          expect.stringContaining('Broadcast test')
        );
      }, 10);
    });

    it('should limit maximum log count', () => {
      // Add more logs than the limit
      for (let i = 0; i < 7; i++) {
        consoleServer.addLog(createMockLogEntry({ message: `Log ${i}` }));
      }

      expect(consoleServer['logs']).toHaveLength(5);
      expect(consoleServer['logs'][0].message).toBe('Log 2'); // First 2 should be removed
      expect(consoleServer['logs'][4].message).toBe('Log 6');
    });

    it('should clear logs when persistLogs is false', () => {
      consoleServer = new RemoteConsoleServer(mockServer, {
        port: 3001,
        enabled: true,
        persistLogs: false,
      });
      consoleServer.start();

      const logEntry = createMockLogEntry({ message: 'Test log' });
      consoleServer.addLog(logEntry);

      // Logs should only keep the most recent one
      expect(consoleServer['logs']).toHaveLength(1);

      const anotherLog = createMockLogEntry({ message: 'Another log' });
      consoleServer.addLog(anotherLog);

      expect(consoleServer['logs']).toHaveLength(1);
      expect(consoleServer['logs'][0].message).toBe('Another log');
    });

    it('should filter logs by level', () => {
      consoleServer = new RemoteConsoleServer(mockServer, {
        port: 3001,
        enabled: true,
        logLevels: ['error', 'warn'],
      });
      consoleServer.start();

      const infoLog = createMockLogEntry({ level: 'info', message: 'Info message' });
      const errorLog = createMockLogEntry({ level: 'error', message: 'Error message' });
      const warnLog = createMockLogEntry({ level: 'warn', message: 'Warning message' });

      consoleServer.addLog(infoLog);
      consoleServer.addLog(errorLog);
      consoleServer.addLog(warnLog);

      expect(consoleServer['logs']).toHaveLength(2);
      expect(consoleServer['logs'].map(log => log.level)).not.toContain('info');
    });
  });

  describe('message handling', () => {
    let mockWs: WebSocket;
    let sendSpy: any;

    beforeEach(() => {
      consoleServer = new RemoteConsoleServer(mockServer, {
        port: 3001,
        enabled: true,
      });
      consoleServer.start();

      mockWs = new WebSocket('ws://localhost:3001');
      sendSpy = vi.spyOn(mockWs, 'send');
    });

    it('should handle get-logs message', () => {
      setTimeout(() => {
        const logEntry = createMockLogEntry({ message: 'Test log' });
        consoleServer.addLog(logEntry);

        const message = { type: 'get-logs' };
        mockWs.onmessage?.({ data: JSON.stringify(message) } as any);

        expect(sendSpy).toHaveBeenCalledWith(
          expect.stringContaining('"type":"logs"')
        );
        expect(sendSpy).toHaveBeenCalledWith(
          expect.stringContaining('Test log')
        );
      }, 10);
    });

    it('should handle clear-logs message', () => {
      setTimeout(() => {
        const logEntry = createMockLogEntry({ message: 'Test log' });
        consoleServer.addLog(logEntry);
        expect(consoleServer['logs']).toHaveLength(1);

        const message = { type: 'clear-logs' };
        mockWs.onmessage?.({ data: JSON.stringify(message) } as any);

        expect(consoleServer['logs']).toHaveLength(0);
        expect(sendSpy).toHaveBeenCalledWith(
          expect.stringContaining('"type":"logs-cleared"')
        );
      }, 10);
    });

    it('should handle get-stats message', () => {
      setTimeout(() => {
        const logEntry = createMockLogEntry({ level: 'info', message: 'Test log' });
        consoleServer.addLog(logEntry);

        const message = { type: 'get-stats' };
        mockWs.onmessage?.({ data: JSON.stringify(message) } as any);

        expect(sendSpy).toHaveBeenCalledWith(
          expect.stringContaining('"type":"stats"')
        );
        expect(sendSpy).toHaveBeenCalledWith(
          expect.stringContaining('"total":1')
        );
      }, 10);
    });

    it('should handle ping message', () => {
      setTimeout(() => {
        const message = { type: 'ping' };
        mockWs.onmessage?.({ data: JSON.stringify(message) } as any);

        expect(sendSpy).toHaveBeenCalledWith(
          expect.stringContaining('"type":"pong"')
        );
      }, 10);
    });

    it('should handle unknown message types', () => {
      setTimeout(() => {
        const message = { type: 'unknown-type' };
        mockWs.onmessage?.({ data: JSON.stringify(message) } as any);

        expect(sendSpy).toHaveBeenCalledWith(
          expect.stringContaining('"type":"error"')
        );
        expect(sendSpy).toHaveBeenCalledWith(
          expect.stringContaining('Unknown message type')
        );
      }, 10);
    });

    it('should handle malformed JSON messages', () => {
      setTimeout(() => {
        mockWs.onmessage?.({ data: 'invalid json' } as any);

        expect(sendSpy).toHaveBeenCalledWith(
          expect.stringContaining('"type":"error"')
        );
      }, 10);
    });
  });

  describe('log filtering and search', () => {
    beforeEach(() => {
      consoleServer = new RemoteConsoleServer(mockServer, {
        port: 3001,
        enabled: true,
        logLevels: ['info', 'warn', 'error', 'debug'],
      });
      consoleServer.start();

      // Add test logs
      consoleServer.addLog(createMockLogEntry({ level: 'info', message: 'Info message' }));
      consoleServer.addLog(createMockLogEntry({ level: 'warn', message: 'Warning message' }));
      consoleServer.addLog(createMockLogEntry({ level: 'error', message: 'Error message' }));
    });

    it('should get logs by level', () => {
      const errorLogs = consoleServer.getLogsByLevel('error');
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe('error');

      const infoLogs = consoleServer.getLogsByLevel('info');
      expect(infoLogs).toHaveLength(1);
      expect(infoLogs[0].level).toBe('info');
    });

    it('should search logs by content', () => {
      const searchResults = consoleServer.searchLogs('Warning');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].message).toContain('Warning');

      const allResults = consoleServer.searchLogs('message');
      expect(allResults).toHaveLength(3);
    });

    it('should get logs in time range', () => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);

      const recentLogs = consoleServer.getLogsByTimeRange(oneHourAgo, now);
      expect(recentLogs).toHaveLength(3);

      const futureLogs = consoleServer.getLogsByTimeRange(now + 1000, now + 2000);
      expect(futureLogs).toHaveLength(0);
    });

    it('should get statistics', () => {
      const stats = consoleServer.getStatistics();

      expect(stats).toMatchObject({
        total: 3,
        byLevel: {
          info: 1,
          warn: 1,
          error: 1,
          debug: 0,
        },
        clientCount: expect.any(Number),
        uptime: expect.any(Number),
      });
    });
  });

  describe('debug logging', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log');
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log debug messages when enabled', () => {
      consoleServer = new RemoteConsoleServer(mockServer, {
        port: 3001,
        enabled: true,
        debug: true,
      });

      consoleServer.start();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[RemoteConsole]'),
        expect.stringContaining('started on port 3001')
      );
    });

    it('should not log debug messages when disabled', () => {
      consoleServer = new RemoteConsoleServer(mockServer, {
        port: 3001,
        enabled: true,
        debug: false,
      });

      consoleServer.start();

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should log client connections in debug mode', () => {
      consoleServer = new RemoteConsoleServer(mockServer, {
        port: 3001,
        enabled: true,
        debug: true,
      });
      consoleServer.start();

      const mockWs = new WebSocket('ws://localhost:3001');

      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[RemoteConsole]'),
          expect.stringContaining('Client connected')
        );
      }, 10);
    });
  });

  describe('error handling', () => {
    it('should handle WebSocket errors gracefully', () => {
      consoleServer = new RemoteConsoleServer(mockServer, {
        port: 3001,
        enabled: true,
      });

      expect(() => {
        consoleServer.start();
      }).not.toThrow();
    });

    it('should handle client send errors', () => {
      consoleServer = new RemoteConsoleServer(mockServer, {
        port: 3001,
        enabled: true,
      });
      consoleServer.start();

      const mockWs = new WebSocket('ws://localhost:3001');
      const sendSpy = vi.spyOn(mockWs, 'send').mockImplementation(() => {
        throw new Error('Send failed');
      });

      setTimeout(() => {
        expect(() => {
          consoleServer.addLog(createMockLogEntry({ message: 'Test' }));
        }).not.toThrow();
      }, 10);
    });

    it('should handle port conflicts gracefully', () => {
      consoleServer = new RemoteConsoleServer(mockServer, {
        port: 80, // Restricted port
        enabled: true,
      });

      expect(() => {
        consoleServer.start();
      }).not.toThrow();
    });
  });

  describe('configuration validation', () => {
    it('should use default values for missing config', () => {
      consoleServer = new RemoteConsoleServer(mockServer, {});

      expect(consoleServer['config']).toMatchObject({
        enabled: false,
        port: 3001,
        persistLogs: true,
        maxLogs: 2000,
        logLevels: ['info', 'warn', 'error', 'debug'],
        debug: false,
      });
    });

    it('should handle invalid port numbers', () => {
      consoleServer = new RemoteConsoleServer(mockServer, {
        port: -1,
        enabled: true,
      });

      expect(consoleServer['config'].port).toBe(-1);
    });

    it('should handle invalid log levels', () => {
      consoleServer = new RemoteConsoleServer(mockServer, {
        logLevels: ['invalid' as any],
        enabled: true,
      });

      expect(consoleServer['config'].logLevels).toContain('invalid');
    });
  });

  describe('integration with TerminalInterceptor', () => {
    beforeEach(() => {
      consoleServer = new RemoteConsoleServer(mockServer, {
        port: 3001,
        enabled: true,
      });
      consoleServer.start();
    });

    it('should receive logs from TerminalInterceptor', () => {
      const mockWs = new WebSocket('ws://localhost:3001');
      const sendSpy = vi.spyOn(mockWs, 'send');

      setTimeout(() => {
        // Simulate TerminalInterceptor adding a log
        const terminalLog = createMockLogEntry({
          level: 'info',
          message: 'Terminal log message',
          source: 'stdout',
        });

        consoleServer.addLog(terminalLog);

        expect(sendSpy).toHaveBeenCalledWith(
          expect.stringContaining('Terminal log message')
        );
      }, 10);
    });

    it('should maintain log order from TerminalInterceptor', () => {
      const mockWs = new WebSocket('ws://localhost:3001');
      const sendSpy = vi.spyOn(mockWs, 'send');

      setTimeout(() => {
        // Add logs in sequence
        for (let i = 0; i < 3; i++) {
          consoleServer.addLog(createMockLogEntry({ message: `Log ${i}` }));
        }

        expect(consoleServer['logs']).toHaveLength(3);
        expect(consoleServer['logs'][0].message).toBe('Log 0');
        expect(consoleServer['logs'][1].message).toBe('Log 1');
        expect(consoleServer['logs'][2].message).toBe('Log 2');
      }, 10);
    });
  });
});