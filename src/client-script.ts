/**
 * 客户端监控脚本
 * 该脚本会被注入到 HTML 中，在客户端运行
 */
export const CLIENT_SCRIPT = `
(function() {
  const monitor = {
    /**
     * 初始化错误监听
     */
    initErrorMonitor() {
      // 监听资源加载错误（CSS、JS、图片等）
      window.addEventListener('error', (e) => {
        if (e.target !== window) {
          this.reportError({
            type: e.target.tagName?.toLowerCase() || 'unknown',
            url: e.target.src || e.target.href || '',
            message: '资源加载失败',
            timestamp: Date.now()
          });
        }
      }, true);
      
      // 监听 Promise 未捕获错误
      window.addEventListener('unhandledrejection', (e) => {
        this.reportError({
          type: 'promise',
          url: location.href,
          message: String(e.reason),
          timestamp: Date.now()
        });
      });
      
      // 拦截 Fetch API，捕获 HTTP 错误
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        try {
          const res = await originalFetch(...args);
          
          // 检查 HTTP 状态码
          if (!res.ok) {
            this.reportError({
              type: 'fetch',
              url: args[0]?.toString() || '',
              message: \`HTTP \${res.status}\`,
              timestamp: Date.now(),
              statusCode: res.status
            });
          }
          
          return res;
        } catch (err) {
          this.reportError({
            type: 'fetch',
            url: args[0]?.toString() || '',
            message: err.message,
            timestamp: Date.now()
          });
          throw err;
        }
      };
    },
    
    /**
     * 上报错误到服务端和父窗口
     */
    reportError(error) {
      // 发送到父窗口（用于 Preview 组件显示）
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'APPDEV_ERROR',
          data: error
        }, '*');
      }
      
      // 通过 HMR 发送到服务器
      if (import.meta.hot) {
        import.meta.hot.send('appdev:error', error);
      }
      
      console.error('[AppDev Monitor] 错误:', error);
    },
    
    /**
     * 初始化
     */
    init() {
      // 启动错误监听
      this.initErrorMonitor();
      
      // 监听来自服务器的消息
      if (import.meta.hot) {
        // 接收 Vite 日志
        import.meta.hot.on('appdev:log', (data) => {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'APPDEV_LOG',
              data
            }, '*');
          }
        });
        
        // 接收 HMR 更新
        import.meta.hot.on('appdev:hmr', (data) => {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'APPDEV_HMR',
              data
            }, '*');
          }
        });
      }
      
      console.log('%c[AppDev Monitor] 监控已启动', 'color: #42b983; font-weight: bold');
    }
  };
  
  // 自动初始化
  monitor.init();
})();
`;

