# TRACIENT Blockchain - Windows PowerShell Test Launcher
# 
# This script runs chaincode tests through WSL.
#
# Usage:
#   .\test-chaincode.ps1              # Run all tests
#   .\test-chaincode.ps1 -Quick       # Quick test
#   .\test-chaincode.ps1 -Verbose     # Verbose output
#

param(
    [switch]$Quick,
    [switch]$Verbose,
    [switch]$Help
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WslPath = $ScriptDir -replace '\\', '/' -replace '^([A-Za-z]):', '/mnt/$1'.ToLower()

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      TRACIENT Chaincode Test Suite (Windows)               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if ($Help) {
    Write-Host "Usage: .\test-chaincode.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Quick     Run quick tests only"
    Write-Host "  -Verbose   Show verbose output"
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

$args = @()
if ($Quick) { $args += "--quick" }
if ($Verbose) { $args += "--verbose" }

if ($args.Count -gt 0) {
    wsl -e bash "$WslPath/test-chaincode.sh" $args
} else {
    wsl -e bash "$WslPath/test-chaincode.sh"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "✓ All tests passed!" -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host "✗ Some tests failed. Check output above." -ForegroundColor Red
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Red
}
