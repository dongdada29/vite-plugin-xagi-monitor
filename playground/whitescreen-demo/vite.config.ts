import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import appDevMonitor from '../../src/index';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    appDevMonitor({
      // 白屏监控 - 主要演示功能
      whiteScreenMonitor: {
        enabled: true,
        screenshot: true,
        thresholds: {
          contentLength: 50,
          elementCount: 5,
          loadTime: 3000,
          containerRatio: 0.1
        },
        checkInterval: 2000,
        alertThreshold: 3,
        debug: true
      },

      // 基础错误监控（辅助功能）
      errorMonitor: true,

      // 其他功能关闭，专注白屏监控
      errorPageCustomization: { enabled: false },
      remoteConsole: { enabled: false },
      designMode: { enabled: false },

      debug: true
    })
  ]
});