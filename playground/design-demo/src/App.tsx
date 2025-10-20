import React, { useState, useEffect } from 'react';

function App() {
  const [designModeActive, setDesignModeActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // 检测 Design 模式是否激活
    const checkDesignMode = () => {
      const isActive = window.__XAGI_DESIGN_MODE_ACTIVE__ || false;
      setDesignModeActive(isActive);
    };

    const interval = setInterval(checkDesignMode, 1000);
    return () => clearInterval(interval);
  }, []);

  // 测试元素选择
  const testElementSelection = () => {
    // 模拟点击选择元素
    const elements = document.querySelectorAll('.demo-section, .demo-button, .feature-card');
    if (elements.length > 0) {
      const randomElement = elements[Math.floor(Math.random() * elements.length)] as HTMLElement;
      randomElement.click();
      setSelectedElement(randomElement);
    }
  };

  // 测试样式编辑
  const testStyleEditing = () => {
    if (selectedElement) {
      // 模拟修改样式
      selectedElement.style.backgroundColor = '#fbbf24';
      selectedElement.style.transform = 'scale(1.05)';
      selectedElement.style.transition = 'all 0.3s ease';
    }
  };

  // 测试颜色选择器
  const testColorPicker = () => {
    const buttons = document.querySelectorAll('.demo-button');
    buttons.forEach((button, index) => {
      setTimeout(() => {
        (button as HTMLElement).style.backgroundColor = `hsl(${index * 60}, 70%, 50%)`;
      }, index * 200);
    });
  };

  // 测试拖拽调整大小
  const testDragResize = () => {
    const sections = document.querySelectorAll('.demo-section');
    sections.forEach(section => {
      (section as HTMLElement).style.cursor = 'nw-resize';
    });
  };

  // 测试 Tailwind 集成
  const testTailwindIntegration = () => {
    const demoElements = document.querySelectorAll('.feature-card');
    demoElements.forEach((element, index) => {
      const classes = [
        'bg-blue-100 border-blue-300',
        'bg-green-100 border-green-300',
        'bg-yellow-100 border-yellow-300',
        'bg-purple-100 border-purple-300'
      ];
      element.className = `feature-card ${classes[index % classes.length]}`;
    });
  };

  // 测试实时预览
  const testLivePreview = () => {
    const texts = document.querySelectorAll('.demo-text');
    texts.forEach(text => {
      (text as HTMLElement).style.color = '#' + Math.floor(Math.random()*16777215).toString(16);
      (text as HTMLElement).style.fontSize = (1 + Math.random()) + 'rem';
    });
  };

  // 添加新元素
  const addNewElement = () => {
    const container = document.querySelector('.demo-elements');
    if (container) {
      const newElement = document.createElement('div');
      newElement.className = 'demo-button design-highlight';
      newElement.textContent = '新创建的按钮';
      newElement.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      container.appendChild(newElement);
    }
  };

  // 复制元素样式
  const copyElementStyle = () => {
    if (selectedElement) {
      const styles = window.getComputedStyle(selectedElement);
      const styleText = `
        background: ${styles.backgroundColor};
        color: ${styles.color};
        padding: ${styles.padding};
        border-radius: ${styles.borderRadius};
        font-size: ${styles.fontSize};
      `;
      console.log('复制的样式:', styleText);
      alert('样式已复制到控制台');
    }
  };

  // 重置所有样式
  const resetAllStyles = () => {
    location.reload();
  };

  return (
    <div className="design-demo-container">
      <header className="demo-header">
        <h1>🎨 Design 模式演示</h1>
        <p>可视化页面编辑器 - 选择、编辑、预览实时效果</p>
      </header>

      <div className="demo-content">
        <div className={`design-mode-status ${designModeActive ? '' : 'inactive'}`}>
          <h3>
            <span className={`status-indicator ${designModeActive ? '' : 'inactive'}`}></span>
            Design 模式状态: {designModeActive ? '已激活' : '未激活'}
          </h3>
          <p>
            {designModeActive
              ? '现在可以点击页面元素进行选择和编辑，使用快捷键进行操作'
              : '等待 Design 模式激活...'}
          </p>
          {selectedElement && (
            <p><strong>已选择元素:</strong> {selectedElement.tagName.toLowerCase()}.{selectedElement.className}</p>
          )}
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <h3>🎯 元素选择</h3>
            <p>点击页面上的任何元素进行选择，支持高亮显示和边框提示。可编辑的元素包括：div、p、h1-h6、span、button、section 等。</p>
          </div>

          <div className="feature-card">
            <h3>✏️ 实时编辑</h3>
            <p>直接修改元素的样式、文本、属性等所有属性。支持颜色选择器、字体调整、边距设置等多种编辑工具。</p>
          </div>

          <div className="feature-card">
            <h3>🎨 样式面板</h3>
            <p>功能强大的样式编辑面板，支持 CSS 属性的实时修改。包括布局、排版、颜色、动画等完整样式控制。</p>
          </div>

          <div className="feature-card">
            <h3>🔄 拖拽调整</h3>
            <p>支持拖拽调整元素大小和位置。实时预览调整效果，精确控制页面布局和元素尺寸。</p>
          </div>

          <div className="feature-card">
            <h3>📱 响应式预览</h3>
            <p>实时预览不同屏幕尺寸下的显示效果。支持移动端、平板、桌面等多种设备尺寸的模拟。</p>
          </div>

          <div className="feature-card">
            <h3>🚀 Tailwind 集成</h3>
            <p>深度集成 Tailwind CSS，支持实时的 class 类名编辑和预览。自动补全和智能提示功能。</p>
          </div>
        </div>

        <div className="demo-sections">
          <div className="demo-section">
            <h4>🔘 按钮组件</h4>
            <div className="demo-elements">
              <button className="demo-button">主要按钮</button>
              <button className="demo-button secondary">次要按钮</button>
              <button className="demo-button accent">强调按钮</button>
              <button className="demo-button" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                危险按钮
              </button>
            </div>
          </div>

          <div className="demo-section">
            <h4>📝 文本内容</h4>
            <div className="demo-elements">
              <p className="demo-text">这是一段普通的文本内容，可以在 Design 模式下进行编辑。</p>
              <h3 className="demo-text" style={{ color: '#1f2937', fontSize: '1.5rem' }}>
                三级标题样式
              </h3>
              <blockquote className="demo-text" style={{
                background: '#f3f4f6',
                padding: '1rem',
                borderLeft: '4px solid #3b82f6',
                fontStyle: 'italic'
              }}>
                "这是一段引用文本，展示了不同的文本样式效果。"
              </blockquote>
            </div>
          </div>

          <div className="demo-section">
            <h4>📋 表单元素</h4>
            <div className="demo-elements">
              <input
                type="text"
                className="demo-input"
                placeholder="输入框示例"
              />
              <textarea
                className="demo-input"
                rows={3}
                placeholder="多行文本输入框..."
              />
              <select className="demo-input">
                <option>选择选项</option>
                <option>选项 1</option>
                <option>选项 2</option>
                <option>选项 3</option>
              </select>
            </div>
          </div>

          <div className="demo-section">
            <h4>🃏 卡片组件</h4>
            <div className="demo-elements">
              <div className="demo-card">
                <h5 style={{ margin: '0 0 0.5rem 0' }}>信息卡片</h5>
                <p style={{ margin: 0 }}>这是一个示例卡片，展示卡片样式效果。</p>
              </div>
              <div className="demo-image">
                图片占位符
              </div>
            </div>
          </div>

          <div className="demo-section">
            <h4>📝 列表组件</h4>
            <div className="demo-elements">
              <ul className="demo-list">
                <li>列表项目 1</li>
                <li>列表项目 2</li>
                <li>列表项目 3</li>
              </ul>
            </div>
          </div>

          <div className="demo-section">
            <h4>🎨 Tailwind 演示</h4>
            <div className="demo-elements">
              <div className="tailwind-demo">
                <h5>Tailwind CSS 样式</h5>
                <p>使用 Tailwind 类名创建的渐变背景卡片</p>
              </div>
              <div className="responsive-grid">
                <div className="responsive-item">项目 1</div>
                <div className="responsive-item">项目 2</div>
                <div className="responsive-item">项目 3</div>
              </div>
            </div>
          </div>
        </div>

        <div className="demo-instructions">
          <h4>🎯 Design 模式操作指南</h4>
          <ul>
            <li><strong>激活模式</strong>: 等待插件自动激活 Design 模式，或使用快捷键 <span className="shortcut">Ctrl+D</span></li>
            <li><strong>选择元素</strong>: 直接点击页面上的任何元素进行选择</li>
            <li><strong>编辑样式</strong>: 选中元素后，在右侧面板中修改 CSS 属性</li>
            <li><strong>颜色选择</strong>: 点击颜色输入框打开颜色选择器</li>
            <li><strong>拖拽调整</strong>: 选中元素后，拖拽边缘调整大小</li>
            <li><strong>实时预览</strong>: 所有修改都会实时反映在页面上</li>
            <li><strong>快捷键</strong>:
              <span className="shortcut">Delete</span> 删除元素,
              <span className="shortcut">Ctrl+C</span> 复制样式,
              <span className="shortcut">Ctrl+Z</span> 撤销操作
            </li>
          </ul>
        </div>

        <div className="demo-sections">
          <div className="demo-section">
            <h4>🧪 测试功能</h4>
            <div className="demo-elements">
              <button className="demo-button" onClick={testElementSelection}>
                测试元素选择
              </button>
              <button className="demo-button secondary" onClick={testStyleEditing}>
                测试样式编辑
              </button>
              <button className="demo-button accent" onClick={testColorPicker}>
                测试颜色选择器
              </button>
              <button className="demo-button" onClick={testDragResize}>
                测试拖拽调整
              </button>
              <button className="demo-button secondary" onClick={testTailwindIntegration}>
                测试 Tailwind 集成
              </button>
              <button className="demo-button accent" onClick={testLivePreview}>
                测试实时预览
              </button>
              <button className="demo-button" onClick={addNewElement}>
                添加新元素
              </button>
              <button className="demo-button secondary" onClick={copyElementStyle}>
                复制元素样式
              </button>
              <button className="demo-button" onClick={resetAllStyles} style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                重置所有样式
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;