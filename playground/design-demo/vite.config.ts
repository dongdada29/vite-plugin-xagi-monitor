import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import appDevMonitor from '../../src/index';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    appDevMonitor({
      // Design 模式 - 主要演示功能
      designMode: {
        enabled: true,
        tailwindIntegration: true,
        autoSync: true,
        editableSelectors: ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'button', 'section', 'article', 'header', 'footer'],
        showElementBorders: true,
        showElementInfo: true,
        enableDragResize: true,
        enableColorPicker: true,
        debug: true
      },

      // 基础错误监控（辅助功能）
      errorMonitor: true,

      // 其他功能关闭，专注 Design 模式
      errorPageCustomization: { enabled: false },
      whiteScreenMonitor: { enabled: false },
      remoteConsole: { enabled: false },

      debug: true
    })
  ]
});