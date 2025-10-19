import type { Plugin } from 'vite';
import { CLIENT_SCRIPT } from './client-script';
import { setupLogInterceptor, setupHMRMonitor } from './log-interceptor';
import { ViteErrorInterceptor } from './vite-error-interceptor';
import { RemoteConsoleServer } from './remote-console';
import type { PluginOptions } from './types';

/**
 * XAgi AppDev Monitor Plugin
 *
 * 功能：
 * 1. 自动注入错误监听脚本
 * 2. 转发 Vite 控制台日志
 * 3. 转发 HMR 更新状态
 * 4. 支持与 Preview 组件通信
 * 5. 增强错误页面显示
 * 6. 远程控制台支持
 * 7. 白屏监控
 * 8. Design 模式支持
 *
 * @param options 插件配置选项
 */
export function xagiMonitor(options: PluginOptions = {}): Plugin {
  const {
    errorMonitor = true,
    logForwarding = true,
    hmrForwarding = true,
    debug = false,
    errorPageCustomization,
    remoteConsole,
    whiteScreenMonitor,
    designMode
  } = options;

  let errorInterceptor: ViteErrorInterceptor | null = null;
  let remoteConsoleServer: RemoteConsoleServer | null = null;

  return {
    name: 'vite-plugin-xagi-monitor',

    /**
     * 配置开发服务器
     */
    configureServer(server) {
      if (debug) {
        console.log('[AppDev Monitor Plugin] 插件已启动');
      }

      // 设置错误页面增强
      if (errorPageCustomization?.enabled) {
        errorInterceptor = new ViteErrorInterceptor(server, {
          debug: debug || errorPageCustomization.debug,
          ...errorPageCustomization
        });
        errorInterceptor.start();

        if (debug) {
          console.log('[AppDev Monitor] 错误页面增强已启用');
        }
      }

      // 设置远程控制台
      if (remoteConsole?.enabled) {
        remoteConsoleServer = new RemoteConsoleServer(server, {
          debug: debug || remoteConsole.debug,
          ...remoteConsole
        });
        remoteConsoleServer.start();

        if (debug) {
          console.log(`[AppDev Monitor] 远程控制台已启用，端口: ${remoteConsole.port || 3001}`);
        }
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

        // 监听增强错误事件
        server.ws.on('appdev:enhanced-error', (data) => {
          console.error('[AppDev Monitor] 收到增强错误报告:', data);

          // 转发增强错误信息
          server.ws.send('appdev:remote-log', {
            level: 'error',
            message: `[增强错误] ${data.type}: ${data.message}`,
            source: `${data.file}:${data.line}:${data.column}`,
            timestamp: data.timestamp,
            data: data
          });
        });
      }

      // TODO: 远程控制台、白屏监控、Design 模式的实现将在后续阶段添加

      // 返回清理函数
      return () => {
        if (errorInterceptor) {
          errorInterceptor.stop();
          errorInterceptor = null;
          if (debug) {
            console.log('[AppDev Monitor] 错误页面增强已停止');
          }
        }

        if (remoteConsoleServer) {
          remoteConsoleServer.stop();
          remoteConsoleServer = null;
          if (debug) {
            console.log('[AppDev Monitor] 远程控制台已停止');
          }
        }
      };
    },

    /**
     * 转换 HTML，注入客户端监控脚本
     */
    transformIndexHtml(html) {
      if (!errorMonitor) {
        return html;
      }

      // 构建配置脚本
      const configScript = `
        window.__XAGI_MONITOR_CONFIG__ = ${JSON.stringify({
          errorPageCustomization,
          remoteConsole,
          whiteScreenMonitor,
          designMode,
          debug
        })};
      `;

      // 在 </head> 标签前注入脚本
      return html.replace(
        '</head>',
        `<script>${configScript}</script><script type="module">${CLIENT_SCRIPT}</script></head>`
      );
    }
  };
}

// 默认导出
export default xagiMonitor;

// 导出类型
export type { PluginOptions };

// 向后兼容导出
export { xagiMonitor as appDevMonitor };

