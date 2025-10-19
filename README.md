# vite-plugin-xagi-monitor

[![npm version](https://img.shields.io/npm/v/vite-plugin-xagi-monitor.svg)](https://www.npmjs.com/package/vite-plugin-xagi-monitor)
[![license](https://img.shields.io/npm/l/vite-plugin-xagi-monitor.svg)](https://github.com/dongdada29/vite-plugin-xagi-monitor/blob/main/LICENSE)

🔥 强大的 Vite 开发监控插件，用于实时监控错误、日志和 HMR 更新状态。

完美集成 XAgi AppDev 平台的 Preview 组件，提供一站式开发体验。

## 功能特性

- ✅ **自动错误捕获**：捕获资源加载错误、Promise 错误、Fetch 错误
- ✅ **日志转发**：实时转发 Vite 控制台日志到客户端
- ✅ **HMR 监控**：实时显示文件更新状态
- ✅ **Preview 集成**：与 Preview 组件无缝集成，实时显示日志和错误

## 安装

```bash
npm install vite-plugin-xagi-monitor --save-dev
# 或
pnpm add vite-plugin-xagi-monitor -D
```

## 使用

### 1. 在 Vite 配置中使用

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import appDevMonitor from 'vite-plugin-xagi-monitor';

export default defineConfig({
  plugins: [
    appDevMonitor({
      errorMonitor: true,    // 启用错误监听
      logForwarding: true,   // 启用日志转发
      hmrForwarding: true,   // 启用 HMR 监控
      debug: false           // 调试模式
    })
  ]
});
```

### 2. Preview 组件集成

在 Preview 组件中添加消息监听：

```typescript
// Preview 组件
const [logs, setLogs] = useState<any[]>([]);
const [hmrStatus, setHmrStatus] = useState('');

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
      setResourceErrors(prev => [...prev, e.data.data]);
    }
  };
  
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
```

## 配置选项

```typescript
interface PluginOptions {
  /** 是否启用错误监听（默认: true） */
  errorMonitor?: boolean;
  
  /** 是否转发 Vite 日志（默认: true） */
  logForwarding?: boolean;
  
  /** 是否转发 HMR 更新（默认: true） */
  hmrForwarding?: boolean;
  
  /** 调试模式（默认: false） */
  debug?: boolean;
}
```

## 消息类型

### APPDEV_LOG
日志消息，包含 Vite 控制台输出：

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

### APPDEV_HMR
HMR 更新消息：

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

### APPDEV_ERROR
错误消息：

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

## 工作原理

1. **服务端**：插件拦截 Vite 的 logger 和文件监听器，通过 HMR WebSocket 转发消息
2. **客户端**：注入的脚本监听各种错误，通过 postMessage 发送到父窗口
3. **Preview 组件**：监听 postMessage 事件，接收并显示日志和错误

## 开发

```bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 开发模式（监听文件变化）
pnpm dev
```

## 项目结构

```
vite-plugin-xagi-monitor/
├── src/                      # 源代码
│   ├── index.ts             # 插件入口
│   ├── types.ts             # 类型定义
│   ├── client-script.ts     # 客户端脚本
│   └── log-interceptor.ts   # 日志拦截器
├── example/                  # 示例项目
│   ├── src/
│   ├── vite.config.ts       # 插件配置示例
│   └── package.json
├── README.md                 # 基础文档
├── USAGE.md                  # 详细使用指南
└── IMPLEMENTATION_SUMMARY.md # 实现总结
```

## 开发

```bash
# 克隆仓库
git clone https://github.com/dongdada29/vite-plugin-xagi-monitor.git
cd vite-plugin-xagi-monitor

# 安装依赖
pnpm install

# 构建插件
pnpm build

# 监听模式（开发）
pnpm dev

# 运行示例
cd example
pnpm install
pnpm dev
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## License

MIT
