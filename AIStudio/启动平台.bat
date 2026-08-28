@echo off
chcp 65001 >nul
setlocal
REM MySQL 安装目录：可通过系统环境变量 MYSQL_HOME 覆盖（新电脑路径不同时设置它即可）
if not defined MYSQL_HOME set "MYSQL_HOME=E:\KjlStudy\mysql"
title 景磊的AI乐园站 - 启动
echo ============================================
echo   景磊的AI乐园站 启动
echo   MySQL : localhost:3306  库 racc
echo   前端  : http://localhost:8090
echo   后端  : http://localhost:8091
echo ============================================
echo.

cd /d "%~dp0."

REM ============ 1. MySQL 3306 ============
netstat -ano | findstr ":3306 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 goto mysql_running
echo [启动] 正在启动 MySQL 8.0 ...
start "RACC-MySQL-3306" cmd /k ""%MYSQL_HOME%\bin\mysqld.exe" --defaults-file="%MYSQL_HOME%\my.ini" --console"
set /a mcount=0
:wait_mysql
set /a mcount+=1
netstat -ano | findstr ":3306 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 goto mysql_ready
if %mcount% geq 30 goto mysql_timeout
%SystemRoot%\System32\ping.exe -n 2 127.0.0.1 >nul
goto wait_mysql
:mysql_timeout
echo [警告] 等待 MySQL 超时，请查看 RACC-MySQL-3306 窗口的日志。
goto mysql_ready
:mysql_running
echo [提示] MySQL 已在运行中。
:mysql_ready
echo [OK] MySQL 就绪完成。
echo.

REM ============ 2. 前端 8090 ============
netstat -ano | findstr ":8090 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 goto frontend_running
echo [启动] 正在启动前端 (Vue3 + Vite) ...
start "RACC-前端-8090" cmd /k "cd /d %~dp0frontend && npm run dev"
echo [OK] 前端已开始启动执行。
goto frontend_done
:frontend_running
echo [提示] 前端端口 8090 已被占用，可能存在运行中。
:frontend_done
echo.

REM ============ 3. 后端 8091 ============
netstat -ano | findstr ":8091 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 goto backend_running
echo [启动] 正在启动后端 (Spring Boot + MySQL) ...
start "RACC-后端-8091" cmd /k "call %~dp0tools\env.cmd && cd /d %~dp0backend && mvn spring-boot:run -DskipTests"
echo [OK] 后端已开始启动执行。
goto backend_wait
:backend_running
echo [提示] 后端端口 8091 已被占用，可能存在运行中。
goto backend_ready
:backend_wait
echo [等待] 正在等待后端就绪（最长180秒）...
set /a count=0
:wait_backend
set /a count+=1
netstat -ano | findstr ":8091 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 goto backend_ready
if %count% geq 180 goto backend_timeout
%SystemRoot%\System32\ping.exe -n 2 127.0.0.1 >nul
goto wait_backend
:backend_timeout
echo [警告] 等待后端超时，请查看 RACC-后端-8091 窗口的日志。
echo 若后端未启动成功，多数是 MySQL 连接问题，可查看日志排查。
goto end
:backend_ready
echo [OK] 后端已经就绪。
echo.
echo ============================================
echo   启动完成，请访问:
echo     http://localhost:8090
echo   账号: admin   密码: admin123
echo ============================================
start "" http://localhost:8090
:end
echo.
pause