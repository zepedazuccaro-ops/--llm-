@echo off
chcp 65001 >nul
title 深渊手札 — LLM文字冒险RPG

cd /d "%~dp0"

echo.
echo   ========================================
echo        深渊手札 - Abyss Codex
echo        LLM 文字冒险 RPG
echo   ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [*] 首次运行，正在安装依赖...
    call npm install
    echo.
)

echo [*] 正在启动开发服务器...
echo [*] 浏览器打开后即可游玩
echo.

start http://localhost:5173

call npm run dev

pause
