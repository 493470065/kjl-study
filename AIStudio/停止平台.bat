@echo off
chcp 65001 >nul
setlocal
REM MySQL 安装目录：可通过系统环境变量 MYSQL_HOME 覆盖（与 启动平台.bat 保持一致）
if not defined MYSQL_HOME set "MYSQL_HOME=E:\KjlStudy\mysql"
title 景磊的AI工作站 - 停止
echo ============================================
echo   景磊的AI工作站 停止
echo ============================================
echo.

REM ---- 停止后端 8091 ----
echo [停止] 正在停止后端服务 (8091) ...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8091 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
netstat -ano | findstr ":8091 " | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (echo [OK] 后端已停止) else (echo [警告] 8091 端口仍有进程)
echo.

REM ---- 停止前端 8090 ----
echo [停止] 正在停止前端服务 (8090) ...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8090 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
netstat -ano | findstr ":8090 " | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (echo [OK] 前端已停止) else (echo [警告] 8090 端口仍有进程)
echo.

REM ---- 停止残留 java/node 窗口 ----
taskkill /F /IM java.exe /FI "WINDOWTITLE eq RACC-后端-8091*" >nul 2>&1
taskkill /F /IM node.exe /FI "WINDOWTITLE eq RACC-前端-8090*" >nul 2>&1

REM ---- MySQL 用 mysqladmin 优雅关闭（避免强杀损坏数据）----
netstat -ano | findstr ":3306 " | findstr "LISTENING" >nul 2>&1
if errorlevel 1 goto mysql_not_running
echo [停止] 正在优雅关闭 MySQL (3306) ...
"%MYSQL_HOME%\bin\mysqladmin.exe" -u root -pracc123 shutdown >nul 2>&1
if errorlevel 1 (echo [警告] mysqladmin 关闭失败，请手动结束 3306 端口进程) else (echo [OK] MySQL 已关闭)
goto mysql_done
:mysql_not_running
echo [提示] MySQL 未在运行中。
:mysql_done

REM ---- 关闭残余的服务窗口 ----
taskkill /F /FI "WINDOWTITLE eq RACC-MySQL-3306*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq RACC-前端-8090*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq RACC-后端-8091*" >nul 2>&1

echo.
echo [完成] 平台已全部停止（若仍有进程，可手动查看任务管理器）
echo.
pause