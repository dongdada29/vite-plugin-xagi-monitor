import { defineConfig } from 'vite';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// 尝试使用主项目的依赖
const resolvePlugin = (pluginName) => {
  try {
    // 首先尝试从当前项目查找
    return require(pluginName);
  } catch (e) {
    try {
      // 然后尝试从主项目查找
      return require(`../../node_modules/${pluginName}`);
    } catch (e2) {
      console.error(`无法找到插件: ${pluginName}`);
      return null;
    }
  }
};

const reactPlugin = resolvePlugin('@vitejs/plugin-react');
const appDevMonitor = resolvePlugin('../../src/index');

// 如果找不到插件，创建一个简单的插件
const createSimplePlugin = (name) => ({
  name,
  configureServer(server) {
    console.log(`[${name}] 插件已启动`);
  }
});

export default defineConfig({
  plugins: [
    reactPlugin || createSimplePlugin('react-placeholder'),
    appDevMonitor || createSimplePlugin('xagi-monitor-placeholder').configureServer?.(server)
  ]
});