#!/usr/bin/env bash
# 启动 AIStudio 外网穿透（tunnelmole，纯 Node 客户端，无需注册）
#
# 用法：  bash tools/start-tunnel.sh [端口]
#   默认端口 8090（前端 Vite）；也可传 8091 直连后端 API。
#
# 说明：
#   - 免费版每次启动分配随机域名（形如 https://xxxx-ip-a-b-c-d.tunnelmole.net），
#     重启会变；需要固定域名要去 https://dashboard.tunnelmole.com 订阅后用
#     `tmole <port> as <subdomain>.tunnelmole.net`。
#   - 公网地址会写入项目根目录 tunnel-url.txt，方便查看。
#   - 客户端自带断线重连，保持本窗口/进程运行即可；关闭即外网失效。
#   - 前提：前端 Vite 已开 allowedHosts: true（vite.config.ts 已配置），
#     否则通过隧道域名访问会被 Vite 拦 403。

set -euo pipefail

PORT="${1:-8090}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_EXE="C:/Program Files/nodejs/node.exe"
TMOLE="C:/Users/Lenovo/.workbuddy/binaries/node/workspace/node_modules/tunnelmole/dist/bin/tunnelmole.js"
OUT="$ROOT/tunnel-url.txt"

if [ ! -f "$TMOLE" ]; then
  echo "未找到 tunnelmole，请先安装："
  echo "  cd C:/Users/Lenovo/.workbuddy/binaries/node/workspace && npm install tunnelmole"
  exit 1
fi

# 端口未监听则提示先启动平台
if ! netstat -ano | grep LISTENING | grep -q ":${PORT}\b"; then
  echo "警告：端口 ${PORT} 未监听，请先用 tools/start-backend.sh / 启动平台.bat 拉起服务"
fi

echo "正在穿透 http://localhost:${PORT} ..."
"$NODE_EXE" "$TMOLE" "$PORT" 2>&1 | tee "$OUT"
