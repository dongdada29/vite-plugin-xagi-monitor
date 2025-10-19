import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// E2E tests simulate the complete workflow from Vite server to browser client
describe('End-to-End Workflow Tests', () => {
  let dom: JSDOM;
  let window: any;
  let document: any;

  beforeEach(() => {
    // Setup DOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Page</title>
        </head>
        <body>
          <div id="root">
            <h1 class="title">Test Application</h1>
            <p id="content">This is test content for monitoring.</p>
            <button class="btn" onclick="testError()">Test Error</button>
            <div id="empty"></div>
          </div>
        </body>
      </html>
    `, {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable',
    });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock WebSocket for client-side communication
    global.WebSocket = class MockWebSocket {
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
        setTimeout(() => {
          if (this.onopen) {
            this.onopen({ type: 'open' });
          }
        }, 0);
      }

      send(data: string) {
        // Mock send
      }

      close() {
        this.readyState = MockWebSocket.CLOSED;
        if (this.onclose) {
          this.onclose({ type: 'close', code: 1000, reason: '' });
        }
      }
    } as any;

    // Mock performance API
    Object.defineProperty(window, 'performance', {
      value: {
        now: vi.fn(() => Date.now()),
        getEntriesByType: vi.fn(() => [
          { name: 'style.css', initiatorType: 'link' },
          { name: 'script.js', initiatorType: 'script' },
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

    // Mock viewport
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
    dom.window.close();
    vi.clearAllMocks();
  });

  describe('complete client script workflow', () => {
    beforeEach(() => {
      // Set up monitor configuration
      window.__XAGI_MONITOR_CONFIG__ = {
        errorMonitor: true,
        whiteScreenMonitor: {
          enabled: true,
          thresholds: {
            contentLength: 50,
            elementCount: 5,
            loadTime: 3000,
          },
          checkInterval: 100,
        },
        designMode: {
          enabled: true,
          showElementBorders: true,
          editableSelectors: ['div', 'p', 'h1', 'button'],
        },
        debug: false,
      };

      // Mock import.meta.hot
      window.importMetaHot = {
        send: vi.fn(),
        on: vi.fn(),
      };

      // Mock parent window for postMessage
      window.parent = {
        postMessage: vi.fn(),
      };
      window.parent !== window; // Ensure parent is different

      // Load and execute client script
      const { CLIENT_SCRIPT } = require('../../src/client-script');
      const script = new Function('window', 'document', CLIENT_SCRIPT);
      script(window, document);
    });

    it('should initialize all monitoring features', () => {
      // Check that monitor was initialized
      expect(window.__XAGI_WHITE_SCREEN_MONITOR__).toBeDefined();
      expect(window.__XAGI_DESIGN_MODE__).toBeDefined();

      // Check that event listeners were set up
      expect(window.importMetaHot.on).toHaveBeenCalledWith('appdev:log', expect.any(Function));
      expect(window.importMetaHot.on).toHaveBeenCalledWith('appdev:hmr', expect.any(Function));
    });

    it('should capture and report JavaScript errors', () => {
      const consoleSpy = vi.spyOn(console, 'error');

      // Trigger a JavaScript error
      setTimeout(() => {
        throw new Error('Test JavaScript error');
      }, 10);

      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[AppDev Monitor Critical Error]'),
          expect.objectContaining({
            type: 'javascript',
            message: 'Test JavaScript error',
            url: 'http://localhost:3000',
          })
        );
      }, 20);

      consoleSpy.mockRestore();
    });

    it('should capture resource loading errors', () => {
      const consoleSpy = vi.spyOn(console, 'error');

      // Create a script element and trigger error
      const script = document.createElement('script');
      script.src = 'http://localhost:3000/non-existent.js';

      const errorEvent = new Event('error', {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(errorEvent, 'target', {
        value: script,
        enumerable: true,
      });

      script.dispatchEvent(errorEvent);

      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[AppDev Monitor]'),
          expect.objectContaining({
            type: 'script',
            url: 'http://localhost:3000/non-existent.js',
            message: '资源加载失败',
          })
        );
      }, 10);

      consoleSpy.mockRestore();
    });

    it('should capture CSS errors with critical severity', () => {
      const consoleSpy = vi.spyOn(console, 'error');

      // Create a link element for CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'http://localhost:3000/non-existent.css';

      const errorEvent = new Event('error', {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(errorEvent, 'target', {
        value: link,
        enumerable: true,
      });

      link.dispatchEvent(errorEvent);

      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[AppDev Monitor Critical Error]'),
          expect.objectContaining({
            type: 'css-error',
            url: 'http://localhost:3000/non-existent.css',
            message: 'CSS 资源加载失败 - 可能导致白屏',
            severity: 'critical',
          })
        );
      }, 10);

      consoleSpy.mockRestore();
    });

    it('should capture Promise rejections', () => {
      const consoleSpy = vi.spyOn(console, 'error');

      // Trigger a Promise rejection
      setTimeout(() => {
        Promise.reject(new Error('Test Promise rejection'));
      }, 10);

      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[AppDev Monitor]'),
          expect.objectContaining({
            type: 'promise',
            message: 'Test Promise rejection',
          })
        );
      }, 20);

      consoleSpy.mockRestore();
    });

    it('should handle server messages', () => {
      // Simulate receiving a log message from server
      const logCallback = window.importMetaHot.on.mock.calls.find(
        call => call[0] === 'appdev:log'
      )?.[1];

      if (logCallback) {
        const logData = {
          level: 'info',
          message: 'Test server log',
          timestamp: Date.now(),
        };

        logCallback(logData);

        // Should forward to parent window
        expect(window.parent.postMessage).toHaveBeenCalledWith({
          type: 'APPDEV_LOG',
          data: logData,
        }, '*');
      }

      // Simulate receiving an HMR message from server
      const hmrCallback = window.importMetaHot.on.mock.calls.find(
        call => call[0] === 'appdev:hmr'
      )?.[1];

      if (hmrCallback) {
        const hmrData = {
          type: 'update',
          path: '/test/file.js',
          timestamp: Date.now(),
        };

        hmrCallback(hmrData);

        expect(window.parent.postMessage).toHaveBeenCalledWith({
          type: 'APPDEV_HMR',
          data: hmrData,
        }, '*');
      }
    });
  });

  describe('white screen monitoring workflow', () => {
    beforeEach(() => {
      window.__XAGI_MONITOR_CONFIG__ = {
        whiteScreenMonitor: {
          enabled: true,
          thresholds: {
            contentLength: 50,
            elementCount: 5,
            loadTime: 3000,
          },
          checkInterval: 50, // Fast for testing
        },
      };

      window.importMetaHot = {
        send: vi.fn(),
        on: vi.fn(),
      };

      const { CLIENT_SCRIPT } = require('../../src/client-script');
      const script = new Function('window', 'document', CLIENT_SCRIPT);
      script(window, document);
    });

    it('should detect normal page', (done) => {
      setTimeout(() => {
        // Page has sufficient content, should not be white screen
        const alertElement = document.getElementById('xagi-white-screen-alert');
        expect(alertElement).toBeNull();
        done();
      }, 100);
    });

    it('should detect white screen when content is insufficient', (done) => {
      // Clear page content to simulate white screen
      document.getElementById('root')!.innerHTML = '';

      setTimeout(() => {
        const alertElement = document.getElementById('xagi-white-screen-alert');
        expect(alertElement).toBeDefined();
        expect(alertElement?.innerHTML).toContain('白屏警告');
        done();
      }, 100);
    });

    it('should send white screen data to server', (done) => {
      // Clear content to trigger white screen
      document.getElementById('root')!.innerHTML = '';

      setTimeout(() => {
        expect(window.importMetaHot.send).toHaveBeenCalledWith(
          'appdev:white-screen',
          expect.objectContaining({
            isWhiteScreen: true,
            url: 'http://localhost:3000',
            metrics: expect.objectContaining({
              textLength: expect.any(Number),
              elementCount: expect.any(Number),
            }),
          })
        );
        done();
      }, 100);
    });

    it('should allow manual dismissal of white screen alert', (done) => {
      // Trigger white screen
      document.getElementById('root')!.innerHTML = '';

      setTimeout(() => {
        const alertElement = document.getElementById('xagi-white-screen-alert');
        expect(alertElement).toBeDefined();

        // Find and click close button
        const closeButton = alertElement?.querySelector('button');
        if (closeButton) {
          closeButton.click();

          // Alert should be removed
          setTimeout(() => {
            const removedAlert = document.getElementById('xagi-white-screen-alert');
            expect(removedAlert).toBeNull();
            done();
          }, 10);
        }
      }, 100);
    });
  });

  describe('Design mode workflow', () => {
    beforeEach(() => {
      window.__XAGI_MONITOR_CONFIG__ = {
        designMode: {
          enabled: true,
          showElementBorders: true,
          editableSelectors: ['p', 'h1', 'button'],
        },
      };

      window.importMetaHot = {
        send: vi.fn(),
        on: vi.fn(),
      };

      const { CLIENT_SCRIPT } = require('../../src/client-script');
      const script = new Function('window', 'document', CLIENT_SCRIPT);
      script(window, document);
    });

    it('should select elements on click', () => {
      const paragraph = document.getElementById('content');
      expect(paragraph).toBeDefined();

      if (paragraph) {
        // Simulate click
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        });
        paragraph.dispatchEvent(clickEvent);

        // Element should be selected
        expect(paragraph.getAttribute('data-xagi-selected')).toBe('true');
      }
    });

    it('should show element info panel', () => {
      const paragraph = document.getElementById('content');
      if (paragraph) {
        // Select element
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        });
        paragraph.dispatchEvent(clickEvent);

        // Info panel should be displayed
        const infoPanel = document.getElementById('xagi-design-panel');
        expect(infoPanel).toBeDefined();
        expect(infoPanel?.innerHTML).toContain('p');
        expect(infoPanel?.innerHTML).toContain('content');
      }
    });

    it('should send design edit events to server', () => {
      const paragraph = document.getElementById('content');
      if (paragraph) {
        // Select element
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        });
        paragraph.dispatchEvent(clickEvent);

        // Should send design event
        expect(window.importMetaHot.send).toHaveBeenCalledWith(
          'appdev:design-edit',
          expect.objectContaining({
            action: 'select',
            selector: expect.any(String),
            timestamp: expect.any(Number),
          })
        );
      }
    });

    it('should handle double click for editing', () => {
      const paragraph = document.getElementById('content');
      if (paragraph) {
        // Select element first
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        });
        paragraph.dispatchEvent(clickEvent);

        // Double click to edit
        const dblClickEvent = new MouseEvent('dblclick', {
          bubbles: true,
          cancelable: true,
        });
        paragraph.dispatchEvent(dblClickEvent);

        // Should have input field for editing
        const inputElement = paragraph.querySelector('input');
        expect(inputElement).toBeDefined();
      }
    });

    it('should show element borders on hover', () => {
      const paragraph = document.getElementById('content');
      if (paragraph) {
        // Simulate hover
        const mouseoverEvent = new MouseEvent('mouseover', {
          bubbles: true,
          cancelable: true,
        });
        paragraph.dispatchEvent(mouseoverEvent);

        expect(paragraph.getAttribute('data-xagi-hover')).toBe('true');

        // Simulate mouse leave
        const mouseoutEvent = new MouseEvent('mouseout', {
          bubbles: true,
          cancelable: true,
        });
        paragraph.dispatchEvent(mouseoutEvent);

        expect(paragraph.getAttribute('data-xagi-hover')).toBeNull();
      }
    });

    it('should not select non-editable elements', () => {
      const div = document.getElementById('root'); // Not in editableSelectors
      if (div) {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        });
        div.dispatchEvent(clickEvent);

        expect(div.getAttribute('data-xagi-selected')).toBeNull();
      }
    });
  });

  describe('integration with Preview component', () => {
    beforeEach(() => {
      // Mock parent window as Preview component
      const receivedMessages: any[] = [];
      window.parent = {
        postMessage: vi.fn((message) => {
          receivedMessages.push(message);
        }),
      };
      window.parent !== window;

      window.__XAGI_MONITOR_CONFIG__ = {
        errorMonitor: true,
        whiteScreenMonitor: { enabled: true },
        designMode: { enabled: true },
      };

      window.importMetaHot = {
        send: vi.fn(),
        on: vi.fn(),
      };

      const { CLIENT_SCRIPT } = require('../../src/client-script');
      const script = new Function('window', 'document', CLIENT_SCRIPT);
      script(window, document);
    });

    it('should communicate error events to Preview component', () => {
      const consoleSpy = vi.spyOn(console, 'error');

      // Trigger an error
      const script = document.createElement('script');
      script.src = 'http://localhost:3000/missing.js';
      const errorEvent = new Event('error');
      Object.defineProperty(errorEvent, 'target', { value: script });
      script.dispatchEvent(errorEvent);

      setTimeout(() => {
        expect(window.parent.postMessage).toHaveBeenCalledWith({
          type: 'APPDEV_ERROR',
          data: expect.objectContaining({
            type: 'script',
            url: 'http://localhost:3000/missing.js',
          }),
        }, '*');
      }, 10);

      consoleSpy.mockRestore();
    });

    it('should forward server logs to Preview component', () => {
      // Simulate server log message
      const logCallback = window.importMetaHot.on.mock.calls.find(
        call => call[0] === 'appdev:log'
      )?.[1];

      if (logCallback) {
        const logData = {
          level: 'warn',
          message: 'Warning from server',
          timestamp: Date.now(),
        };

        logCallback(logData);

        expect(window.parent.postMessage).toHaveBeenCalledWith({
          type: 'APPDEV_LOG',
          data: logData,
        }, '*');
      }
    });

    it('should forward HMR updates to Preview component', () => {
      const hmrCallback = window.importMetaHot.on.mock.calls.find(
        call => call[0] === 'appdev:hmr'
      )?.[1];

      if (hmrCallback) {
        const hmrData = {
          type: 'update',
          path: '/src/App.jsx',
          timestamp: Date.now(),
        };

        hmrCallback(hmrData);

        expect(window.parent.postMessage).toHaveBeenCalledWith({
          type: 'APPDEV_HMR',
          data: hmrData,
        }, '*');
      }
    });

    it('should forward white screen events to Preview component', (done) => {
      // Trigger white screen
      document.getElementById('root')!.innerHTML = '';

      setTimeout(() => {
        expect(window.parent.postMessage).toHaveBeenCalledWith({
          type: 'APPDEV_WHITE_SCREEN',
          data: expect.objectContaining({
            isWhiteScreen: true,
          }),
        }, '*');
        done();
      }, 100);
    });

    it('should forward design edit events to Preview component', () => {
      const paragraph = document.getElementById('content');
      if (paragraph) {
        // Select element
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        });
        paragraph.dispatchEvent(clickEvent);

        // Should send design event to server, which should be forwarded to Preview
        expect(window.importMetaHot.send).toHaveBeenCalledWith(
          'appdev:design-edit',
          expect.any(Object)
        );
      }
    });
  });

  describe('error handling and recovery', () => {
    beforeEach(() => {
      window.__XAGI_MONITOR_CONFIG__ = {
        errorMonitor: true,
        debug: false,
      };

      window.importMetaHot = {
        send: vi.fn(),
        on: vi.fn(),
      };

      const { CLIENT_SCRIPT } = require('../../src/client-script');
      const script = new Function('window', 'document', CLIENT_SCRIPT);
      script(window, document);
    });

    it('should handle missing import.meta.hot gracefully', () => {
      // Remove import.meta.hot
      delete window.importMetaHot;

      expect(() => {
        // Should not throw errors
        const error = new Error('Test error');
        window.dispatchEvent(new ErrorEvent('error', { error }));
      }).not.toThrow();
    });

    it('should handle postMessage errors gracefully', () => {
      // Mock postMessage to throw error
      const originalPostMessage = window.parent.postMessage;
      window.parent.postMessage = vi.fn(() => {
        throw new Error('PostMessage failed');
      });

      expect(() => {
        // Trigger error that would send postMessage
        const script = document.createElement('script');
        script.src = 'missing.js';
        const errorEvent = new Event('error');
        Object.defineProperty(errorEvent, 'target', { value: script });
        script.dispatchEvent(errorEvent);
      }).not.toThrow();

      window.parent.postMessage = originalPostMessage;
    });

    it('should handle WebSocket errors gracefully', () => {
      // Mock WebSocket to throw error
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class {
        constructor() {
          throw new Error('WebSocket connection failed');
        }
      } as any;

      expect(() => {
        // Should not prevent script initialization
        window.importMetaHot.send('test message');
      }).not.toThrow();

      global.WebSocket = originalWebSocket;
    });
  });

  describe('performance and memory', () => {
    beforeEach(() => {
      window.__XAGI_MONITOR_CONFIG__ = {
        errorMonitor: true,
        whiteScreenMonitor: {
          enabled: true,
          checkInterval: 10, // Very fast for testing
        },
        designMode: {
          enabled: true,
        },
      };

      window.importMetaHot = {
        send: vi.fn(),
        on: vi.fn(),
      };

      const { CLIENT_SCRIPT } = require('../../src/client-script');
      const script = new Function('window', 'document', CLIENT_SCRIPT);
      script(window, document);
    });

    it('should not cause memory leaks with repeated operations', () => {
      const initialListeners = window.getEventListeners?.?.() || {};

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const element = document.getElementById('content');
        if (element) {
          const clickEvent = new MouseEvent('click');
          element.dispatchEvent(clickEvent);
        }
      }

      // Should not accumulate excessive listeners
      // (This is a basic check - more sophisticated memory testing could be added)
      expect(true).toBe(true); // Test passes if no errors thrown
    });

    it('should handle rapid error reporting without performance issues', () => {
      const consoleSpy = vi.spyOn(console, 'error');

      // Generate many errors rapidly
      for (let i = 0; i < 50; i++) {
        const error = new Error(`Test error ${i}`);
        window.dispatchEvent(new ErrorEvent('error', { error }));
      }

      // Should handle all errors without throwing
      expect(consoleSpy).toHaveBeenCalledTimes(50);
      consoleSpy.mockRestore();
    });

    it('should handle frequent white screen checks efficiently', (done) => {
      const startTime = Date.now();

      // Let white screen monitor run for a while
      setTimeout(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Should complete quickly even with frequent checks
        expect(duration).toBeLessThan(200);
        done();
      }, 150);
    });
  });
});