import { vi } from 'vitest';

// Mock global objects that might not be available in test environment
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Mock process.stdout and process.stderr
const originalWrite = process.stdout.write;
const originalWriteError = process.stderr.write;

beforeEach(() => {
  vi.clearAllMocks();

  // Reset process methods
  process.stdout.write = originalWrite;
  process.stderr.write = originalWriteError;
});

// Mock DOM environment
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
  },
  writable: true,
});

// Mock import.meta.hot
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      hot: {
        send: vi.fn(),
        on: vi.fn(),
      },
    },
  },
  writable: true,
});

// Mock WebSocket
class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  send(data: string) {
    // Mock send method
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

global.WebSocket = MockWebSocket as any;

// Mock fetch
global.fetch = vi.fn();

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    getEntriesByType: vi.fn(() => []),
  },
  writable: true,
});

// Mock document methods
Object.defineProperty(document, 'querySelector', {
  value: vi.fn(() => null),
  writable: true,
});

Object.defineProperty(document, 'querySelectorAll', {
  value: vi.fn(() => []),
  writable: true,
});

// Export setup utilities
export const createMockViteServer = () => ({
  ws: {
    send: vi.fn(),
    on: vi.fn(),
  },
  middlewares: {
    use: vi.fn(),
  },
});

export const createMockError = (overrides = {}) => ({
  type: 'SyntaxError',
  message: 'Test error',
  file: '/test/file.js',
  line: 10,
  column: 5,
  stack: 'Error: Test error\n    at test (/test/file.js:10:5)',
  ...overrides,
});

export const createMockLogEntry = (overrides = {}) => ({
  level: 'info',
  message: 'Test log message',
  timestamp: Date.now(),
  source: 'test',
  ...overrides,
});

export const createMockWhiteScreenResult = (overrides = {}) => ({
  isWhiteScreen: false,
  timestamp: Date.now(),
  url: 'http://localhost:3000',
  metrics: {
    textLength: 100,
    elementCount: 20,
    pageHeight: 500,
    hasVisibleContent: true,
    loadTime: 1000,
    bodyChildren: 5,
    rootChildren: 3,
    hasInteractiveElements: true,
    hasImages: false,
    hasBackground: true,
    hasContentInRoot: true,
  },
  ...overrides,
});

export const createMockDesignEditInfo = (overrides = {}) => ({
  action: 'select',
  selector: '#test-element',
  timestamp: Date.now(),
  data: {
    type: 'element-select',
    tagName: 'div',
    className: 'test-class',
  },
  ...overrides,
});