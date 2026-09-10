@echo off
chcp 65001 >nul
setlocal
REM MySQL 安装目录：可通过系统环境变量 MYSQL_HOME 覆盖（新电脑路径不同时设置它即可）
if not defined MYSQL_HOME set "MYSQL_HOME=E:\KjlStudy\mysql"
title 景磊的AI工作站 - 启动
echo ============================================
echo   景磊的AI工作站 启动（零窗口静默模式）
echo   MySQL : localhost:3306  库 racc
echo   前端  : http://localhost:8090
echo   后端  : http://localhost:8091
echo   日志  : logs\mysql.log / frontend.log / backend.log
echo ============================================
echo.

cd /d "%~dp0."
if not exist logs mkdir logs

REM ============ 1. MySQL 3306 ============
netstat -ano | findstr ":3306 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 goto mysql_running
echo [启动] 正在启动 MySQL 8.0（后台隐藏）...
powershell -NoProfile -Command "Start-Process -FilePath '%MYSQL_HOME%\bin\mysqld.exe' -ArgumentList '--defaults-file=%MYSQL_HOME%\my.ini','--console' -WindowStyle Hidden -RedirectStandardOutput '%~dp0logs\mysql.log' -RedirectStandardError '%~dp0logs\mysql-err.log'"
set /a mcount=0
:wait_mysql
set /a mcount+=1
netstat -ano | findstr ":3306 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 goto mysql_ready
if %mcount% geq 30 goto mysql_timeout
%SystemRoot%\System32\ping.exe -n 2 127.0.0.1 >nul
goto wait_mysql
:mysql_timeout
echo [警告] 等待 MySQL 超时，请查看 logs\mysql.log 与 logs\mysql-err.log。
goto mysql_ready
:mysql_running
echo [提示] MySQL 已在运行中。
:mysql_ready
echo [OK] MySQL 就绪完成。
echo.

REM ============ 2. 前端 8090 ============
netstat -ano | findstr ":8090 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 goto frontend_running
echo [启动] 正在启动前端 (Vue3 + Vite，后台隐藏)...
powershell -NoProfile -Command "Start-Process cmd -ArgumentList '/c cd /d %~dp0frontend && npm run dev >> %~dp0logs\frontend.log 2>&1' -WindowStyle Hidden"
echo [OK] 前端已开始启动执行。
goto frontend_done
:frontend_running
echo [提示] 前端端口 8090 已被占用，可能存在运行中。
:frontend_done
echo.

REM ============ 3. 后端 8091（直接启动已构建 jar，改后端代码后需重新构建） ============
netstat -ano | findstr ":8091 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 goto backend_running
if not exist "%~dp0backend\target\racc-platform-1.0.0.jar" (
    echo [错误] 找不到 backend\target\racc-platform-1.0.0.jar
    echo        请先构建：bash tools/start-backend.sh --build  或  mvn -f backend/pom.xml package -DskipTests
    goto end
)
echo [启动] 正在启动后端 (Spring Boot jar，后台隐藏)...
powershell -NoProfile -Command "Start-Process cmd -ArgumentList '/c call %~dp0tools\env.cmd && cd /d %~dp0backend && java -Dserver.port=8091 -jar target\racc-platform-1.0.0.jar >> %~dp0logs\backend.log 2>&1' -WindowStyle Hidden"
echo [OK] 后端已开始启动执行。
goto backend_wait
:backend_running
echo [提示] 后端端口 8091 已被占用，可能存在运行中。
goto backend_ready
:backend_wait
echo [等待] 正在等待后端就绪（最长120秒）...
set /a count=0
:wait_backend
set /a count+=1
netstat -ano | findstr ":8091 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 goto backend_ready
if %count% geq 120 goto backend_timeout
%SystemRoot%\System32\ping.exe -n 2 127.0.0.1 >nul
goto wait_backend
:backend_timeout
echo [警告] 等待后端超时，请查看 logs\backend.log。
echo 若后端未启动成功，多数是 MySQL 连接或 jar 未构建，可查看日志排查。
goto end
:backend_ready
echo [OK] 后端已经就绪。
echo.
echo ============================================
echo   启动完成，请访问:
echo     http://localhost:8090
echo   账号: admin   密码: admin123
echo   查看日志: logs\ 目录（mysql/frontend/backend.log）
echo ============================================
start "" http://localhost:8090
:end
echo.
pause