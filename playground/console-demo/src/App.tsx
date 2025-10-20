import React, { useState, useEffect } from 'react';

function App() {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [logCount, setLogCount] = useState(0);

  useEffect(() => {
    // 模拟连接状态检测
    const checkConnection = () => {
      const isConnected = window.__XAGI_CONSOLE_CONNECTED__ || false;
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    };

    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  // 基础日志测试
  const testBasicLogs = () => {
    console.log('📝 这是一个基础日志');
    console.info('ℹ️ 这是一个信息日志');
    console.warn('⚠️ 这是一个警告日志');
    console.error('❌ 这是一个错误日志');
    console.debug('🐛 这是一个调试日志');
    setLogCount(prev => prev + 5);
  };

  // 对象日志测试
  const testObjectLogs = () => {
    const user = {
      id: 1,
      name: '张三',
      email: 'zhangsan@example.com',
      profile: {
        age: 25,
        city: '北京',
        hobbies: ['编程', '阅读', '运动']
      }
    };

    console.log('用户信息:', user);
    console.table(user.profile);
    setLogCount(prev => prev + 2);
  };

  // 数组日志测试
  const testArrayLogs = () => {
    const products = [
      { id: 1, name: '笔记本电脑', price: 5999, category: '电子产品' },
      { id: 2, name: '无线鼠标', price: 99, category: '配件' },
      { id: 3, name: '机械键盘', price: 299, category: '配件' }
    ];

    console.log('产品列表:', products);
    console.table(products);
    setLogCount(prev => prev + 2);
  };

  // 性能日志测试
  const testPerformanceLogs = () => {
    console.time('性能测试');

    // 模拟一些计算
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += Math.random();
    }

    console.timeEnd('性能测试');
    console.log('计算结果:', sum);
    console.log('内存使用:', performance.memory);
    setLogCount(prev => prev + 3);
  };

  // 网络请求日志
  const testNetworkLogs = async () => {
    console.log('🌐 开始网络请求测试');

    try {
      console.log('发送 GET 请求...');
      const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
      const data = await response.json();
      console.log('请求成功:', data);
    } catch (error) {
      console.error('请求失败:', error);
    }

    setLogCount(prev => prev + 3);
  };

  // 错误和异常日志
  const testErrorLogs = () => {
    try {
      // 故意触发错误
      JSON.parse('{"invalid": json}');
    } catch (error) {
      console.error('JSON 解析错误:', error);
    }

    // 创建自定义错误
    const customError = new Error('这是一个自定义错误');
    customError.stack = '自定义错误堆栈信息';
    console.error('自定义错误:', customError);

    setLogCount(prev => prev + 2);
  };

  // 实时数据流日志
  const testRealTimeLogs = () => {
    let count = 0;
    const interval = setInterval(() => {
      count++;
      console.log(`📊 实时数据 #${count}:`, {
        timestamp: new Date().toISOString(),
        value: Math.random() * 100,
        status: count % 2 === 0 ? 'active' : 'idle'
      });

      if (count >= 10) {
        clearInterval(interval);
        console.log('🏁 实时数据流结束');
      }
    }, 500);

    setLogCount(prev => prev + 12);
  };

  // 批量日志压力测试
  const testBatchLogs = () => {
    console.log('🚀 开始批量日志压力测试...');

    const startTime = Date.now();
    for (let i = 0; i < 1000; i++) {
      console.log(`批量日志 ${i + 1}/1000`, {
        id: i,
        data: Math.random().toString(36),
        timestamp: Date.now()
      });
    }

    const endTime = Date.now();
    console.log(`✅ 批量日志完成，耗时: ${endTime - startTime}ms`);
    setLogCount(prev => prev + 1001);
  };

  return (
    <div className="console-demo-container">
      <div className="demo-header">
        <h1>📡 远程控制台演示</h1>
        <p>实时监控和转发浏览器控制台日志到远程服务器</p>
      </div>

      <div className={`connection-status ${connectionStatus === 'disconnected' ? 'disconnected' : ''}`}>
        <h3>
          <span className={`status-indicator ${connectionStatus === 'disconnected' ? 'disconnected' : ''}`}></span>
          WebSocket 连接状态: {connectionStatus === 'connected' ? '已连接' : '未连接'}
        </h3>
        <p>
          {connectionStatus === 'connected'
            ? '正在实时转发控制台日志到远程服务器'
            : '请等待 WebSocket 连接建立...'}
        </p>
        {connectionStatus === 'connected' && (
          <p><strong>已发送日志数量:</strong> {logCount}</p>
        )}
      </div>

      <div className="console-categories">
        <div className="console-category">
          <h3>📝 基础日志测试</h3>
          <p className="description">测试不同级别的控制台输出</p>
          <div className="console-buttons">
            <button className="console-btn" onClick={testBasicLogs}>
              基础日志 (log/info/warn/error/debug)
            </button>
            <button className="console-btn" onClick={testObjectLogs}>
              对象日志 (Object)
            </button>
            <button className="console-btn" onClick={testArrayLogs}>
              数组日志 (Array/Table)
            </button>
          </div>
        </div>

        <div className="console-category">
          <h3>⚡ 性能和调试</h3>
          <p className="description">性能监控和调试相关日志</p>
          <div className="console-buttons">
            <button className="console-btn" onClick={testPerformanceLogs}>
              性能测试 (time/timeEnd)
            </button>
            <button className="console-btn warn" onClick={testErrorLogs}>
              错误日志 (try/catch)
            </button>
            <button className="console-btn" onClick={testNetworkLogs}>
              网络请求日志
            </button>
          </div>
        </div>

        <div className="console-category">
          <h3>🔄 实时和批量</h3>
          <p className="description">实时数据流和大量日志测试</p>
          <div className="console-buttons">
            <button className="console-btn" onClick={testRealTimeLogs}>
              实时数据流 (定时器)
            </button>
            <button className="console-btn error" onClick={testBatchLogs}>
              批量压力测试 (1000条)
            </button>
          </div>
        </div>
      </div>

      <div className="demo-instructions">
        <h4>🎯 演示功能说明</h4>
        <ol>
          <li><strong>启动开发服务器</strong>: 运行 <code>pnpm dev</code></li>
          <li><strong>打开远程控制台</strong>: 在另一个终端中访问 WebSocket 服务器</li>
          <li><strong>连接地址</strong>: <div className="server-url">ws://localhost:3001</div></li>
          <li><strong>测试日志</strong>: 点击上方按钮生成各种类型的日志</li>
          <li><strong>观察转发</strong>: 在远程控制台查看实时转发的日志</li>
        </ol>
        <p><strong>特性</strong>: 实时转发、日志持久化、多客户端连接、日志过滤、历史记录</p>
      </div>
    </div>
  );
}

export default App;