# Design 模式演示 (Design Mode Demo)

这是 XAgi Monitor 插件 Design 模式功能的专用演示项目。

## 🎯 功能演示

### 可视化编辑
- **元素选择**: 点击页面任何元素进行选择和高亮
- **实时编辑**: 直接修改元素的样式、内容和属性
- **拖拽调整**: 支持拖拽调整元素大小和位置
- **颜色选择器**: 内置颜色选择工具，支持渐变色
- **字体编辑**: 实时调整字体、大小、行高等属性

### Tailwind CSS 集成
- **类名编辑**: 实时编辑 Tailwind CSS 类名
- **智能提示**: 自动补全和语法高亮
- **实时预览**: 类名修改立即生效
- **响应式类**: 支持响应式断点类名编辑

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

### 激活 Design 模式
- 等待插件自动激活
- 或使用快捷键 `Ctrl+D` 手动激活

## 🧪 演示组件

### 基础组件
- **按钮**: 多种样式和状态的按钮组件
- **文本**: 标题、段落、引用等文本元素
- **表单**: 输入框、下拉框、文本域等表单元素
- **卡片**: 信息卡片和图片占位符
- **列表**: 有序列表和无序列表

### 高级功能
- **Tailwind 样式**: 使用 Tailwind CSS 类名的组件
- **响应式网格**: 自适应的网格布局
- **渐变效果**: 多种渐变背景和文字效果

## ⚙️ 配置说明

项目专门针对 Design 模式功能进行配置：

```typescript
// vite.config.ts
appDevMonitor({
  designMode: {
    enabled: true,
    tailwindIntegration: true,        // 启用 Tailwind 集成
    autoSync: true,                   // 自动同步修改
    editableSelectors: [              // 可编辑的元素选择器
      'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'span', 'button', 'section', 'article', 'header', 'footer'
    ],
    showElementBorders: true,         // 显示元素边框
    showElementInfo: true,            // 显示元素信息
    enableDragResize: true,           // 启用拖拽调整
    enableColorPicker: true,          // 启用颜色选择器
    debug: true
  },
  errorMonitor: true,                 // 基础错误监控
  // 其他功能已关闭，专注 Design 模式
  errorPageCustomization: { enabled: false },
  whiteScreenMonitor: { enabled: false },
  remoteConsole: { enabled: false }
})
```

## 🎨 使用方法

### 激活和选择
1. **激活模式**: Design 模式会自动激活，状态显示在页面顶部
2. **选择元素**: 直接点击页面上的任何元素
3. **查看信息**: 选中的元素会显示边框和相关信息

### 编辑样式
1. **样式面板**: 选中元素后显示样式编辑面板
2. **实时修改**: 修改任何 CSS 属性都会立即生效
3. **颜色编辑**: 点击颜色输入框打开颜色选择器
4. **数值调整**: 使用滑块或输入框调整数值

### Tailwind 编辑
1. **类名编辑**: 在专门的 Tailwind 面板中编辑类名
2. **智能提示**: 输入时显示相关的类名建议
3. **实时预览**: 类名修改立即反映在页面上

### 拖拽和调整
1. **调整大小**: 拖拽元素边缘调整大小
2. **移动位置**: 拖拽元素中心移动位置
3. **约束保持**: 按住 Shift 键保持比例

## ⌨️ 快捷键

- `Ctrl+D`: 激活/取消 Design 模式
- `Delete`: 删除选中元素
- `Ctrl+C`: 复制选中元素样式
- `Ctrl+V`: 粘贴样式到选中元素
- `Ctrl+Z`: 撤销上一步操作
- `Ctrl+Y`: 重做操作
- `Esc`: 取消选择
- `Tab`: 切换到下一个可编辑元素

## 🔧 高级功能

### 自定义可编辑元素
```typescript
editableSelectors: [
  'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'span', 'button', 'section', 'article', 'header', 'footer',
  '.custom-class', '[data-editable]'
]
```

### 样式同步配置
```typescript
autoSync: {
  enabled: true,
  debounce: 300,      // 防抖延迟(ms)
  syncToFile: false,  // 是否同步到文件
  maxHistory: 50      // 最大历史记录数
}
```

### 颜色选择器配置
```typescript
colorPicker: {
  enabled: true,
  presets: [          // 预设颜色
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
    '#8b5cf6', '#ec4899', '#6b7280', '#000000'
  ],
  enableGradient: true,  // 启用渐变色
  enableOpacity: true    // 启用透明度
}
```

## 📱 响应式支持

Design 模式支持响应式设计编辑：

### 断点预览
- 移动端: 320px - 768px
- 平板: 768px - 1024px
- 桌面: 1024px+

### Tailwind 响应式类
支持所有 Tailwind 响应式前缀：
- `sm:` - 小屏幕
- `md:` - 中等屏幕
- `lg:` - 大屏幕
- `xl:` - 超大屏幕
- `2xl:` - 超超大屏幕

## 🚀 性能优化

### 编辑性能
- **防抖处理**: 样式修改使用防抖减少重绘
- **虚拟化**: 大量元素时的虚拟渲染
- **缓存机制**: 样式计算结果缓存

### 内存管理
- **历史记录限制**: 限制撤销/重做历史数量
- **垃圾回收**: 及时清理未使用的编辑器实例
- **事件优化**: 合理的事件监听器管理

## 🔍 故障排除

如果 Design 模式未生效：

1. **检查配置**: 确认 `designMode.enabled` 为 `true`
2. **查看控制台**: 检查是否有插件相关错误
3. **重新激活**: 尝试使用快捷键 `Ctrl+D` 重新激活
4. **检查元素**: 确认目标元素在 `editableSelectors` 列表中
5. **样式冲突**: 检查是否有其他 CSS 影响编辑功能

## 📝 最佳实践

1. **合理配置**: 根据项目需求配置可编辑元素
2. **性能考虑**: 大型页面考虑限制编辑范围
3. **用户体验**: 提供清晰的操作提示和反馈
4. **样式管理**: 定期清理无用的样式修改
5. **团队协作**: 建立样式编辑的规范和流程

## 🎨 设计原则

- **直观操作**: 符合用户直觉的交互设计
- **实时反馈**: 所有操作都有即时的视觉反馈
- **非侵入性**: 不影响页面的正常功能和样式
- **可恢复性**: 支持撤销和重做操作
- **响应式**: 适配不同屏幕尺寸和设备