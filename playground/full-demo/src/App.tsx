import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'error' | 'console' | 'whitescreen' | 'design'>('overview');
  const [featureStatus, setFeatureStatus] = useState({
    errorMonitor: false,
    consoleConnected: false,
    whiteScreenActive: false,
    designModeActive: false
  });
  const [count, setCount] = useState(0);

  useEffect(() => {
    // 检测各功能状态
    const checkFeatureStatus = () => {
      setFeatureStatus({
        errorMonitor: window.__XAGI_ERROR_MONITOR__ || false,
        consoleConnected: window.__XAGI_CONSOLE_CONNECTED__ || false,
        whiteScreenActive: window.__XAGI_WHITESCREEN_ACTIVE__ || false,
        designModeActive: window.__XAGI_DESIGN_MODE_ACTIVE__ || false
      });
    };

    const interval = setInterval(checkFeatureStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // 错误监控测试
  const testSyncError = () => {
    throw new Error('同步错误测试');
  };

  const testAsyncError = async () => {
    await Promise.reject('异步错误测试');
  };

  const testNetworkError = async () => {
    try {
      await fetch('http://localhost:9999/api/test');
    } catch (error) {
      console.error('网络请求错误:', error);
    }
  };

  // 远程控制台测试
  const testConsoleLogs = () => {
    console.log('📝 普通日志 - 远程控制台测试');
    console.info('ℹ️ 信息日志');
    console.warn('⚠️ 警告日志');
    console.error('❌ 错误日志');
    console.debug('🐛 调试日志');

    console.table([
      { name: '张三', age: 25, city: '北京' },
      { name: '李四', age: 30, city: '上海' }
    ]);
  };

  const testPerformanceLogs = () => {
    console.time('性能测试');
    let sum = 0;
    for (let i = 0; i < 100000; i++) {
      sum += Math.random();
    }
    console.timeEnd('性能测试');
    console.log('计算结果:', sum);
  };

  // 白屏监控测试
  const testWhiteScreen = () => {
    document.body.innerHTML = '<div style="height: 100vh; background: white;"></div>';
  };

  const testEmptyContent = () => {
    document.querySelector('.App')!.innerHTML = '';
  };

  // Design 模式测试
  const testDesignSelection = () => {
    const elements = document.querySelectorAll('.demo-section, .test-button');
    if (elements.length > 0) {
      const element = elements[Math.floor(Math.random() * elements.length)] as HTMLElement;
      element.style.border = '2px dashed #3b82f6';
      setTimeout(() => {
        element.style.border = '';
      }, 2000);
    }
  };

  const renderOverview = () => (
    <div className="overview-section">
      <h2>🎯 功能概览</h2>
      <div className="status-grid">
        <div className={`status-card ${featureStatus.errorMonitor ? 'active' : 'inactive'}`}>
          <h3>🚨 错误监控</h3>
          <p>状态: {featureStatus.errorMonitor ? '✅ 已激活' : '❌ 未激活'}</p>
          <p>捕获和处理各种类型的错误</p>
        </div>
        <div className={`status-card ${featureStatus.consoleConnected ? 'active' : 'inactive'}`}>
          <h3>📡 远程控制台</h3>
          <p>状态: {featureStatus.consoleConnected ? '✅ 已连接' : '❌ 未连接'}</p>
          <p>实时转发浏览器日志到远程服务器</p>
        </div>
        <div className={`status-card ${featureStatus.whiteScreenActive ? 'active' : 'inactive'}`}>
          <h3>⚪ 白屏监控</h3>
          <p>状态: {featureStatus.whiteScreenActive ? '✅ 监控中' : '❌ 未激活'}</p>
          <p>智能检测页面空白状态</p>
        </div>
        <div className={`status-card ${featureStatus.designModeActive ? 'active' : 'inactive'}`}>
          <h3>🎨 Design 模式</h3>
          <p>状态: {featureStatus.designModeActive ? '✅ 已激活' : '❌ 未激活'}</p>
          <p>可视化页面编辑器</p>
        </div>
      </div>

      <div className="demo-info">
        <h3>📖 使用说明</h3>
        <p>这是 XAgi Monitor 的全功能演示项目，集成了所有四大核心功能：</p>
        <ul>
          <li><strong>错误监控</strong>: 全面的错误捕获和智能处理</li>
          <li><strong>远程控制台</strong>: WebSocket 实时日志转发</li>
          <li><strong>白屏监控</strong>: 多维度页面状态检测</li>
          <li><strong>Design 模式</strong>: 可视化样式编辑</li>
        </ul>
        <p>点击上方标签页体验各个功能的详细演示。</p>
      </div>
    </div>
  );

  const renderErrorDemo = () => (
    <div className="demo-section">
      <h2>🚨 错误监控演示</h2>
      <p>测试各种错误类型的捕获和处理</p>

      <div className="button-group">
        <button className="test-button error" onClick={testSyncError}>
          同步错误
        </button>
        <button className="test-button error" onClick={testAsyncError}>
          异步错误
        </button>
        <button className="test-button error" onClick={testNetworkError}>
          网络错误
        </button>
      </div>

      <div className="feature-info">
        <h4>功能特性</h4>
        <ul>
          <li>智能错误分类和识别</li>
          <li>AI 友好的错误信息展示</li>
          <li>代码片段自动提取</li>
          <li>修复建议生成</li>
        </ul>
      </div>
    </div>
  );

  const renderConsoleDemo = () => (
    <div className="demo-section">
      <h2>📡 远程控制台演示</h2>
      <p>测试日志实时转发功能 (连接到 ws://localhost:3001)</p>

      <div className="button-group">
        <button className="test-button console" onClick={testConsoleLogs}>
          基础日志测试
        </button>
        <button className="test-button console" onClick={testPerformanceLogs}>
          性能日志测试
        </button>
        <button className="test-button console" onClick={() => {
          for (let i = 0; i < 10; i++) {
            setTimeout(() => {
              console.log(`实时日志 ${i + 1}/10:`, {
                timestamp: new Date().toISOString(),
                random: Math.random()
              });
            }, i * 500);
          }
        }}>
          实时日志流
        </button>
      </div>

      <div className="feature-info">
        <h4>功能特性</h4>
        <ul>
          <li>WebSocket 实时连接</li>
          <li>多客户端支持</li>
          <li>日志持久化存储</li>
          <li>日志过滤和搜索</li>
        </ul>
      </div>
    </div>
  );

  const renderWhiteScreenDemo = () => (
    <div className="demo-section">
      <h2>⚪ 白屏监控演示</h2>
      <p>⚠️ 警告: 以下操作会导致页面白屏，请谨慎使用</p>

      <div className="button-group">
        <button className="test-button warning" onClick={testWhiteScreen}>
          完全白屏
        </button>
        <button className="test-button warning" onClick={testEmptyContent}>
          清空内容
        </button>
        <button className="test-button" onClick={() => window.location.reload()}>
          恢复页面
        </button>
      </div>

      <div className="feature-info">
        <h4>功能特性</h4>
        <ul>
          <li>多维度白屏检测算法</li>
          <li>实时监控和警报</li>
          <li>自动截图保存</li>
          <li>性能指标收集</li>
        </ul>
      </div>
    </div>
  );

  const renderDesignDemo = () => (
    <div className="demo-section">
      <h2>🎨 Design 模式演示</h2>
      <p>可视化页面编辑功能，点击元素进行选择和编辑</p>

      <div className="design-playground">
        <div className="editable-element" style={{ padding: '1rem', background: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: '8px', margin: '1rem 0' }}>
          <h4>可编辑卡片 1</h4>
          <p>这是一个可以编辑的元素，点击选择并修改样式。</p>
          <button className="demo-button">示例按钮</button>
        </div>

        <div className="editable-element" style={{ padding: '1rem', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', margin: '1rem 0' }}>
          <h4>可编辑卡片 2</h4>
          <p>不同的样式和布局，支持拖拽调整大小。</p>
          <input type="text" placeholder="可编辑输入框" style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }} />
        </div>

        <div className="button-group">
          <button className="test-button design" onClick={testDesignSelection}>
            测试元素选择
          </button>
          <button className="test-button design" onClick={() => {
            document.querySelectorAll('.editable-element').forEach((el, index) => {
              setTimeout(() => {
                (el as HTMLElement).style.backgroundColor = `hsl(${index * 60}, 70%, 95%)`;
              }, index * 300);
            });
          }}>
            测试样式修改
          </button>
        </div>
      </div>

      <div className="feature-info">
        <h4>功能特性</h4>
        <ul>
          <li>可视化元素选择</li>
          <li>实时样式编辑</li>
          <li>拖拽调整大小</li>
          <li>Tailwind CSS 集成</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="App">
      <header className="app-header">
        <h1>🚀 XAgi Monitor 全功能演示</h1>
        <p>Vite 插件四大核心功能综合展示</p>
      </header>

      <nav className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 功能概览
        </button>
        <button
          className={`tab-button ${activeTab === 'error' ? 'active' : ''}`}
          onClick={() => setActiveTab('error')}
        >
          🚨 错误监控
        </button>
        <button
          className={`tab-button ${activeTab === 'console' ? 'active' : ''}`}
          onClick={() => setActiveTab('console')}
        >
          📡 远程控制台
        </button>
        <button
          className={`tab-button ${activeTab === 'whitescreen' ? 'active' : ''}`}
          onClick={() => setActiveTab('whitescreen')}
        >
          ⚪ 白屏监控
        </button>
        <button
          className={`tab-button ${activeTab === 'design' ? 'active' : ''}`}
          onClick={() => setActiveTab('design')}
        >
          🎨 Design 模式
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'error' && renderErrorDemo()}
        {activeTab === 'console' && renderConsoleDemo()}
        {activeTab === 'whitescreen' && renderWhiteScreenDemo()}
        {activeTab === 'design' && renderDesignDemo()}

        <div className="demo-actions">
          <h3>基础功能测试</h3>
          <div className="button-group">
            <button onClick={() => setCount(count + 1)}>
              计数器: {count}
            </button>
            <button onClick={() => console.log('HMR 测试 - 编辑 App.tsx 文件')}>
              HMR 测试
            </button>
          </div>
          <p className="hint">
            💡 提示: 编辑 <code>src/App.tsx</code> 并保存以测试热模块替换功能
          </p>
        </div>
      </main>

      <footer className="app-footer">
        <p>打开浏览器开发者工具查看详细的日志和错误信息</p>
      </footer>
    </div>
  );
}

export default App;