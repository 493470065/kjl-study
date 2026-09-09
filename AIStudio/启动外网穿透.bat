@echo off
chcp 65001 >nul
title AIStudio 外网穿透 (tunnelmole)

set PORT=8090
set NODE_EXE=C:\Program Files\nodejs\node.exe
set TMOLE=C:\Users\Lenovo\.workbuddy\binaries\node\workspace\node_modules\tunnelmole\dist\bin\tunnelmole.js

echo ============================================
echo   AIStudio 外网穿透
echo   本机服务: http://localhost:%PORT%
echo ============================================
echo.
echo 启动后会显示形如下面的公网地址：
echo   https://xxxx.tunnelmole.net
echo 把它发给同事即可访问。本窗口关掉 = 外网失效。
echo.

if not exist "%TMOLE%" (
  echo [错误] 未找到 tunnelmole，请先执行：
  echo   cd C:\Users\Lenovo\.workbuddy\binaries\node\workspace ^&^& npm install tunnelmole
  pause
  exit /b 1
)

"%NODE_EXE%" "%TMOLE%" %PORT%
pause
