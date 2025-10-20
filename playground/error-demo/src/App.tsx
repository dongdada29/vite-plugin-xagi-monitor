import React from 'react';

function App() {
  // 同步错误测试
  const testSyncError = () => {
    throw new Error('这是一个同步错误测试');
  };

  // Promise 错误测试
  const testPromiseError = () => {
    Promise.reject(new Error('这是一个 Promise rejection 错误'));
  };

  // 异步错误测试
  const testAsyncError = async () => {
    try {
      await nonExistentFunction();
    } catch (error) {
      console.error('异步错误捕获:', error);
    }
  };

  // 资源加载错误测试
  const testResourceError = () => {
    const script = document.createElement('script');
    script.src = 'http://localhost:9999/non-existent-script.js';
    script.onerror = () => {
      console.error('脚本加载失败');
    };
    document.head.appendChild(script);

    const img = new Image();
    img.src = 'http://localhost:9999/non-existent-image.jpg';
    img.onerror = () => {
      console.error('图片加载失败');
    };
  };

  // 网络请求错误测试
  const testNetworkError = async () => {
    try {
      const response = await fetch('http://localhost:9999/api/test');
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error('网络请求错误:', error);
    }
  };

  // 类型错误测试
  const testTypeError = () => {
    const obj = null;
    console.log(obj.someProperty);
  };

  // 引用错误测试
  const testReferenceError = () => {
    console.log(undefinedVariable.someMethod());
  };

  // 语法错误测试
  const testSyntaxError = () => {
    const script = document.createElement('script');
    script.textContent = 'const x = ;';
    document.head.appendChild(script);
  };

  // 自定义错误测试
  const testCustomError = () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'CustomError';
      }
    }
    throw new CustomError('这是一个自定义错误');
  };

  // 递归溢出错误
  const testStackOverflow = () => {
    const recursive = () => recursive();
    recursive();
  };

  return (
    <div className="error-demo-container">
      <div className="demo-header">
        <h1>🚨 错误监控演示</h1>
        <p>全面演示 XAgi Monitor 的错误捕获和页面增强功能</p>
      </div>

      <div className="error-categories">
        <div className="error-category">
          <h3>💥 基础错误类型</h3>
          <p className="description">测试常见的 JavaScript 错误类型</p>
          <div className="error-buttons">
            <button className="error-btn" onClick={testSyncError}>
              同步错误 (Throw Error)
            </button>
            <button className="error-btn" onClick={testPromiseError}>
              Promise Rejection
            </button>
            <button className="error-btn" onClick={testAsyncError}>
              异步函数错误
            </button>
            <button className="error-btn" onClick={testTypeError}>
              类型错误 (TypeError)
            </button>
            <button className="error-btn" onClick={testReferenceError}>
              引用错误 (ReferenceError)
            </button>
          </div>
        </div>

        <div className="error-category">
          <h3>🌐 网络和资源错误</h3>
          <p className="description">测试资源加载和网络请求失败</p>
          <div className="error-buttons">
            <button className="error-btn secondary" onClick={testResourceError}>
              资源加载错误
            </button>
            <button className="error-btn secondary" onClick={testNetworkError}>
              网络请求错误
            </button>
          </div>
        </div>

        <div className="error-category">
          <h3>⚙️ 高级错误类型</h3>
          <p className="description">测试特殊的错误场景</p>
          <div className="error-buttons">
            <button className="error-btn" onClick={testCustomError}>
              自定义错误
            </button>
            <button className="error-btn" onClick={testSyntaxError}>
              语法错误
            </button>
            <button className="error-btn" onClick={testStackOverflow}>
              栈溢出错误
            </button>
          </div>
        </div>
      </div>

      <div className="demo-info">
        <h4>🎯 演示功能说明</h4>
        <ul>
          <li><strong>错误页面增强</strong>: 发生错误时显示 AI 友好的错误信息</li>
          <li><strong>代码片段展示</strong>: 自动提取和显示错误相关的代码</li>
          <li><strong>错误分类</strong>: 智能分类错误类型并提供解决建议</li>
          <li><strong>堆栈跟踪优化</strong>: 清晰的堆栈信息显示</li>
        </ul>
        <p><strong>提示</strong>: 打开浏览器开发者工具查看详细的错误信息和增强页面效果</p>
      </div>
    </div>
  );
}

export default App;