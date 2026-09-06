#!/bin/bash
# ============================================================
# RACC 平台后端统一启动脚本
# 用法:
#   tools/start-backend.sh            直接启动（要求 jar 已存在）
#   tools/start-backend.sh --build    先构建再启动（构建前要求 8091 已停止，否则 jar 被锁）
#
# 说明:
# - data-dir 已改为绝对路径，从任何 cwd 执行本脚本都安全
# - 构建使用 classworlds Launcher 直跑 Maven（mvn.cmd 在 bash/PowerShell 后台均受限）
# - 启动后会打印 [自检] 日志：skills 等目录解析路径与计数，空目录会在日志中直接暴露
# - 停止后端: PowerShell 执行
#   Get-NetTCPConnection -LocalPort 8091 -State Listen | Select -Exp OwningProcess -Unique | % { Stop-Process -Id $_ -Force }
# ============================================================
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
source tools/env.sh

JAR=backend/target/racc-platform-1.0.0.jar

if [ "$1" = "--build" ]; then
  # 构建前检查 8091 是否仍在运行（运行中会锁 jar 导致 repackage 失败）
  if curl -s -o /dev/null --max-time 3 http://localhost:8091/; then
    echo "[start] 错误：8091 端口仍有后端在运行，会锁住 jar。请先用上方 PowerShell 命令停止后再 --build。" >&2
    exit 1
  fi
  echo "[start] 构建 jar ..."
  CWJAR=$(ls "$ROOT/tools/apache-maven-3.9.16/boot/"plexus-classworlds-*.jar | head -1 | sed 's|^/f/|F:/|')
  ( cd "$ROOT/backend" && "$JAVA_HOME/bin/java.exe" -classpath "$CWJAR" \
    "-Dclassworlds.conf=F:/kjl-study/AIStudio/tools/apache-maven-3.9.16/bin/m2.conf" \
    "-Dmaven.home=F:/kjl-study/AIStudio/tools/apache-maven-3.9.16" \
    "-Dmaven.multiModuleProjectDirectory=F:/kjl-study/AIStudio/backend" \
    org.codehaus.plexus.classworlds.launcher.Launcher -q -DskipTests package )
  echo "[start] 构建完成: $(ls -la "$JAR" | awk '{print $5, $6, $7, $8}')"
fi

if [ ! -f "$JAR" ]; then
  echo "[start] 错误：找不到 $JAR，请先用 --build 构建。" >&2
  exit 1
fi

echo "[start] 启动后端 8091 ..."
exec "$JAVA_HOME/bin/java.exe" -Dserver.port=8091 -jar "$JAR"
