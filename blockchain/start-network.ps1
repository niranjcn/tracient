# TRACIENT Blockchain - Windows PowerShell Launcher
# 
# This script runs the appropriate bash script through WSL.
# Use this from Windows PowerShell to manage the blockchain network.
#
# Usage:
#   .\start-network.ps1              # Start network
#   .\start-network.ps1 clean        # Clean start
#   .\start-network.ps1 --network-only  # Network only
#

param(
    [Parameter(Position=0)]
    [string]$Mode = "",
    [switch]$Help
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WslPath = $ScriptDir -replace '\\', '/' -replace '^([A-Za-z]):', '/mnt/$1'.ToLower()

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      TRACIENT Blockchain - Windows Launcher                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if ($Help) {
    Write-Host "Usage: .\start-network.ps1 [MODE]"
    Write-Host ""
    Write-Host "Modes:"
    Write-Host "  (none)           Start with data preservation"
    Write-Host "  clean            Fresh start, remove all data"
    Write-Host "  --network-only   Start network only, no chaincode"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\start-network.ps1"
    Write-Host "  .\start-network.ps1 clean"
    Write-Host "  .\start-network.ps1 --network-only"
    exit 0
}

# Check if WSL is available
try {
    $wslVersion = wsl --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "WSL not found"
    }
} catch {
    Write-Host "✗ WSL is not installed or not running." -ForegroundColor Red
    Write-Host "  Please install WSL: wsl --install" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ WSL detected" -ForegroundColor Green
Write-Host "Running: $WslPath/start-network.sh $Mode" -ForegroundColor Blue
Write-Host ""

# Run the bash script through WSL
if ($Mode) {
    wsl -e bash "$WslPath/start-network.sh" $Mode
} else {
    wsl -e bash "$WslPath/start-network.sh"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "✓ Operation completed successfully!" -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host "✗ Operation failed. Check the output above for errors." -ForegroundColor Red
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Red
}
