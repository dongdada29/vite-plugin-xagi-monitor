import type { WhiteScreenMonitorConfig, WhiteScreenResult } from './types';

/**
 * 增强的白屏监控器
 * 智能检测和报告页面空白状态
 */
export class WhiteScreenMonitor {
  private config: WhiteScreenMonitorConfig;
  private isEnabled = false;
  private monitoringInterval?: NodeJS.Timeout;
  private lastResults: WhiteScreenResult[] = [];
  private onWhiteScreenDetected?: (result: WhiteScreenResult) => void;

  constructor(config: WhiteScreenMonitorConfig = {}) {
    this.config = {
      enabled: false,
      screenshot: false,
      thresholds: {
        contentLength: 50,
        elementCount: 5,
        loadTime: 3000
      },
      checkInterval: 2000,
      debug: false,
      ...config
    };
  }

  /**
   * 启动白屏监控
   */
  start() {
    if (this.isEnabled || !this.config.enabled) return;

    this.isEnabled = true;

    // 等待页面加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => this.startMonitoring(), this.config.thresholds?.loadTime || 3000);
      });
    } else {
      setTimeout(() => this.startMonitoring(), this.config.thresholds?.loadTime || 3000);
    }

    if (this.config.debug) {
      console.log('[White Screen Monitor] 白屏监控已启用');
    }
  }

  /**
   * 停止白屏监控
   */
  stop() {
    this.isEnabled = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    if (this.config.debug) {
      console.log('[White Screen Monitor] 白屏监控已停止');
    }
  }

  /**
   * 开始监控
   */
  private startMonitoring() {
    if (!this.isEnabled) return;

    // 立即执行一次检测
    this.performCheck();

    // 设置定时检测
    this.monitoringInterval = setInterval(() => {
      this.performCheck();
    }, this.config.checkInterval);
  }

  /**
   * 执行白屏检测
   */
  private performCheck() {
    const result = this.analyzePage();

    // 存储结果
    this.lastResults.push(result);
    if (this.lastResults.length > 100) {
      this.lastResults = this.lastResults.slice(-50);
    }

    // 如果检测到白屏，触发回调
    if (result.isWhiteScreen) {
      this.handleWhiteScreenDetected(result);
    }

    // 发送监控数据
    this.sendMonitoringData(result);

    if (this.config.debug) {
      console.log('[White Screen Monitor] 检测结果:', result.isWhiteScreen ? '白屏' : '正常', result.metrics);
    }
  }

  /**
   * 分析页面状态
   */
  private analyzePage(): WhiteScreenResult {
    const startTime = performance.now();

    // 收集页面指标
    const metrics = this.collectMetrics();

    // 判断是否为白屏
    const isWhiteScreen = this.evaluateWhiteScreen(metrics);

    // 生成截图（如果启用）
    let screenshot: string | undefined;
    if (this.config.screenshot && isWhiteScreen) {
      screenshot = this.generateScreenshot();
    }

    const result: WhiteScreenResult = {
      isWhiteScreen,
      timestamp: Date.now(),
      url: window.location.href,
      metrics,
      screenshot
    };

    // 记录性能数据
    const endTime = performance.now();
    if (this.config.debug) {
      console.log(`[White Screen Monitor] 分析耗时: ${(endTime - startTime).toFixed(2)}ms`);
    }

    return result;
  }

  /**
   * 收集页面指标
   */
  private collectMetrics() {
    const body = document.body;
    const root = document.getElementById('root') || document.querySelector('[id]') || document.body;

    // 基础指标
    const textLength = body?.innerText?.length || 0;
    const elementCount = document.querySelectorAll('*').length;
    const pageHeight = Math.max(
      body?.scrollHeight || 0,
      document.documentElement.scrollHeight || 0
    );

    // 资源加载指标
    const resources = performance.getEntriesByType('resource');
    const loadedResources = resources.filter(r => r.initiatorType !== 'xmlhttprequest').length;

    // 性能指标
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const loadTime = navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0;

    // DOM 结构分析
    const hasVisibleContent = this.hasVisibleContent(body);
    const hasInteractiveElements = document.querySelectorAll('button, input, select, textarea, a').length > 0;
    const hasImages = document.querySelectorAll('img').length > 0;

    // CSS 检查
    const computedStyles = window.getComputedStyle(body);
    const hasBackground = computedStyles.background !== 'rgba(0, 0, 0, 0)' && computedStyles.backgroundColor !== 'transparent';
    const hasContentInRoot = root && (root.innerText?.length || 0) > 10;

    return {
      textLength,
      elementCount,
      pageHeight,
      loadedResources,
      totalResources: resources.length,
      loadTime,
      hasVisibleContent,
      hasInteractiveElements,
      hasImages,
      hasBackground,
      hasContentInRoot,
      bodyChildren: body?.children?.length || 0,
      rootChildren: root?.children?.length || 0,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth
    };
  }

  /**
   * 评估是否为白屏
   */
  private evaluateWhiteScreen(metrics: any): boolean {
    const thresholds = this.config.thresholds || {};

    // 文本内容检查
    const hasInsufficientText = metrics.textLength < (thresholds.contentLength || 50);

    // 元素数量检查
    const hasInsufficientElements = metrics.elementCount < (thresholds.elementCount || 5);

    // 页面高度检查
    const hasInsufficientHeight = metrics.pageHeight < 200 && metrics.bodyChildren < 3;

    // 根元素内容检查
    const rootEmpty = !metrics.hasContentInRoot;

    // 可见内容检查
    const noVisibleContent = !metrics.hasVisibleContent;

    // 加载时间检查（可能表示加载失败）
    const loadTimeIssue = metrics.loadTime > (thresholds.loadTime || 3000) && hasInsufficientText;

    // 综合判断
    const checks = [
      hasInsufficientText,
      hasInsufficientElements,
      hasInsufficientHeight,
      rootEmpty,
      noVisibleContent
    ];

    // 如果超过一半的条件满足，认为是白屏
    const trueCount = checks.filter(Boolean).length;
    const isWhiteScreen = trueCount >= Math.ceil(checks.length / 2);

    // 特殊情况处理
    if (loadTimeIssue && trueCount >= 2) {
      return true;
    }

    // 如果有交互元素但内容很少，可能是部分白屏
    if (metrics.hasInteractiveElements && hasInsufficientText && metrics.pageHeight < 300) {
      return true;
    }

    return isWhiteScreen;
  }

  /**
   * 检查是否有可见内容
   */
  private hasVisibleContent(element: Element | null): boolean {
    if (!element) return false;

    const styles = window.getComputedStyle(element);
    const isVisible = styles.display !== 'none' &&
                     styles.visibility !== 'hidden' &&
                     styles.opacity !== '0';

    if (!isVisible) return false;

    // 检查是否有实际内容
    const text = element.innerText?.trim();
    if (text && text.length > 5) return true;

    // 检查子元素
    const children = element.children;
    for (let i = 0; i < children.length; i++) {
      if (this.hasVisibleContent(children[i])) {
        return true;
      }
    }

    return false;
  }

  /**
   * 生成截图
   */
  private generateScreenshot(): string {
    try {
      // 简单的文本截图
      return document.documentElement.outerHTML.substring(0, 1000);
    } catch (error) {
      console.error('[White Screen Monitor] 生成截图失败:', error);
      return '';
    }
  }

  /**
   * 处理白屏检测结果
   */
  private handleWhiteScreenDetected(result: WhiteScreenResult) {
    console.error('🚨 [White Screen Monitor] 检测到白屏!', {
      url: result.url,
      timestamp: new Date(result.timestamp).toISOString(),
      metrics: result.metrics
    });

    // 触发回调
    if (this.onWhiteScreenDetected) {
      this.onWhiteScreenDetected(result);
    }

    // 发送到服务器
    this.sendWhiteScreenAlert(result);
  }

  /**
   * 发送监控数据
   */
  private sendMonitoringData(result: WhiteScreenResult) {
    try {
      if (window.importMetaHot) {
        window.importMetaHot.send('appdev:white-screen', result);
      }

      // 发送到父窗口（用于 iframe 预览）
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'APPDEV_WHITE_SCREEN',
          data: result
        }, '*');
      }
    } catch (error) {
      console.error('[White Screen Monitor] 发送监控数据失败:', error);
    }
  }

  /**
   * 发送白屏警报
   */
  private sendWhiteScreenAlert(result: WhiteScreenResult) {
    // 在页面上显示警报
    const alertElement = document.createElement('div');
    alertElement.id = 'xagi-white-screen-alert';
    alertElement.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #dc3545;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
      animation: slideDown 0.3s ease-out;
    `;

    alertElement.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 18px;">🚨</span>
        <div>
          <strong>白屏警告</strong><br>
          <small>页面内容异常，请检查控制台获取详细信息</small>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          margin-left: 10px;
        ">×</button>
      </div>
    `;

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // 移除现有警报
    const existingAlert = document.getElementById('xagi-white-screen-alert');
    if (existingAlert) {
      existingAlert.remove();
    }

    // 添加新警报
    document.body.appendChild(alertElement);

    // 5秒后自动移除
    setTimeout(() => {
      if (alertElement.parentNode) {
        alertElement.remove();
      }
    }, 5000);
  }

  /**
   * 设置白屏检测回调
   */
  onDetected(callback: (result: WhiteScreenResult) => void) {
    this.onWhiteScreenDetected = callback;
  }

  /**
   * 获取最近的检测结果
   */
  getLastResults(count: number = 10): WhiteScreenResult[] {
    return this.lastResults.slice(-count);
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const total = this.lastResults.length;
    const whiteScreens = this.lastResults.filter(r => r.isWhiteScreen).length;
    const lastWhiteScreen = this.lastResults
      .filter(r => r.isWhiteScreen)
      .pop();

    return {
      totalChecks: total,
      whiteScreenCount: whiteScreens,
      whiteScreenRate: total > 0 ? (whiteScreens / total * 100).toFixed(2) + '%' : '0%',
      lastWhiteScreenAt: lastWhiteScreen ? new Date(lastWhiteScreen.timestamp).toISOString() : null,
      averageMetrics: this.calculateAverageMetrics()
    };
  }

  /**
   * 计算平均指标
   */
  private calculateAverageMetrics() {
    if (this.lastResults.length === 0) return null;

    const sum = this.lastResults.reduce((acc, result) => ({
      textLength: acc.textLength + result.metrics.textLength,
      elementCount: acc.elementCount + result.metrics.elementCount,
      pageHeight: acc.pageHeight + result.metrics.pageHeight,
      loadTime: acc.loadTime + result.metrics.loadTime
    }), { textLength: 0, elementCount: 0, pageHeight: 0, loadTime: 0 });

    const count = this.lastResults.length;
    return {
      textLength: Math.round(sum.textLength / count),
      elementCount: Math.round(sum.elementCount / count),
      pageHeight: Math.round(sum.pageHeight / count),
      loadTime: Math.round(sum.loadTime / count)
    };
  }
}

// 导出全局实例（用于客户端注入）
declare global {
  interface Window {
    __XAGI_WHITE_SCREEN_MONITOR__?: WhiteScreenMonitor;
  }
}