# vite-plugin-xagi-monitor

[![npm version](https://img.shields.io/npm/v/vite-plugin-xagi-monitor.svg)](https://www.npmjs.com/package/vite-plugin-xagi-monitor)
[![license](https://img.shields.io/npm/l/vite-plugin-xagi-monitor.svg)](https://github.com/dongdada29/vite-plugin-xagi-monitor/blob/main/LICENSE)

🚀 全功能的 Vite 开发增强插件，提供完整的开发监控和调试解决方案。

完美集成 XAgi AppDev 平台，提供一站式开发体验。

## ✨ 核心功能

### 🔍 错误页面增强
- ✅ **自定义错误页面**：美化 Vite 错误页面显示
- ✅ **AI 友好格式**：结构化错误信息，便于 AI 分析
- ✅ **代码片段显示**：显示错误相关代码片段
- ✅ **智能建议**：提供修复建议和最佳实践

### 📡 远程控制台
- ✅ **实时日志捕获**：完整捕获终端输出日志
- ✅ **WebSocket 通信**：实时传输到远程浏览器
- ✅ **日志历史**：完整保存和查看历史日志
- ✅ **多级别过滤**：支持 info、warn、error、debug 级别

### 🎯 白屏监控
- ✅ **智能检测**：多维度分析页面空白状态
- ✅ **实时警报**：检测到白屏时立即通知
- ✅ **详细报告**：提供页面状态分析报告
- ✅ **自动恢复**：支持自动刷新和恢复建议

### 🎨 Design 模式
- ✅ **可视化选择**：点击选择页面元素
- ✅ **实时编辑**：直接编辑元素内容和样式
- ✅ **Tailwind 集成**：支持 Tailwind CSS 类名编辑
- ✅ **元素操作**：复制、删除、移动等操作
- ✅ **样式调试**：快速样式修改和预览

### 🔧 基础监控
- ✅ **自动错误捕获**：资源加载、Promise、Fetch 错误
- ✅ **日志转发**：实时转发 Vite 控制台日志
- ✅ **HMR 监控**：实时显示热更新状态
- ✅ **Preview 集成**：与 Preview 组件无缝集成

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
      // 基础监控
      errorMonitor: true,        // 启用错误监听
      logForwarding: true,       // 启用日志转发
      hmrForwarding: true,       // 启用 HMR 监控
      debug: false,              // 调试模式

      // 错误页面增强
      errorPageCustomization: {
        enabled: true,           // 启用错误页面增强
        aiFriendly: true,        // AI 友好格式
        showStack: true,         // 显示错误堆栈
        showCodeSnippet: true,   // 显示代码片段
        maxStackLines: 8,        // 最大堆栈行数
        debug: false             // 调试模式
      },

      // 远程控制台
      remoteConsole: {
        enabled: true,           // 启用远程控制台
        port: 3001,              // 控制台服务端口
        persistLogs: true,       // 持久化日志
        maxLogs: 2000,           // 最大日志数量
        logLevels: ['info', 'warn', 'error', 'debug'], // 日志级别
        debug: false             // 调试模式
      },

      // 白屏监控
      whiteScreenMonitor: {
        enabled: true,           // 启用白屏监控
        screenshot: false,       // 截图功能
        thresholds: {
          contentLength: 50,     // 内容长度阈值
          elementCount: 5,       // 元素数量阈值
          loadTime: 3000         // 加载时间阈值
        },
        checkInterval: 2000,     // 检查间隔
        debug: false             // 调试模式
      },

      // Design 模式
      designMode: {
        enabled: true,           // 启用 Design 模式
        tailwindIntegration: false, // Tailwind 集成
        autoSync: true,          // 自动同步
        editableSelectors: ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'button', 'section'],
        showElementBorders: true, // 显示元素边框
        debug: false             // 调试模式
      }
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

### 3. 远程控制台访问

启用远程控制台后，可以在浏览器中访问：
```
http://localhost:3001
```

### 4. Design 模式使用

启用 Design 模式后：
- 在页面上点击任意元素进行选择
- 使用 `Ctrl+Shift+D` 快捷键切换 Design 模式
- 双击元素进行内容编辑
- 通过浮动面板修改样式和属性

## 配置选项

```typescript
interface PluginOptions {
  // 基础监控配置
  /** 是否启用错误监听（默认: true） */
  errorMonitor?: boolean;

  /** 是否转发 Vite 日志（默认: true） */
  logForwarding?: boolean;

  /** 是否转发 HMR 更新（默认: true） */
  hmrForwarding?: boolean;

  /** 调试模式（默认: false） */
  debug?: boolean;

  // 错误页面增强配置
  /** 错误页面自定义配置 */
  errorPageCustomization?: {
    enabled?: boolean;           // 是否启用（默认: false）
    aiFriendly?: boolean;        // AI 友好格式（默认: true）
    showStack?: boolean;         // 显示错误堆栈（默认: true）
    showCodeSnippet?: boolean;   // 显示代码片段（默认: true）
    maxStackLines?: number;      // 最大堆栈行数（默认: 8）
    debug?: boolean;             // 调试模式（默认: false）
  };

  // 远程控制台配置
  /** 远程控制台配置 */
  remoteConsole?: {
    enabled?: boolean;           // 是否启用（默认: false）
    port?: number;               // 服务端口（默认: 3001）
    persistLogs?: boolean;       // 持久化日志（默认: true）
    maxLogs?: number;            // 最大日志数量（默认: 2000）
    logLevels?: string[];        // 日志级别（默认: ['info', 'warn', 'error', 'debug']）
    debug?: boolean;             // 调试模式（默认: false）
  };

  // 白屏监控配置
  /** 白屏监控配置 */
  whiteScreenMonitor?: {
    enabled?: boolean;           // 是否启用（默认: false）
    screenshot?: boolean;        // 截图功能（默认: false）
    thresholds?: {
      contentLength?: number;    // 内容长度阈值（默认: 50）
      elementCount?: number;     // 元素数量阈值（默认: 5）
      loadTime?: number;         // 加载时间阈值（默认: 3000）
    };
    checkInterval?: number;      // 检查间隔毫秒（默认: 2000）
    debug?: boolean;             // 调试模式（默认: false）
  };

  // Design 模式配置
  /** Design 模式配置 */
  designMode?: {
    enabled?: boolean;           // 是否启用（默认: false）
    tailwindIntegration?: boolean; // Tailwind 集成（默认: false）
    autoSync?: boolean;          // 自动同步（默认: true）
    editableSelectors?: string[]; // 可编辑选择器
    showElementBorders?: boolean; // 显示元素边框（默认: true）
    debug?: boolean;             // 调试模式（默认: false）
  };
}
```

## 消息类型

### APPDEV_LOG
日志消息，包含 Vite 控制台输出：

```typescript
{
  type: 'APPDEV_LOG',
  data: {
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    timestamp: number,
    source?: string
  }
}
```

### APPDEV_HMR
HMR 更新消息：

```typescript
{
  type: 'APPDEV_HMR',
  data: {
    type: 'update' | 'full-reload' | 'error',
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
    statusCode?: number,
    severity?: 'normal' | 'critical',
    element?: string
  }
}
```

### APPDEV_WHITE_SCREEN
白屏监控消息：

```typescript
{
  type: 'APPDEV_WHITE_SCREEN',
  data: {
    isWhiteScreen: boolean,
    timestamp: number,
    url: string,
    metrics: {
      textLength: number;
      elementCount: number;
      pageHeight: number;
      hasVisibleContent: boolean;
      loadTime: number;
      // ... 更多指标
    }
  }
}
```

### APPDEV_DESIGN_EDIT
Design 模式编辑消息：

```typescript
{
  type: 'APPDEV_DESIGN_EDIT',
  data: {
    action: 'select' | 'edit' | 'duplicate' | 'remove',
    selector: string,
    timestamp: number,
    data: {
      type: string;
      oldValue?: any;
      newValue?: any;
    }
  }
}
```

## 工作原理

### 架构概览
```
┌─────────────────┐    WebSocket     ┌──────────────────┐    postMessage    ┌─────────────────┐
│   Vite Server   │ ◄─────────────► │   Client Script  │ ◄─────────────────► │  Preview Panel   │
│                 │                 │                  │                    │                 │
│ • Log Interceptor │                │ • Error Monitor  │                    │ • Log Display   │
│ • HMR Monitor    │                │ • White Screen   │                    │ • Error Display │
│ • Remote Console │                │ • Design Mode     │                    │ • Design Tools   │
└─────────────────┘                 └──────────────────┘                    └─────────────────┘
```

### 功能模块

1. **错误页面增强模块**：
   - 拦截 Vite 错误中间件
   - 解析和美化错误信息
   - 注入自定义 HTML/CSS

2. **远程控制台模块**：
   - 启动 WebSocket 服务器
   - 拦截 process.stdout/stderr
   - 提供网页控制台界面

3. **白屏监控模块**：
   - 定时分析页面 DOM
   - 多维度指标评估
   - 实时警报通知

4. **Design 模式模块**：
   - 元素选择和编辑
   - 样式实时修改
   - 操作历史记录

### 数据流
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
├── src/                          # 源代码
│   ├── index.ts                  # 插件入口点
│   ├── types.ts                  # TypeScript 类型定义
│   ├── client-script.ts          # 客户端监控脚本
│   ├── log-interceptor.ts        # 日志拦截器
│   ├── vite-error-interceptor.ts # Vite 错误页面增强
│   ├── terminal-interceptor.ts   # 终端输出拦截器
│   ├── remote-console.ts         # 远程控制台服务器
│   ├── white-screen-monitor.ts   # 白屏监控器
│   └── design-runtime.ts         # Design 模式运行时
├── playground/                   # 示例项目
│   ├── src/
│   │   ├── App.tsx              # React 应用示例
│   │   ├── error-test.tsx       # 错误测试组件
│   │   └── main.tsx             # 应用入口
│   ├── vite.config.ts           # 插件配置示例
│   ├── package.json             # 示例项目依赖
│   └── pnpm-lock.yaml           # 锁定依赖版本
├── docs/                         # 文档目录
│   ├── README.md                # 基础文档
│   ├── USAGE.md                 # 详细使用指南
│   └── IMPLEMENTATION_SUMMARY.md # 实现总结
├── package.json                  # 项目依赖配置
├── tsconfig.json                 # TypeScript 配置
├── pnpm-lock.yaml               # 锁定依赖版本
└── .gitignore                   # Git 忽略文件
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
cd playground
pnpm install
pnpm dev
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## License

MIT
