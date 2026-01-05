# ============================================================================
# Enroll Admin Identity with Role Attributes for Tracient Backend
# ============================================================================
# This script enrolls an admin user with proper role attributes for IAM
# ============================================================================

param(
    [string]$Username = "tracientadmin",
    [string]$Org = "org1"
)

$ErrorActionPreference = "Stop"

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BlockchainDir = Split-Path -Parent $ScriptDir
$TestNetworkDir = Join-Path $BlockchainDir "network\test-network"
$OrgPath = Join-Path $TestNetworkDir "organizations\peerOrganizations\$Org.example.com"
$CAName = if ($Org -eq "org1") { "ca-org1" } else { "ca-org2" }
$CAPort = if ($Org -eq "org1") { "7054" } else { "8054" }
$TLSCert = Join-Path $TestNetworkDir "organizations\fabric-ca\$Org\ca-cert.pem"

# Add Fabric binaries to PATH
$BinPath = Join-Path $BlockchainDir "network\bin"
$env:PATH = "$BinPath;$env:PATH"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TRACIENT ADMIN IDENTITY ENROLLMENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if CA cert exists
if (-not (Test-Path $TLSCert)) {
    Write-Host "[ERROR] CA certificate not found at: $TLSCert" -ForegroundColor Red
    Write-Host "Make sure the network is running. Run: .\start-network.ps1" -ForegroundColor Yellow
    exit 1
}

# Set CA client home
$env:FABRIC_CA_CLIENT_HOME = $OrgPath
Write-Host "[INFO] Using CA at: localhost:$CAPort" -ForegroundColor Blue
Write-Host "[INFO] MSP ID: Org1MSP" -ForegroundColor Blue
Write-Host "[INFO] Username: $Username" -ForegroundColor Blue
Write-Host ""

# Step 1: Register the admin user with role attributes
Write-Host "[STEP 1] Registering admin user with role attributes..." -ForegroundColor Yellow
Write-Host ""

$Password = "${Username}pw"

try {
    & fabric-ca-client register `
        --caname $CAName `
        --id.name $Username `
        --id.secret $Password `
        --id.type client `
        --id.attrs "role=admin:ecert,clearanceLevel=99:ecert,canRecordWage=true:ecert,canRecordUPI=true:ecert,canRegisterUsers=true:ecert,canManageUsers=true:ecert,canUpdateThresholds=true:ecert,canFlagAnomaly=true:ecert,canReviewAnomaly=true:ecert,canGenerateReport=true:ecert,canBatchProcess=true:ecert,canReadAll=true:ecert,canExport=true:ecert" `
        --tls.certfiles $TLSCert `
        -u "https://localhost:$CAPort" 2>&1 | Out-Null
    
    Write-Host "[SUCCESS] User registered successfully" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] User may already be registered, continuing..." -ForegroundColor Yellow
}
Write-Host ""

# Step 2: Enroll the user
Write-Host "[STEP 2] Enrolling admin user and generating certificates..." -ForegroundColor Yellow
Write-Host ""

$UserDir = Join-Path $OrgPath "users\$Username"
$UserMSPDir = Join-Path $UserDir "msp"

# Create user directory
New-Item -ItemType Directory -Path $UserMSPDir -Force | Out-Null

# Enroll
& fabric-ca-client enroll `
    -u "https://${Username}:${Password}@localhost:$CAPort" `
    --caname $CAName `
    -M $UserMSPDir `
    --tls.certfiles $TLSCert

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Enrollment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "[SUCCESS] User enrolled successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Copy config.yaml for NodeOUs
Write-Host "[STEP 3] Configuring MSP..." -ForegroundColor Yellow

$ConfigYaml = Join-Path $OrgPath "msp\config.yaml"
if (Test-Path $ConfigYaml) {
    Copy-Item $ConfigYaml (Join-Path $UserMSPDir "config.yaml") -Force
    Write-Host "[SUCCESS] MSP configured" -ForegroundColor Green
} else {
    Write-Host "[WARNING] config.yaml not found, skipping..." -ForegroundColor Yellow
}
Write-Host ""

# Verify the certificate has attributes
Write-Host "[STEP 4] Verifying certificate attributes..." -ForegroundColor Yellow

$CertPath = Join-Path $UserMSPDir "signcerts\cert.pem"
if (Test-Path $CertPath) {
    $CertContent = Get-Content $CertPath -Raw
    if ($CertContent -match "role") {
        Write-Host "[SUCCESS] Certificate contains role attributes" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Certificate may not contain attributes" -ForegroundColor Yellow
    }
} else {
    Write-Host "[ERROR] Certificate not found!" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ENROLLMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin Identity Details:" -ForegroundColor Cyan
Write-Host "  Username: $Username" -ForegroundColor White
Write-Host "  Password: $Password" -ForegroundColor White
Write-Host "  Org: $Org" -ForegroundColor White
Write-Host "  MSP ID: Org1MSP" -ForegroundColor White
Write-Host "  Role: admin" -ForegroundColor White
Write-Host "  Clearance: 99" -ForegroundColor White
Write-Host ""
Write-Host "Certificate Location:" -ForegroundColor Cyan
Write-Host "  $CertPath" -ForegroundColor White
Write-Host ""
Write-Host "Private Key Location:" -ForegroundColor Cyan
$KeystorePath = Join-Path $UserMSPDir "keystore"
$KeyFiles = Get-ChildItem $KeystorePath -Filter "*_sk"
if ($KeyFiles) {
    Write-Host "  $(Join-Path $KeystorePath $KeyFiles[0].Name)" -ForegroundColor White
}
Write-Host ""
Write-Host "[NEXT STEP] Update backend/.env to use this identity:" -ForegroundColor Yellow
Write-Host "  FABRIC_USER_NAME=$Username" -ForegroundColor White
Write-Host ""
