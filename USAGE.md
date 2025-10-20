# 使用指南

## 🚀 快速开始

### 1. 安装插件

```bash
# 在你的 Vite 项目中安装
cd your-vite-project
npm install vite-plugin-xagi-monitor --save-dev
# 或
pnpm add vite-plugin-xagi-monitor -D
```

### 2. 基础配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import appDevMonitor from 'vite-plugin-xagi-monitor';

export default defineConfig({
  plugins: [
    react(),
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

## 📡 功能详解

### 1. 错误页面增强

当 Vite 开发服务器遇到错误时，插件会自动增强错误页面显示：

**功能特性：**
- 🎨 美化错误页面布局
- 🤖 AI 友好的结构化错误信息
- 📝 显示相关代码片段
- 💡 提供修复建议
- 🔍 高亮错误位置

**配置选项：**
```typescript
errorPageCustomization: {
  enabled: true,           // 启用功能
  aiFriendly: true,        // AI 友好格式，便于 LLM 分析
  showStack: true,         // 显示完整错误堆栈
  showCodeSnippet: true,   // 显示错误相关代码
  maxStackLines: 8,        // 最大堆栈显示行数
  debug: false             // 调试模式
}
```

### 2. 远程控制台

提供完整的终端日志捕获和远程浏览器访问功能：

**功能特性：**
- 📡 实时捕获所有终端输出
- 🌐 通过浏览器远程访问控制台
- 💾 持久化日志历史
- 🔍 多级别日志过滤
- 📊 日志统计和分析

**访问方式：**
1. 启用远程控制台功能
2. 访问 `http://localhost:3001`
3. 在任何设备上查看实时日志

**配置选项：**
```typescript
remoteConsole: {
  enabled: true,           // 启用远程控制台
  port: 3001,              // 服务端口
  persistLogs: true,       // 持久化日志到内存
  maxLogs: 2000,           // 最大保存日志数量
  logLevels: ['info', 'warn', 'error', 'debug'], // 支持的日志级别
  debug: false             // 调试模式
}
```

### 3. 白屏监控

智能检测页面空白状态，及时发现问题：

**功能特性：**
- 🎯 多维度页面状态分析
- ⚡ 实时监控和警报
- 📊 详细的状态报告
- 🔔 自动通知和恢复建议

**检测指标：**
- 文本内容长度
- DOM 元素数量
- 页面高度
- 可见内容检测
- 资源加载状态
- 加载时间分析

**配置选项：**
```typescript
whiteScreenMonitor: {
  enabled: true,           // 启用白屏监控
  screenshot: false,       // 截图功能（实验性）
  thresholds: {
    contentLength: 50,     // 最小文本长度阈值
    elementCount: 5,       // 最小元素数量阈值
    loadTime: 3000         // 最大加载时间阈值（毫秒）
  },
  checkInterval: 2000,     // 检查间隔（毫秒）
  debug: false             // 调试模式
}
```

### 4. Design 模式

可视化页面编辑和调试工具：

**功能特性：**
- 🎨 点击选择页面元素
- ✏️ 直接编辑内容和样式
- 🎯 实时预览修改效果
- 📋 复制、删除、移动元素
- 🎭 Tailwind CSS 集成支持

**使用方法：**
1. 启用 Design 模式
2. 在页面上点击任意元素进行选择
3. 使用浮动面板修改属性
4. 双击元素进行内容编辑
5. 使用快捷键 `Ctrl+Shift+D` 切换模式

**配置选项：**
```typescript
designMode: {
  enabled: true,           // 启用 Design 模式
  tailwindIntegration: false, // Tailwind CSS 类名编辑
  autoSync: true,          // 自动同步修改
  editableSelectors: ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'button', 'section'],
  showElementBorders: true, // 显示可编辑元素边框
  debug: false             // 调试模式
}
```

## 📨 消息通信

插件通过 `postMessage` 向父窗口发送多种类型的消息：

### 基础消息类型

#### APPDEV_LOG (日志消息)
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

#### APPDEV_HMR (热更新消息)
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

#### APPDEV_ERROR (错误消息)
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

### 增强消息类型

#### APPDEV_WHITE_SCREEN (白屏监控)
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
      bodyChildren: number;
      rootChildren: number;
      hasInteractiveElements: boolean;
      hasImages: boolean;
      hasBackground: boolean;
      hasContentInRoot: boolean;
    }
  }
}
```

#### APPDEV_DESIGN_EDIT (Design 模式编辑)
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
      property?: string;
    }
  }
}
```

## 🛠️ Preview 组件集成

### 完整集成示例

```typescript
import React, { useState, useEffect } from 'react';

const PreviewPanel = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [hmrStatus, setHmrStatus] = useState('');
  const [errors, setErrors] = useState<any[]>([]);
  const [whiteScreenEvents, setWhiteScreenEvents] = useState<any[]>([]);
  const [designEdits, setDesignEdits] = useState<any[]>([]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      switch (e.data?.type) {
        // 基础日志
        case 'APPDEV_LOG':
          setLogs(prev => [...prev, e.data.data].slice(-100));
          break;

        // HMR 更新
        case 'APPDEV_HMR':
          setHmrStatus(e.data.data.path);
          setTimeout(() => setHmrStatus(''), 3000);
          break;

        // 错误报告
        case 'APPDEV_ERROR':
          setErrors(prev => [...prev, e.data.data].slice(-50));
          break;

        // 白屏监控
        case 'APPDEV_WHITE_SCREEN':
          if (e.data.data.isWhiteScreen) {
            setWhiteScreenEvents(prev => [...prev, e.data.data].slice(-20)]);
          }
          break;

        // Design 模式编辑
        case 'APPDEV_DESIGN_EDIT':
          setDesignEdits(prev => [...prev, e.data.data].slice(-100)]);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="preview-panel">
      {/* HMR 状态指示器 */}
      {hmrStatus && (
        <div className="hmr-status">
          🔥 热更新: {hmrStatus}
        </div>
      )}

      {/* 错误警告 */}
      {errors.length > 0 && (
        <div className="error-warning">
          ⚠️ 检测到 {errors.length} 个错误
        </div>
      )}

      {/* 白屏警告 */}
      {whiteScreenEvents.length > 0 && (
        <div className="white-screen-warning">
          🚨 检测到白屏问题!
        </div>
      )}

      {/* 主内容区域 */}
      <div className="content-area">
        <iframe
          src={devServerUrl}
          className="preview-iframe"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>

      {/* 侧边栏面板 */}
      <div className="sidebar">
        <Tabs>
          <Tab label="日志">
            <LogViewer logs={logs} />
          </Tab>
          <Tab label="错误">
            <ErrorViewer errors={errors} />
          </Tab>
          <Tab label="白屏监控">
            <WhiteScreenViewer events={whiteScreenEvents} />
          </Tab>
          <Tab label="Design 编辑">
            <DesignViewer edits={designEdits} />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};
```

## 🧪 测试示例

### 运行示例项目

```bash
# 进入示例目录
cd playground

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 功能测试清单

#### 1. 基础功能测试
- [ ] 修改任意文件，观察 HMR 状态更新
- [ ] 点击"测试 Promise 错误"按钮
- [ ] 点击"测试 Fetch 错误"按钮
- [ ] 查看控制台日志转发

#### 2. 错误页面增强测试
- [ ] 故意修改代码引入语法错误
- [ ] 观察错误页面是否美化显示
- [ ] 检查代码片段是否正确显示
- [ ] 验证 AI 友好格式

#### 3. 远程控制台测试
- [ ] 访问 `http://localhost:3001`
- [ ] 在开发项目中执行各种操作
- [ ] 观察远程控制台实时日志
- [ ] 测试日志过滤功能

#### 4. 白屏监控测试
- [ ] 清空页面内容触发白屏
- [ ] 观察白屏警报是否显示
- [ ] 检查监控指标是否准确
- [ ] 验证恢复建议

#### 5. Design 模式测试
- [ ] 启用 Design 模式
- [ ] 点击选择各种元素
- [ ] 测试内容编辑功能
- [ ] 验证样式修改
- [ ] 测试元素操作功能

## 🔧 工作原理

### 架构设计

```
┌─────────────────┐    WebSocket     ┌──────────────────┐    postMessage    ┌─────────────────┐
│   Vite Server   │ ◄─────────────► │   Client Script  │ ◄─────────────────► │  Preview Panel   │
│                 │                 │                  │                    │                 │
│ • Log Interceptor │                │ • Error Monitor  │                    │ • Log Display   │
│ • HMR Monitor    │                │ • White Screen   │                    │ • Error Display │
│ • Error Page     │                │ • Design Mode     │                    │ • White Screen  │
│ • Remote Console │                │ • Communication  │                    │ • Design Tools   │
└─────────────────┘                 └──────────────────┘                    └─────────────────┘
```

### 数据流程

1. **Vite 插件层**：
   - 拦截 Vite 的 logger、HMR 事件
   - 启动各种监控服务（远程控制台、错误页面增强等）
   - 通过 HMR WebSocket 与客户端通信

2. **客户端脚本层**：
   - 接收服务端消息
   - 执行页面监控（错误、白屏、Design 模式）
   - 通过 postMessage 与 Preview 组件通信

3. **Preview 组件层**：
   - 监听各种消息类型
   - 管理状态和 UI 展示
   - 提供完整的开发监控界面

## ❓ 常见问题

### Q: 插件影响生产环境性能吗？

A: 不会。插件只在开发模式 (`--dev`) 下运行，生产构建时会自动禁用所有功能。

### Q: 如何只启用特定功能？

A: 只需在配置中启用需要的功能：

```typescript
appDevMonitor({
  errorMonitor: true,        // 只启用基础监控
  logForwarding: false,      // 关闭日志转发
  hmrForwarding: false,      // 关闭 HMR 监控
  remoteConsole: {           // 只启用远程控制台
    enabled: true,
    port: 3001
  },
  whiteScreenMonitor: {      // 关闭白屏监控
    enabled: false
  },
  designMode: {              // 关闭 Design 模式
    enabled: false
  }
})
```

### Q: 远程控制台端口被占用怎么办？

A: 修改端口号：

```typescript
remoteConsole: {
  enabled: true,
  port: 3002  // 改为其他端口
}
```

### Q: 白屏监控误报怎么办？

A: 调整阈值参数：

```typescript
whiteScreenMonitor: {
  enabled: true,
  thresholds: {
    contentLength: 30,    // 降低文本长度要求
    elementCount: 3,      // 降低元素数量要求
    loadTime: 5000        // 增加加载时间容忍度
  },
  checkInterval: 3000     // 延长检查间隔
}
```

### Q: Design 模式与现有框架冲突？

A: 可以限制可编辑的元素类型：

```typescript
designMode: {
  enabled: true,
  editableSelectors: ['p', 'span', 'div'],  // 只允许编辑特定元素
  showElementBorders: false                 // 关闭边框显示
}
```

### Q: 如何调试插件本身？

A: 启用调试模式：

```typescript
appDevMonitor({
  debug: true,  // 启用全局调试

  errorPageCustomization: {
    debug: true  // 启用特定功能调试
  },

  // ... 其他配置
})
```

## 📊 性能优化建议

### 1. 日志管理
- 日志已自动限制为最近 100 条
- 远程控制台默认保存 2000 条
- 可通过 `maxLogs` 调整

### 2. 白屏监控优化
- 合理设置检查间隔（建议 2-5 秒）
- 调整阈值以减少误报
- 在性能敏感页面可关闭监控

### 3. Design 模式优化
- 限制可编辑元素选择器
- 关闭不必要的样式功能
- 在复杂页面谨慎使用

### 4. 生产环境
- 插件自动在生产环境禁用
- 无需额外配置

## 🔗 相关链接

- [GitHub 仓库](https://github.com/dongdada29/vite-plugin-xagi-monitor)
- [问题反馈](https://github.com/dongdada29/vite-plugin-xagi-monitor/issues)
- [更新日志](CHANGELOG.md)
- [API 文档](docs/API.md)
- [贡献指南](CONTRIBUTING.md)