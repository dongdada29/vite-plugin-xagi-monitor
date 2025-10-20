# 快速开始

## 5 分钟快速集成

### Step 1: 安装插件 (30 秒)

```bash
cd your-vite-project
npm install vite-plugin-xagi-monitor --save-dev
```

### Step 2: 配置 Vite (1 分钟)

打开 `vite.config.ts`，添加插件：

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import appDevMonitor from 'vite-plugin-xagi-monitor';

export default defineConfig({
  plugins: [
    react(),
    appDevMonitor() // 👈 就这一行！
  ]
});
```

### Step 3: 启动开发服务器 (10 秒)

```bash
npm run dev
```

### Step 4: 查看效果 (1 分钟)

打开浏览器控制台，你会看到：

```
[AppDev Monitor] 监控已启动
```

现在：
1. **修改代码并保存** → 查看 HMR 更新提示 ⚡
2. **触发错误** → 查看错误捕获 🐛
3. **查看 Vite 日志** → 实时转发到客户端 📝

### Step 5: Preview 组件集成 (2 分钟)

在你的 Preview 组件中，添加消息监听：

```typescript
import { useEffect, useState } from 'react';

const Preview = () => {
  const [logs, setLogs] = useState([]);
  const [hmrStatus, setHmrStatus] = useState('');

  useEffect(() => {
    const handleMessage = (e) => {
      // 日志
      if (e.data?.type === 'APPDEV_LOG') {
        setLogs(prev => [...prev, e.data.data]);
      }
      
      // HMR
      if (e.data?.type === 'APPDEV_HMR') {
        setHmrStatus(e.data.data.path);
        setTimeout(() => setHmrStatus(''), 3000);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div>
      {hmrStatus && <div>🔥 {hmrStatus}</div>}
      <button>日志 ({logs.length})</button>
      <iframe src={devServerUrl} />
    </div>
  );
};
```

## 完成！🎉

现在你已经成功集成了 `vite-plugin-xagi-appdev-monitor`。

### 你得到了什么？

- ✅ 自动错误捕获（资源、Promise、Fetch）
- ✅ 实时 Vite 日志转发
- ✅ HMR 更新状态监控
- ✅ 与 Preview 组件无缝集成

### 下一步

- 📖 阅读 [详细使用指南](./USAGE.md)
- 🔧 查看 [配置选项](#配置选项)
- 💡 运行 [示例项目](#运行示例)

## 配置选项

```typescript
appDevMonitor({
  errorMonitor: true,    // 启用错误监听
  logForwarding: true,   // 启用日志转发
  hmrForwarding: true,   // 启用 HMR 监控
  debug: false           // 调试模式
})
```

## 运行示例

```bash
cd node_modules/vite-plugin-xagi-monitor/playground
npm install
npm run dev
```

打开浏览器访问 `http://localhost:5173`，尝试：
1. 点击"测试 Promise 错误"
2. 点击"测试 Fetch 错误"
3. 修改 `src/App.tsx` 并保存
4. 查看浏览器控制台

## 常见问题

### Q: 没有看到日志？

A: 确保：
1. ✅ 插件已添加到 `vite.config.ts`
2. ✅ 开发服务器已重启
3. ✅ 浏览器控制台已打开

### Q: HMR 状态不显示？

A: 确保：
1. ✅ `hmrForwarding: true`
2. ✅ Preview 组件已添加消息监听
3. ✅ iframe 和父窗口可以通信（非跨域）

### Q: 如何在生产环境禁用？

A: 插件默认只在开发环境生效，生产构建时会自动排除。

## 获取帮助

- 📖 [完整文档](./README.md)
- 💬 [GitHub Issues](https://github.com/your-org/vite-plugin-xagi-monitor/issues)
- 📧 联系我们: support@xagi.com

---

**享受开发！** 🚀

