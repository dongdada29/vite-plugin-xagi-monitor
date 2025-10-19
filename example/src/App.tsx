import { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  // 测试错误捕获
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
      </div>
      <p className="read-the-docs">
        打开浏览器控制台查看日志和错误信息
      </p>
    </div>
  );
}

export default App;

