# TRACIENT Blockchain - Windows PowerShell Restart Launcher
# 
# This script runs the restart script through WSL.
# Preserves all blockchain data.
#
# Usage:
#   .\restart-network.ps1              # Restart network
#   .\restart-network.ps1 --force      # Force restart
#

param(
    [switch]$Force,
    [switch]$Help
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WslPath = $ScriptDir -replace '\\', '/' -replace '^([A-Za-z]):', '/mnt/$1'.ToLower()

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      TRACIENT Network Restart (Windows)                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if ($Help) {
    Write-Host "Usage: .\restart-network.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Force     Force restart even if running"
    Write-Host "  -Help      Show this help"
    exit 0
}

# Check WSL
try {
    wsl --version 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "WSL error" }
} catch {
    Write-Host "✗ WSL is not installed or not running." -ForegroundColor Red
    exit 1
}

Write-Host "✓ WSL detected" -ForegroundColor Green

if ($Force) {
    wsl -e bash "$WslPath/restart-network.sh" --force
} else {
    wsl -e bash "$WslPath/restart-network.sh"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Network restarted successfully!" -ForegroundColor Green
}
