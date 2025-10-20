import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import appDevMonitor from '../../src/index';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    appDevMonitor({
      // 远程控制台 - 主要演示功能
      remoteConsole: {
        enabled: true,
        port: 3001,
        persistLogs: true,
        maxLogs: 2000,
        logLevels: ['log', 'info', 'warn', 'error', 'debug'],
        debug: true
      },

      // 基础错误监控（辅助功能）
      errorMonitor: true,

      // 其他功能关闭，专注远程控制台
      errorPageCustomization: { enabled: false },
      whiteScreenMonitor: { enabled: false },
      designMode: { enabled: false },

      debug: true
    })
  ]
});