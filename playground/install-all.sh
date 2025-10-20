#!/bin/bash

echo "🚀 XAgi Monitor Playground - 批量安装脚本"
echo "=========================================="

# 检查是否有包管理器
if ! command -v pnpm &> /dev/null && ! command -v npm &> /dev/null && ! command -v yarn &> /dev/null; then
    echo "❌ 未找到包管理器 (npm/pnpm/yarn)"
    echo "请先安装 Node.js 和包管理器:"
    echo "  - 安装 Node.js: https://nodejs.org/"
    echo "  - 安装 pnpm: npm install -g pnpm"
    exit 1
fi

# 获取包管理器
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
    INSTALL_CMD="pnpm install"
    DEV_CMD="pnpm dev"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
    INSTALL_CMD="npm install"
    DEV_CMD="npm run dev"
else
    PKG_MANAGER="yarn"
    INSTALL_CMD="yarn install"
    DEV_CMD="yarn dev"
fi

echo "📦 检测到包管理器: $PKG_MANAGER"
echo ""

# 演示项目列表
PROJECTS=(
    "error-demo:🚨 错误监控演示"
    "console-demo:📡 远程控制台演示"
    "whitescreen-demo:⚪ 白屏监控演示"
    "design-demo:🎨 Design模式演示"
    "full-demo:🌟 全功能综合演示"
)

# 安装所有项目
for project_info in "${PROJECTS[@]}"; do
    IFS=':' read -r project_dir project_name <<< "$project_info"

    echo "🔧 安装 $project_name ($project_dir)..."

    if [ -d "$project_dir" ]; then
        cd "$project_dir"

        if [ ! -f "package.json" ]; then
            echo "  ⚠️  跳过：未找到 package.json"
            cd ..
            continue
        fi

        # 检查是否已安装
        if [ -d "node_modules" ]; then
            echo "  ✅ 已安装依赖，跳过安装"
        else
            echo "  📦 正在安装依赖..."
            if $INSTALL_CMD; then
                echo "  ✅ 安装完成"
            else
                echo "  ❌ 安装失败"
            fi
        fi

        cd ..
    else
        echo "  ⚠️  跳过：目录不存在"
    fi

    echo ""
done

echo "🎉 所有项目安装完成！"
echo ""
echo "🚀 启动项目："
echo ""

for project_info in "${PROJECTS[@]}"; do
    IFS=':' read -r project_dir project_name <<< "$project_info"
    echo "  $project_name:"
    echo "    cd $project_dir"
    echo "    $DEV_CMD"
    echo ""
done

echo "📖 访问导航页面:"
echo "  打开 playground/index.html 查看所有项目概览"
echo ""
echo "🔗 更多信息:"
echo "  查看 README.md 了解详细使用说明"