# 使用指南

## 快速开始

### 1. 在 Vite 项目中安装并配置插件

```bash
# 在你的 Vite 项目中安装
cd your-vite-project
npm install vite-plugin-xagi-monitor --save-dev
```

### 2. 配置 vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import appDevMonitor from 'vite-plugin-xagi-monitor';

export default defineConfig({
  plugins: [
    react(),
    appDevMonitor({
      errorMonitor: true,    // 启用错误监听
      logForwarding: true,   // 启用日志转发
      hmrForwarding: true,   // 启用 HMR 监控
      debug: false           // 生产环境关闭调试
    })
  ]
});
```

### 3. 在 Preview 组件中接收消息

插件会通过 `postMessage` 向父窗口发送三种类型的消息：

#### 消息类型 1: APPDEV_LOG (Vite 日志)

```typescript
{
  type: 'APPDEV_LOG',
  data: {
    level: 'info' | 'warn' | 'error',
    message: string,
    timestamp: number
  }
}
```

#### 消息类型 2: APPDEV_HMR (HMR 更新)

```typescript
{
  type: 'APPDEV_HMR',
  data: {
    type: 'update' | 'full-reload',
    path?: string,
    timestamp: number
  }
}
```

#### 消息类型 3: APPDEV_ERROR (错误报告)

```typescript
{
  type: 'APPDEV_ERROR',
  data: {
    type: string,
    url: string,
    message: string,
    timestamp: number,
    statusCode?: number
  }
}
```

### 4. Preview 组件集成示例

```typescript
const Preview = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [hmrStatus, setHmrStatus] = useState('');
  const [errors, setErrors] = useState<any[]>([]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      // 接收日志
      if (e.data?.type === 'APPDEV_LOG') {
        setLogs(prev => [...prev, e.data.data].slice(-100));
      }
      
      // 接收 HMR 更新
      if (e.data?.type === 'APPDEV_HMR') {
        setHmrStatus(e.data.data.path);
        setTimeout(() => setHmrStatus(''), 3000);
      }
      
      // 接收错误
      if (e.data?.type === 'APPDEV_ERROR') {
        setErrors(prev => [...prev, e.data.data]);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div>
      {/* HMR 状态显示 */}
      {hmrStatus && <div>🔥 {hmrStatus}</div>}
      
      {/* 日志按钮 */}
      <button onClick={() => console.log(logs)}>
        查看日志 ({logs.length})
      </button>
      
      {/* 错误显示 */}
      {errors.length > 0 && (
        <div>检测到 {errors.length} 个错误</div>
      )}
      
      {/* iframe */}
      <iframe src={devServerUrl} />
    </div>
  );
};
```

## 测试示例

### 运行示例项目

```bash
# 进入示例目录
cd example

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 测试功能

1. **测试 HMR**: 修改 `src/App.tsx` 并保存，观察 HMR 状态
2. **测试错误捕获**: 点击"测试 Promise 错误"和"测试 Fetch 错误"按钮
3. **查看日志**: 打开浏览器控制台查看转发的日志

## 工作原理

### 服务端（Vite 插件）

1. **日志拦截**: 拦截 Vite 的 `logger.info/warn/error`
2. **HMR 监控**: 监听文件变化事件
3. **消息转发**: 通过 HMR WebSocket (`server.ws.send`) 发送到客户端

### 客户端（注入脚本）

1. **接收服务端消息**: 监听 HMR 事件 (`import.meta.hot.on`)
2. **错误监听**: 捕获资源错误、Promise 错误、Fetch 错误
3. **向父窗口转发**: 通过 `postMessage` 发送给 Preview 组件

### Preview 组件

1. **监听消息**: 通过 `window.addEventListener('message')` 接收
2. **状态管理**: 管理日志、HMR 状态、错误列表
3. **UI 展示**: 显示实时日志和错误信息

## 常见问题

### Q: 为什么没有收到日志？

A: 检查以下几点：
1. 确保插件已正确配置在 `vite.config.ts` 中
2. 确保 `logForwarding` 选项为 `true`
3. 检查浏览器控制台是否有错误
4. 确认 iframe 和父窗口的通信没有被浏览器安全策略阻止

### Q: 跨域问题怎么办？

A: 如果 iframe 和父窗口不同源，部分功能可能受限。建议：
1. 使用相同域名
2. 配置 CORS
3. 使用 nginx 反向代理

### Q: 如何减少日志数量？

A: 日志已经自动限制在最近 100 条。如需调整：
```typescript
setViteLogs((prev) => {
  const newLogs = [...prev, log];
  return newLogs.length > 50 ? newLogs.slice(-50) : newLogs; // 改为 50
});
```

## 性能优化建议

1. **日志限制**: 已内置，保留最近 100 条
2. **HMR 状态**: 自动 3 秒后清除
3. **错误列表**: 限制最多 50 条
4. **生产环境**: 设置 `debug: false` 关闭调试日志

## 进阶使用

### 自定义错误处理

```typescript
if (e.data?.type === 'APPDEV_ERROR') {
  const error = e.data.data;
  
  // 根据错误类型自定义处理
  if (error.statusCode >= 500) {
    notification.error({ message: '服务器错误' });
  } else if (error.type === 'script') {
    console.error('关键脚本加载失败:', error.url);
  }
}
```

### 日志过滤

```typescript
const filteredLogs = logs.filter(log => log.level === 'error');
```

### 持久化

```typescript
// 保存到 localStorage
useEffect(() => {
  localStorage.setItem('vite-logs', JSON.stringify(logs));
}, [logs]);
```

## 更多信息

- [GitHub](https://github.com/your-org/vite-plugin-xagi-monitor)
- [问题反馈](https://github.com/your-org/vite-plugin-xagi-monitor/issues)

