Write-Host "🚀 INICIANDO SISTEMA FINANCEIRO COMPLETO" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

# Função para verificar se uma porta está sendo usada
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Função para aguardar um serviço ficar online
function Wait-ForService {
    param([int]$Port, [string]$ServiceName)
    Write-Host "⏳ Aguardando $ServiceName ficar online na porta $Port..." -ForegroundColor Yellow
    $attempts = 0
    while (!(Test-Port -Port $Port) -and $attempts -lt 30) {
        Start-Sleep 2
        $attempts++
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
    if (Test-Port -Port $Port) {
        Write-Host ""
        Write-Host "✅ $ServiceName está online!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️  $ServiceName pode não estar rodando corretamente" -ForegroundColor Red
    }
}

Write-Host "📡 1. Backend (API) iniciando..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'C:\financial-control-system\backend'; npm start" -WindowStyle Normal

Wait-ForService -Port 3001 -ServiceName "Backend API"

Write-Host "🌐 2. Frontend Web iniciando..." -ForegroundColor Yellow  
Start-Process powershell -ArgumentList "-Command", "cd 'C:\financial-control-system\frontend-web'; npm start" -WindowStyle Normal

Wait-ForService -Port 3000 -ServiceName "Frontend Web"

Write-Host "📱 3. App Expo iniciando..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'C:\financial-control-system\FinancialApp'; npx expo start" -WindowStyle Normal

# Expo não usa porta fixa, então aguarda um pouco
Start-Sleep 5

Write-Host ""
Write-Host "✅ SISTEMA COMPLETO INICIADO!" -ForegroundColor Green
Write-Host "🌐 Frontend Web: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend API:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "📱 Expo App:     Escaneie QR Code com Expo Go" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Para React Native puro:" -ForegroundColor Magenta
Write-Host "   cd FinancialAppMobile" -ForegroundColor Gray
Write-Host "   npx react-native run-android" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Para parar todos os serviços:" -ForegroundColor Red
Write-Host "   Ctrl+C em cada janela ou feche os terminais" -ForegroundColor Gray
Write-Host ""
Write-Host "🔄 Para reiniciar, execute novamente: .\start.ps1" -ForegroundColor Blue
