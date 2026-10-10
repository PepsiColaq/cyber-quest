@echo off
chcp 65001 >nul
cd /d "%~dp0"

where msedge >nul 2>&1
if %errorlevel%==0 (
  start "" msedge --new-window --start-fullscreen "%~dp0index.html"
  exit /b 0
)

where chrome >nul 2>&1
if %errorlevel%==0 (
  start "" chrome --new-window --start-fullscreen "%~dp0index.html"
  exit /b 0
)

start "" "%~dp0index.html"
