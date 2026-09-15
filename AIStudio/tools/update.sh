#!/bin/bash
# ============================================================
# kjl-study 一键更新脚本：git pull → 重建 jar → 重启后端 → 自检断言
#
# 用法:
#   bash tools/update.sh            # 完整流程（pull + 重建 + 重启 + 校验）
#   bash tools/update.sh --skip-pull  # 跳过 git pull（仅重建+重启，用于本地改码后）
#
# 解决的问题（2026-09-15 踩坑）:
#   上游提交把 application.yml 的 racc.data-dir 默认值改成作者机器的
#   E:/KjlStudy/AI/kjl-study/...，本机 pull 后技能列表变空（后端在 E 盘新建空目录）。
#   本脚本最后一步会断言 skills 目录与本机一致且数量>0，复发时立即报错而不是静默失效。
#
# 本机路径约定（数据目录通过 env.cmd / env.sh 的 RACC_DATADIR 覆盖 yml 默认值）:
#   代码: F:\kjl-study\AIStudio   数据: F:\kjl-study\AIStudio\data   MySQL: E:\KjlStudy\mysql
# ============================================================
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
source tools/env.sh

JAR=backend/target/racc-platform-1.0.0.jar
LOG=logs/backend.log
FRONTEND_URL=http://localhost:8090
BACKEND_URL=http://localhost:8091

fail() { echo "[update] ❌ $*" >&2; exit 1; }
ok()   { echo "[update] ✅ $*"; }

# ---------- 0. 前置检查 ----------
[ -f tools/env.cmd ] || fail "找不到 tools/env.cmd"
[ -f "$JAR" ] || { echo "[update] jar 不存在，将执行构建"; }

# ---------- 1. git pull ----------
if [ "$1" != "--skip-pull" ]; then
  echo "[update] 1/5 git fetch + 检查本地改动..."
  if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    fail "本地有未提交改动，先提交或 stash 后再更新：$(git status --porcelain --untracked-files=no | head -5)"
  fi
  git fetch origin
  LOCAL=$(git rev-parse HEAD); REMOTE=$(git rev-parse origin/main)
  if [ "$LOCAL" = "$REMOTE" ]; then
    ok "已是最新 ($LOCAL)"
  else
    echo "[update] 有新提交: $(git log --oneline HEAD..origin/main | head -5)"
    git merge --ff-only origin/main || fail "无法 fast-forward（本地有分叉提交），请手动处理"
    ok "已更新到 $REMOTE"
  fi
else
  echo "[update] 1/5 跳过 git pull (--skip-pull)"
fi

# ---------- 2. 配置漂移检查（重点防线） ----------
echo "[update] 2/5 检查 application.yml 数据目录配置..."
YML=backend/src/main/resources/application.yml
if grep -E '^\s*data-dir:' "$YML" | grep -qE 'E:/KjlStudy|E:\\KjlStudy'; then
  echo "[update] ⚠️  application.yml data-dir 又指向上游作者的 E 盘路径！"
  echo "[update]    本机通过 env.cmd 的 RACC_DATADIR=F:\\kjl-study\\AIStudio\\data 覆盖，启动不受影响；"
  echo "[update]    但建议下次提交时把默认值改回 \${RACC_DATADIR:...} 形式。"
else
  ok "data-dir 配置正常（或已被环境变量覆盖）"
fi

# ---------- 3. 停旧后端 → 重建 jar ----------
echo "[update] 3/5 停止 8091 旧后端（如有）..."
# 注意: 8091 无进程时 Get-NetTCPConnection 报错属预期，PowerShell 会以非零码退出，
# set -e 会误杀脚本，故这里必须显式 exit 0
powershell -NoProfile -Command "\$c = Get-NetTCPConnection -LocalPort 8091 -State Listen -ErrorAction SilentlyContinue; if (\$c) { \$c | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id \$_ -Force }; Write-Host '[update]    已停止旧后端' } else { Write-Host '[update]    8091 无运行中进程' }; exit 0" 2>/dev/null
sleep 2

echo "[update] 重建 jar ..."
CWJAR=$(cygpath -w "$(ls "$ROOT/tools/apache-maven-3.9.16/boot/"plexus-classworlds-*.jar | head -1)")
( cd "$ROOT/backend" && "$JAVA_HOME/bin/java.exe" -classpath "$CWJAR" \
  "-Dclassworlds.conf=$ROOT/tools/apache-maven-3.9.16/bin/m2.conf" \
  "-Dmaven.home=$ROOT/tools/apache-maven-3.9.16" \
  "-Dmaven.multiModuleProjectDirectory=$ROOT/backend" \
  org.codehaus.plexus.classworlds.launcher.Launcher -q -DskipTests package ) \
  || fail "jar 构建失败（上游代码可能编译不过，看上方 Maven 输出）"
[ -f "$JAR" ] || fail "构建后 jar 仍不存在"
ok "构建完成: $(ls -la "$JAR" | awk '{print $5}') bytes"

# ---------- 4. 重启后端 ----------
# ROOTW: Windows 风格路径（cmd 不认 /f/... 这种 POSIX 路径）
ROOTW=$(cygpath -w "$ROOT")
echo "[update] 4/5 启动后端 8091 ..."
powershell -NoProfile -Command "Start-Process cmd -ArgumentList '/c call $ROOTW\\tools\\env.cmd && cd /d $ROOTW\\backend && java -Dserver.port=8091 -jar target\\racc-platform-1.0.0.jar >> $ROOTW\\logs\\backend.log 2>&1' -WindowStyle Hidden"
for i in $(seq 1 60); do
  netstat -ano | grep ":8091 " | grep -q LISTENING && break
  [ $i -eq 60 ] && fail "后端 180s 未就绪，查看 $LOG"
  sleep 3
done
ok "后端端口就绪"

# ---------- 5. 自检断言：技能目录 + 数量 + 登录 ----------
echo "[update] 5/5 校验数据目录与技能加载..."
sleep 5  # 等 Spring 完全起来（端口先于应用就绪）
SKILLS_DIR=$(tail -c 300000 "$LOG" | grep -aoE 'skills = [^ ]+' | tail -1 | sed 's/skills = //')
echo "[update]    本轮自检 skills 目录: $SKILLS_DIR"
case "$SKILLS_DIR" in
  F:\\kjl-study\\AIStudio\\data\\skills|F:/kjl-study/AIStudio/data/skills)
    ok "skills 目录指向本机 F 盘" ;;
  *) fail "skills 目录漂移为 '$SKILLS_DIR'（应为 F 盘 data/skills）！
   原因几乎必然是上游改了 yml 默认值且环境变量未生效。
   处理: 确认 tools/env.cmd 里有 set \"RACC_DATADIR=F:\\kjl-study\\AIStudio\\data\" 后重跑本脚本。" ;;
esac

TOKEN=$(curl -s -X POST $BACKEND_URL/api/auth/login -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
[ -n "$TOKEN" ] || fail "登录失败，后端可能未完全启动"
SKILL_COUNT=$(curl -s "$BACKEND_URL/api/skills" -H "Authorization: Bearer $TOKEN" | grep -o '"name":"' | wc -l)
[ "$SKILL_COUNT" -gt 0 ] || fail "技能列表为空！磁盘目录: $(ls data/skills 2>/dev/null | wc -l) 个；检查 RACC_DATADIR"
ok "技能加载 $SKILL_COUNT 个（磁盘 $(ls data/skills | wc -l) 个）"

# TFS 桥接（需求看板等依赖）：数据库重建会丢 mcp_servers 注册，种子 SQL 已补录但仍需断言
MCP_NAME=$(curl -s "$BACKEND_URL/api/mcp/servers" -H "Authorization: Bearer $TOKEN" | grep -o '"name":"tfs-query-winex"' | head -1)
if [ -n "$MCP_NAME" ]; then
  ok "MCP Server tfs-query-winex 已注册"
else
  echo "[update] ⚠️  MCP Server tfs-query-winex 未注册（TFS 桥接类功能不可用）"
  echo "[update]    处理: MCP管理 菜单重新注册，或在 racc 库补执行 db/02_seed.sql 中的 mcp_servers INSERT"
fi

# 前端顺带确认
FRONT_CODE=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
[ "$FRONT_CODE" = "200" ] && ok "前端 $FRONTEND_URL 正常" || echo "[update] ⚠️ 前端返回 $FRONT_CODE（如未启动可运行 启动平台.bat）"

echo ""
echo "============================================"
echo "  更新完成，访问: $FRONTEND_URL"
echo "============================================"
