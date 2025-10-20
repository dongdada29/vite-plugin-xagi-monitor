import React, { useState, useEffect } from 'react';

function App() {
  const [monitorStatus, setMonitorStatus] = useState<'active' | 'warning' | 'error'>('active');
  const [metrics, setMetrics] = useState({
    contentLength: 0,
    elementCount: 0,
    loadTime: 0,
    containerRatio: 0
  });
  const [isWhiteScreen, setIsWhiteScreen] = useState(false);

  useEffect(() => {
    // 模拟监控数据更新
    const updateMetrics = () => {
      const contentLength = document.body?.textContent?.length || 0;
      const elementCount = document.querySelectorAll('*').length;
      const containerRatio = document.querySelector('.whitescreen-demo-container') ?
        1 : 0;

      setMetrics({
        contentLength,
        elementCount,
        loadTime: performance.now(),
        containerRatio
      });

      // 根据指标更新状态
      if (contentLength < 50 || elementCount < 5 || containerRatio < 0.1) {
        setMonitorStatus('error');
      } else if (contentLength < 100 || elementCount < 10) {
        setMonitorStatus('warning');
      } else {
        setMonitorStatus('active');
      }
    };

    const interval = setInterval(updateMetrics, 1000);
    updateMetrics();

    return () => clearInterval(interval);
  }, []);

  // 完全白屏测试
  const testCompleteWhiteScreen = () => {
    document.body.innerHTML = '<div class="white-screen"></div>';
    setIsWhiteScreen(true);
    setMonitorStatus('error');
  };

  // 空内容测试
  const testEmptyContent = () => {
    document.body.innerHTML = '<div class="empty-content">页面内容为空</div>';
    setIsWhiteScreen(true);
    setMonitorStatus('error');
  };

  // CSS 加载失败测试
  const testCSSError = () => {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'http://localhost:9999/non-existent.css';
    style.onerror = () => {
      console.error('CSS 加载失败，可能导致样式丢失和白屏');
      setMonitorStatus('error');
    };
    document.head.appendChild(style);

    // 移除现有样式
    setTimeout(() => {
      document.querySelectorAll('style').forEach(el => el.remove());
      setMonitorStatus('warning');
    }, 1000);
  };

  // JavaScript 错误测试
  const testJSError = () => {
    // 添加会导致 JS 错误的脚本
    const script = document.createElement('script');
    script.textContent = `
      // 故意的语法错误
      const x = ;
      undefinedFunction();
    `;
    script.onerror = () => {
      console.error('JavaScript 执行错误');
      setMonitorStatus('error');
    };
    document.head.appendChild(script);
  };

  // 网络资源加载失败测试
  const testResourceFailure = () => {
    const resources = [
      { type: 'script', src: 'http://localhost:9999/app.js' },
      { type: 'img', src: 'http://localhost:9999/logo.png' },
      { type: 'link', rel: 'stylesheet', href: 'http://localhost:9999/styles.css' }
    ];

    resources.forEach(resource => {
      const element = document.createElement(resource.type);
      Object.keys(resource).forEach(key => {
        if (key !== 'type') {
          element[key] = resource[key];
        }
      });

      element.onerror = () => {
        console.error(`${resource.type} 资源加载失败`);
      };

      document.head.appendChild(element);
    });

    setMonitorStatus('warning');
  };

  // 布局错乱测试
  const testLayoutBroken = () => {
    const container = document.querySelector('.whitescreen-demo-container');
    if (container) {
      container.classList.add('broken-layout');
      setMonitorStatus('error');
    }
  };

  // 长时间加载测试
  const testLongLoading = () => {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-spinner';
    loadingDiv.innerHTML = '<div class="spinner"></div>';
    document.body.innerHTML = '';
    document.body.appendChild(loadingDiv);

    setIsWhiteScreen(true);
    setMonitorStatus('warning');

    // 模拟长时间加载
    setTimeout(() => {
      console.log('长时间加载测试完成');
      restoreContent();
    }, 10000);
  };

  // 元素隐藏测试
  const testHiddenElements = () => {
    const container = document.querySelector('.whitescreen-demo-container');
    if (container) {
      container.classList.add('hidden-elements');
      setMonitorStatus('error');
    }
  };

  // 恢复内容
  const restoreContent = () => {
    window.location.reload();
  };

  if (isWhiteScreen) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: '#6b7280' }}>白屏监控演示中...</p>
        <button
          onClick={restoreContent}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          恢复正常页面
        </button>
      </div>
    );
  }

  return (
    <div className="whitescreen-demo-container">
      <div className="demo-header">
        <h1>⚪ 白屏监控演示</h1>
        <p>智能检测页面空白状态，提供实时监控和警报</p>
      </div>

      <div className={`monitor-status ${monitorStatus}`}>
        <h3>
          {monitorStatus === 'active' && '✅ 监控状态: 正常'}
          {monitorStatus === 'warning' && '⚠️ 监控状态: 警告'}
          {monitorStatus === 'error' && '❌ 监控状态: 检测到白屏'}
        </h3>
        <p>
          {monitorStatus === 'active' && '页面内容正常，未检测到白屏问题'}
          {monitorStatus === 'warning' && '页面内容较少，可能存在潜在问题'}
          {monitorStatus === 'error' && '已检测到白屏状态，请检查页面内容'}
        </p>

        <div className="monitor-metrics">
          <div className="metric-card">
            <div className="metric-value">{metrics.contentLength}</div>
            <div className="metric-label">内容长度</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{metrics.elementCount}</div>
            <div className="metric-label">元素数量</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{Math.round(metrics.loadTime)}ms</div>
            <div className="metric-label">加载时间</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{(metrics.containerRatio * 100).toFixed(0)}%</div>
            <div className="metric-label">容器占比</div>
          </div>
        </div>
      </div>

      <div className="scenario-categories">
        <div className="scenario-category">
          <h3>🚨 严重白屏场景</h3>
          <p className="description">模拟严重的白屏问题</p>
          <div className="scenario-buttons">
            <button className="scenario-btn danger" onClick={testCompleteWhiteScreen}>
              完全白屏
            </button>
            <button className="scenario-btn danger" onClick={testEmptyContent}>
              空内容页面
            </button>
            <button className="scenario-btn danger" onClick={testJSError}>
              JavaScript 错误
            </button>
          </div>
        </div>

        <div className="scenario-category">
          <h3>⚠️ 资源加载问题</h3>
          <p className="description">模拟资源加载失败导致的白屏</p>
          <div className="scenario-buttons">
            <button className="scenario-btn warning" onClick={testCSSError}>
              CSS 加载失败
            </button>
            <button className="scenario-btn warning" onClick={testResourceFailure}>
              资源加载失败
            </button>
            <button className="scenario-btn warning" onClick={testLongLoading}>
              长时间加载
            </button>
          </div>
        </div>

        <div className="scenario-category">
          <h3>🎨 布局和显示问题</h3>
          <p className="description">模拟布局问题导致的视觉白屏</p>
          <div className="scenario-buttons">
            <button className="scenario-btn" onClick={testLayoutBroken}>
              布局错乱
            </button>
            <button className="scenario-btn" onClick={testHiddenElements}>
              元素隐藏
            </button>
            <button className="scenario-btn" onClick={restoreContent}>
              恢复正常页面
            </button>
          </div>
        </div>
      </div>

      <div className="demo-instructions">
        <h4>🎯 演示功能说明</h4>
        <ul>
          <li><strong>多维度检测</strong>: 内容长度、元素数量、容器占比、加载时间</li>
          <li><strong>实时监控</strong>: 每2秒检查一次页面状态</li>
          <li><strong>智能判断</strong>: 综合多个指标判断是否存在白屏</li>
          <li><strong>警报系统</strong>: 检测到白屏时立即发出警报</li>
          <li><strong>恢复机制</strong>: 提供页面恢复和刷新功能</li>
        </ul>
        <p><strong>提示</strong>: 点击上方按钮模拟不同的白屏场景，观察监控系统的反应</p>
      </div>
    </div>
  );
}

export default App;