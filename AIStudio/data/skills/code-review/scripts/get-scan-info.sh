#!/bin/bash
# 扫描信息脚本
# 获取仓库和 git 信息

set -e

echo "=== 扫描信息 ==="

# 当前 commit
HEAD_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
echo "HEAD_COMMIT: $HEAD_COMMIT"

# 当前分支
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "BRANCH: $BRANCH"

# 远程仓库
REMOTE=$(git config --get remote.origin.url 2>/dev/null || echo "none")
echo "REMOTE: $REMOTE"

# 仓库根目录
ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
echo "ROOT_DIR: $ROOT_DIR"

# 项目名称
PROJECT_NAME=$(basename "$ROOT_DIR")
echo "PROJECT_NAME: $PROJECT_NAME"

# 最后提交时间
LAST_COMMIT_TIME=$(git log -1 --format=%ci 2>/dev/null || echo "unknown")
echo "LAST_COMMIT_TIME: $LAST_COMMIT_TIME"

# 文件统计
JAVA_FILES=$(find . -name "*.java" ! -path "*/test/*" 2>/dev/null | wc -l | xargs)
PY_FILES=$(find . -name "*.py" ! -path "*/test/*" ! -path "*/__pycache__/*" 2>/dev/null | wc -l | xargs)
JS_FILES=$(find . -name "*.js" ! -path "*/node_modules/*" 2>/dev/null | wc -l | xargs)

echo "FILE_COUNTS:"
echo "  Java: $JAVA_FILES"
echo "  Python: $PY_FILES"
echo "  JavaScript: $JS_FILES"

echo ""
echo "=== 信息获取完成 ==="
