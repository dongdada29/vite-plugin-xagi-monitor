import { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  const testError = () => {
    // 触发 Promise 错误
    Promise.reject('这是一个测试 Promise 错误');
  };

  const testFetchError = async () => {
    try {
      // 触发 Fetch 错误
      await fetch('http://localhost:3000/non-existent-api');
    } catch (error) {
      console.error('Fetch 错误:', error);
    }
  };

  const testRuntimeError = () => {
    // 引用未定义的变量
    console.log(undefinedVariable.someProperty);
  };

  const testCSSError = () => {
    // 动态创建一个会返回 500 错误的 CSS link
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'http://localhost:5174/error.css'; // 不存在的地址，会返回错误
    link.type = 'text/css';

    // 监听加载状态
    link.onerror = function(e) {
      console.error('CSS 加载失败:', e);
    };

    document.head.appendChild(link);

    // 可选：移除现有的 CSS 来模拟更严重的白屏效果
    setTimeout(() => {
      const existingLinks = document.querySelectorAll('link[href*="App.css"]');
      existingLinks.forEach(link => link.remove());
      console.log('已移除现有 CSS，白屏效果更明显');
    }, 500);
  };

  return (
    <div className="App">
      <h1>Vite Plugin XAgi AppDev Monitor</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          编辑 <code>src/App.tsx</code> 并保存以测试 HMR
        </p>
      </div>
      <div className="card">
        <h2>错误监控测试</h2>
        <button onClick={testError}>
          测试 Promise 错误
        </button>
        <button onClick={testFetchError}>
          测试 Fetch 错误
        </button>
        <button onClick={testRuntimeError}>
          测试运行时错误
        </button>
      </div>

      <div className="card">
        <h2>CSS 500 错误白屏测试 ⚠️</h2>
        <button onClick={testCSSError} style={{backgroundColor: '#ff6b6b', color: 'white'}}>
          测试 CSS 500 错误（会导致白屏）
        </button>
        <p style={{fontSize: '12px', color: '#666'}}>
          点击后将动态加载一个返回 500 错误的 CSS 文件，模拟白屏场景
        </p>
      </div>
      <p className="read-the-docs">
        打开浏览器控制台查看日志和错误信息
      </p>
    </div>
  );
}

export default App;

