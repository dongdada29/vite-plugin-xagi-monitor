# Console Demo 安装指南

## 🔧 安装步骤

### 方法 1: 使用自动化脚本
```bash
# 进入项目目录
cd playground/console-demo

# 运行安装脚本
./install.sh
```

### 方法 2: 手动安装
```bash
# 进入项目目录
cd playground/console-demo

# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

## 📦 依赖包列表

项目需要以下依赖：

### 运行时依赖
- `react: ^18.2.0`
- `react-dom: ^18.2.0`

### 开发依赖
- `@types/react: ^18.2.43`
- `@types/react-dom: ^18.2.17`
- `@typescript-eslint/eslint-plugin: ^6.14.0`
- `@typescript-eslint/parser: ^6.14.0`
- `@vitejs/plugin-react: ^4.2.1`
- `eslint: ^8.55.0`
- `eslint-plugin-react-hooks: ^4.6.0`
- `eslint-plugin-react-refresh: ^0.4.5`
- `typescript: ^5.2.2`
- `vite: ^5.0.8`

## 🚀 启动项目

安装完成后，运行开发服务器：

```bash
# 使用 pnpm
pnpm dev

# 或使用 npm
npm run dev

# 或使用 yarn
yarn dev
```

然后在浏览器中访问 `http://localhost:5173`

## 🔍 故障排除

### 1. 模块未找到错误
如果看到类似这样的错误：
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@vitejs/plugin-react'
```

**解决方案**:
```bash
# 确保在正确的目录
cd playground/console-demo

# 清理缓存并重新安装
rm -rf node_modules package-lock.json pnpm-lock.yaml
pnpm install
```

### 2. Node.js 版本问题
确保使用兼容的 Node.js 版本：
```bash
node --version  # 需要 >= 16.0.0
```

### 3. 端口占用
如果端口 5173 被占用：
```bash
# 使用不同端口
pnpm dev --port 3000
```

### 4. 插件路径问题
如果遇到插件导入错误，请确认：
1. 主项目已构建：`cd ../../ && npm run build`
2. 插件路径正确：`import appDevMonitor from '../../src/index'`

## 📱 访问演示

启动成功后，在浏览器中访问：
- 主页面：`http://localhost:5173`
- WebSocket 服务器：`ws://localhost:3001`

## 🧪 功能测试

项目包含以下测试功能：

1. **基础日志测试**
2. **对象日志测试**
3. **数组日志测试**
4. **性能日志测试**
5. **网络请求日志**
6. **错误和异常日志**
7. **实时数据流**
8. **批量日志测试**

## 📋 预期效果

- ✅ 远程控制台连接状态实时显示
- ✅ 日志数量统计
- ✅ WebSocket 服务器在端口 3001 启动
- ✅ 控制台日志实时转发到远程服务器
- ✅ 支持多种日志类型和格式

## 🛠️ 开发工具

项目配置了以下开发工具：
- **ESLint**: 代码质量检查
- **TypeScript**: 类型安全
- **Vite**: 快速的开发服务器和构建工具

## 📄 相关文档

- [项目 README](./README.md)
- [Playground 总览](../README.md)
- [主项目文档](../../README.md)

---

如果安装过程中遇到其他问题，请查看控制台输出的错误信息，或参考主项目的故障排除指南。