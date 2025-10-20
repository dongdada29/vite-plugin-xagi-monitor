# 远程控制台演示 (Remote Console Demo)

这是 XAgi Monitor 插件远程控制台功能的专用演示项目。

## 🎯 功能演示

### 远程日志转发
- **实时转发**: 将浏览器控制台日志实时转发到远程服务器
- **WebSocket 连接**: 建立稳定的双向通信通道
- **多客户端支持**: 支持多个浏览器同时连接
- **日志持久化**: 在服务器端保存历史日志记录

### 日志管理功能
- **日志过滤**: 按级别、关键词过滤日志
- **历史记录**: 查看和搜索历史日志
- **实时统计**: 显示日志数量和连接状态
- **批量处理**: 支持大量日志的高效传输

## 🚀 快速开始

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm dev
```

### 访问演示页面
打开浏览器访问 `http://localhost:5173`

### 连接远程控制台
使用 WebSocket 客户端连接到 `ws://localhost:3001`

## 🧪 测试场景

### 1. 基础日志测试
- `console.log()` - 普通日志
- `console.info()` - 信息日志
- `console.warn()` - 警告日志
- `console.error()` - 错误日志
- `console.debug()` - 调试日志

### 2. 复杂数据类型
- 对象和数组的结构化显示
- `console.table()` 表格化展示
- DOM 元素和函数对象

### 3. 性能监控
- `console.time()` / `console.timeEnd()` 性能计时
- 内存使用情况监控
- 网络请求状态跟踪

### 4. 实时数据流
- 定时器产生的实时日志
- 批量数据的高效传输
- 长时间运行的日志监控

### 5. 错误处理
- 异常捕获和错误堆栈
- 网络请求失败处理
- 自定义错误类型

## ⚙️ 配置说明

项目专门针对远程控制台功能进行配置：

```typescript
// vite.config.ts
appDevMonitor({
  remoteConsole: {
    enabled: true,
    port: 3001,              // WebSocket 服务器端口
    persistLogs: true,        // 启用日志持久化
    maxLogs: 2000,           // 最大日志数量
    logLevels: ['log', 'info', 'warn', 'error', 'debug'],
    debug: true
  },
  errorMonitor: true,        // 基础错误监控
  // 其他功能已关闭，专注远程控制台
  errorPageCustomization: { enabled: false },
  whiteScreenMonitor: { enabled: false },
  designMode: { enabled: false }
})
```

## 📊 预期效果

### 浏览器端
- 所有控制台输出被实时捕获
- WebSocket 连接状态实时显示
- 日志计数和统计信息

### 远程服务器端
- 接收来自浏览器的日志流
- 支持多客户端连接管理
- 提供日志查询和过滤功能

### 开发体验
- 无需打开浏览器开发者工具
- 集中式日志查看和管理
- 支持远程调试和监控

## 🔍 故障排除

如果远程控制台未生效：

1. **检查端口占用**: 确认 3001 端口未被占用
2. **WebSocket 连接**: 使用 WebSocket 客户端测试连接
3. **浏览器控制台**: 检查是否有插件相关错误
4. **防火墙设置**: 确认本地防火墙允许 WebSocket 连接

## 🛠️ WebSocket 客户端示例

可以使用以下方式连接和查看日志：

### JavaScript 客户端
```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  console.log('已连接到远程控制台服务器');
};

ws.onmessage = (event) => {
  const logData = JSON.parse(event.data);
  console.log('远程日志:', logData);
};
```

### 第三方工具
- **Postman**: 支持 WebSocket 连接测试
- **WebSocket King**: 浏览器扩展工具
- **wscat**: 命令行 WebSocket 客户端

### 命令行测试
```bash
# 安装 wscat
npm install -g wscat

# 连接服务器
wscat -c ws://localhost:3001
```