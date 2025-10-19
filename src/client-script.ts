/**
 * 增强的客户端监控脚本
 * 集成错误监控、白屏检测、Design 模式等功能
 */
export const CLIENT_SCRIPT = `
(function() {
  const config = window.__XAGI_MONITOR_CONFIG__ || {};

  const monitor = {
    /**
     * 初始化所有功能
     */
    init() {
      console.log('%c[AppDev Monitor] 启动增强监控功能', 'color: #42b983; font-weight: bold');

      // 启动错误监控
      this.initErrorMonitor();

      // 启动白屏监控
      this.initWhiteScreenMonitor();

      // 启动 Design 模式
      this.initDesignMode();

      // 监听服务器消息
      this.setupMessageListeners();

      // 初始化完成
      this.onInitialized();
    },

    /**
     * 初始化错误监听
     */
    initErrorMonitor() {
      // 资源加载错误
      window.addEventListener('error', (e) => {
        if (e.target !== window) {
          const tagName = e.target.tagName?.toLowerCase() || 'unknown';
          const resourceUrl = e.target.src || e.target.href || '';

          // 特别关注 CSS 错误
          if (tagName === 'link' && resourceUrl.includes('.css')) {
            this.reportError({
              type: 'css-error',
              url: resourceUrl,
              message: 'CSS 资源加载失败 - 可能导致白屏',
              timestamp: Date.now(),
              severity: 'critical',
              element: e.target.outerHTML
            });
            return;
          }

          // 其他资源错误
          this.reportError({
            type: tagName,
            url: resourceUrl,
            message: '资源加载失败',
            timestamp: Date.now(),
            element: e.target.outerHTML
          });
        }
      }, true);

      // Promise 错误
      window.addEventListener('unhandledrejection', (e) => {
        this.reportError({
          type: 'promise',
          url: location.href,
          message: String(e.reason),
          timestamp: Date.now()
        });
      });

      // Fetch API 拦截
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const url = args[0]?.toString() || '';

        try {
          const res = await originalFetch(...args);

          // CSS 资源 HTTP 错误
          if (!res.ok && url.includes('.css')) {
            this.reportError({
              type: 'css-http-error',
              url: url,
              message: \`CSS 资源 HTTP \${res.status} 错误\`,
              timestamp: Date.now(),
              statusCode: res.status,
              severity: 'critical'
            });
          }
          // 其他 HTTP 错误
          else if (!res.ok) {
            this.reportError({
              type: 'fetch',
              url: url,
              message: \`HTTP \${res.status}\`,
              timestamp: Date.now(),
              statusCode: res.status
            });
          }

          return res;
        } catch (err) {
          // CSS 网络错误
          if (url.includes('.css')) {
            this.reportError({
              type: 'css-network-error',
              url: url,
              message: \`CSS 资源网络错误: \${err.message}\`,
              timestamp: Date.now(),
              severity: 'critical'
            });
          } else {
            this.reportError({
              type: 'fetch',
              url: url,
              message: err.message,
              timestamp: Date.now()
            });
          }

          throw err;
        }
      };
    },

    /**
     * 初始化白屏监控
     */
    initWhiteScreenMonitor() {
      if (!config.whiteScreenMonitor?.enabled) return;

      // 创建白屏监控器
      if (typeof window.__XAGI_WHITE_SCREEN_MONITOR__ === 'undefined') {
        // 简化的白屏监控逻辑
        const whiteScreenMonitor = {
          checkInterval: config.whiteScreenMonitor?.checkInterval || 3000,
          isRunning: false,

          start() {
            if (this.isRunning) return;
            this.isRunning = true;

            // 延迟开始监控
            setTimeout(() => {
              this.check();
              this.interval = setInterval(() => this.check(), this.checkInterval);
            }, 2000);

            console.log('[White Screen Monitor] 白屏监控已启动');
          },

          check() {
            const body = document.body;
            const root = document.getElementById('root');

            // 多维度检测
            const checks = {
              textLength: (body?.innerText?.length || 0) < 50,
              elementCount: document.querySelectorAll('*').length < 10,
              pageHeight: (body?.offsetHeight || 0) < 200,
              rootEmpty: root && root.children.length === 0
            };

            const failedCount = Object.values(checks).filter(Boolean).length;
            const isWhiteScreen = failedCount >= 2;

            if (isWhiteScreen) {
              this.reportWhiteScreen(checks);
            }
          },

          reportWhiteScreen(checks) {
            const result = {
              isWhiteScreen: true,
              timestamp: Date.now(),
              url: location.href,
              checks: checks
            };

            // 发送警报
            console.error('🚨 [White Screen Monitor] 检测到白屏!', result);

            // 发送到服务器
            if (import.meta.hot) {
              import.meta.hot.send('appdev:white-screen', result);
            }

            // 页面内警告
            this.showWhiteScreenAlert();
          },

          showWhiteScreenAlert() {
            const alert = document.createElement('div');
            alert.style.cssText = \`
              position: fixed;
              top: 20px;
              right: 20px;
              background: #dc3545;
              color: white;
              padding: 12px 16px;
              border-radius: 8px;
              font-family: system-ui;
              font-size: 14px;
              z-index: 999999;
              box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
            \`;
            alert.innerHTML = \`
              <div style="display: flex; align-items: center; gap: 10px;">
                <span>🚨 白屏警告</span>
                <button onclick="this.parentElement.parentElement.remove()" style="
                  background: none;
                  border: none;
                  color: white;
                  cursor: pointer;
                  font-size: 16px;
                ">×</button>
              </div>
            \`;

            document.body.appendChild(alert);
            setTimeout(() => alert.remove(), 5000);
          }
        };

        window.__XAGI_WHITE_SCREEN_MONITOR__ = whiteScreenMonitor;
        whiteScreenMonitor.start();
      }
    },

    /**
     * 初始化 Design 模式
     */
    initDesignMode() {
      if (!config.designMode?.enabled) return;

      // 简化的 Design 模式逻辑
      const designMode = {
        isEnabled: false,
        selectedElement: null,

        start() {
          this.isEnabled = true;
          document.addEventListener('click', this.handleClick.bind(this), true);
          this.injectDesignStyles();

          // 添加全局快捷键
          document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
              this.toggle();
            }
          });

          console.log('[Design Mode] Design 模式已启用 (Ctrl+Shift+D 切换)');
        },

        toggle() {
          this.isEnabled = !this.isEnabled;
          if (this.isEnabled) {
            this.start();
          } else {
            this.stop();
          }
        },

        handleClick(e) {
          if (!this.isEnabled) return;

          e.preventDefault();
          e.stopPropagation();

          const element = e.target;
          if (this.isEditable(element)) {
            this.selectElement(element);
          }
        },

        isEditable(element) {
          const editableTags = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'button'];
          return editableTags.includes(element.tagName.toLowerCase());
        },

        selectElement(element) {
          this.clearSelection();
          this.selectedElement = element;
          element.style.outline = '2px solid #4dabf7';
          this.showElementInfo(element);
        },

        clearSelection() {
          if (this.selectedElement) {
            this.selectedElement.style.outline = '';
            this.selectedElement = null;
          }
          this.hideElementInfo();
        },

        showElementInfo(element) {
          this.hideElementInfo();

          const panel = document.createElement('div');
          panel.id = 'xagi-design-info';
          panel.style.cssText = \`
            position: fixed;
            top: \${element.getBoundingClientRect().bottom + 10}px;
            left: \${element.getBoundingClientRect().left}px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 12px;
            font-family: system-ui;
            font-size: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
          \`;

          panel.innerHTML = \`
            <div><strong>\${element.tagName.toLowerCase()}</strong></div>
            <div>类名: \${element.className || '(无)'}</div>
            <div>ID: \${element.id || '(无)'}</div>
            <button onclick="this.parentElement.remove()" style="
              margin-top: 8px;
              padding: 4px 8px;
              border: 1px solid #ddd;
              background: #f8f9fa;
              border-radius: 4px;
              cursor: pointer;
            ">关闭</button>
          \`;

          document.body.appendChild(panel);
        },

        hideElementInfo() {
          const panel = document.getElementById('xagi-design-info');
          if (panel) panel.remove();
        },

        injectDesignStyles() {
          const style = document.createElement('style');
          style.textContent = \`
            [data-xagi-hover] {
              outline: 2px dashed #4dabf7 !important;
              cursor: pointer !important;
            }
          \`;
          document.head.appendChild(style);
        },

        stop() {
          this.isEnabled = false;
          this.clearSelection();
          document.removeEventListener('click', this.handleClick.bind(this), true);
        }
      };

      window.__XAGI_DESIGN_MODE__ = designMode;
      designMode.start();
    },

    /**
     * 设置消息监听器
     */
    setupMessageListeners() {
      if (import.meta.hot) {
        // 接收日志
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
    },

    /**
     * 报告错误
     */
    reportError(error) {
      // 发送到父窗口
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'APPDEV_ERROR',
          data: error
        }, '*');
      }

      // 发送到服务器
      if (import.meta.hot) {
        import.meta.hot.send('appdev:error', error);
      }

      // 控制台显示
      if (error.severity === 'critical') {
        console.error('🚨 [AppDev Monitor Critical Error]', error);
      } else {
        console.error('[AppDev Monitor] 错误:', error);
      }
    },

    /**
     * 初始化完成回调
     */
    onInitialized() {
      // 发送初始化完成事件
      if (import.meta.hot) {
        import.meta.hot.send('appdev:initialized', {
          features: {
            errorMonitor: true,
            whiteScreenMonitor: !!config.whiteScreenMonitor?.enabled,
            designMode: !!config.designMode?.enabled
          },
          timestamp: Date.now()
        });
      }
    }
  };

  // 自动初始化
  monitor.init();
})();
`;