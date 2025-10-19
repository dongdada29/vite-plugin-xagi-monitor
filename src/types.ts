import 'vite/types/customEvent.d.ts';

/**
 * 插件配置选项
 */
export interface PluginOptions {
  /** 是否启用错误监听 */
  errorMonitor?: boolean;
  /** 是否转发 Vite 日志 */
  logForwarding?: boolean;
  /** 是否转发 HMR 更新 */
  hmrForwarding?: boolean;
  /** 调试模式 */
  debug?: boolean;
}

/**
 * 扩展 Vite HMR 自定义事件类型
 */
declare module 'vite/types/customEvent.d.ts' {
  interface CustomEventMap {
    /**
     * Vite 日志事件
     */
    'appdev:log': {
      level: 'info' | 'warn' | 'error';
      message: string;
      timestamp: number;
    };
    
    /**
     * HMR 更新事件
     */
    'appdev:hmr': {
      type: 'update' | 'full-reload';
      path?: string;
      timestamp: number;
    };
    
    /**
     * 错误报告事件（客户端 -> 服务端）
     */
    'appdev:error': {
      type: string;
      url: string;
      message: string;
      timestamp: number;
      statusCode?: number;
    };
  }
}

