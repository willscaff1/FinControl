Write-Host "🚀 INICIANDO SISTEMA FINANCEIRO COMPLETO" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

Write-Host "📡 1. Backend (API) iniciando..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'C:\financial-control-system\backend'; npm start" -WindowStyle Normal

Start-Sleep 3

Write-Host "� 2. Frontend Web iniciando..." -ForegroundColor Yellow  
Start-Process powershell -ArgumentList "-Command", "cd 'C:\financial-control-system\frontend-web'; npm start" -WindowStyle Normal

Start-Sleep 2

Write-Host "📱 3. App Expo iniciando..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'C:\financial-control-system\FinancialAppExpo'; npx expo start" -WindowStyle Normal

Write-Host ""
Write-Host "✅ SISTEMA COMPLETO INICIADO!" -ForegroundColor Green
Write-Host "🌐 Frontend Web: http://localhost:3000" -ForegroundColor Cyan
Write-Host "� Backend API:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "📱 Expo App:     Escaneie QR Code com Expo Go" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Para React Native puro:" -ForegroundColor Magenta
Write-Host "   cd FinancialAppMobile" -ForegroundColor Gray
Write-Host "   npx react-native run-android" -ForegroundColor Gray
