#!/bin/bash
# 环境检查脚本
# 用于检查扫描所需的环境和工具

set -e

echo "=== 检查扫描环境 ==="

# 检查 Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo "✅ Git: $GIT_VERSION"
else
    echo "❌ Git: 未安装"
    exit 1
fi

# 检查是否在 Git 仓库中
if git rev-parse --git-dir &> /dev/null; then
    echo "✅ Git 仓库: 检测到"
else
    echo "❌ Git 仓库: 未检测到"
    exit 1
fi

# 检查 Python（可选）
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✅ Python: $PYTHON_VERSION"
else
    echo "⚠️  Python: 未安装（可选）"
fi

# 检查 Java（可选）
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    echo "✅ Java: $JAVA_VERSION"
else
    echo "⚠️  Java: 未安装（可选）"
fi

# 检查 Node.js（可选）
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "⚠️  Node.js: 未安装（可选）"
fi

echo ""
echo "=== 环境检查完成 ==="
