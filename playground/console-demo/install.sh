#!/bin/bash

echo "🚀 安装 Console Demo 依赖..."

# 检查是否有 pnpm
if command -v pnpm &> /dev/null; then
    echo "使用 pnpm 安装依赖..."
    pnpm install
elif command -v npm &> /dev/null; then
    echo "使用 npm 安装依赖..."
    npm install
elif command -v yarn &> /dev/null; then
    echo "使用 yarn 安装依赖..."
    yarn install
else
    echo "❌ 未找到包管理器 (npm/pnpm/yarn)"
    echo "请先安装 Node.js 和包管理器:"
    echo "  - 安装 Node.js: https://nodejs.org/"
    echo "  - 安装 pnpm: npm install -g pnpm"
    echo "  - 或安装 npm: npm 已随 Node.js 安装"
    exit 1
fi

echo "✅ 依赖安装完成！"
echo "🚀 启动开发服务器:"
echo "  pnpm dev"
echo "  npm run dev"
echo "  yarn dev"