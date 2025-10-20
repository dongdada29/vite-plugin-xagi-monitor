import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import appDevMonitor from '../src/index';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    appDevMonitor({
      // 启用错误监听
      errorMonitor: true,
      // 启用日志转发
      logForwarding: true,
      // 启用 HMR 监控
      hmrForwarding: true,
      // 调试模式（开发时可以打开）
      debug: true,

      // 新增功能配置
      // 错误页面增强 - 暂时禁用，避免编译错误
      errorPageCustomization: {
        enabled: false,
        aiFriendly: true,
        showStack: true,
        showCodeSnippet: true,
        maxStackLines: 8,
        debug: true
      },

      // 白屏监控
      whiteScreenMonitor: {
        enabled: true,
        screenshot: false, // 暂时关闭截图功能
        thresholds: {
          contentLength: 50,
          elementCount: 5,
          loadTime: 3000
        },
        checkInterval: 2000
      },

      // 远程控制台
      remoteConsole: {
        enabled: true,
        port: 3001,
        persistLogs: true,
        maxLogs: 2000,
        logLevels: ['info', 'warn', 'error', 'debug'],
        debug: true
      },

      // Design 模式
      designMode: {
        enabled: true,
        tailwindIntegration: false,
        autoSync: true,
        editableSelectors: ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'button', 'section'],
        showElementBorders: true,
        debug: true
      }
    })
  ]
});

