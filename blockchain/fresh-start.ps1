# TRACIENT Blockchain - Windows PowerShell Fresh Start Launcher
# 
# This script performs complete cleanup through WSL.
# WARNING: ALL DATA WILL BE DELETED!
#
# Usage:
#   .\fresh-start.ps1              # Cleanup and restart
#   .\fresh-start.ps1 -CleanupOnly # Cleanup only
#

param(
    [switch]$CleanupOnly,
    [switch]$Yes,
    [switch]$Help
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WslPath = $ScriptDir -replace '\\', '/' -replace '^([A-Za-z]):', '/mnt/$1'.ToLower()

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      TRACIENT Fresh Start (Windows)                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  WARNING: This will DELETE ALL BLOCKCHAIN DATA!" -ForegroundColor Red
Write-Host ""

if ($Help) {
    Write-Host "Usage: .\fresh-start.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -CleanupOnly   Cleanup only, don't restart"
    Write-Host "  -Yes           Skip confirmation"
    Write-Host "  -Help          Show this help"
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

$args = @()
if ($CleanupOnly) { $args += "--cleanup" }
if ($Yes) { $args += "--yes" }

if ($args.Count -gt 0) {
    wsl -e bash "$WslPath/fresh-start.sh" $args
} else {
    wsl -e bash "$WslPath/fresh-start.sh"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Operation completed successfully!" -ForegroundColor Green
}
