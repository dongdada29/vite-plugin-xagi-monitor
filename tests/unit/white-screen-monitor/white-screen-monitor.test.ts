import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WhiteScreenMonitor } from '../../../src/white-screen-monitor';
import { createMockWhiteScreenResult } from '../../setup';

describe('WhiteScreenMonitor', () => {
  let monitor: WhiteScreenMonitor;
  let mockCallback: any;

  beforeEach(() => {
    mockCallback = vi.fn();

    // Mock DOM environment
    document.body.innerHTML = '';
    document.documentElement.innerHTML = '';

    // Mock performance API
    Object.defineProperty(window, 'performance', {
      value: {
        now: vi.fn(() => Date.now()),
        getEntriesByType: vi.fn(() => [
          {
            name: 'http://localhost:3000/style.css',
            initiatorType: 'link',
          },
          {
            name: 'http://localhost:3000/script.js',
            initiatorType: 'script',
          },
        ]),
      },
      writable: true,
    });

    // Mock location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000',
      },
      writable: true,
    });

    // Mock innerHeight and innerWidth
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      writable: true,
    });

    Object.defineProperty(window, 'innerWidth', {
      value: 1200,
      writable: true,
    });
  });

  afterEach(() => {
    if (monitor && monitor['isEnabled']) {
      monitor.stop();
    }
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      monitor = new WhiteScreenMonitor();

      expect(monitor).toBeDefined();
      expect(monitor['isEnabled']).toBe(false);
      expect(monitor['lastResults']).toEqual([]);
    });

    it('should initialize with custom config', () => {
      const customConfig = {
        enabled: false,
        screenshot: true,
        thresholds: {
          contentLength: 100,
          elementCount: 10,
          loadTime: 5000,
        },
        checkInterval: 5000,
        debug: true,
      };

      monitor = new WhiteScreenMonitor(customConfig);

      expect(monitor['config']).toEqual(customConfig);
    });

    it('should merge config with defaults', () => {
      const partialConfig = {
        enabled: true,
        checkInterval: 3000,
      };

      monitor = new WhiteScreenMonitor(partialConfig);

      expect(monitor['config'].enabled).toBe(true);
      expect(monitor['config'].checkInterval).toBe(3000);
      expect(monitor['config'].thresholds.contentLength).toBe(50); // Default value
    });
  });

  describe('start and stop', () => {
    it('should start monitoring when enabled', () => {
      monitor = new WhiteScreenMonitor({ enabled: true });

      monitor.start();

      expect(monitor['isEnabled']).toBe(true);
      expect(monitor['monitoringInterval']).toBeDefined();
    });

    it('should not start when disabled', () => {
      monitor = new WhiteScreenMonitor({ enabled: false });

      monitor.start();

      expect(monitor['isEnabled']).toBe(false);
      expect(monitor['monitoringInterval']).toBeUndefined();
    });

    it('should stop monitoring', () => {
      monitor = new WhiteScreenMonitor({ enabled: true });

      monitor.start();
      expect(monitor['isEnabled']).toBe(true);

      monitor.stop();
      expect(monitor['isEnabled']).toBe(false);
      expect(monitor['monitoringInterval']).toBeUndefined();
    });

    it('should not start if already running', () => {
      monitor = new WhiteScreenMonitor({ enabled: true });

      monitor.start();
      const interval = monitor['monitoringInterval'];

      monitor.start();
      expect(monitor['monitoringInterval']).toBe(interval);
    });

    it('should handle stop when not running', () => {
      monitor = new WhiteScreenMonitor({ enabled: true });

      expect(() => {
        monitor.stop();
      }).not.toThrow();
      expect(monitor['isEnabled']).toBe(false);
    });

    it('should wait for DOMContentLoaded if loading', () => {
      // Mock loading state
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true,
      });

      monitor = new WhiteScreenMonitor({ enabled: true });
      const eventSpy = vi.spyOn(document, 'addEventListener');

      monitor.start();

      expect(eventSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
      expect(monitor['isEnabled']).toBe(false); // Should not start immediately

      eventSpy.mockRestore();
    });
  });

  describe('metrics collection', () => {
    beforeEach(() => {
      monitor = new WhiteScreenMonitor({ enabled: true });
    });

    it('should collect basic DOM metrics', () => {
      // Setup test DOM
      document.body.innerHTML = `
        <div id="root">
          <h1>Test Page</h1>
          <p>This is a test paragraph with some content.</p>
          <button>Click me</button>
        </div>
      `;

      const metrics = monitor['collectMetrics']();

      expect(metrics).toMatchObject({
        textLength: expect.any(Number),
        elementCount: expect.any(Number),
        pageHeight: expect.any(Number),
        bodyChildren: expect.any(Number),
        rootChildren: expect.any(Number),
        viewportHeight: 800,
        viewportWidth: 1200,
      });

      expect(metrics.textLength).toBeGreaterThan(0);
      expect(metrics.elementCount).toBeGreaterThan(0);
    });

    it('should collect performance metrics', () => {
      const metrics = monitor['collectMetrics']();

      expect(metrics).toMatchObject({
        loadedResources: expect.any(Number),
        totalResources: expect.any(Number),
        loadTime: expect.any(Number),
      });

      expect(metrics.loadedResources).toBeGreaterThan(0);
    });

    it('should detect visible content', () => {
      // Setup visible content
      document.body.innerHTML = '<p style="display: block;">Visible content</p>';

      const metrics = monitor['collectMetrics']();

      expect(metrics.hasVisibleContent).toBe(true);
    });

    it('should detect hidden content', () => {
      // Setup hidden content
      document.body.innerHTML = '<p style="display: none;">Hidden content</p>';

      const metrics = monitor['collectMetrics']();

      expect(metrics.hasVisibleContent).toBe(false);
    });

    it('should detect interactive elements', () => {
      document.body.innerHTML = `
        <button>Button</button>
        <input type="text" />
        <select><option>Option</option></select>
        <textarea></textarea>
      `;

      const metrics = monitor['collectMetrics']();

      expect(metrics.hasInteractiveElements).toBe(true);
    });

    it('should detect images', () => {
      document.body.innerHTML = '<img src="test.jpg" alt="Test image" />';

      const metrics = monitor['collectMetrics']();

      expect(metrics.hasImages).toBe(true);
    });

    it('should detect background styles', () => {
      document.body.style.backgroundColor = '#ffffff';

      const metrics = monitor['collectMetrics']();

      expect(metrics.hasBackground).toBe(true);
    });

    it('should handle empty body gracefully', () => {
      document.body.innerHTML = '';

      const metrics = monitor['collectMetrics']();

      expect(metrics.textLength).toBe(0);
      expect(metrics.bodyChildren).toBe(0);
    });

    it('should handle missing root element', () => {
      document.body.innerHTML = '<p>No root element</p>';

      const metrics = monitor['collectMetrics']();

      expect(metrics.rootChildren).toBe(0);
      expect(metrics.hasContentInRoot).toBe(false);
    });
  });

  describe('white screen evaluation', () => {
    beforeEach(() => {
      monitor = new WhiteScreenMonitor({
        thresholds: {
          contentLength: 50,
          elementCount: 5,
          loadTime: 3000,
        },
      });
    });

    it('should detect normal page as not white screen', () => {
      document.body.innerHTML = `
        <div id="root">
          <h1>Normal Page</h1>
          <p>This page has sufficient content to not be considered a white screen.</p>
          <div>Additional content here</div>
          <span>More content</span>
          <section>Even more content</section>
        </div>
      `;

      const metrics = monitor['collectMetrics']();
      const isWhiteScreen = monitor['evaluateWhiteScreen'](metrics);

      expect(isWhiteScreen).toBe(false);
    });

    it('should detect insufficient text content', () => {
      document.body.innerHTML = '<p>Short</p>';

      const metrics = monitor['collectMetrics']();
      const isWhiteScreen = monitor['evaluateWhiteScreen'](metrics);

      expect(isWhiteScreen).toBe(true);
    });

    it('should detect insufficient element count', () => {
      document.body.innerHTML = '<p>Only one element</p>';

      const metrics = monitor['collectMetrics']();
      const isWhiteScreen = monitor['evaluateWhiteScreen'](metrics);

      expect(isWhiteScreen).toBe(true);
    });

    it('should detect empty root element', () => {
      document.body.innerHTML = '<div id="root"></div>';

      const metrics = monitor['collectMetrics']();
      const isWhiteScreen = monitor['evaluateWhiteScreen'](metrics);

      expect(isWhiteScreen).toBe(true);
    });

    it('should detect no visible content', () => {
      document.body.innerHTML = '<p style="display: none; visibility: hidden; opacity: 0;">Hidden content</p>';

      const metrics = monitor['collectMetrics']();
      const isWhiteScreen = monitor['evaluateWhiteScreen'](metrics);

      expect(isWhiteScreen).toBe(true);
    });

    it('should handle load time issues', () => {
      // Mock slow load time
      Object.defineProperty(window, 'performance', {
        value: {
          now: vi.fn(() => Date.now()),
          getEntriesByType: vi.fn(() => [
            {
              loadEventEnd: 5000,
              loadEventStart: 1000,
            },
          ]),
        },
        writable: true,
      });

      document.body.innerHTML = '<p>Some content</p>';

      const metrics = monitor['collectMetrics']();
      const isWhiteScreen = monitor['evaluateWhiteScreen'](metrics);

      expect(isWhiteScreen).toBe(true);
    });

    it('should handle edge cases with interactive elements', () => {
      document.body.innerHTML = '<button>Button</button>';

      const metrics = monitor['collectMetrics']();
      const isWhiteScreen = monitor['evaluateWhiteScreen'](metrics);

      // Should still be white screen due to insufficient content
      expect(isWhiteScreen).toBe(true);
    });

    it('should use custom thresholds', () => {
      monitor = new WhiteScreenMonitor({
        thresholds: {
          contentLength: 10,
          elementCount: 1,
          loadTime: 1000,
        },
      });

      document.body.innerHTML = '<p>Short content</p>';

      const metrics = monitor['collectMetrics']();
      const isWhiteScreen = monitor['evaluateWhiteScreen'](metrics);

      // Should not be white screen with custom thresholds
      expect(isWhiteScreen).toBe(false);
    });
  });

  describe('page analysis', () => {
    beforeEach(() => {
      monitor = new WhiteScreenMonitor({ enabled: true });
    });

    it('should analyze page and return result', () => {
      document.body.innerHTML = '<p>Test content</p>';

      const result = monitor['analyzePage']();

      expect(result).toMatchObject({
        isWhiteScreen: expect.any(Boolean),
        timestamp: expect.any(Number),
        url: 'http://localhost:3000',
        metrics: expect.any(Object),
      });
    });

    it('should include screenshot when enabled', async () => {
      monitor = new WhiteScreenMonitor({ screenshot: true });

      document.body.innerHTML = '<p>Test content</p>';

      const result = monitor['analyzePage']();

      expect(result.screenshot).toBeDefined();
      expect(typeof result.screenshot).toBe('string');
    });

    it('should not include screenshot when disabled', () => {
      monitor = new WhiteScreenMonitor({ screenshot: false });

      document.body.innerHTML = '<p>Test content</p>';

      const result = monitor['analyzePage']();

      expect(result.screenshot).toBeUndefined();
    });

    it('should handle screenshot generation errors', () => {
      monitor = new WhiteScreenMonitor({ screenshot: true });

      // Mock a situation where screenshot fails
      const originalGetElementsByTagName = document.getElementsByTagName;
      document.getElementsByTagName = vi.fn(() => {
        throw new Error('Screenshot failed');
      });

      document.body.innerHTML = '<p>Test content</p>';

      expect(() => {
        const result = monitor['analyzePage']();
        expect(result.screenshot).toBe('');
      }).not.toThrow();

      document.getElementsByTagName = originalGetElementsByTagName;
    });
  });

  describe('check execution', () => {
    beforeEach(() => {
      monitor = new WhiteScreenMonitor({ enabled: true });
      monitor['sendMonitoringData'] = vi.fn();
      monitor['sendWhiteScreenAlert'] = vi.fn();
    });

    it('should perform check and store results', () => {
      document.body.innerHTML = '<p>Test content</p>';

      monitor['performCheck']();

      expect(monitor['lastResults']).toHaveLength(1);
      expect(monitor['sendMonitoringData']).toHaveBeenCalled();
    });

    it('should limit stored results', () => {
      monitor = new WhiteScreenMonitor({ enabled: true });

      // Add more results than the limit
      for (let i = 0; i < 120; i++) {
        monitor['lastResults'].push({
          isWhiteScreen: false,
          timestamp: Date.now() + i,
          url: 'http://localhost:3000',
          metrics: {},
        });
      }

      monitor['performCheck']();

      expect(monitor['lastResults'].length).toBeLessThanOrEqual(50);
    });

    it('should handle white screen detection', () => {
      document.body.innerHTML = ''; // Empty page

      monitor['performCheck']();

      expect(monitor['sendWhiteScreenAlert']).toHaveBeenCalled();
    });

    it('should not trigger alert for normal page', () => {
      document.body.innerHTML = '<p>Sufficient content for normal page</p>';

      monitor['performCheck']();

      expect(monitor['sendWhiteScreenAlert']).not.toHaveBeenCalled();
    });
  });

  describe('alert system', () => {
    beforeEach(() => {
      monitor = new WhiteScreenMonitor({ enabled: true });
    });

    it('should show white screen alert', () => {
      const result = createMockWhiteScreenResult({
        isWhiteScreen: true,
        metrics: {
          textLength: 0,
          elementCount: 0,
          pageHeight: 0,
          hasVisibleContent: false,
          loadTime: 0,
          bodyChildren: 0,
          rootChildren: 0,
          hasInteractiveElements: false,
          hasImages: false,
          hasBackground: false,
          hasContentInRoot: false,
        },
      });

      const consoleSpy = vi.spyOn(console, 'error');

      monitor['sendWhiteScreenAlert'](result);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[White Screen Monitor] 检测到白屏!'),
        expect.objectContaining({
          url: result.url,
          timestamp: expect.any(Number),
          metrics: result.metrics,
        })
      );

      consoleSpy.mockRestore();
    });

    it('should inject alert element into DOM', () => {
      const result = createMockWhiteScreenResult({ isWhiteScreen: true });

      monitor['sendWhiteScreenAlert'](result);

      const alertElement = document.getElementById('xagi-white-screen-alert');
      expect(alertElement).toBeDefined();
      expect(alertElement?.innerHTML).toContain('白屏警告');
    });

    it('should remove existing alert before adding new one', () => {
      // Add existing alert
      const existingAlert = document.createElement('div');
      existingAlert.id = 'xagi-white-screen-alert';
      document.body.appendChild(existingAlert);

      const result = createMockWhiteScreenResult({ isWhiteScreen: true });
      monitor['sendWhiteScreenAlert'](result);

      const alertElement = document.getElementById('xagi-white-screen-alert');
      expect(alertElement).toBeDefined();
      expect(document.body.children).toContain(alertElement);
    });

    it('should auto-remove alert after timeout', (done) => {
      vi.useFakeTimers();

      const result = createMockWhiteScreenResult({ isWhiteScreen: true });
      monitor['sendWhiteScreenAlert'](result);

      const alertElement = document.getElementById('xagi-white-screen-alert');
      expect(alertElement).toBeDefined();

      // Fast-forward 5 seconds
      vi.advanceTimersByTime(5000);

      setTimeout(() => {
        const removedAlert = document.getElementById('xagi-white-screen-alert');
        expect(removedAlert).toBeNull();
        vi.useRealTimers();
        done();
      }, 0);
    });

    it('should handle manual alert dismissal', () => {
      const result = createMockWhiteScreenResult({ isWhiteScreen: true });
      monitor['sendWhiteScreenAlert'](result);

      const alertElement = document.getElementById('xagi-white-screen-alert');
      expect(alertElement).toBeDefined();

      // Simulate click on close button
      const closeButton = alertElement?.querySelector('button');
      if (closeButton) {
        closeButton.click();
      }

      const removedAlert = document.getElementById('xagi-white-screen-alert');
      expect(removedAlert).toBeNull();
    });
  });

  describe('callback system', () => {
    beforeEach(() => {
      monitor = new WhiteScreenMonitor({ enabled: true });
    });

    it('should call callback when white screen is detected', () => {
      const result = createMockWhiteScreenResult({ isWhiteScreen: true });
      monitor.onDetected(mockCallback);

      monitor['handleWhiteScreenDetected'](result);

      expect(mockCallback).toHaveBeenCalledWith(result);
    });

    it('should not call callback for normal results', () => {
      const result = createMockWhiteScreenResult({ isWhiteScreen: false });
      monitor.onDetected(mockCallback);

      monitor['handleWhiteScreenDetected'](result);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should handle multiple callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      monitor.onDetected(callback1);
      monitor.onDetected(callback2);

      const result = createMockWhiteScreenResult({ isWhiteScreen: true });
      monitor['handleWhiteScreenDetected'](result);

      expect(callback1).toHaveBeenCalledWith(result);
      expect(callback2).toHaveBeenCalledWith(result);
    });
  });

  describe('data retrieval', () => {
    beforeEach(() => {
      monitor = new WhiteScreenMonitor({ enabled: true });

      // Add some test results
      for (let i = 0; i < 5; i++) {
        monitor['lastResults'].push(createMockWhiteScreenResult({
          isWhiteScreen: i % 2 === 0,
          timestamp: Date.now() + i * 1000,
        }));
      }
    });

    it('should get last results with default count', () => {
      const results = monitor.getLastResults();

      expect(results).toHaveLength(5);
      expect(results[0].isWhiteScreen).toBe(true);
      expect(results[4].isWhiteScreen).toBe(true);
    });

    it('should get last results with custom count', () => {
      const results = monitor.getLastResults(3);

      expect(results).toHaveLength(3);
      expect(results[0].timestamp).toBeGreaterThan(results[1].timestamp);
    });

    it('should handle count larger than available results', () => {
      const results = monitor.getLastResults(10);

      expect(results).toHaveLength(5);
    });

    it('should get statistics', () => {
      const stats = monitor.getStats();

      expect(stats).toMatchObject({
        totalChecks: 5,
        whiteScreenCount: 3,
        whiteScreenRate: '60.00%',
        averageMetrics: expect.any(Object),
      });

      expect(stats.lastWhiteScreenAt).toBeDefined();
      expect(stats.averageMetrics).toBeDefined();
    });

    it('should calculate average metrics correctly', () => {
      const stats = monitor.getStats();

      expect(stats.averageMetrics).toMatchObject({
        textLength: expect.any(Number),
        elementCount: expect.any(Number),
        pageHeight: expect.any(Number),
        loadTime: expect.any(Number),
      });
    });

    it('should handle empty results', () => {
      monitor = new WhiteScreenMonitor({ enabled: true });

      const stats = monitor.getStats();

      expect(stats).toMatchObject({
        totalChecks: 0,
        whiteScreenCount: 0,
        whiteScreenRate: '0%',
        lastWhiteScreenAt: null,
        averageMetrics: null,
      });
    });
  });

  describe('debug functionality', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log');
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log debug messages when enabled', () => {
      monitor = new WhiteScreenMonitor({
        enabled: true,
        debug: true,
      });

      document.body.innerHTML = '<p>Test content</p>';

      monitor['performCheck']();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[White Screen Monitor]'),
        expect.stringContaining('检测结果:')
      );
    });

    it('should not log debug messages when disabled', () => {
      monitor = new WhiteScreenMonitor({
        enabled: true,
        debug: false,
      });

      document.body.innerHTML = '<p>Test content</p>';

      monitor['performCheck']();

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should log performance timing in debug mode', () => {
      monitor = new WhiteScreenMonitor({
        enabled: true,
        debug: true,
      });

      document.body.innerHTML = '<p>Test content</p>';

      monitor['analyzePage']();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[White Screen Monitor]'),
        expect.stringContaining('分析耗时:')
      );
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      monitor = new WhiteScreenMonitor({ enabled: true });
    });

    it('should handle DOM query errors', () => {
      // Mock querySelector to throw error
      const originalQuerySelector = document.querySelector;
      document.querySelector = vi.fn(() => {
        throw new Error('DOM query error');
      });

      expect(() => {
        monitor['collectMetrics']();
      }).not.toThrow();

      document.querySelector = originalQuerySelector;
    });

    it('should handle performance API errors', () => {
      // Mock performance API to throw error
      Object.defineProperty(window, 'performance', {
        value: {
          now: vi.fn(() => {
            throw new Error('Performance API error');
          }),
          getEntriesByType: vi.fn(() => []),
        },
        writable: true,
      });

      expect(() => {
        monitor['analyzePage']();
      }).not.toThrow();
    });

    it('should handle WebSocket send errors', () => {
      monitor = new WhiteScreenMonitor({ enabled: true });

      // Mock import.meta.hot.send to throw error
      const mockImportMeta = {
        hot: {
          send: vi.fn(() => {
            throw new Error('WebSocket error');
          }),
        },
      };

      Object.defineProperty(global, 'import', {
        value: mockImportMeta,
        writable: true,
      });

      expect(() => {
        monitor['sendMonitoringData']({
          isWhiteScreen: false,
          timestamp: Date.now(),
          url: 'http://localhost:3000',
          metrics: {},
        });
      }).not.toThrow();
    });

    it('should handle postMessage errors', () => {
      monitor = new WhiteScreenMonitor({ enabled: true });

      // Mock postMessage to throw error
      const originalPostMessage = window.parent?.postMessage;
      if (window.parent) {
        window.parent.postMessage = vi.fn(() => {
          throw new Error('PostMessage error');
        });
      }

      expect(() => {
        monitor['sendMonitoringData']({
          isWhiteScreen: false,
          timestamp: Date.now(),
          url: 'http://localhost:3000',
          metrics: {},
        });
      }).not.toThrow();

      if (window.parent && originalPostMessage) {
        window.parent.postMessage = originalPostMessage;
      }
    });
  });

  describe('integration with import.meta.hot', () => {
    beforeEach(() => {
      monitor = new WhiteScreenMonitor({ enabled: true });

      const mockImportMeta = {
        hot: {
          send: vi.fn(),
        },
      };

      Object.defineProperty(global, 'import', {
        value: mockImportMeta,
        writable: true,
      });
    });

    it('should send monitoring data via import.meta.hot', () => {
      const result = createMockWhiteScreenResult();

      monitor['sendMonitoringData'](result);

      expect(import.meta.hot.send).toHaveBeenCalledWith(
        'appdev:white-screen',
        result
      );
    });

    it('should handle missing import.meta.hot', () => {
      Object.defineProperty(global, 'import', {
        value: {},
        writable: true,
      });

      expect(() => {
        monitor['sendMonitoringData'](createMockWhiteScreenResult());
      }).not.toThrow();
    });
  });

  describe('configuration validation', () => {
    it('should handle invalid checkInterval', () => {
      expect(() => {
        monitor = new WhiteScreenMonitor({
          enabled: true,
          checkInterval: -1,
        });
        monitor.start();
      }).not.toThrow();
    });

    it('should handle invalid thresholds', () => {
      expect(() => {
        monitor = new WhiteScreenMonitor({
          enabled: true,
          thresholds: {
            contentLength: -1,
            elementCount: 0,
            loadTime: -1000,
          },
        });
      }).not.toThrow();
    });

    it('should handle boolean conversion for enabled', () => {
      expect(() => {
        monitor = new WhiteScreenMonitor({
          enabled: 'true' as any,
        });
      }).not.toThrow();

      expect(monitor['config'].enabled).toBe('true');
    });
  });
});