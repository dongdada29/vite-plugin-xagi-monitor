import type { ViteDevServer } from 'vite';

/**
 * 设置 Vite Logger 拦截器
 * 拦截 Vite 的日志输出并转发到客户端
 */
export function setupLogInterceptor(
  server: ViteDevServer,
  onLog: (log: { level: 'info' | 'warn' | 'error'; message: string; timestamp: number }) => void
) {
  const logger = server.config.logger;
  
  // 保存原始方法
  const originalInfo = logger.info.bind(logger);
  const originalWarn = logger.warn.bind(logger);
  const originalError = logger.error.bind(logger);
  
  // 拦截 info 级别日志
  logger.info = (msg: string, options?: any) => {
    onLog({
      level: 'info',
      message: msg,
      timestamp: Date.now()
    });
    originalInfo(msg, options);
  };
  
  // 拦截 warn 级别日志
  logger.warn = (msg: string, options?: any) => {
    onLog({
      level: 'warn',
      message: msg,
      timestamp: Date.now()
    });
    originalWarn(msg, options);
  };
  
  // 拦截 error 级别日志
  logger.error = (msg: string, options?: any) => {
    onLog({
      level: 'error',
      message: msg,
      timestamp: Date.now()
    });
    originalError(msg, options);
  };
}

/**
 * 设置 HMR 监控
 * 监听文件变化并转发更新信息
 */
export function setupHMRMonitor(
  server: ViteDevServer,
  onUpdate: (update: { type: 'update' | 'full-reload'; path?: string; timestamp: number }) => void
) {
  // 监听文件变化事件
  server.watcher.on('change', (file) => {
    onUpdate({
      type: 'update',
      path: file.replace(server.config.root, ''),
      timestamp: Date.now()
    });
  });
  
  // 监听文件添加事件
  server.watcher.on('add', (file) => {
    onUpdate({
      type: 'update',
      path: file.replace(server.config.root, ''),
      timestamp: Date.now()
    });
  });
  
  // 监听文件删除事件
  server.watcher.on('unlink', (file) => {
    onUpdate({
      type: 'update',
      path: file.replace(server.config.root, ''),
      timestamp: Date.now()
    });
  });
}

