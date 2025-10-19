import type { DesignModeConfig, DesignEditInfo } from './types';

/**
 * Design 模式运行时
 * 提供可视化编辑和样式修改功能
 */
export class DesignRuntime {
  private config: DesignModeConfig;
  private isEnabled = false;
  private selectedElement: Element | null = null;
  private isEditing = false;
  private originalStyles = new Map<Element, string>();
  private onEditCallback?: (editInfo: DesignEditInfo) => void;

  constructor(config: DesignModeConfig = {}) {
    this.config = {
      enabled: false,
      tailwindIntegration: false,
      autoSync: false,
      editableSelectors: ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'button', 'section', 'article'],
      showElementBorders: true,
      debug: false,
      ...config
    };
  }

  /**
   * 启动 Design 模式
   */
  start() {
    if (this.isEnabled || !this.config.enabled) return;

    this.isEnabled = true;
    this.setupElementSelection();
    this.setupKeyboardShortcuts();
    this.injectDesignStyles();

    if (this.config.debug) {
      console.log('[Design Runtime] Design 模式已启用');
    }
  }

  /**
   * 停止 Design 模式
   */
  stop() {
    this.isEnabled = false;
    this.removeDesignStyles();
    this.clearSelection();
    this.restoreOriginalStyles();

    if (this.config.debug) {
      console.log('[Design Runtime] Design 模式已停止');
    }
  }

  /**
   * 设置元素选择功能
   */
  private setupElementSelection() {
    // 点击事件处理
    document.addEventListener('click', this.handleClick.bind(this), true);
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
  }

  /**
   * 处理点击事件
   */
  private handleClick(event: MouseEvent) {
    if (!this.isEnabled || this.isEditing) return;

    event.preventDefault();
    event.stopPropagation();

    const target = event.target as Element;
    if (this.isEditableElement(target)) {
      this.selectElement(target);
    }
  }

  /**
   * 处理鼠标悬停
   */
  private handleMouseOver(event: MouseEvent) {
    if (!this.isEnabled || this.isEditing) return;

    const target = event.target as Element;
    if (this.isEditableElement(target)) {
      this.highlightElement(target);
    }
  }

  /**
   * 处理鼠标离开
   */
  private handleMouseOut(event: MouseEvent) {
    if (!this.isEnabled || this.isEditing) return;

    const target = event.target as Element;
    this.removeHighlight(target);
  }

  /**
   * 检查元素是否可编辑
   */
  private isEditableElement(element: Element): boolean {
    // 检查选择器匹配
    if (this.config.editableSelectors) {
      const selector = this.config.editableSelectors.join(',');
      return element.matches(selector);
    }

    // 默认可编辑元素
    const editableTags = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'button', 'section', 'article'];
    return editableTags.includes(element.tagName.toLowerCase());
  }

  /**
   * 选择元素
   */
  private selectElement(element: Element) {
    this.clearSelection();
    this.selectedElement = element;
    this.elementToDesignMode(element);
    this.showElementInfo(element);
    this.sendDesignEvent('select', element);
  }

  /**
   * 清除选择
   */
  private clearSelection() {
    if (this.selectedElement) {
      this.elementFromDesignMode(this.selectedElement);
      this.selectedElement = null;
    }
    this.hideElementInfo();
  }

  /**
   * 将元素设置为可编辑状态
   */
  private elementToDesignMode(element: Element) {
    // 保存原始样式
    this.originalStyles.set(element, element.getAttribute('style') || '');

    // 添加选中样式
    if (this.config.showElementBorders) {
      element.setAttribute('data-xagi-selected', 'true');
    }

    // 如果是文本内容元素，设置为可编辑
    if (this.isTextContentElement(element)) {
      element.setAttribute('contenteditable', 'true');
      element.addEventListener('input', this.handleTextEdit.bind(this));
      element.addEventListener('blur', this.handleTextBlur.bind(this));
    }

    // 添加双击编辑功能
    element.addEventListener('dblclick', this.handleDoubleClick.bind(this));
  }

  /**
   * 将元素从可编辑状态恢复
   */
  private elementFromDesignMode(element: Element) {
    // 恢复原始样式
    const originalStyle = this.originalStyles.get(element);
    if (originalStyle !== undefined) {
      element.setAttribute('style', originalStyle);
      this.originalStyles.delete(element);
    }

    // 移除选中标记
    element.removeAttribute('data-xagi-selected');

    // 移除可编辑属性
    element.removeAttribute('contenteditable');
    element.removeEventListener('input', this.handleTextEdit.bind(this));
    element.removeEventListener('blur', this.handleTextBlur.bind(this));
    element.removeEventListener('dblclick', this.handleDoubleClick.bind(this));
  }

  /**
   * 检查是否为文本内容元素
   */
  private isTextContentElement(element: Element): boolean {
    const textTags = ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    return textTags.includes(element.tagName.toLowerCase()) &&
           element.children.length === 0;
  }

  /**
   * 高亮元素
   */
  private highlightElement(element: Element) {
    element.setAttribute('data-xagi-hover', 'true');
  }

  /**
   * 移除高亮
   */
  private removeHighlight(element: Element) {
    element.removeAttribute('data-xagi-hover');
  }

  /**
   * 显示元素信息面板
   */
  private showElementInfo(element: Element) {
    const panel = document.createElement('div');
    panel.id = 'xagi-design-panel';
    panel.innerHTML = this.generateElementPanel(element);

    // 添加样式
    this.addPanelStyles(panel);

    // 定位面板
    const rect = element.getBoundingClientRect();
    panel.style.cssText = `
      position: fixed;
      top: ${rect.bottom + 10}px;
      left: ${rect.left}px;
      z-index: 10000;
    `;

    // 移除现有面板
    const existingPanel = document.getElementById('xagi-design-panel');
    if (existingPanel) {
      existingPanel.remove();
    }

    document.body.appendChild(panel);
  }

  /**
   * 隐藏元素信息面板
   */
  private hideElementInfo() {
    const panel = document.getElementById('xagi-design-panel');
    if (panel) {
      panel.remove();
    }
  }

  /**
   * 生成元素面板 HTML
   */
  private generateElementPanel(element: Element): string {
    const tagName = element.tagName.toLowerCase();
    const className = element.className || '(无类名)';
    const id = element.id || '(无ID)';
    const textContent = element.textContent?.substring(0, 50) || '';

    let panelHTML = `
      <div class="xagi-panel-header">
        <strong>${tagName}</strong>
        <button class="xagi-close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="xagi-panel-content">
        <div><strong>ID:</strong> ${id}</div>
        <div><strong>类名:</strong> ${className}</div>
        <div><strong>文本:</strong> "${textContent}${textContent.length >= 50 ? '...' : ''}"</div>
    `;

    // 添加 Tailwind 类名编辑
    if (this.config.tailwindIntegration) {
      panelHTML += `
        <div class="xagi-section">
          <strong>Tailwind 类名:</strong>
          <input type="text" class="xagi-input" value="${className}"
                 onchange="window.__XAGI_DESIGN_RUNTIME__.updateTailwindClasses(this.value)">
        </div>
      `;
    }

    // 添加常用样式控制
    panelHTML += `
      <div class="xagi-section">
        <strong>快速样式:</strong>
        <div class="xagi-quick-styles">
          <button onclick="window.__XAGI_DESIGN_RUNTIME__.addStyle('background-color', '#ff6b6b')">背景红</button>
          <button onclick="window.__XAGI_DESIGN_RUNTIME__.addStyle('background-color', '#4dabf7')">背景蓝</button>
          <button onclick="window.__XAGI_DESIGN_RUNTIME__.addStyle('color', '#ff6b6b')">文字红</button>
          <button onclick="window.__XAGI_DESIGN_RUNTIME__.addStyle('padding', '10px')">内边距</button>
          <button onclick="window.__XAGI_DESIGN_RUNTIME__.addStyle('margin', '10px')">外边距</button>
        </div>
      </div>
    `;

    // 添加操作按钮
    panelHTML += `
      <div class="xagi-section">
        <strong>操作:</strong>
        <div class="xagi-actions">
          <button onclick="window.__XAGI_DESIGN_RUNTIME__.editContent()">编辑内容</button>
          <button onclick="window.__XAGI_DESIGN_RUNTIME__.duplicateElement()">复制元素</button>
          <button onclick="window.__XAGI_DESIGN_RUNTIME__.removeElement()">删除元素</button>
        </div>
      </div>
    `;

    panelHTML += '</div>';
    return panelHTML;
  }

  /**
   * 更新 Tailwind 类名
   */
  updateTailwindClasses(classes: string) {
    if (!this.selectedElement) return;

    const oldClasses = this.selectedElement.className;
    this.selectedElement.className = classes;

    this.sendDesignEvent('edit', this.selectedElement, {
      type: 'tailwind-classes',
      oldValue: oldClasses,
      newValue: classes
    });

    this.showElementInfo(this.selectedElement);
  }

  /**
   * 添加样式
   */
  addStyle(property: string, value: string) {
    if (!this.selectedElement) return;

    const element = this.selectedElement as HTMLElement;
    const oldValue = element.style.getPropertyValue(property);
    element.style.setProperty(property, value);

    this.sendDesignEvent('edit', this.selectedElement, {
      type: 'style',
      property,
      oldValue,
      newValue: value
    });
  }

  /**
   * 编辑内容
   */
  editContent() {
    if (!this.selectedElement) return;

    this.isEditing = true;
    const element = this.selectedElement as HTMLElement;

    const oldContent = element.textContent || '';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = oldContent;
    input.className = 'xagi-edit-input';
    input.style.cssText = `
      border: 2px solid #4dabf7;
      padding: 4px 8px;
      font-family: inherit;
      font-size: inherit;
      background: white;
      z-index: 10001;
      position: relative;
    `;

    // 替换内容
    element.innerHTML = '';
    element.appendChild(input);
    input.focus();
    input.select();

    const saveEdit = () => {
      const newContent = input.value;
      element.textContent = newContent;
      this.isEditing = false;

      this.sendDesignEvent('edit', this.selectedElement, {
        type: 'content',
        oldValue: oldContent,
        newValue: newContent
      });
    };

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveEdit();
      } else if (e.key === 'Escape') {
        element.textContent = oldContent;
        this.isEditing = false;
      }
    });
  }

  /**
   * 复制元素
   */
  duplicateElement() {
    if (!this.selectedElement) return;

    const clone = this.selectedElement.cloneNode(true) as Element;
    this.selectedElement.parentNode?.insertBefore(clone, this.selectedElement.nextSibling);

    this.sendDesignEvent('edit', clone, {
      type: 'duplicate',
      originalElement: this.selectedElement
    });

    // 自动选择新复制的元素
    this.selectElement(clone);
  }

  /**
   * 删除元素
   */
  removeElement() {
    if (!this.selectedElement) return;

    const element = this.selectedElement;
    this.clearSelection();
    element.remove();

    this.sendDesignEvent('edit', element, {
      type: 'remove'
    });
  }

  /**
   * 处理文本编辑
   */
  private handleTextEdit(event: Event) {
    const target = event.target as Element;
    const newContent = target.textContent || '';

    this.sendDesignEvent('edit', target, {
      type: 'content-edit',
      value: newContent
    });
  }

  /**
   * 处理文本失焦
   */
  private handleTextBlur(event: Event) {
    // 可以在这里添加内容验证逻辑
  }

  /**
   * 处理双击事件
   */
  private handleDoubleClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.editContent();
  }

  /**
   * 设置键盘快捷键
   */
  private setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (!this.isEnabled) return;

      // Escape 退出编辑/选择
      if (e.key === 'Escape') {
        this.clearSelection();
        this.isEditing = false;
      }

      // Delete 删除选中元素
      if (e.key === 'Delete' && this.selectedElement && !this.isEditing) {
        this.removeElement();
      }
    });
  }

  /**
   * 注入 Design 模式样式
   */
  private injectDesignStyles() {
    const style = document.createElement('style');
    style.id = 'xagi-design-styles';
    style.textContent = `
      [data-xagi-hover] {
        outline: 2px dashed #4dabf7 !important;
        background-color: rgba(77, 171, 247, 0.1) !important;
        cursor: pointer !important;
      }

      [data-xagi-selected] {
        outline: 2px solid #ff6b6b !important;
        background-color: rgba(255, 107, 107, 0.1) !important;
        cursor: pointer !important;
      }

      [contenteditable]:focus {
        outline: 2px solid #4dabf7 !important;
        background-color: rgba(77, 171, 247, 0.2) !important;
      }

      .xagi-panel {
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 12px;
        max-width: 300px;
      }

      .xagi-panel-header {
        background: #f8f9fa;
        padding: 8px 12px;
        border-bottom: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
      }

      .xagi-panel-content {
        padding: 12px;
      }

      .xagi-panel-content > div {
        margin-bottom: 8px;
      }

      .xagi-section {
        margin-bottom: 12px;
        padding-top: 8px;
        border-top: 1px solid #eee;
      }

      .xagi-input {
        width: 100%;
        padding: 4px 6px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 12px;
        margin-top: 4px;
      }

      .xagi-quick-styles,
      .xagi-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 6px;
      }

      .xagi-quick-styles button,
      .xagi-actions button {
        padding: 4px 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: #fff;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .xagi-quick-styles button:hover,
      .xagi-actions button:hover {
        background: #f8f9fa;
        border-color: #4dabf7;
      }

      .xagi-close-btn {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .xagi-close-btn:hover {
        color: #ff6b6b;
      }

      .xagi-edit-input {
        border: 2px solid #4dabf7 !important;
        padding: 4px 8px !important;
        font-family: inherit !important;
        font-size: inherit !important;
        background: white !important;
        z-index: 10001 !important;
        position: relative !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 移除 Design 样式
   */
  private removeDesignStyles() {
    const style = document.getElementById('xagi-design-styles');
    if (style) {
      style.remove();
    }
  }

  /**
   * 添加面板样式
   */
  private addPanelStyles(panel: Element) {
    panel.classList.add('xagi-panel');
  }

  /**
   * 恢复原始样式
   */
  private restoreOriginalStyles() {
    this.originalStyles.forEach((style, element) => {
      element.setAttribute('style', style);
    });
    this.originalStyles.clear();
  }

  /**
   * 发送 Design 事件
   */
  private sendDesignEvent(action: string, element: Element, data?: any) {
    const editInfo: DesignEditInfo = {
      action: action as any,
      selector: this.generateSelector(element),
      data: data || {},
      timestamp: Date.now()
    };

    // 发送到服务器
    try {
      if (window.importMetaHot) {
        window.importMetaHot.send('appdev:design-edit', editInfo);
      }
    } catch (error) {
      console.error('[Design Runtime] 发送事件失败:', error);
    }

    // 触发回调
    if (this.onEditCallback) {
      this.onEditCallback(editInfo);
    }

    if (this.config.debug) {
      console.log('[Design Runtime] 编辑事件:', editInfo);
    }
  }

  /**
   * 生成元素选择器
   */
  private generateSelector(element: Element): string {
    // 优先使用 ID
    if (element.id) {
      return `#${element.id}`;
    }

    // 使用类名
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `.${classes.join('.')}`;
      }
    }

    // 使用标签名
    return element.tagName.toLowerCase();
  }

  /**
   * 设置编辑回调
   */
  onEdit(callback: (editInfo: DesignEditInfo) => void) {
    this.onEditCallback = callback;
  }

  /**
   * 获取当前选中的元素
   */
  getSelectedElement(): Element | null {
    return this.selectedElement;
  }

  /**
   * 手动选择元素
   */
  selectElementBySelector(selector: string): boolean {
    try {
      const element = document.querySelector(selector);
      if (element) {
        this.selectElement(element);
        return true;
      }
    } catch (error) {
      console.error('[Design Runtime] 无效的选择器:', selector);
    }
    return false;
  }
}

// 将实例暴露到全局
if (typeof window !== 'undefined') {
  window.__XAGI_DESIGN_RUNTIME__ = new DesignRuntime();
}