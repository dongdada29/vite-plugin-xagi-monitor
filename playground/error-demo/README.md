# 错误监控演示 (Error Monitor Demo)

这是 XAgi Monitor 插件错误监控功能的专用演示项目。

## 🎯 功能演示

### 错误页面增强
- **AI 友好的错误信息**: 将技术错误转换为易懂的描述
- **代码片段展示**: 自动提取并高亮显示错误相关的代码
- **智能建议**: 基于错误类型提供解决方案建议
- **美观的错误页面**: 替代浏览器默认的错误页面

### 错误类型覆盖
- **同步错误**: `throw new Error()`
- **Promise 错误**: `Promise.reject()`
- **异步函数错误**: `async/await` 错误
- **类型错误**: `TypeError`
- **引用错误**: `ReferenceError`
- **资源加载错误**: 脚本、图片加载失败
- **网络请求错误**: API 请求失败
- **自定义错误**: 用户定义的错误类型
- **语法错误**: 代码语法问题
- **栈溢出错误**: 递归调用过深

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

## 🧪 测试步骤

1. **基础错误测试**
   - 点击各错误按钮触发不同类型的错误
   - 观察增强的错误页面显示
   - 查看代码片段和建议信息

2. **开发者工具检查**
   - 打开浏览器开发者工具
   - 查看 Console 面板的错误日志
   - 检查 Network 面板的请求状态

3. **错误恢复测试**
   - 在错误页面点击刷新或返回
   - 验证页面恢复功能

## ⚙️ 配置说明

项目专门针对错误监控功能进行配置：

```typescript
// vite.config.ts
appDevMonitor({
  errorMonitor: true,
  errorPageCustomization: {
    enabled: true,
    aiFriendly: true,
    showStack: true,
    showCodeSnippet: true,
    maxStackLines: 15,
    customStyles: {
      backgroundColor: '#1a1a1a',
      textColor: '#ffffff',
      accentColor: '#ff6b6b'
    }
  },
  // 其他功能已关闭，专注错误监控
  whiteScreenMonitor: { enabled: false },
  remoteConsole: { enabled: false },
  designMode: { enabled: false }
})
```

## 📊 预期效果

- **错误发生时**: 显示美观的错误页面而非浏览器默认页面
- **信息展示**: 包含错误描述、代码片段、修复建议
- **用户体验**: 保持界面一致性，提供更好的错误处理体验
- **开发辅助**: 帮助开发者快速定位和解决问题

## 🔍 故障排除

如果错误页面增强未生效：

1. 确认插件配置正确
2. 检查浏览器控制台是否有插件错误
3. 尝试刷新页面重新加载插件
4. 确认 `errorPageCustomization.enabled` 为 `true`