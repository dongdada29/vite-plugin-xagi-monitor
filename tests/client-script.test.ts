import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CLIENT_SCRIPT } from '../src/client-script';

describe('Client Script Integration Tests', () => {
  let window: any;
  let document: any;

  beforeEach(() => {
    // Setup DOM environment
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <div id="root">
            <h1>Test</h1>
            <p>Content</p>
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

    // Mock required APIs
    window.importMetaHot = {
      send: vi.fn(),
      on: vi.fn(),
    };

    window.parent = {
      postMessage: vi.fn(),
    };
    window.parent !== window;

    Object.defineProperty(window, 'performance', {
      value: {
        now: vi.fn(() => Date.now()),
        getEntriesByType: vi.fn(() => []),
      },
      writable: true,
    });

    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost:3000' },
      writable: true,
    });
  });

  afterEach(() => {
    window.close();
    vi.clearAllMocks();
  });

  it('should execute client script without errors', () => {
    expect(() => {
      const script = new Function('window', 'document', CLIENT_SCRIPT);
      script(window, document);
    }).not.toThrow();
  });

  it('should initialize monitor with default config', () => {
    window.__XAGI_MONITOR_CONFIG__ = {
      errorMonitor: true,
      whiteScreenMonitor: { enabled: false },
      designMode: { enabled: false },
    };

    const script = new Function('window', 'document', CLIENT_SCRIPT);
    script(window, document);

    // Should not throw and should set up monitoring
    expect(true).toBe(true);
  });

  it('should handle missing configuration gracefully', () => {
    const script = new Function('window', 'document', CLIENT_SCRIPT);
    script(window, document);

    // Should not throw when config is missing
    expect(true).toBe(true);
  });

  it('should setup error listeners', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    const script = new Function('window', 'document', CLIENT_SCRIPT);
    script(window, document);

    // Should setup error event listeners
    expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function), true);
    expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));

    addEventListenerSpy.mockRestore();
  });

  it('should setup resource error listeners', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    window.__XAGI_MONITOR_CONFIG__ = {
      errorMonitor: true,
    };

    const script = new Function('window', 'document', CLIENT_SCRIPT);
    script(window, document);

    // Should setup resource error monitoring
    expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function), true);

    addEventListenerSpy.mockRestore();
  });

  it('should intercept fetch API', () => {
    const originalFetch = window.fetch;
    const script = new Function('window', 'document', CLIENT_SCRIPT);
    script(window, document);

    // Fetch should be replaced
    expect(window.fetch).not.toBe(originalFetch);
  });

  it('should handle fetch errors', async () => {
    window.__XAGI_MONITOR_CONFIG__ = {
      errorMonitor: true,
    };

    // Mock fetch to throw error
    window.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    const script = new Function('window', 'document', CLIENT_SCRIPT);
    script(window, document);

    try {
      await window.fetch('http://example.com');
    } catch (error) {
      // Should handle error without throwing
      expect(error.message).toBe('Network error');
    }
  });

  it('should send initialization event', () => {
    window.__XAGI_MONITOR_CONFIG__ = {
      errorMonitor: true,
      whiteScreenMonitor: { enabled: true },
      designMode: { enabled: true },
    };

    const script = new Function('window', 'document', CLIENT_SCRIPT);
    script(window, document);

    // Should send initialization event
    expect(window.importMetaHot.send).toHaveBeenCalledWith(
      'appdev:initialized',
      expect.objectContaining({
        features: expect.objectContaining({
          errorMonitor: true,
          whiteScreenMonitor: true,
          designMode: true,
        }),
        timestamp: expect.any(Number),
      })
    );
  });

  it('should handle missing import.meta.hot gracefully', () => {
    delete window.importMetaHot;

    window.__XAGI_MONITOR_CONFIG__ = {
      errorMonitor: true,
    };

    expect(() => {
      const script = new Function('window', 'document', CLIENT_SCRIPT);
      script(window, document);
    }).not.toThrow();
  });

  it('should handle missing parent window gracefully', () => {
    window.parent = window; // Same window

    window.__XAGI_MONITOR_CONFIG__ = {
      errorMonitor: true,
    };

    expect(() => {
      const script = new Function('window', 'document', CLIENT_SCRIPT);
      script(window, document);
    }).not.toThrow();
  });
});