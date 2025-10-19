# 测试文档

## 测试结构

本项目采用多层测试策略，确保代码质量和功能完整性：

```
tests/
├── setup.ts                    # 测试环境配置和 Mock 设置
├── client-script.test.ts       # 客户端脚本集成测试
├── unit/                       # 单元测试
│   ├── error-interceptor/      # 错误页面增强模块测试
│   ├── remote-console/         # 远程控制台模块测试
│   ├── white-screen-monitor/   # 白屏监控模块测试
│   ├── design-runtime/         # Design 模式模块测试
│   └── client-script/          # 客户端脚本模块测试
├── integration/                # 集成测试
│   └── plugin.integration.test.ts # 插件集成测试
└── e2e/                        # 端到端测试
    └── full-workflow.test.ts   # 完整工作流测试
```

## 测试类型

### 1. 单元测试 (Unit Tests)
- 测试单个模块的功能
- 使用 Mock 隔离依赖
- 快速执行，易于调试

### 2. 集成测试 (Integration Tests)
- 测试模块间的交互
- 测试插件与 Vite 服务器的集成
- 验证配置和生命周期管理

### 3. 端到端测试 (E2E Tests)
- 模拟完整的使用场景
- 从客户端到服务端的完整流程
- 验证整体功能协调工作

## 运行测试

### 安装测试依赖
```bash
pnpm install
```

### 运行所有测试
```bash
# 监听模式
pnpm test

# 单次运行
pnpm test:run

# 带覆盖率报告
pnpm test:coverage
```

### 运行特定测试类型
```bash
# 只运行单元测试
pnpm test:unit

# 只运行集成测试
pnpm test:integration

# 只运行端到端测试
pnpm test:e2e
```

### 测试 UI 界面
```bash
pnpm test:ui
```

## 测试覆盖范围

### 错误页面增强功能
- ✅ 中间件拦截和错误页面增强
- ✅ AI 友好的错误格式化
- ✅ 代码片段提取和显示
- ✅ 错误分类和建议生成
- ✅ 配置选项验证

### 远程控制台功能
- ✅ 终端输出拦截和处理
- ✅ WebSocket 服务器管理
- ✅ 日志持久化和过滤
- ✅ 客户端连接管理
- ✅ 实时日志广播

### 白屏监控功能
- ✅ 多维度页面状态检测
- ✅ 智能白屏判断算法
- ✅ 实时警报系统
- ✅ 性能指标收集
- ✅ 配置阈值调整

### Design 模式功能
- ✅ 元素选择和编辑
- ✅ 可视化操作面板
- ✅ 样式实时修改
- ✅ Tailwind CSS 集成
- ✅ 键盘快捷键支持

### 插件核心功能
- ✅ Vite 插件集成
- ✅ 配置管理和验证
- ✅ 生命周期管理
- ✅ HTML 转换和脚本注入
- ✅ 错误处理和恢复

## 测试配置

### Vitest 配置
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'tests/**', '**/*.d.ts'],
    },
  },
});
```

### Mock 配置
- **WebSocket**: Mock WebSocket 用于测试客户端-服务端通信
- **Performance API**: Mock 性能 API 用于测试白屏监控
- **DOM 环境**: 使用 jsdom 提供完整的 DOM 环境
- **Vite Server**: Mock Vite 服务器用于测试插件集成

## 测试最佳实践

### 1. 测试隔离
- 每个测试用例独立运行
- 使用 beforeEach/afterEach 清理状态
- Mock 外部依赖避免副作用

### 2. 断言策略
- 测试正常流程和边界情况
- 验证错误处理和恢复机制
- 确保配置选项正确生效

### 3. 性能考虑
- 测试内存泄漏和性能回归
- 验证高频操作不会阻塞
- 确保资源正确清理

### 4. 覆盖率目标
- 单元测试覆盖率 > 90%
- 集成测试覆盖主要功能路径
- E2E 测试覆盖关键用户场景

## 持续集成

### GitHub Actions 配置示例
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm test:coverage
```

## 调试测试

### 1. 运行单个测试文件
```bash
npx vitest run tests/unit/error-interceptor/vite-error-interceptor.test.ts
```

### 2. 调试模式
```bash
npx vitest --inspect-brk tests/unit/error-interceptor/vite-error-interceptor.test.ts
```

### 3. 详细输出
```bash
npx vitest run --reporter=verbose
```

## 测试数据和工具

### Mock 数据生成器
- `createMockError()`: 生成模拟错误对象
- `createMockLogEntry()`: 生成模拟日志条目
- `createMockWhiteScreenResult()`: 生成模拟白屏检测结果
- `createMockDesignEditInfo()`: 生成模拟设计编辑信息

### 测试工具函数
- DOM 操作辅助函数
- WebSocket 连接模拟
- 性能计时器 Mock
- 事件触发器

## 添加新测试

### 1. 创建测试文件
```typescript
// tests/unit/new-feature/new-feature.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { NewFeature } from '../../../src/new-feature';

describe('NewFeature', () => {
  beforeEach(() => {
    // 设置测试环境
  });

  it('should do something', () => {
    // 编写测试用例
  });
});
```

### 2. 运行新测试
```bash
pnpm test tests/unit/new-feature/new-feature.test.ts
```

### 3. 检查覆盖率
```bash
pnpm test:coverage
```

## 常见问题

### Q: 测试运行缓慢？
A: 检查是否正确使用 Mock，避免真实网络请求和 I/O 操作。

### Q: WebSocket 测试失败？
A: 确保 WebSocket Mock 正确配置，检查连接状态和事件处理。

### Q: DOM 测试不稳定？
A: 使用 JSDOM 提供稳定的 DOM 环境，注意异步操作的时序。

### Q: 覆盖率不足？
A: 检查未覆盖的代码路径，添加边界情况和错误处理测试。

## 测试贡献指南

1. 为新功能编写对应的测试
2. 确保测试覆盖正常流程和错误情况
3. 使用有意义的测试描述
4. 保持测试代码的可读性和维护性
5. 在提交前运行完整的测试套件