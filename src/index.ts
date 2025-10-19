import type { Plugin } from 'vite';
import { CLIENT_SCRIPT } from './client-script';
import { setupLogInterceptor, setupHMRMonitor } from './log-interceptor';
import type { PluginOptions } from './types';

/**
 * XAgi AppDev Monitor Plugin
 * 
 * 功能：
 * 1. 自动注入错误监听脚本
 * 2. 转发 Vite 控制台日志
 * 3. 转发 HMR 更新状态
 * 4. 支持与 Preview 组件通信
 * 
 * @param options 插件配置选项
 */
export function appDevMonitor(options: PluginOptions = {}): Plugin {
  const {
    errorMonitor = true,
    logForwarding = true,
    hmrForwarding = true,
    debug = false
  } = options;
  
  return {
    name: 'vite-plugin-xagi-appdev-monitor',
    
    /**
     * 配置开发服务器
     */
    configureServer(server) {
      if (debug) {
        console.log('[AppDev Monitor Plugin] 插件已启动');
      }
      
      // 设置日志转发
      if (logForwarding) {
        setupLogInterceptor(server, (log) => {
          // 通过 WebSocket 发送日志到所有客户端
          server.ws.send('appdev:log', log);
          
          if (debug) {
            console.log('[Plugin Debug]', log);
          }
        });
      }
      
      // 设置 HMR 监控
      if (hmrForwarding) {
        setupHMRMonitor(server, (update) => {
          // 通过 WebSocket 发送更新信息到所有客户端
          server.ws.send('appdev:hmr', update);
          
          if (debug) {
            console.log('[Plugin Debug] HMR:', update);
          }
        });
      }
      
      // 监听来自客户端的错误报告
      if (errorMonitor) {
        server.ws.on('appdev:error', (data) => {
          console.error('[AppDev Monitor] 收到错误报告:', data);
          
          // 将错误作为日志转发给所有客户端
          server.ws.send('appdev:log', {
            level: 'error',
            message: `[资源错误] ${data.type}: ${data.url} - ${data.message}`,
            timestamp: data.timestamp
          });
        });
      }
    },
    
    /**
     * 转换 HTML，注入客户端监控脚本
     */
    transformIndexHtml(html) {
      if (!errorMonitor) {
        return html;
      }
      
      // 在 </head> 标签前注入脚本
      return html.replace(
        '</head>',
        `<script type="module">${CLIENT_SCRIPT}</script></head>`
      );
    }
  };
}

// 默认导出
export default appDevMonitor;

// 导出类型
export type { PluginOptions };

