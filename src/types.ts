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

  // 新增配置选项
  /** 错误页面定制配置 */
  errorPageCustomization?: ErrorPageConfig;
  /** 远程控制台配置 */
  remoteConsole?: RemoteConsoleConfig;
  /** 白屏监控配置 */
  whiteScreenMonitor?: WhiteScreenMonitorConfig;
  /** Design 模式配置 */
  designMode?: DesignModeConfig;
}

/**
 * 错误页面定制配置
 */
export interface ErrorPageConfig {
  /** 是否启用错误页面增强 */
  enabled?: boolean;
  /** AI 友好的错误信息 */
  aiFriendly?: boolean;
  /** 是否显示堆栈信息 */
  showStack?: boolean;
  /** 是否显示代码片段 */
  showCodeSnippet?: boolean;
  /** 最大堆栈行数 */
  maxStackLines?: number;
  /** 自定义错误页面模板路径 */
  templatePath?: string;
  /** 调试模式 */
  debug?: boolean;
}

/**
 * 远程控制台配置
 */
export interface RemoteConsoleConfig {
  /** 是否启用远程控制台 */
  enabled?: boolean;
  /** WebSocket 端口 */
  port?: number;
  /** 是否持久化日志 */
  persistLogs?: boolean;
  /** 最大日志数量 */
  maxLogs?: number;
  /** 日志级别过滤 */
  logLevels?: ('info' | 'warn' | 'error' | 'debug')[];
  /** 调试模式 */
  debug?: boolean;
}

/**
 * 白屏监控配置
 */
export interface WhiteScreenMonitorConfig {
  /** 是否启用白屏监控 */
  enabled?: boolean;
  /** 是否自动截图 */
  screenshot?: boolean;
  /** 检测阈值配置 */
  thresholds?: {
    /** 内容长度阈值 */
    contentLength?: number;
    /** 元素数量阈值 */
    elementCount?: number;
    /** 加载时间阈值（毫秒） */
    loadTime?: number;
  };
  /** 检测间隔（毫秒） */
  checkInterval?: number;
}

/**
 * Design 模式配置
 */
export interface DesignModeConfig {
  /** 是否启用 Design 模式 */
  enabled?: boolean;
  /** 是否集成 Tailwind CSS */
  tailwindIntegration?: boolean;
  /** 是否自动同步 */
  autoSync?: boolean;
  /** 可编辑的元素选择器 */
  editableSelectors?: string[];
  /** 是否显示元素边框 */
  showElementBorders?: boolean;
}

/**
 * 解析后的错误信息
 */
export interface ParsedError {
  /** 错误消息 */
  message: string;
  /** 错误文件 */
  file: string;
  /** 行号 */
  line: number;
  /** 列号 */
  column: number;
  /** 堆栈信息 */
  stack: string;
  /** 代码片段 */
  codeSnippet: string;
  /** 错误类型 */
  type: string;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 远程日志条目
 */
export interface RemoteLogEntry {
  /** 日志级别 */
  level: 'info' | 'warn' | 'error' | 'debug';
  /** 日志消息 */
  message: string;
  /** 时间戳 */
  timestamp: number;
  /** 来源 */
  source?: string;
  /** 额外数据 */
  data?: any;
}

/**
 * 白屏监控结果
 */
export interface WhiteScreenResult {
  /** 是否为白屏 */
  isWhiteScreen: boolean;
  /** 检测时间 */
  timestamp: number;
  /** 页面 URL */
  url: string;
  /** 检测指标 */
  metrics: {
    /** 文本内容长度 */
    textLength: number;
    /** DOM 元素数量 */
    elementCount: number;
    /** 页面高度 */
    pageHeight: number;
    /** 已加载资源数量 */
    loadedResources: number;
    /** 总资源数量 */
    totalResources: number;
  };
  /** 截图数据（如果启用） */
  screenshot?: string;
}

/**
 * Design 模式编辑信息
 */
export interface DesignEditInfo {
  /** 操作类型 */
  action: 'select' | 'edit' | 'style' | 'content';
  /** 目标元素选择器 */
  selector: string;
  /** 编辑数据 */
  data: any;
  /** 时间戳 */
  timestamp: number;
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

    /**
     * 增强错误事件
     */
    'appdev:enhanced-error': {
      type: string;
      message: string;
      file: string;
      line: number;
      column: number;
      stack: string;
      codeSnippet: string;
      timestamp: number;
    };

    /**
     * 远程控制台日志事件
     */
    'appdev:remote-log': {
      level: 'info' | 'warn' | 'error' | 'debug';
      message: string;
      source: string;
      timestamp: number;
      data?: any;
    };

    /**
     * 白屏监控事件
     */
    'appdev:white-screen': {
      isWhiteScreen: boolean;
      url: string;
      metrics: {
        textLength: number;
        elementCount: number;
        pageHeight: number;
        loadedResources: number;
        totalResources: number;
      };
      timestamp: number;
      screenshot?: string;
    };

    /**
     * Design 模式事件
     */
    'appdev:design-select': {
      selector: string;
      element: {
        tagName: string;
        className: string;
        textContent: string;
      };
      timestamp: number;
    };

    /**
     * Design 模式编辑事件
     */
    'appdev:design-edit': {
      action: 'select' | 'edit' | 'style' | 'content';
      selector: string;
      data: any;
      timestamp: number;
    };

    /**
     * 终端输出事件
     */
    'appdev:terminal-output': {
      type: 'stdout' | 'stderr';
      data: string;
      timestamp: number;
    };

    /**
     * 资源加载监控事件
     */
    'appdev:resource-monitor': {
      url: string;
      type: string;
      status: 'loading' | 'success' | 'error';
      duration?: number;
      size?: number;
      timestamp: number;
    };
  }
}

