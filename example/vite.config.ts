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
      debug: true
    })
  ]
});

