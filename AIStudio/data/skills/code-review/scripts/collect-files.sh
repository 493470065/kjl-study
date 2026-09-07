#!/bin/bash
# 文件收集脚本
# 收集需要扫描的源码文件

set -e

# 默认扫描类型：全量
SCAN_TYPE="${1:-initial}"

echo "=== 收集扫描文件（模式: $SCAN_TYPE）==="

if [ "$SCAN_TYPE" = "initial" ]; then
    # 首次扫描：收集所有源码文件
    echo "模式: 首次全量扫描"

    find . -type f \
        \( -name "*.java" -o \
           -name "*.py" -o \
           -name "*.js" -o \
           -name "*.ts" -o \
           -name "*.vue" -o \
           -name "*.jsx" -o \
           -name "*.tsx" -o \
           -name "*.go" \
        \) \
        ! -path "*/node_modules/*" \
        ! -path "*/target/*" \
        ! -path "*/test/*" \
        ! -path "*/tests/*" \
        ! -path "*/__pycache__/*" \
        ! -path "*/.git/*" \
        ! -name "*test*.py" \
        ! -name "*Test.java" \
        ! -name "*.test.ts" \
        ! -name "*.spec.ts" \
        ! -name "*.test.js" \
        | sort

elif [ "$SCAN_TYPE" = "incremental" ]; then
    # 增量扫描：收集变更文件
    echo "模式: 增量变更扫描"

    # 从 prompt 提取 commit（如果提供）
    # 优先使用 START_COMMIT/BASE_COMMIT，向后兼容
    if [ -n "$START_COMMIT" ]; then
        start_commit="$START_COMMIT"
    elif [ -n "$BASE_COMMIT" ]; then
        start_commit="$BASE_COMMIT"  # 向后兼容
    else
        # fallback：从 scan_record.json 读取
        RECORD_FILE=".claude/scan-records/scan_record.json"
        if [ -f "$RECORD_FILE" ]; then
            start_commit=$(cat "$RECORD_FILE" | grep -o '"last_scan_commit":"[^"]*"' | cut -d'"' -f4)
        fi
    fi

    # 目标 commit（默认 HEAD）
    if [ -n "$END_COMMIT" ]; then
        end_commit="$END_COMMIT"
    else
        end_commit="HEAD"
    fi

    if [ -z "$start_commit" ]; then
        echo "错误: 无法获取 start_commit"
        echo "提示: 请在 prompt 中提供 START_COMMIT 或 BASE_COMMIT"
        exit 1
    fi

    # 获取变更文件
    echo "📊 增量扫描统计："
    echo "   基准提交: $start_commit"
    echo "   目标提交: $end_commit"

    # 获取变更统计
    echo "   变更文件统计:"
    git diff --stat "$start_commit".."$end_commit" 2>/dev/null || true

    # 获取变更文件列表
    git diff --name-only "$start_commit".."$end_commit" 2>/dev/null | \
        grep -E '\.(java|py|js|ts|vue|jsx|tsx|go)$' | \
        grep -v -E "(test|spec|node_modules|target)" | \
        sort

else
    echo "错误: 未知的扫描类型 '$SCAN_TYPE'"
    echo "用法: $0 <initial|incremental> [base_commit]"
    exit 1
fi
