Write-Host "Iniciando Sistema Financeiro Completo" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

Write-Host "1. Backend API iniciando..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\financial-control-system\backend; npm start"

Start-Sleep 3

Write-Host "2. Frontend Web iniciando..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\financial-control-system\frontend-web; npm start"

Start-Sleep 2

Write-Host "3. App Expo iniciando..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\financial-control-system\FinancialApp; npx expo start"

Write-Host ""
Write-Host "Sistema iniciado com sucesso!" -ForegroundColor Green
Write-Host "Frontend Web: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Expo App: Escaneie QR Code com Expo Go" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para parar: Feche as janelas do PowerShell" -ForegroundColor Red

Read-Host "Pressione Enter para fechar..."
