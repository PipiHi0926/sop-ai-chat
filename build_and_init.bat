@echo off
chcp 65001 >nul

echo =================================================
echo   [AI SOP Platform] 初始化與建置腳本
echo =================================================
echo.

echo [1/3] 安裝 Python 後端依賴套件 (Installing Python dependencies)...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [錯誤] Python 套件安裝失敗，請檢查網路連線或 Python 環境。
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] 安裝 Node.js 前端依賴套件 (Installing Node.js dependencies)...
cd /d "%~dp0frontend"
call npm install
if %errorlevel% neq 0 (
    echo [錯誤] npm install 失敗，請確認是否安裝 Node.js，或檢查公司網路 Proxy 設定。
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] 建置前端 React 應用程式 (Building React Frontend)...
call npm run build
if %errorlevel% neq 0 (
    echo [錯誤] npm run build 失敗。
    pause
    exit /b %errorlevel%
)

echo.
echo =================================================
echo   建置完成！(Build Successfully)
echo   正在為您啟動服務...
echo =================================================
cd /d "%~dp0"
call start.bat
