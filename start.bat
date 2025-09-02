@echo off
echo Iniciando Sistema Financeiro Completo
echo =====================================
echo.

echo 1. Backend API iniciando...
start "Backend API" cmd /k "cd /d C:\financial-control-system\backend && npm start"

timeout /t 3 /nobreak >nul

echo 2. Frontend Web iniciando...
start "Frontend Web" cmd /k "cd /d C:\financial-control-system\frontend-web && npm start"

timeout /t 2 /nobreak >nul

echo 3. App Expo iniciando...
start "App Expo" cmd /k "cd /d C:\financial-control-system\FinancialApp && npx expo start"

echo.
echo Sistema iniciado com sucesso!
echo Frontend Web: http://localhost:3000
echo Backend API: http://localhost:3001
echo Expo App: Escaneie QR Code com Expo Go
echo.
echo Para parar: Feche as janelas do cmd
pause
