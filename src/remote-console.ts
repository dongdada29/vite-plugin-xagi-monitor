import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import type { ViteDevServer } from 'vite';
import type { RemoteConsoleConfig, RemoteLogEntry } from './types';
import { TerminalInterceptor } from './terminal-interceptor';

/**
 * 远程控制台服务器
 * 提供 WebSocket 接口用于实时日志传输和控制台功能
 */
export class RemoteConsoleServer {
  private server: ViteDevServer;
  private config: RemoteConsoleConfig;
  private wsServer?: WebSocketServer;
  private terminalInterceptor: TerminalInterceptor;
  private httpServer?: any;
  private clients: Set<WebSocket> = new Set();
  private isRunning = false; // 添加运行状态属性

  constructor(server: ViteDevServer, config: RemoteConsoleConfig = {}) {
    this.server = server;
    this.config = {
      enabled: false,
      port: 3001,
      persistLogs: true,
      maxLogs: 2000,
      logLevels: ['info', 'warn', 'error', 'debug'],
      debug: false,
      ...config
    };

    this.terminalInterceptor = new TerminalInterceptor({
      ...this.config,
      debug: this.config.debug
    });
  }

  /**
   * 启动远程控制台服务器
   */
  start() {
    if (this.isRunning || !this.config.enabled) return;

    this.isRunning = true;
    this.startHttpServer();
    this.startWebSocketServer();
    this.setupTerminalInterception();

    if (this.config.debug) {
      console.log(`[Remote Console] 远程控制台已启动，端口: ${this.config.port}`);
    }
  }

  /**
   * 停止远程控制台服务器
   */
  stop() {
    this.isRunning = false;
    this.terminalInterceptor.stop();

    if (this.wsServer) {
      this.wsServer.close();
      this.wsServer = undefined;
    }

    if (this.httpServer) {
      this.httpServer.close();
      this.httpServer = undefined;
    }

    this.clients.clear();

    if (this.config.debug) {
      console.log('[Remote Console] 远程控制台已停止');
    }
  }

  /**
   * 启动 HTTP 服务器
   */
  private startHttpServer() {
    try {
      this.httpServer = createServer((req: any, res: any) => {
        this.handleHttpRequest(req, res);
      });

      this.httpServer.listen(this.config.port);
    } catch (error) {
      if (this.config.debug) {
        console.error('[Remote Console] HTTP 服务器启动失败:', error);
      }
      this.isRunning = false;
    }
  }

  /**
   * 启动 WebSocket 服务器
   */
  private startWebSocketServer() {
    try {
      this.wsServer = new WebSocketServer({ port: this.config.port + 1 });

      this.wsServer.on('connection', (ws: WebSocket) => {
        this.handleClientConnection(ws);
      });

      this.wsServer.on('error', (error: any) => {
        if (this.config.debug) {
          console.error('[Remote Console] WebSocket 服务器错误:', error);
        }
      });
    } catch (error) {
      if (this.config.debug) {
        console.error('[Remote Console] WebSocket 服务器启动失败:', error);
      }
      this.isRunning = false;
    }
  }

  /**
   * 处理客户端连接
   */
  private handleClientConnection(ws: WebSocket) {
    this.clients.add(ws);

    // 发送历史日志
    const historicalLogs = this.terminalInterceptor.getLogs();
    this.sendToClient(ws, {
      type: 'historical-logs',
      data: historicalLogs
    });

    ws.on('message', (data: any) => {
      this.handleClientMessage(ws, data);
    });

    ws.on('close', () => {
      this.clients.delete(ws);
    });

    ws.on('error', (error: any) => {
      console.error('[Remote Console] 客户端连接错误:', error);
      this.clients.delete(ws);
    });

    if (this.config.debug) {
      console.log('[Remote Console] 新客户端连接');
    }
  }

  /**
   * 处理客户端消息
   */
  private handleClientMessage(ws: WebSocket, data: any) {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'get-logs':
          this.sendToClient(ws, {
            type: 'logs-response',
            data: this.terminalInterceptor.getLogs()
          });
          break;

        case 'get-filtered-logs':
          this.sendToClient(ws, {
            type: 'filtered-logs-response',
            data: this.terminalInterceptor.getFilteredLogs(message.filter)
          });
          break;

        case 'get-stats':
          this.sendToClient(ws, {
            type: 'stats-response',
            data: this.terminalInterceptor.getStats()
          });
          break;

        case 'clear-logs':
          this.terminalInterceptor.clearLogs();
          this.broadcast({
            type: 'logs-cleared',
            data: null
          });
          break;

        case 'export-logs':
          const exportData = this.terminalInterceptor.exportLogs(message.format);
          this.sendToClient(ws, {
            type: 'export-response',
            data: exportData
          });
          break;

        case 'execute-command':
          this.executeCommand(message.command);
          break;

        default:
          console.warn('[Remote Console] 未知消息类型:', message.type);
      }
    } catch (error) {
      console.error('[Remote Console] 处理客户端消息失败:', error);
      this.sendToClient(ws, {
        type: 'error',
        data: '处理消息失败'
      });
    }
  }

  /**
   * 执行命令
   */
  private executeCommand(command: string) {
    // 安全考虑，只允许执行安全的命令
    const allowedCommands = ['npm run dev', 'npm run build', 'npm test', 'ls', 'pwd'];
    const isAllowed = allowedCommands.some(allowed => command.startsWith(allowed));

    if (!isAllowed) {
      this.broadcast({
        type: 'command-error',
        data: '命令不被允许执行'
      });
      return;
    }

    // 这里可以实现命令执行逻辑
    // 为了安全考虑，暂时只记录命令
    this.broadcast({
      type: 'command-executed',
      data: { command, timestamp: Date.now() }
    });
  }

  /**
   * 设置终端拦截
   */
  private setupTerminalInterception() {
    this.terminalInterceptor.start();

    // 订阅日志更新
    this.terminalInterceptor.subscribe((log: RemoteLogEntry) => {
      this.broadcast({
        type: 'new-log',
        data: log
      });
    });
  }

  /**
   * 处理 HTTP 请求
   */
  private handleHttpRequest(req: any, res: any) {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${this.config.port}`);
    const path = url.pathname;

    switch (path) {
      case '/':
        this.serveConsolePage(res);
        break;

      case '/api/logs':
        if (req.method === 'GET') {
          this.serveLogs(res, url.searchParams);
        } else {
          res.writeHead(405);
          res.end('Method Not Allowed');
        }
        break;

      case '/api/stats':
        if (req.method === 'GET') {
          this.serveStats(res);
        } else {
          res.writeHead(405);
          res.end('Method Not Allowed');
        }
        break;

      default:
        res.writeHead(404);
        res.end('Not Found');
    }
  }

  /**
   * 提供控制台页面
   */
  private serveConsolePage(res: any) {
    const html = this.generateConsoleHTML();
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(html);
  }

  /**
   * 提供日志 API
   */
  private serveLogs(res: any, params: URLSearchParams) {
    const filter = {
      level: params.get('level') || undefined,
      source: params.get('source') || undefined,
      search: params.get('search') || undefined,
      startTime: params.get('startTime') ? parseInt(params.get('startTime')!) : undefined,
      endTime: params.get('endTime') ? parseInt(params.get('endTime')!) : undefined
    };

    const logs = this.terminalInterceptor.getFilteredLogs(filter);

    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify(logs));
  }

  /**
   * 提供统计 API
   */
  private serveStats(res: any) {
    const stats = this.terminalInterceptor.getStats();

    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify(stats));
  }

  /**
   * 生成控制台页面 HTML
   */
  private generateConsoleHTML(): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XAgi Remote Console</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Monaco', 'Menlo', monospace; background: #1a1a1a; color: #fff; }
        .container { height: 100vh; display: flex; flex-direction: column; }
        .header { background: #2d2d2d; padding: 10px; border-bottom: 1px solid #444; }
        .title { font-size: 16px; font-weight: bold; color: #4dabf7; }
        .controls { display: flex; gap: 10px; margin-top: 10px; }
        .btn { padding: 5px 10px; background: #4dabf7; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
        .btn:hover { background: #3b9cdb; }
        .filters { display: flex; gap: 10px; align-items: center; }
        .filter { padding: 5px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; font-size: 12px; }
        .logs-container { flex: 1; overflow-y: auto; padding: 10px; }
        .log-entry { margin-bottom: 5px; padding: 5px; border-radius: 3px; font-size: 12px; }
        .log-info { background: rgba(13, 110, 253, 0.1); border-left: 3px solid #0d6efd; }
        .log-warn { background: rgba(255, 193, 7, 0.1); border-left: 3px solid #ffc107; }
        .log-error { background: rgba(220, 53, 69, 0.1); border-left: 3px solid #dc3545; }
        .log-debug { background: rgba(108, 117, 125, 0.1); border-left: 3px solid #6c757d; }
        .log-time { color: #888; margin-right: 10px; }
        .log-level { font-weight: bold; margin-right: 10px; min-width: 50px; }
        .log-source { color: #4dabf7; margin-right: 10px; }
        .log-message { white-space: pre-wrap; }
        .stats { background: #2d2d2d; padding: 10px; border-top: 1px solid #444; font-size: 12px; }
        .connection-status { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-left: 10px; }
        .connected { background: #28a745; }
        .disconnected { background: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <span class="title">🖥️ XAgi Remote Console</span>
                <span id="connection-status" class="connection-status disconnected"></span>
            </div>
            <div class="controls">
                <div class="filters">
                    <select id="level-filter" class="filter">
                        <option value="">所有级别</option>
                        <option value="info">Info</option>
                        <option value="warn">Warn</option>
                        <option value="error">Error</option>
                        <option value="debug">Debug</option>
                    </select>
                    <input type="text" id="search-filter" class="filter" placeholder="搜索日志..." style="width: 200px;">
                    <button class="btn" onclick="clearLogs()">清除日志</button>
                    <button class="btn" onclick="exportLogs('json')">导出 JSON</button>
                    <button class="btn" onclick="exportLogs('txt')">导出 TXT</button>
                </div>
            </div>
        </div>
        <div id="logs-container" class="logs-container"></div>
        <div class="stats">
            <span id="stats-info">加载中...</span>
        </div>
    </div>

    <script>
        let ws;
        let logs = [];
        let reconnectTimer;

        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:${this.config.port + 1}');

            ws.onopen = function() {
                console.log('WebSocket 连接已建立');
                document.getElementById('connection-status').className = 'connection-status connected';
                clearTimeout(reconnectTimer);
            };

            ws.onmessage = function(event) {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            };

            ws.onclose = function() {
                console.log('WebSocket 连接已关闭');
                document.getElementById('connection-status').className = 'connection-status disconnected';
                reconnectTimer = setTimeout(connectWebSocket, 3000);
            };

            ws.onerror = function(error) {
                console.error('WebSocket 错误:', error);
            };
        }

        function handleWebSocketMessage(message) {
            switch (message.type) {
                case 'historical-logs':
                    logs = message.data;
                    renderLogs();
                    updateStats();
                    break;
                case 'new-log':
                    logs.push(message.data);
                    if (shouldShowLog(message.data)) {
                        addLogToDOM(message.data);
                    }
                    updateStats();
                    break;
                case 'logs-cleared':
                    logs = [];
                    renderLogs();
                    updateStats();
                    break;
            }
        }

        function addLogToDOM(log) {
            const container = document.getElementById('logs-container');
            const logElement = createLogElement(log);
            container.appendChild(logElement);
            container.scrollTop = container.scrollHeight;
        }

        function createLogElement(log) {
            const div = document.createElement('div');
            div.className = 'log-entry log-' + log.level;
            div.innerHTML = \`
                <span class="log-time">\${new Date(log.timestamp).toLocaleTimeString()}</span>
                <span class="log-level">\${log.level.toUpperCase()}</span>
                <span class="log-source">[\${log.source}]</span>
                <span class="log-message">\${log.message}</span>
            \`;
            return div;
        }

        function renderLogs() {
            const container = document.getElementById('logs-container');
            container.innerHTML = '';
            logs.filter(shouldShowLog).forEach(log => {
                container.appendChild(createLogElement(log));
            });
            container.scrollTop = container.scrollHeight;
        }

        function shouldShowLog(log) {
            const levelFilter = document.getElementById('level-filter').value;
            const searchFilter = document.getElementById('search-filter').value.toLowerCase();

            if (levelFilter && log.level !== levelFilter) return false;
            if (searchFilter && !log.message.toLowerCase().includes(searchFilter)) return false;

            return true;
        }

        function updateStats() {
            const stats = {
                total: logs.length,
                info: logs.filter(l => l.level === 'info').length,
                warn: logs.filter(l => l.level === 'warn').length,
                error: logs.filter(l => l.level === 'error').length,
                debug: logs.filter(l => l.level === 'debug').length,
                recent: logs.filter(l => Date.now() - l.timestamp < 5 * 60 * 1000).length
            };

            document.getElementById('stats-info').textContent =
                \`总计: \${stats.total} | Info: \${stats.info} | Warn: \${stats.warn} | Error: \${stats.error} | Debug: \${stats.debug} | 最近5分钟: \${stats.recent}\`;
        }

        function clearLogs() {
            ws.send(JSON.stringify({ type: 'clear-logs' }));
        }

        function exportLogs(format) {
            ws.send(JSON.stringify({ type: 'export-logs', format: format }));
        }

        // 事件监听器
        document.getElementById('level-filter').addEventListener('change', renderLogs);
        document.getElementById('search-filter').addEventListener('input', renderLogs);

        // 启动连接
        connectWebSocket();
    </script>
</body>
</html>`;
  }

  /**
   * 发送消息到客户端
   */
  private sendToClient(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * 广播消息到所有客户端
   */
  private broadcast(message: any) {
    this.clients.forEach(ws => {
      this.sendToClient(ws, message);
    });
  }

  /**
   * 添加日志（公开方法，用于测试）
   */
  addLog(log: RemoteLogEntry) {
    // 通过 TerminalInterceptor 添加日志
    this.terminalInterceptor.addLog(log);

    // 广播新日志到所有客户端
    this.broadcast({
      type: 'new-log',
      data: log
    });
  }

  /**
   * 获取日志（公开方法，用于测试）
   */
  get logs() {
    return this.terminalInterceptor.getLogs();
  }

  /**
   * 按级别获取日志
   */
  getLogsByLevel(level: string) {
    return this.terminalInterceptor.getLogsByLevel(level);
  }

  /**
   * 搜索日志内容
   */
  searchLogs(searchTerm: string) {
    return this.terminalInterceptor.searchLogs(searchTerm);
  }

  /**
   * 按时间范围获取日志
   */
  getLogsByTimeRange(startTime: number, endTime: number) {
    return this.terminalInterceptor.getLogsByTimeRange(startTime, endTime);
  }

  /**
   * 获取统计信息
   */
  getStatistics() {
    return this.terminalInterceptor.getStatistics();
  }
}
