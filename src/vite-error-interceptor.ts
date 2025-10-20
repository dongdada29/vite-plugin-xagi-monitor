import type { ViteDevServer } from 'vite';
import type { ErrorPageConfig, ParsedError } from './types';

/**
 * Vite 错误拦截器
 * 通过添加中间件来拦截和增强错误页面
 */
export class ViteErrorInterceptor {
  private server: ViteDevServer;
  private config: ErrorPageConfig;
  private errorHandlerAdded = false;

  constructor(server: ViteDevServer, config: ErrorPageConfig = {}) {
    this.server = server;
    this.config = {
      enabled: true,
      aiFriendly: false,
      showStack: true,
      showCodeSnippet: true,
      maxStackLines: 10,
      ...config
    };
  }

  /**
   * 启动错误拦截
   */
  start() {
    if (!this.config.enabled || this.errorHandlerAdded) return;

    // 添加错误处理中间件到中间件栈的开头
    this.server.middlewares.use(this.createErrorHandlerMiddleware());
    this.errorHandlerAdded = true;

    if (this.config.debug) {
      console.log('[Vite Error Interceptor] 错误拦截已启用');
    }
  }

  /**
   * 停止错误拦截
   */
  stop() {
    // 移除错误处理中间件（简化处理）
    this.errorHandlerAdded = false;
    if (this.config.debug) {
      console.log('[Vite Error Interceptor] 错误拦截已停止');
    }
  }

  /**
   * 创建错误处理中间件
   */
  private createErrorHandlerMiddleware() {
    return (req: any, res: any, next: any) => {
      // 保存原始方法
      const originalWrite = res.write.bind(res);
      const originalEnd = res.end.bind(res);

      let responseData = '';
      let isHtmlResponse = false;

      // 拦截 write 方法
      res.write = function(chunk: any, encoding?: any) {
        if (typeof chunk === 'string') {
          responseData += chunk;

          // 检查是否为 HTML 响应
          const contentType = res.getHeader('content-type');
          if (contentType?.includes('text/html')) {
            isHtmlResponse = true;
          }
        }
        return originalWrite(chunk, encoding);
      };

      // 拦截 end 方法
      res.end = function(chunk?: any, encoding?: any) {
        if (chunk) {
          responseData += chunk;
        }

        // 如果是 HTML 响应且包含 Vite 错误页面特征
        if (isHtmlResponse && responseData.includes('vite-error-overlay')) {
          try {
            const enhancedResponse = this.enhanceErrorPage(responseData, req.url);

            // 更新内容长度
            res.setHeader('content-length', Buffer.byteLength(enhancedResponse));
            originalEnd(enhancedResponse, encoding);
            return;
          } catch (error) {
            console.error('[Vite Error Interceptor] 增强错误页面失败:', error);
          }
        }

        originalEnd(chunk, encoding);
      }.bind(this);

      next();
    }
  }

  /**
   * 增强错误页面
   */
  private enhanceErrorPage(html: string, url: string): string {
    const parsedError = this.parseErrorFromHTML(html);

    if (!parsedError) {
      return html;
    }

    // 生成增强的错误信息
    const enhancedInfo = this.generateEnhancedErrorInfo(parsedError, url);

    // 在原始错误页面中插入增强信息
    return html.replace(
      /<body[^>]*>/,
      `<body>${enhancedInfo}`
    );
  }

  /**
   * 从 HTML 中解析错误信息
   */
  private parseErrorFromHTML(html: string): ParsedError | null {
    try {
      // 提取错误消息
      const messageMatch = html.match(/<pre[^>]*>(.*?)<\/pre>/s);
      const message = messageMatch ? messageMatch[1].trim() : '';

      // 提取文件位置
      const fileMatch = html.match(/<span[^>]*>([^:]+):(\d+):(\d+)<\/span>/);
      const file = fileMatch ? fileMatch[1] : '';
      const line = fileMatch ? parseInt(fileMatch[2]) : 0;
      const column = fileMatch ? parseInt(fileMatch[3]) : 0;

      // 提取错误堆栈
      const stackMatch = html.match(/<pre[^>]*class="stack"[^>]*>(.*?)<\/pre>/s);
      const stack = stackMatch ? stackMatch[1].trim() : '';

      // 提取代码片段
      const codeMatch = html.match(/<pre[^>]*class="code"[^>]*>(.*?)<\/pre>/s);
      const codeSnippet = codeMatch ? codeMatch[1].trim() : '';

      if (!message && !file) {
        return null;
      }

      return {
        message,
        file,
        line,
        column,
        stack: this.config.showStack ? this.formatStack(stack) : '',
        codeSnippet: this.config.showCodeSnippet ? codeSnippet : '',
        type: this.determineErrorType(message, file),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('[Vite Error Interceptor] 解析错误信息失败:', error);
      return null;
    }
  }

  /**
   * 格式化堆栈信息
   */
  private formatStack(stack: string): string {
    if (!stack) return '';

    const lines = stack.split('\n').filter(line => line.trim());
    return lines.slice(0, this.config.maxStackLines).join('\n');
  }

  /**
   * 确定错误类型
   */
  private determineErrorType(message: string, file: string): string {
    if (message.includes('Module not found') || message.includes('Cannot resolve')) {
      return 'MODULE_NOT_FOUND';
    }
    if (message.includes('SyntaxError') || message.includes('Unexpected token')) {
      return 'SYNTAX_ERROR';
    }
    if (message.includes('TypeError')) {
      return 'TYPE_ERROR';
    }
    if (message.includes('ReferenceError')) {
      return 'REFERENCE_ERROR';
    }
    if (file.endsWith('.css')) {
      return 'CSS_ERROR';
    }
    if (file.endsWith('.vue') || file.endsWith('.jsx') || file.endsWith('.tsx')) {
      return 'COMPONENT_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  /**
   * 生成增强的错误信息
   */
  private generateEnhancedErrorInfo(error: ParsedError, url: string): string {
    const errorId = `error-${Date.now()}`;

    let enhancedHTML = `
<div id="${errorId}" style="
  position: fixed;
  top: 10px;
  right: 10px;
  width: 400px;
  max-height: 300px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  color: #fff;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  z-index: 999999;
  overflow: auto;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
">
  <div style="
    background: #333;
    padding: 8px 12px;
    border-bottom: 1px solid #444;
    display: flex;
    justify-content: space-between;
    align-items: center;
  ">
    <span style="color: #ff6b6b; font-weight: bold;">🚨 XAgi Enhanced Error</span>
    <button onclick="this.parentElement.parentElement.remove()" style="
      background: none;
      border: none;
      color: #999;
      cursor: pointer;
      font-size: 14px;
    ">✕</button>
  </div>
  <div style="padding: 12px;">
    <div style="margin-bottom: 8px;">
      <strong>Type:</strong> <span style="color: #4dabf7;">${error.type}</span>
    </div>
    <div style="margin-bottom: 8px;">
      <strong>File:</strong> <span style="color: #69db7c;">${error.file}:${error.line}:${error.column}</span>
    </div>
    <div style="margin-bottom: 8px;">
      <strong>Message:</strong>
      <div style="color: #ffd43b; margin-top: 4px; white-space: pre-wrap;">${error.message}</div>
    </div>`;

    if (error.codeSnippet) {
      enhancedHTML += `
    <div style="margin-bottom: 8px;">
      <strong>Code:</strong>
      <pre style="background: #2d2d2d; padding: 8px; border-radius: 4px; margin-top: 4px; overflow-x: auto;">${error.codeSnippet}</pre>
    </div>`;
    }

    if (this.config.aiFriendly) {
      enhancedHTML += this.generateAIFriendlyInfo(error);
    }

    enhancedHTML += `
    <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #444;">
      <button onclick="navigator.clipboard.writeText(\`${this.generateQuickCopyText(error)}\`)" style="
        background: #4dabf7;
        border: none;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        margin-right: 8px;
      ">📋 Copy Error</button>
      <button onclick="window.open('vscode://file/${error.file}:${error.line}:${error.column}', '_blank')" style="
        background: #69db7c;
        border: none;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
      ">🔧 Open in VSCode</button>
    </div>
  </div>
</div>

<script>
// 发送错误信息到插件
if (import.meta.hot) {
  import.meta.hot.send('appdev:enhanced-error', ${JSON.stringify(error)});
}
</script>`;

    return enhancedHTML;
  }

  /**
   * 生成 AI 友好的错误信息
   */
  private generateAIFriendlyInfo(error: ParsedError): string {
    const suggestions = this.generateErrorSuggestions(error);

    return `
    <div style="margin-bottom: 8px;">
      <strong>🤖 AI Assistant:</strong>
      <div style="background: #2d2d2d; padding: 8px; border-radius: 4px; margin-top: 4px;">
        <div style="color: #4dabf7; margin-bottom: 4px;">Quick Fix Suggestions:</div>
        <ul style="margin: 0; padding-left: 16px; color: #ccc;">
          ${suggestions.map(s => `<li style="margin-bottom: 2px;">${s}</li>`).join('')}
        </ul>
      </div>
    </div>`;
  }

  /**
   * 生成错误修复建议
   */
  private generateErrorSuggestions(error: ParsedError): string[] {
    const suggestions: string[] = [];

    switch (error.type) {
      case 'MODULE_NOT_FOUND':
        suggestions.push('Check if the module is installed: npm install [module-name]');
        suggestions.push('Verify the import path is correct');
        suggestions.push('Check if the module exists in node_modules');
        break;
      case 'SYNTAX_ERROR':
        suggestions.push('Check for missing brackets, commas, or semicolons');
        suggestions.push('Verify JSX syntax if applicable');
        suggestions.push('Check for reserved keywords usage');
        break;
      case 'TYPE_ERROR':
        suggestions.push('Check variable types before using them');
        suggestions.push('Add null/undefined checks');
        suggestions.push('Verify function return types');
        break;
      case 'CSS_ERROR':
        suggestions.push('Check CSS syntax for missing semicolons or brackets');
        suggestions.push('Verify CSS imports and file paths');
        suggestions.push('Check for invalid CSS properties');
        break;
      default:
        suggestions.push('Check the console for more details');
        suggestions.push('Verify all dependencies are properly installed');
        suggestions.push('Review recent changes in the file');
    }

    return suggestions;
  }

  /**
   * 生成快速复制文本
   */
  private generateQuickCopyText(error: ParsedError): string {
    return `Error: ${error.message}
Type: ${error.type}
File: ${error.file}:${error.line}:${error.column}
${error.stack ? `Stack: ${error.stack}` : ''}`;
  }
}
