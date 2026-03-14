@echo off
chcp 65001 >nul
title Taboca Gestão — Iniciando Sistema

echo.
echo ╔══════════════════════════════════════════╗
echo ║   🥖  TABOCA GESTÃO — iniciando...       ║
echo ╚══════════════════════════════════════════╝
echo.

:: Vai para o diretório do script
cd /d "%~dp0"

:: ─── Verifica se Node.js está instalado ────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado!
    echo.
    echo    Instale o Node.js em: https://nodejs.org
    echo    ^(versão recomendada: 18 ou superior^)
    echo.
    echo    Após instalar, execute este arquivo novamente.
    echo.
    start https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo ✅ Node.js encontrado: %NODE_VER%

:: ─── Instala dependências se necessário ────────────
if not exist "node_modules\" (
    echo.
    echo 📦 Instalando dependências pela primeira vez...
    echo    ^(isso pode levar 1-2 minutos^)
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo ❌ Erro ao instalar dependências.
        echo    Verifique sua conexão com a internet e tente novamente.
        pause
        exit /b 1
    )
    echo.
    echo ✅ Dependências instaladas com sucesso!
)

:: ─── Abre o navegador após 3 segundos ──────────────
echo.
echo 🚀 Iniciando Taboca Gestão em http://localhost:3000
echo.
echo    Para encerrar o sistema, feche esta janela.
echo.

start "" /b cmd /c "timeout /t 3 >nul && start http://localhost:3000"

:: ─── Inicia o servidor ─────────────────────────────
call npm run dev

pause
