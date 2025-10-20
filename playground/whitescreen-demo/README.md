# 白屏监控演示 (White Screen Monitor Demo)

这是 XAgi Monitor 插件白屏监控功能的专用演示项目。

## 🎯 功能演示

### 智能白屏检测
- **多维度分析**: 内容长度、元素数量、容器占比、加载时间
- **实时监控**: 定时检查页面状态，及时发现白屏问题
- **智能判断**: 综合多个指标进行白屏判断，减少误报
- **阈值配置**: 可自定义检测阈值，适应不同场景需求

### 白屏场景覆盖
- **完全白屏**: 页面完全无内容
- **空内容页面**: 只有少量或无意义内容
- **资源加载失败**: CSS/JS 资源加载失败
- **布局错乱**: 元素位置异常导致视觉白屏
- **长时间加载**: 加载时间过长导致的白屏

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

## 🧪 测试场景

### 1. 严重白屏场景
- **完全白屏**: 移除所有页面内容
- **空内容页面**: 只显示空白或少量文字
- **JavaScript 错误**: 脚本执行错误导致页面无法渲染

### 2. 资源加载问题
- **CSS 加载失败**: 样式文件加载失败，页面失去样式
- **资源加载失败**: 图片、脚本等资源加载失败
- **长时间加载**: 模拟网络慢或服务器响应慢

### 3. 布局显示问题
- **布局错乱**: 元素定位异常，内容不可见
- **元素隐藏**: CSS 或脚本导致元素不可见
- **容器占比异常**: 主要内容区域过小

## ⚙️ 配置说明

项目专门针对白屏监控功能进行配置：

```typescript
// vite.config.ts
appDevMonitor({
  whiteScreenMonitor: {
    enabled: true,
    screenshot: true,                    // 启用截图功能
    thresholds: {
      contentLength: 50,                 // 内容长度阈值
      elementCount: 5,                   // 元素数量阈值
      loadTime: 3000,                    // 加载时间阈值(ms)
      containerRatio: 0.1                // 容器占比阈值
    },
    checkInterval: 2000,                 // 检查间隔(ms)
    alertThreshold: 3,                   // 警报阈值(连续检测次数)
    debug: true
  },
  errorMonitor: true,                    // 基础错误监控
  // 其他功能已关闭，专注白屏监控
  errorPageCustomization: { enabled: false },
  remoteConsole: { enabled: false },
  designMode: { enabled: false }
})
```

## 📊 监控指标

### 核心指标
- **内容长度**: 页面文本内容字符数
- **元素数量**: DOM 元素总数
- **容器占比**: 主要内容区域占页面比例
- **加载时间**: 页面加载完成时间

### 检测算法
```typescript
// 简化的检测逻辑
const isWhiteScreen =
  contentLength < thresholds.contentLength ||
  elementCount < thresholds.elementCount ||
  containerRatio < thresholds.containerRatio ||
  loadTime > thresholds.loadTime;
```

### 监控状态
- **正常 (active)**: 所有指标正常
- **警告 (warning)**: 部分指标接近阈值
- **错误 (error)**: 检测到白屏状态

## 🔍 预期效果

### 检测到白屏时
1. **立即警报**: 控制台和页面显示警告信息
2. **状态更新**: 实时更新监控状态和指标
3. **截图保存**: 自动保存白屏时的页面截图
4. **恢复建议**: 提供页面恢复操作建议

### 开发体验
- **实时反馈**: 立即发现白屏问题
- **详细信息**: 提供具体的检测指标和分析
- **操作指导**: 给出问题解决的具体建议

## 🛠️ 高级配置

### 自定义阈值
```typescript
whiteScreenMonitor: {
  thresholds: {
    contentLength: 100,     // 更严格的内容要求
    elementCount: 10,       // 更严格的元素要求
    loadTime: 2000,         // 更严格的加载时间要求
    containerRatio: 0.2     // 更严格的容器占比要求
  }
}
```

### 检测频率调整
```typescript
whiteScreenMonitor: {
  checkInterval: 1000,      // 更频繁的检查(1秒)
  alertThreshold: 2         // 更敏感的警报(2次检测)
}
```

## 📈 性能考虑

### 检测频率
- 默认每2秒检查一次，平衡监控效果和性能开销
- 可根据需要调整检查间隔

### 资源消耗
- 轻量级的DOM查询和计算
- 不会影响页面正常渲染性能
- 异步处理，不阻塞主线程

## 🔧 故障排除

如果白屏监控未生效：

1. **检查配置**: 确认 `whiteScreenMonitor.enabled` 为 `true`
2. **查看控制台**: 检查是否有插件相关错误
3. **验证阈值**: 调整检测阈值以适应页面内容
4. **测试场景**: 使用演示按钮验证各种白屏场景

## 📝 最佳实践

1. **合理设置阈值**: 根据实际页面内容调整检测阈值
2. **关注加载时间**: 特别注意首屏加载时间监控
3. **结合错误监控**: 白屏通常与错误相关，结合使用效果更佳
4. **定期检查**: 在生产环境中持续监控白屏问题