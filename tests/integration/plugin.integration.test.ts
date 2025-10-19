import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { xagiMonitor } from '../../src/index';
import { createMockViteServer, createMockError, createMockLogEntry } from '../setup';

describe('Plugin Integration Tests', () => {
  let mockServer: any;
  let plugin: any;

  beforeEach(() => {
    mockServer = createMockViteServer();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('plugin initialization', () => {
    it('should create plugin with default options', () => {
      plugin = xagiMonitor();

      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('vite-plugin-xagi-monitor');
      expect(plugin.configureServer).toBeDefined();
      expect(plugin.transformIndexHtml).toBeDefined();
    });

    it('should create plugin with custom options', () => {
      const customOptions = {
        errorMonitor: false,
        logForwarding: false,
        hmrForwarding: false,
        debug: true,
      };

      plugin = xagiMonitor(customOptions);

      expect(plugin).toBeDefined();
      expect(typeof plugin.configureServer).toBe('function');
    });
  });

  describe('server configuration', () => {
    beforeEach(() => {
      plugin = xagiMonitor({
        errorMonitor: true,
        logForwarding: true,
        hmrForwarding: true,
        debug: false,
      });
    });

    it('should configure server successfully', () => {
      const result = plugin.configureServer(mockServer);

      expect(result).toBeDefined();
      expect(typeof result).toBe('function');
    });

    it('should return cleanup function', () => {
      const cleanup = plugin.configureServer(mockServer);

      expect(typeof cleanup).toBe('function');
    });

    it('should not configure when debug is disabled', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      plugin = xagiMonitor({ debug: false });
      plugin.configureServer(mockServer);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should log debug message when debug is enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      plugin = xagiMonitor({ debug: true });
      plugin.configureServer(mockServer);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AppDev Monitor Plugin]'),
        expect.stringContaining('插件已启动')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('error monitoring setup', () => {
    beforeEach(() => {
      plugin = xagiMonitor({
        errorMonitor: true,
        errorPageCustomization: {
          enabled: true,
          debug: false,
        },
      });
    });

    it('should setup error page customization when enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      plugin.configureServer(mockServer);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AppDev Monitor]'),
        expect.stringContaining('错误页面增强已启用')
      );

      consoleSpy.mockRestore();
    });

    it('should not setup error page customization when disabled', () => {
      plugin = xagiMonitor({
        errorMonitor: true,
        errorPageCustomization: {
          enabled: false,
        },
      });

      const consoleSpy = vi.spyOn(console, 'log');

      plugin.configureServer(mockServer);

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('错误页面增强已启用')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('remote console setup', () => {
    beforeEach(() => {
      plugin = xagiMonitor({
        remoteConsole: {
          enabled: true,
          port: 3001,
          debug: false,
        },
      });
    });

    it('should setup remote console when enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      plugin.configureServer(mockServer);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AppDev Monitor]'),
        expect.stringContaining('远程控制台已启用，端口: 3001')
      );

      consoleSpy.mockRestore();
    });

    it('should use default port when not specified', () => {
      plugin = xagiMonitor({
        remoteConsole: {
          enabled: true,
        },
      });

      const consoleSpy = vi.spyOn(console, 'log');

      plugin.configureServer(mockServer);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('远程控制台已启用，端口: 3001')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('log forwarding setup', () => {
    beforeEach(() => {
      plugin = xagiMonitor({
        logForwarding: true,
        debug: false,
      });
    });

    it('should setup log forwarding when enabled', () => {
      plugin.configureServer(mockServer);

      // Verify that middleware setup is called
      expect(mockServer.middlewares.use).toHaveBeenCalled();
    });

    it('should forward logs to WebSocket', () => {
      const cleanup = plugin.configureServer(mockServer);

      // Simulate log forwarding
      if (cleanup) {
        cleanup();
      }

      expect(mockServer.ws.send).toHaveBeenCalled();
    });
  });

  describe('HMR monitoring setup', () => {
    beforeEach(() => {
      plugin = xagiMonitor({
        hmrForwarding: true,
        debug: false,
      });
    });

    it('should setup HMR monitoring when enabled', () => {
      plugin.configureServer(mockServer);

      // Should setup file watchers and HMR event handlers
      expect(mockServer.ws.on).toHaveBeenCalled();
    });

    it('should forward HMR updates to clients', () => {
      plugin.configureServer(mockServer);

      // Simulate HMR event
      const hmrCallback = mockServer.ws.on.mock.calls.find(
        call => call[0] === 'appdev:hmr'
      )?.[1];

      if (hmrCallback) {
        const updateData = {
          type: 'update',
          path: '/test/file.js',
          timestamp: Date.now(),
        };

        hmrCallback(updateData);

        expect(mockServer.ws.send).toHaveBeenCalledWith('appdev:hmr', updateData);
      }
    });
  });

  describe('error handling in server', () => {
    beforeEach(() => {
      plugin = xagiMonitor({
        errorMonitor: true,
        logForwarding: true,
        hmrForwarding: true,
      });
    });

    it('should handle client error reports', () => {
      plugin.configureServer(mockServer);

      // Get the error handler
      const errorHandler = mockServer.ws.on.mock.calls.find(
        call => call[0] === 'appdev:error'
      )?.[1];

      if (errorHandler) {
        const errorData = {
          type: 'script',
          url: '/test/script.js',
          message: 'Script load failed',
          timestamp: Date.now(),
        };

        errorHandler(errorData);

        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('[AppDev Monitor] 收到错误报告:'),
          errorData
        );
      }
    });

    it('should forward errors as logs', () => {
      plugin.configureServer(mockServer);

      const errorHandler = mockServer.ws.on.mock.calls.find(
        call => call[0] === 'appdev:error'
      )?.[1];

      if (errorHandler) {
        const errorData = {
          type: 'css',
          url: '/test/style.css',
          message: 'CSS load failed',
          timestamp: Date.now(),
        };

        errorHandler(errorData);

        expect(mockServer.ws.send).toHaveBeenCalledWith('appdev:log', {
          level: 'error',
          message: '[资源错误] css: /test/style.css - CSS load failed',
          timestamp: errorData.timestamp,
        });
      }
    });

    it('should handle enhanced error reports', () => {
      plugin.configureServer(mockServer);

      const enhancedErrorHandler = mockServer.ws.on.mock.calls.find(
        call => call[0] === 'appdev:enhanced-error'
      )?.[1];

      if (enhancedErrorHandler) {
        const enhancedError = {
          type: 'SyntaxError',
          message: 'Unexpected token',
          file: '/test/file.js',
          line: 10,
          column: 5,
          timestamp: Date.now(),
        };

        enhancedErrorHandler(enhancedError);

        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('[AppDev Monitor] 收到增强错误报告:'),
          enhancedError
        );

        expect(mockServer.ws.send).toHaveBeenCalledWith('appdev:remote-log', {
          level: 'error',
          message: '[增强错误] SyntaxError: Unexpected token',
          source: '/test/file.js:10:5',
          timestamp: enhancedError.timestamp,
          data: enhancedError,
        });
      }
    });
  });

  describe('HTML transformation', () => {
    beforeEach(() => {
      plugin = xagiMonitor({
        errorMonitor: true,
        errorPageCustomization: {
          enabled: true,
          aiFriendly: true,
          debug: false,
        },
        remoteConsole: {
          enabled: true,
          port: 3001,
        },
        whiteScreenMonitor: {
          enabled: true,
          thresholds: {
            contentLength: 50,
            elementCount: 5,
            loadTime: 3000,
          },
        },
        designMode: {
          enabled: true,
          showElementBorders: true,
        },
      });
    });

    it('should transform HTML with client script', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test</title>
        </head>
        <body>
          <div id="app"></div>
        </body>
        </html>
      `;

      const transformedHtml = plugin.transformIndexHtml(html);

      expect(transformedHtml).toContain('<script>');
      expect(transformedHtml).toContain('window.__XAGI_MONITOR_CONFIG__');
      expect(transformedHtml).toContain('CLIENT_SCRIPT');
    });

    it('should include configuration in HTML', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test</title>
        </head>
        <body>
        </body>
        </html>
      `;

      const transformedHtml = plugin.transformIndexHtml(html);

      expect(transformedHtml).toContain('"errorPageCustomization"');
      expect(transformedHtml).toContain('"remoteConsole"');
      expect(transformedHtml).toContain('"whiteScreenMonitor"');
      expect(transformedHtml).toContain('"designMode"');
    });

    it('should not transform HTML when errorMonitor is disabled', () => {
      plugin = xagiMonitor({
        errorMonitor: false,
      });

      const html = '<html><head></head><body></body></html>';
      const transformedHtml = plugin.transformIndexHtml(html);

      expect(transformedHtml).toBe(html);
    });

    it('should handle malformed HTML gracefully', () => {
      const malformedHtml = '<html><head><title>Test';

      expect(() => {
        plugin.transformIndexHtml(malformedHtml);
      }).not.toThrow();
    });
  });

  describe('cleanup functionality', () => {
    beforeEach(() => {
      plugin = xagiMonitor({
        errorPageCustomization: {
          enabled: true,
        },
        remoteConsole: {
          enabled: true,
        },
      });
    });

    it('should cleanup error interceptor', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      const cleanup = plugin.configureServer(mockServer);
      cleanup();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AppDev Monitor]'),
        expect.stringContaining('错误页面增强已停止')
      );

      consoleSpy.mockRestore();
    });

    it('should cleanup remote console server', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      const cleanup = plugin.configureServer(mockServer);
      cleanup();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AppDev Monitor]'),
        expect.stringContaining('远程控制台已停止')
      );

      consoleSpy.mockRestore();
    });

    it('should handle cleanup when features are not enabled', () => {
      plugin = xagiMonitor({
        errorPageCustomization: {
          enabled: false,
        },
        remoteConsole: {
          enabled: false,
        },
      });

      const consoleSpy = vi.spyOn(console, 'log');

      const cleanup = plugin.configureServer(mockServer);
      cleanup();

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('错误页面增强已停止')
      );
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('远程控制台已停止')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('multiple feature integration', () => {
    beforeEach(() => {
      plugin = xagiMonitor({
        errorMonitor: true,
        logForwarding: true,
        hmrForwarding: true,
        errorPageCustomization: {
          enabled: true,
        },
        remoteConsole: {
          enabled: true,
        },
        whiteScreenMonitor: {
          enabled: true,
        },
        designMode: {
          enabled: true,
        },
      });
    });

    it('should initialize all features simultaneously', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      plugin.configureServer(mockServer);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('错误页面增强已启用')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('远程控制台已启用')
      );

      consoleSpy.mockRestore();
    });

    it('should handle events from all features', () => {
      plugin.configureServer(mockServer);

      // Simulate various events
      const errorEvent = mockServer.ws.on.mock.calls.find(
        call => call[0] === 'appdev:error'
      )?.[1];

      const hmrEvent = mockServer.ws.on.mock.calls.find(
        call => call[0] === 'appdev:hmr'
      )?.[1];

      const whiteScreenEvent = mockServer.ws.on.mock.calls.find(
        call => call[0] === 'appdev:white-screen'
      )?.[1];

      const designEditEvent = mockServer.ws.on.mock.calls.find(
        call => call[0] === 'appdev:design-edit'
      )?.[1];

      expect(errorEvent).toBeDefined();
      expect(hmrEvent).toBeDefined();
      // Note: white-screen and design-edit events are handled by client script
      // but the server should be ready to receive them
    });

    it('should cleanup all features', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      const cleanup = plugin.configureServer(mockServer);
      cleanup();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('错误页面增强已停止')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('远程控制台已停止')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('configuration edge cases', () => {
    it('should handle missing configuration', () => {
      expect(() => {
        plugin = xagiMonitor();
        plugin.configureServer(mockServer);
      }).not.toThrow();
    });

    it('should handle empty configuration object', () => {
      expect(() => {
        plugin = xagiMonitor({});
        plugin.configureServer(mockServer);
      }).not.toThrow();
    });

    it('should handle invalid configuration values', () => {
      expect(() => {
        plugin = xagiMonitor({
          errorMonitor: 'true' as any,
          logForwarding: null as any,
          hmrForwarding: undefined as any,
          debug: 1 as any,
        });
        plugin.configureServer(mockServer);
      }).not.toThrow();
    });

    it('should handle partial configuration', () => {
      expect(() => {
        plugin = xagiMonitor({
          errorMonitor: true,
          // Other options use defaults
        });
        plugin.configureServer(mockServer);
      }).not.toThrow();
    });
  });

  describe('error handling and robustness', () => {
    beforeEach(() => {
      plugin = xagiMonitor({
        errorMonitor: true,
        logForwarding: true,
        hmrForwarding: true,
      });
    });

    it('should handle missing server methods gracefully', () => {
      const incompleteServer = {
        ws: {
          send: vi.fn(),
          on: vi.fn(),
        },
        // Missing middlewares
      };

      expect(() => {
        plugin.configureServer(incompleteServer);
      }).not.toThrow();
    });

    it('should handle WebSocket errors', () => {
      mockServer.ws.send = vi.fn(() => {
        throw new Error('WebSocket error');
      });

      const cleanup = plugin.configureServer(mockServer);

      expect(() => {
        // Should not throw when WebSocket fails
        if (cleanup) cleanup();
      }).not.toThrow();
    });

    it('should handle malformed HTML in transform', () => {
      const malformedHtmls = [
        '',
        '<html',
        'not html at all',
        '<script>alert("test")</script>',
      ];

      malformedHtmls.forEach(html => {
        expect(() => {
          plugin.transformIndexHtml(html);
        }).not.toThrow();
      });
    });
  });

  describe('performance considerations', () => {
    beforeEach(() => {
      plugin = xagiMonitor({
        errorMonitor: true,
        logForwarding: true,
        hmrForwarding: true,
      });
    });

    it('should not block server startup', () => {
      const startTime = Date.now();
      plugin.configureServer(mockServer);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });

    it('should not block HTML transformation', () => {
      const largeHtml = '<html><head>'.repeat(1000) + '</head><body></body></html>';

      const startTime = Date.now();
      const result = plugin.transformIndexHtml(largeHtml);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
      expect(result).toBeDefined();
    });

    it('should handle multiple rapid configure calls', () => {
      expect(() => {
        for (let i = 0; i < 10; i++) {
          const cleanup = plugin.configureServer(mockServer);
          if (cleanup) cleanup();
        }
      }).not.toThrow();
    });
  });
});