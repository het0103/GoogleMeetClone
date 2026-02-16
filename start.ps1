# Quick Start Script for Windows
# Double-click this file to start the server

Write-Host "🎥 GMeet Clone - Starting Server..." -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
if (-Not (Test-Path ".venv")) {
    Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
}

# Activate virtual environment
Write-Host "🔧 Activating virtual environment..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1

# Install/Update dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet

# Get local IP address
$localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*","Ethernet*" | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"} | Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "✅ Server is starting..." -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🌐 Access URLs:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "   Local:    http://localhost:5000" -ForegroundColor White
if ($localIP) {
    Write-Host "   Network:  http://$($localIP):5000" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📱 Share http://$($localIP):5000 with friends on same WiFi!" -ForegroundColor Green
} else {
    Write-Host "   Network:  (Could not detect IP)" -ForegroundColor Red
}
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 For remote testing, see TESTING_GUIDE.md" -ForegroundColor Yellow
Write-Host "🛑 Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
python server.py

# Keep window open on error
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Server stopped with errors!" -ForegroundColor Red
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
