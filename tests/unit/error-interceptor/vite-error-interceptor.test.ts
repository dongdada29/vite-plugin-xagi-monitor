import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ViteErrorInterceptor } from '../../../src/vite-error-interceptor';
import type { ErrorPageCustomizationConfig } from '../../../src/types';
import { createMockViteServer, createMockError } from '../../setup';

describe('ViteErrorInterceptor', () => {
  let mockServer: any;
  let interceptor: ViteErrorInterceptor;
  let mockNext: any;
  let mockRes: any;

  beforeEach(() => {
    mockServer = createMockViteServer();
    mockNext = vi.fn();
    mockRes = {
      status: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
      end: vi.fn(),
    };

    // Mock fs module
    vi.doMock('fs', () => ({
      readFileSync: vi.fn((path: string) => {
        if (path.includes('test-file.js')) {
          return `
const test = 'value';
console.log(test);
const error = new Error('test error');
          `.trim();
        }
        return '';
      }),
      existsSync: vi.fn(() => true),
    }));

    // Mock path module
    vi.doMock('path', () => ({
      resolve: vi.fn((...args) => args.join('/')),
      basename: vi.fn((path: string) => path.split('/').pop()),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      interceptor = new ViteErrorInterceptor(mockServer, {});

      expect(interceptor).toBeDefined();
      expect(interceptor['isRunning']).toBe(false);
    });

    it('should initialize with custom config', () => {
      const config: ErrorPageCustomizationConfig = {
        enabled: true,
        aiFriendly: false,
        showStack: false,
        showCodeSnippet: false,
        maxStackLines: 5,
        debug: true,
      };

      interceptor = new ViteErrorInterceptor(mockServer, config);

      expect(interceptor).toBeDefined();
      expect(interceptor['config']).toEqual(config);
    });
  });

  describe('start and stop', () => {
    it('should start the interceptor', () => {
      interceptor = new ViteErrorInterceptor(mockServer, { enabled: true });

      interceptor.start();

      expect(interceptor['isRunning']).toBe(true);
      expect(mockServer.middlewares.use).toHaveBeenCalled();
    });

    it('should stop the interceptor', () => {
      interceptor = new ViteErrorInterceptor(mockServer, { enabled: true });

      interceptor.start();
      interceptor.stop();

      expect(interceptor['isRunning']).toBe(false);
    });

    it('should not start if already running', () => {
      interceptor = new ViteErrorInterceptor(mockServer, { enabled: true });

      interceptor.start();
      const middlewareCount = mockServer.middlewares.use.mock.calls.length;

      interceptor.start();

      expect(mockServer.middlewares.use).toHaveBeenCalledTimes(middlewareCount);
    });
  });

  describe('middleware functionality', () => {
    beforeEach(() => {
      interceptor = new ViteErrorInterceptor(mockServer, {
        enabled: true,
        aiFriendly: true,
        showStack: true,
        showCodeSnippet: true,
        maxStackLines: 8,
        debug: false,
      });
      interceptor.start();
    });

    it('should pass through non-error responses', () => {
      const mockReq = { url: '/test.css' };
      const mockRes = { status: 200 };
      const mockNext = vi.fn();

      // Get the middleware function
      const middleware = mockServer.middlewares.use.mock.calls[0][0];
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should intercept error responses (status 500)', () => {
      const mockReq = { url: '/test.js' };
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        setHeader: vi.fn().mockReturnThis(),
        end: vi.fn(),
        getHeader: vi.fn(),
      };
      const mockNext = vi.fn();

      // Simulate Vite error
      const error = new Error('Test error');
      mockNext.mockImplementationOnce((err?: any) => {
        if (err) {
          mockRes.status(500);
        }
      });

      // Get the middleware function
      const middleware = mockServer.middlewares.use.mock.calls[0][0];
      middleware(mockReq, mockRes, mockNext);

      // Should not call original error handling
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should enhance HTML error responses', () => {
      const mockReq = { url: '/test.js' };
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        setHeader: vi.fn().mockReturnThis(),
        end: vi.fn(),
        getHeader: vi.fn(() => 'text/html'),
      };
      const mockNext = vi.fn();

      // Get the middleware function
      const middleware = mockServer.middlewares.use.mock.calls[0][0];
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
    });

    it('should not enhance non-HTML error responses', () => {
      const mockReq = { url: '/test.css' };
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        setHeader: vi.fn().mockReturnThis(),
        end: vi.fn(),
        getHeader: vi.fn(() => 'text/css'),
      };
      const mockNext = vi.fn();

      // Get the middleware function
      const middleware = mockServer.middlewares.use.mock.calls[0][0];
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.setHeader).not.toHaveBeenCalledWith('Content-Type', 'text/html');
    });
  });

  describe('error processing', () => {
    beforeEach(() => {
      interceptor = new ViteErrorInterceptor(mockServer, {
        enabled: true,
        aiFriendly: true,
        showStack: true,
        showCodeSnippet: true,
        maxStackLines: 8,
        debug: false,
      });
    });

    it('should parse JavaScript errors correctly', () => {
      const error = createMockError({
        type: 'SyntaxError',
        message: 'Unexpected token',
        file: '/test/file.js',
        line: 10,
        column: 5,
      });

      const parsed = interceptor['parseError'](error);

      expect(parsed.type).toBe('SyntaxError');
      expect(parsed.message).toBe('Unexpected token');
      expect(parsed.file).toBe('/test/file.js');
      expect(parsed.line).toBe(10);
      expect(parsed.column).toBe(5);
    });

    it('should handle missing file information', () => {
      const error = new Error('Unknown error');

      const parsed = interceptor['parseError'](error);

      expect(parsed.file).toBe('unknown');
      expect(parsed.line).toBe(0);
      expect(parsed.column).toBe(0);
    });

    it('should truncate stack traces', () => {
      const longStack = Array.from({ length: 20 }, (_, i) => `at function${i} (file${i}.js:${i}:1)`).join('\n');
      const error = createMockError({ stack: longStack });

      const parsed = interceptor['parseError'](error);

      expect(parsed.stack?.split('\n').length).toBeLessThanOrEqual(8);
    });

    it('should extract code snippets', () => {
      const error = createMockError({
        file: '/test-file.js',
        line: 2,
      });

      const snippet = interceptor['extractCodeSnippet']('/test-file.js', 2);

      expect(snippet).toBeDefined();
      expect(snippet).toContain("const test = 'value'");
    });

    it('should handle missing code files gracefully', () => {
      const error = createMockError({
        file: '/non-existent-file.js',
        line: 1,
      });

      const snippet = interceptor['extractCodeSnippet']('/non-existent-file.js', 1);

      expect(snippet).toBe('// Unable to load source code');
    });

    it('should generate suggestions based on error type', () => {
      const syntaxError = createMockError({ type: 'SyntaxError' });
      const typeError = createMockError({ type: 'TypeError' });

      const syntaxSuggestions = interceptor['generateSuggestions']('SyntaxError');
      const typeSuggestions = interceptor['generateSuggestions']('TypeError');

      expect(syntaxSuggestions).toContain('Check for missing brackets, parentheses, or semicolons');
      expect(typeSuggestions).toContain('Check variable types and function signatures');
    });
  });

  describe('AI-friendly error formatting', () => {
    beforeEach(() => {
      interceptor = new ViteErrorInterceptor(mockServer, {
        enabled: true,
        aiFriendly: true,
        showStack: true,
        showCodeSnippet: true,
        maxStackLines: 8,
        debug: false,
      });
    });

    it('should format errors in AI-friendly structure', () => {
      const error = createMockError({
        type: 'SyntaxError',
        message: 'Unexpected token }',
        file: '/test-file.js',
        line: 3,
        column: 15,
      });

      const formatted = interceptor['formatAIFriendlyError'](error);

      expect(formatted).toHaveProperty('type');
      expect(formatted).toHaveProperty('message');
      expect(formatted).toHaveProperty('file');
      expect(formatted).toHaveProperty('line');
      expect(formatted).toHaveProperty('column');
      expect(formatted).toHaveProperty('stack');
      expect(formatted).toHaveProperty('suggestions');
      expect(formatted).toHaveProperty('codeSnippet');
      expect(formatted).toHaveProperty('timestamp');

      expect(formatted.type).toBe('SyntaxError');
      expect(formatted.message).toBe('Unexpected token }');
      expect(formatted.file).toBe('/test-file.js');
      expect(formatted.line).toBe(3);
      expect(formatted.column).toBe(15);
    });

    it('should include relevant suggestions', () => {
      const error = createMockError({ type: 'ReferenceError' });
      const formatted = interceptor['formatAIFriendlyError'](error);

      expect(formatted.suggestions).toBeDefined();
      expect(Array.isArray(formatted.suggestions)).toBe(true);
      expect(formatted.suggestions.length).toBeGreaterThan(0);
    });

    it('should include code snippet when enabled', () => {
      const error = createMockError({
        file: '/test-file.js',
        line: 2,
      });
      const formatted = interceptor['formatAIFriendlyError'](error);

      expect(formatted.codeSnippet).toBeDefined();
      expect(typeof formatted.codeSnippet).toBe('string');
    });

    it('should not include code snippet when disabled', () => {
      interceptor = new ViteErrorInterceptor(mockServer, {
        enabled: true,
        aiFriendly: true,
        showStack: true,
        showCodeSnippet: false,
        maxStackLines: 8,
      });

      const error = createMockError();
      const formatted = interceptor['formatAIFriendlyError'](error);

      expect(formatted.codeSnippet).toBeUndefined();
    });
  });

  describe('HTML generation', () => {
    beforeEach(() => {
      interceptor = new ViteErrorInterceptor(mockServer, {
        enabled: true,
        aiFriendly: true,
        showStack: true,
        showCodeSnippet: true,
        maxStackLines: 8,
        debug: false,
      });
    });

    it('should generate enhanced error page HTML', () => {
      const error = createMockError({
        type: 'SyntaxError',
        message: 'Test error message',
        file: '/test-file.js',
        line: 2,
      });

      const html = interceptor['generateErrorPage'](error);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<title>Error - XAgi Monitor</title>');
      expect(html).toContain('Test error message');
      expect(html).toContain('/test-file.js');
      expect(html).toContain('Line 2');
      expect(html).toContain('console.log(test)');
    });

    it('should include AI-friendly data when enabled', () => {
      const error = createMockError();
      const html = interceptor['generateErrorPage'](error);

      expect(html).toContain('__XAGI_ERROR_DATA__');
      expect(html).toContain('"aiFriendly":true');
    });

    it('should not include debug info in production', () => {
      const error = createMockError();
      const html = interceptor['generateErrorPage'](error);

      expect(html).not.toContain('data-debug="true"');
    });

    it('should include debug info when debug mode is enabled', () => {
      interceptor = new ViteErrorInterceptor(mockServer, {
        enabled: true,
        aiFriendly: true,
        showStack: true,
        showCodeSnippet: true,
        debug: true,
      });

      const error = createMockError();
      const html = interceptor['generateErrorPage'](error);

      expect(html).toContain('data-debug="true"');
    });
  });

  describe('configuration validation', () => {
    it('should use default values for missing config', () => {
      interceptor = new ViteErrorInterceptor(mockServer, {});

      expect(interceptor['config'].enabled).toBe(false);
      expect(interceptor['config'].aiFriendly).toBe(true);
      expect(interceptor['config'].showStack).toBe(true);
      expect(interpreter['config'].showCodeSnippet).toBe(true);
      expect(interpreter['config'].maxStackLines).toBe(8);
    });

    it('should validate maxStackLines', () => {
      interceptor = new ViteErrorInterceptor(mockServer, {
        enabled: true,
        maxStackLines: 20,
      });

      expect(interceptor['config'].maxStackLines).toBe(20);
    });

    it('should handle invalid config gracefully', () => {
      expect(() => {
        interceptor = new ViteErrorInterceptor(mockServer, {
          enabled: 'true' as any, // Should be boolean
          maxStackLines: -1, // Should be positive
        });
      }).not.toThrow();
    });
  });

  describe('debug logging', () => {
    beforeEach(() => {
      interceptor = new ViteErrorInterceptor(mockServer, {
        enabled: true,
        debug: true,
      });
    });

    it('should log debug messages when enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      interceptor.start();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ViteErrorInterceptor]'),
        expect.stringContaining('Error page enhancement started')
      );

      consoleSpy.mockRestore();
    });

    it('should not log debug messages when disabled', () => {
      interceptor = new ViteErrorInterceptor(mockServer, {
        enabled: true,
        debug: false,
      });

      const consoleSpy = vi.spyOn(console, 'log');

      interceptor.start();

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});