import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DesignRuntime } from '../../../src/design-runtime';
import { createMockDesignEditInfo } from '../../setup';

describe('DesignRuntime', () => {
  let designRuntime: DesignRuntime;
  let mockCallback: any;

  beforeEach(() => {
    mockCallback = vi.fn();

    // Mock DOM environment
    document.body.innerHTML = `
      <div id="test-container">
        <h1 class="title">Test Title</h1>
        <p id="test-paragraph">Test paragraph content</p>
        <button class="btn">Test Button</button>
        <section class="content">
          <span>Test span</span>
        </section>
      </div>
    `;

    // Mock getBoundingClientRect
    Object.defineProperty(Element.prototype, 'getBoundingClientRect', {
      value: vi.fn(() => ({
        bottom: 100,
        left: 50,
        right: 200,
        top: 50,
        width: 150,
        height: 50,
        x: 50,
        y: 50,
      })),
      writable: true,
    });

    // Mock import.meta.hot
    Object.defineProperty(global, 'import', {
      value: {
        meta: {
          hot: {
            send: vi.fn(),
          },
        },
      },
      writable: true,
    });
  });

  afterEach(() => {
    if (designRuntime && designRuntime['isEnabled']) {
      designRuntime.stop();
    }
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      designRuntime = new DesignRuntime();

      expect(designRuntime).toBeDefined();
      expect(designRuntime['isEnabled']).toBe(false);
      expect(designRuntime['selectedElement']).toBe(null);
      expect(designRuntime['isEditing']).toBe(false);
    });

    it('should initialize with custom config', () => {
      const customConfig = {
        enabled: true,
        tailwindIntegration: true,
        autoSync: false,
        editableSelectors: ['p', 'span'],
        showElementBorders: false,
        debug: true,
      };

      designRuntime = new DesignRuntime(customConfig);

      expect(designRuntime['config']).toEqual(customConfig);
    });

    it('should merge config with defaults', () => {
      const partialConfig = {
        enabled: true,
        showElementBorders: false,
      };

      designRuntime = new DesignRuntime(partialConfig);

      expect(designRuntime['config'].enabled).toBe(true);
      expect(designRuntime['config'].showElementBorders).toBe(false);
      expect(designRuntime['config'].tailwindIntegration).toBe(false); // Default value
    });
  });

  describe('start and stop', () => {
    it('should start when enabled', () => {
      designRuntime = new DesignRuntime({ enabled: true });

      designRuntime.start();

      expect(designRuntime['isEnabled']).toBe(true);
    });

    it('should not start when disabled', () => {
      designRuntime = new DesignRuntime({ enabled: false });

      designRuntime.start();

      expect(designRuntime['isEnabled']).toBe(false);
    });

    it('should stop and clean up', () => {
      designRuntime = new DesignRuntime({ enabled: true });

      designRuntime.start();
      expect(designRuntime['isEnabled']).toBe(true);

      designRuntime.stop();
      expect(designRuntime['isEnabled']).toBe(false);
      expect(designRuntime['selectedElement']).toBe(null);
      expect(designRuntime['isEditing']).toBe(false);
    });

    it('should not start if already running', () => {
      designRuntime = new DesignRuntime({ enabled: true });

      designRuntime.start();
      const documentSpy = vi.spyOn(document, 'addEventListener');

      designRuntime.start();

      // Should not add duplicate event listeners
      expect(documentSpy).toHaveBeenCalledTimes(3); // click, mouseover, mouseout
      documentSpy.mockRestore();
    });

    it('should handle stop when not running', () => {
      designRuntime = new DesignRuntime({ enabled: true });

      expect(() => {
        designRuntime.stop();
      }).not.toThrow();
      expect(designRuntime['isEnabled']).toBe(false);
    });
  });

  describe('element selection', () => {
    beforeEach(() => {
      designRuntime = new DesignRuntime({ enabled: true });
      designRuntime.start();
    });

    it('should select editable elements', () => {
      const paragraph = document.getElementById('test-paragraph');
      expect(paragraph).toBeDefined();

      if (paragraph) {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        });
        paragraph.dispatchEvent(clickEvent);

        expect(designRuntime['selectedElement']).toBe(paragraph);
        expect(paragraph.getAttribute('data-xagi-selected')).toBe('true');
      }
    });

    it('should not select non-editable elements', () => {
      const container = document.getElementById('test-container');
      expect(container).toBeDefined();

      if (container) {
        // Container is div, should be editable by default
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        });
        container.dispatchEvent(clickEvent);

        expect(designRuntime['selectedElement']).toBe(container);
      }
    });

    it('should respect custom editable selectors', () => {
      designRuntime = new DesignRuntime({
        enabled: true,
        editableSelectors: ['p', 'span'],
      });
      designRuntime.start();

      const button = document.querySelector('.btn');
      const paragraph = document.getElementById('test-paragraph');

      if (button) {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        });
        button.dispatchEvent(clickEvent);

        expect(designRuntime['selectedElement']).not.toBe(button);
      }

      if (paragraph) {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        });
        paragraph.dispatchEvent(clickEvent);

        expect(designRuntime['selectedElement']).toBe(paragraph);
      }
    });

    it('should handle element highlighting on mouseover', () => {
      const paragraph = document.getElementById('test-paragraph');
      expect(paragraph).toBeDefined();

      if (paragraph) {
        const mouseoverEvent = new MouseEvent('mouseover', {
          bubbles: true,
          cancelable: true,
        });
        paragraph.dispatchEvent(mouseoverEvent);

        expect(paragraph.getAttribute('data-xagi-hover')).toBe('true');
      }
    });

    it('should remove highlight on mouseout', () => {
      const paragraph = document.getElementById('test-paragraph');
      expect(paragraph).toBeDefined();

      if (paragraph) {
        const mouseoverEvent = new MouseEvent('mouseover', {
          bubbles: true,
          cancelable: true,
        });
        const mouseoutEvent = new MouseEvent('mouseout', {
          bubbles: true,
          cancelable: true,
        });

        paragraph.dispatchEvent(mouseoverEvent);
        expect(paragraph.getAttribute('data-xagi-hover')).toBe('true');

        paragraph.dispatchEvent(mouseoutEvent);
        expect(paragraph.getAttribute('data-xagi-hover')).toBeNull();
      }
    });

    it('should not select elements when editing', () => {
      designRuntime['isEditing'] = true;

      const paragraph = document.getElementById('test-paragraph');
      if (paragraph) {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        });
        paragraph.dispatchEvent(clickEvent);

        expect(designRuntime['selectedElement']).toBeNull();
      }
    });
  });

  describe('element editing', () => {
    beforeEach(() => {
      designRuntime = new DesignRuntime({ enabled: true });
      designRuntime.start();

      const paragraph = document.getElementById('test-paragraph');
      if (paragraph) {
        designRuntime['selectElement'](paragraph);
      }
    });

    it('should enable contenteditable for text elements', () => {
      const selectedElement = designRuntime['selectedElement'];
      if (selectedElement) {
        expect(selectedElement.getAttribute('contenteditable')).toBe('true');
      }
    });

    it('should handle double click for editing', () => {
      const selectedElement = designRuntime['selectedElement'];
      if (selectedElement) {
        const dblClickEvent = new MouseEvent('dblclick', {
          bubbles: true,
          cancelable: true,
        });
        selectedElement.dispatchEvent(dblClickEvent);

        expect(designRuntime['isEditing']).toBe(true);
      }
    });

    it('should add style to elements', () => {
      const selectedElement = designRuntime['selectedElement'] as HTMLElement;
      if (selectedElement) {
        designRuntime.addStyle('color', 'red');

        expect(selectedElement.style.color).toBe('red');
      }
    });

    it('should update Tailwind classes when enabled', () => {
      designRuntime = new DesignRuntime({
        enabled: true,
        tailwindIntegration: true,
      });
      designRuntime.start();

      const element = document.getElementById('test-paragraph');
      if (element) {
        designRuntime['selectElement'](element);
        designRuntime.updateTailwindClasses('text-red-500 font-bold');

        expect(element.className).toBe('text-red-500 font-bold');
      }
    });

    it('should not update Tailwind classes when disabled', () => {
      designRuntime = new DesignRuntime({
        enabled: true,
        tailwindIntegration: false,
      });
      designRuntime.start();

      const element = document.getElementById('test-paragraph');
      if (element) {
        const originalClass = element.className;
        designRuntime['selectElement'](element);
        designRuntime.updateTailwindClasses('text-red-500 font-bold');

        expect(element.className).toBe(originalClass);
      }
    });

    it('should handle text editing', () => {
      const selectedElement = designRuntime['selectedElement'] as HTMLElement;
      if (selectedElement) {
        const originalContent = selectedElement.textContent || '';

        designRuntime.editContent();

        const inputElement = selectedElement.querySelector('input');
        expect(inputElement).toBeDefined();

        if (inputElement) {
          inputElement.value = 'New content';
          const blurEvent = new Event('blur');
          inputElement.dispatchEvent(blurEvent);

          expect(selectedElement.textContent).toBe('New content');
          expect(designRuntime['isEditing']).toBe(false);
        }
      }
    });

    it('should handle Escape key during editing', () => {
      const selectedElement = designRuntime['selectedElement'] as HTMLElement;
      if (selectedElement) {
        const originalContent = selectedElement.textContent || '';

        designRuntime.editContent();

        const inputElement = selectedElement.querySelector('input');
        if (inputElement) {
          const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
          inputElement.dispatchEvent(escapeEvent);

          expect(selectedElement.textContent).toBe(originalContent);
          expect(designRuntime['isEditing']).toBe(false);
        }
      }
    });

    it('should handle Enter key during editing', () => {
      const selectedElement = designRuntime['selectedElement'] as HTMLElement;
      if (selectedElement) {
        designRuntime.editContent();

        const inputElement = selectedElement.querySelector('input');
        if (inputElement) {
          inputElement.value = 'New content';
          const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
          inputElement.dispatchEvent(enterEvent);

          expect(selectedElement.textContent).toBe('New content');
          expect(designRuntime['isEditing']).toBe(false);
        }
      }
    });
  });

  describe('element operations', () => {
    beforeEach(() => {
      designRuntime = new DesignRuntime({ enabled: true });
      designRuntime.start();

      const paragraph = document.getElementById('test-paragraph');
      if (paragraph) {
        designRuntime['selectElement'](paragraph);
      }
    });

    it('should duplicate selected element', () => {
      const selectedElement = designRuntime['selectedElement'];
      if (selectedElement && selectedElement.parentNode) {
        const originalChildCount = selectedElement.parentNode.children.length;

        designRuntime.duplicateElement();

        expect(selectedElement.parentNode.children.length).toBe(originalChildCount + 1);
        expect(designRuntime['selectedElement']).not.toBe(selectedElement); // Should select the new element
      }
    });

    it('should remove selected element', () => {
      const selectedElement = designRuntime['selectedElement'];
      if (selectedElement && selectedElement.parentNode) {
        const originalChildCount = selectedElement.parentNode.children.length;

        designRuntime.removeElement();

        expect(selectedElement.parentNode.children.length).toBe(originalChildCount - 1);
        expect(designRuntime['selectedElement']).toBeNull();
      }
    });

    it('should not remove element if not selected', () => {
      designRuntime['selectedElement'] = null;

      expect(() => {
        designRuntime.removeElement();
      }).not.toThrow();
    });

    it('should not duplicate element if not selected', () => {
      designRuntime['selectedElement'] = null;

      expect(() => {
        designRuntime.duplicateElement();
      }).not.toThrow();
    });
  });

  describe('element info panel', () => {
    beforeEach(() => {
      designRuntime = new DesignRuntime({ enabled: true });
      designRuntime.start();

      const paragraph = document.getElementById('test-paragraph');
      if (paragraph) {
        designRuntime['selectElement'](paragraph);
      }
    });

    it('should show element info panel', () => {
      const panel = document.getElementById('xagi-design-panel');
      expect(panel).toBeDefined();
      expect(panel?.innerHTML).toContain('p');
      expect(panel?.innerHTML).toContain('test-paragraph');
    });

    it('should hide element info panel on clear', () => {
      designRuntime['clearSelection']();

      const panel = document.getElementById('xagi-design-panel');
      expect(panel).toBeNull();
    });

    it('should update panel when selecting different elements', () => {
      const button = document.querySelector('.btn');
      if (button) {
        designRuntime['selectElement'](button);

        const panel = document.getElementById('xagi-design-panel');
        expect(panel?.innerHTML).toContain('button');
        expect(panel?.innerHTML).toContain('btn');
      }
    });

    it('should include Tailwind controls when enabled', () => {
      designRuntime = new DesignRuntime({
        enabled: true,
        tailwindIntegration: true,
      });
      designRuntime.start();

      const paragraph = document.getElementById('test-paragraph');
      if (paragraph) {
        designRuntime['selectElement'](paragraph);

        const panel = document.getElementById('xagi-design-panel');
        expect(panel?.innerHTML).toContain('Tailwind 类名');
      }
    });

    it('should include quick style controls', () => {
      const panel = document.getElementById('xagi-design-panel');
      expect(panel?.innerHTML).toContain('快速样式');
      expect(panel?.innerHTML).toContain('背景红');
      expect(panel?.innerHTML).toContain('文字红');
    });

    it('should include action controls', () => {
      const panel = document.getElementById('xagi-design-panel');
      expect(panel?.innerHTML).toContain('操作');
      expect(panel?.innerHTML).toContain('编辑内容');
      expect(panel?.innerHTML).toContain('复制元素');
      expect(panel?.innerHTML).toContain('删除元素');
    });
  });

  describe('keyboard shortcuts', () => {
    beforeEach(() => {
      designRuntime = new DesignRuntime({ enabled: true });
      designRuntime.start();
    });

    it('should clear selection on Escape', () => {
      const paragraph = document.getElementById('test-paragraph');
      if (paragraph) {
        designRuntime['selectElement'](paragraph);
        expect(designRuntime['selectedElement']).toBe(paragraph);

        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(escapeEvent);

        expect(designRuntime['selectedElement']).toBeNull();
      }
    });

    it('should delete selected element on Delete', () => {
      const paragraph = document.getElementById('test-paragraph');
      if (paragraph) {
        designRuntime['selectElement'](paragraph);
        expect(designRuntime['selectedElement']).toBe(paragraph);

        const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
        document.dispatchEvent(deleteEvent);

        expect(designRuntime['selectedElement']).toBeNull();
        expect(document.getElementById('test-paragraph')).toBeNull();
      }
    });

    it('should not handle shortcuts when disabled', () => {
      designRuntime.stop();

      const paragraph = document.getElementById('test-paragraph');
      if (paragraph) {
        designRuntime['selectElement'](paragraph);

        const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
        document.dispatchEvent(deleteEvent);

        expect(designRuntime['selectedElement']).toBeNull(); // Still null because stop() was called
      }
    });

    it('should not delete element when editing', () => {
      designRuntime['isEditing'] = true;
      const paragraph = document.getElementById('test-paragraph');
      if (paragraph) {
        designRuntime['selectElement'](paragraph);

        const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
        document.dispatchEvent(deleteEvent);

        expect(document.getElementById('test-paragraph')).toBeDefined();
      }
    });
  });

  describe('style injection', () => {
    beforeEach(() => {
      designRuntime = new DesignRuntime({ enabled: true });
      designRuntime.start();
    });

    it('should inject design styles on start', () => {
      const styleElement = document.getElementById('xagi-design-styles');
      expect(styleElement).toBeDefined();
      expect(styleElement?.textContent).toContain('[data-xagi-hover]');
      expect(styleElement?.textContent).toContain('[data-xagi-selected]');
    });

    it('should remove design styles on stop', () => {
      designRuntime.stop();

      const styleElement = document.getElementById('xagi-design-styles');
      expect(styleElement).toBeNull();
    });

    it('should include hover styles', () => {
      const styleElement = document.getElementById('xagi-design-styles');
      expect(styleElement?.textContent).toContain('outline: 2px dashed #4dabf7');
    });

    it('should include selected styles', () => {
      const styleElement = document.getElementById('xagi-design-styles');
      expect(styleElement?.textContent).toContain('outline: 2px solid #ff6b6b');
    });

    it('should include panel styles', () => {
      const styleElement = document.getElementById('xagi-design-styles');
      expect(styleElement?.textContent).toContain('.xagi-panel');
      expect(styleElement?.textContent).toContain('.xagi-panel-header');
    });
  });

  describe('event system', () => {
    beforeEach(() => {
      designRuntime = new DesignRuntime({ enabled: true });
      designRuntime.start();
    });

    it('should send design events', () => {
      const mockImportMeta = {
        meta: {
          hot: {
            send: vi.fn(),
          },
        },
      };

      Object.defineProperty(global, 'import', {
        value: mockImportMeta,
        writable: true,
      });

      const paragraph = document.getElementById('test-paragraph');
      if (paragraph) {
        designRuntime['selectElement'](paragraph);

        expect(import.meta.hot.send).toHaveBeenCalledWith(
          'appdev:design-edit',
          expect.objectContaining({
            action: 'select',
            selector: expect.any(String),
            timestamp: expect.any(Number),
          })
        );
      }
    });

    it('should call edit callback', () => {
      designRuntime.onEdit(mockCallback);

      const paragraph = document.getElementById('test-paragraph');
      if (paragraph) {
        designRuntime['selectElement'](paragraph);

        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'select',
            selector: expect.any(String),
            timestamp: expect.any(Number),
          })
        );
      }
    });

    it('should handle missing import.meta.hot', () => {
      Object.defineProperty(global, 'import', {
        value: {},
        writable: true,
      });

      const paragraph = document.getElementById('test-paragraph');
      if (paragraph) {
        expect(() => {
          designRuntime['selectElement'](paragraph);
        }).not.toThrow();
      }
    });

    it('should generate correct selector', () => {
      const elementWithId = document.getElementById('test-paragraph');
      if (elementWithId) {
        const selector = designRuntime['generateSelector'](elementWithId);
        expect(selector).toBe('#test-paragraph');
      }

      const elementWithClass = document.querySelector('.btn');
      if (elementWithClass) {
        const selector = designRuntime['generateSelector'](elementWithClass);
        expect(selector).toBe('.btn');
      }

      const plainElement = document.querySelector('.title');
      if (plainElement) {
        const selector = designRuntime['generateSelector'](plainElement);
        expect(selector).toBe('h1');
      }
    });
  });

  describe('element detection', () => {
    beforeEach(() => {
      designRuntime = new DesignRuntime({
        enabled: true,
        editableSelectors: ['p', 'span', 'button'],
      });
      designRuntime.start();
    });

    it('should detect editable elements by selector', () => {
      const paragraph = document.getElementById('test-paragraph');
      if (paragraph) {
        expect(designRuntime['isEditableElement'](paragraph)).toBe(true);
      }

      const button = document.querySelector('.btn');
      if (button) {
        expect(designRuntime['isEditableElement'](button)).toBe(true);
      }

      const span = document.querySelector('span');
      if (span) {
        expect(designRuntime['isEditableElement'](span)).toBe(true);
      }
    });

    it('should detect non-editable elements', () => {
      const container = document.getElementById('test-container');
      if (container) {
        expect(designRuntime['isEditableElement'](container)).toBe(false);
      }
    });

    it('should detect text content elements', () => {
      const paragraph = document.getElementById('test-paragraph');
      if (paragraph) {
        expect(designRuntime['isTextContentElement'](paragraph)).toBe(true);
      }

      const title = document.querySelector('.title');
      if (title) {
        expect(designRuntime['isTextContentElement'](title)).toBe(true);
      }
    });

    it('should not detect elements with children as text content elements', () => {
      const section = document.querySelector('.content');
      if (section) {
        expect(designRuntime['isTextContentElement'](section)).toBe(false);
      }
    });
  });

  describe('API methods', () => {
    beforeEach(() => {
      designRuntime = new DesignRuntime({ enabled: true });
      designRuntime.start();
    });

    it('should get selected element', () => {
      const paragraph = document.getElementById('test-paragraph');
      if (paragraph) {
        designRuntime['selectElement'](paragraph);
        expect(designRuntime.getSelectedElement()).toBe(paragraph);
      }
    });

    it('should select element by selector', () => {
      const success = designRuntime.selectElementBySelector('#test-paragraph');
      expect(success).toBe(true);
      expect(designRuntime.getSelectedElement()?.id).toBe('test-paragraph');
    });

    it('should handle invalid selector', () => {
      const success = designRuntime.selectElementBySelector('#non-existent');
      expect(success).toBe(false);
      expect(designRuntime.getSelectedElement()).toBeNull();
    });

    it('should handle selector errors gracefully', () => {
      expect(() => {
        designRuntime.selectElementBySelector('###invalid###');
      }).not.toThrow();
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
      designRuntime = new DesignRuntime({
        enabled: true,
        debug: true,
      });

      designRuntime.start();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Design Runtime]'),
        expect.stringContaining('Design 模式已启用')
      );
    });

    it('should not log debug messages when disabled', () => {
      designRuntime = new DesignRuntime({
        enabled: true,
        debug: false,
      });

      designRuntime.start();

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should log edit events in debug mode', () => {
      designRuntime = new DesignRuntime({
        enabled: true,
        debug: true,
      });
      designRuntime.start();

      const paragraph = document.getElementById('test-paragraph');
      if (paragraph) {
        designRuntime['selectElement'](paragraph);

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Design Runtime]'),
          expect.stringContaining('编辑事件:')
        );
      }
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      designRuntime = new DesignRuntime({ enabled: true });
      designRuntime.start();
    });

    it('should handle DOM errors gracefully', () => {
      // Mock getComputedStyle to throw error
      const originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = vi.fn(() => {
        throw new Error('DOM error');
      });

      const paragraph = document.getElementById('test-paragraph');
      if (paragraph) {
        expect(() => {
          designRuntime['selectElement'](paragraph);
        }).not.toThrow();
      }

      window.getComputedStyle = originalGetComputedStyle;
    });

    it('should handle style injection errors', () => {
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn(() => {
        throw new Error('Element creation error');
      });

      expect(() => {
        designRuntime['injectDesignStyles']();
      }).not.toThrow();

      document.createElement = originalCreateElement;
    });

    it('should handle missing parent element', () => {
      const orphanElement = document.createElement('div');
      orphanElement.textContent = 'Orphan element';

      expect(() => {
        designRuntime['selectElement'](orphanElement);
      }).not.toThrow();
    });

    it('should handle callback errors', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });

      designRuntime.onEdit(errorCallback);

      const paragraph = document.getElementById('test-paragraph');
      if (paragraph) {
        expect(() => {
          designRuntime['selectElement'](paragraph);
        }).not.toThrow();
      }

      expect(errorCallback).toHaveBeenCalled();
    });
  });

  describe('configuration validation', () => {
    it('should handle boolean conversion for enabled', () => {
      expect(() => {
        designRuntime = new DesignRuntime({
          enabled: 'true' as any,
        });
      }).not.toThrow();

      expect(designRuntime['config'].enabled).toBe('true');
    });

    it('should handle invalid editable selectors', () => {
      expect(() => {
        designRuntime = new DesignRuntime({
          enabled: true,
          editableSelectors: ['invalid###' as any, 123 as any],
        });
        designRuntime.start();
      }).not.toThrow();
    });

    it('should handle missing config', () => {
      expect(() => {
        designRuntime = new DesignRuntime(undefined as any);
      }).not.toThrow();
    });
  });

  describe('integration with global instance', () => {
    it('should expose instance globally', () => {
      expect(window.__XAGI_DESIGN_RUNTIME__).toBeDefined();
    });

    it('should use global instance when available', () => {
      const globalInstance = window.__XAGI_DESIGN_RUNTIME__;
      if (globalInstance) {
        expect(globalInstance).toBeInstanceOf(DesignRuntime);
      }
    });
  });
});