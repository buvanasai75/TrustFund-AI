Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " TrustFund AI - Multi-Tier Platform Unified Launcher" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. MongoDB Server
$dbPath = Join-Path $projectRoot "data\db"
if (!(Test-Path $dbPath)) { New-Item -ItemType Directory -Force -Path $dbPath | Out-Null }
$mongodExe = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"
if (Test-Path $mongodExe) {
    Write-Host "[1/4] Starting MongoDB Server on port 27017..." -ForegroundColor Green
    $mongoProc = Start-Process -FilePath $mongodExe -ArgumentList "--dbpath `"$dbPath`" --port 27017 --bind_ip 127.0.0.1" -PassThru
} else {
    Write-Host "[1/4] MongoDB binary not found at default path. Ensure mongod service is active." -ForegroundColor Yellow
}

Start-Sleep -Seconds 2

# 2. Python FastAPI AI Service
$pyExe = Join-Path $projectRoot "python_runtime\python.exe"
if (!(Test-Path $pyExe)) { $pyExe = "python.exe" }
$aiDir = Join-Path $projectRoot "ai-service"
Write-Host "[2/4] Starting Python FastAPI AI Microservice on port 8000..." -ForegroundColor Green
$aiProc = Start-Process -FilePath $pyExe -ArgumentList "-m uvicorn main:app --host 127.0.0.1 --port 8000" -WorkingDirectory $aiDir -PassThru

Start-Sleep -Seconds 2

# 3. Node.js Express Backend
$backendDir = Join-Path $projectRoot "backend"
Write-Host "[3/4] Starting Node.js Express Backend on port 5000..." -ForegroundColor Green
$backendProc = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $backendDir -PassThru

Start-Sleep -Seconds 2

# 4. React Vite Frontend
$frontendDir = Join-Path $projectRoot "frontend"
Write-Host "[4/4] Starting React Vite Frontend on port 5173..." -ForegroundColor Green
$npmCmd = "C:\Program Files\nodejs\npm.cmd"
if (!(Test-Path $npmCmd)) { $npmCmd = "npm.cmd" }
$frontendProc = Start-Process -FilePath $npmCmd -ArgumentList "run dev" -WorkingDirectory $frontendDir -PassThru

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " All services started successfully!" -ForegroundColor Green
Write-Host " Frontend:   http://localhost:5173" -ForegroundColor White
Write-Host " Backend:    http://localhost:5000/api/health" -ForegroundColor White
Write-Host " AI Service: http://localhost:8000/docs" -ForegroundColor White
Write-Host " Press Ctrl+C in this terminal to stop all services." -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan

try {
    Wait-Process -Id $frontendProc.Id
} finally {
    Write-Host "Shutting down background services..." -ForegroundColor Yellow
    if ($frontendProc) { Stop-Process -Id $frontendProc.Id -Force -ErrorAction SilentlyContinue }
    if ($backendProc) { Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue }
    if ($aiProc) { Stop-Process -Id $aiProc.Id -Force -ErrorAction SilentlyContinue }
    if ($mongoProc) { Stop-Process -Id $mongoProc.Id -Force -ErrorAction SilentlyContinue }
    Write-Host "All processes stopped cleanly." -ForegroundColor Green
}
