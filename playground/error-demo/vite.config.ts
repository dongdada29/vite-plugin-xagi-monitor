import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import appDevMonitor from '../../src/index';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    appDevMonitor({
      // 错误监控 - 主要演示功能
      errorMonitor: true,

      // 错误页面增强 - 核心演示功能
      errorPageCustomization: {
        enabled: true,
        aiFriendly: true,
        showStack: true,
        showCodeSnippet: true,
        maxStackLines: 15,
        debug: true,
        customStyles: {
          backgroundColor: '#1a1a1a',
          textColor: '#ffffff',
          accentColor: '#ff6b6b'
        }
      },

      // 其他功能关闭，专注错误监控
      whiteScreenMonitor: { enabled: false },
      remoteConsole: { enabled: false },
      designMode: { enabled: false },

      debug: true
    })
  ]
});