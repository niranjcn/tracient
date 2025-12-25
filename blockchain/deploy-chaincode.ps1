# TRACIENT Blockchain - Windows PowerShell Deploy Launcher
# 
# This script deploys chaincode through WSL.
#
# Usage:
#   .\deploy-chaincode.ps1              # Deploy chaincode
#   .\deploy-chaincode.ps1 -Version 3.0 # Deploy specific version
#

param(
    [string]$Version = "2.0",
    [switch]$Help
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WslPath = $ScriptDir -replace '\\', '/' -replace '^([A-Za-z]):', '/mnt/$1'.ToLower()

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      TRACIENT Chaincode Deployment (Windows)               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if ($Help) {
    Write-Host "Usage: .\deploy-chaincode.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Version   Chaincode version (default: 2.0)"
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
Write-Host "Deploying chaincode version: $Version" -ForegroundColor Blue

wsl -e bash "$WslPath/deploy-chaincode.sh" --version $Version

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Chaincode deployed successfully!" -ForegroundColor Green
}
