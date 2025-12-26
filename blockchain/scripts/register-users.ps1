# TRACIENT IAM - User Registration Script for Windows PowerShell
# ============================================================================
# This script registers users with custom attributes in Fabric CA
# for Attribute-Based Access Control (ABAC)
# ============================================================================

param(
    [Parameter(Position=0)]
    [string]$Command,
    
    [Parameter(Position=1)]
    [string]$UserID,
    
    [Parameter(Position=2)]
    [string]$Name,
    
    [Parameter(Position=3)]
    [string]$IDHash,
    
    [Parameter(Position=4)]
    [string]$Department,
    
    [Parameter(Position=5)]
    [string]$State,
    
    [Parameter(Position=6)]
    [string]$MaxWageOrOrg,
    
    [Parameter(Position=7)]
    [string]$Org
)

$ErrorActionPreference = "Stop"

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FabricSamplesDir = Join-Path $ScriptDir "..\fabric-samples"
$TestNetworkDir = Join-Path $FabricSamplesDir "test-network"
$CADir = Join-Path $TestNetworkDir "organizations"

# Colors
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Blue }
function Write-Success { Write-Host "[SUCCESS] $args" -ForegroundColor Green }
function Write-Warning { Write-Host "[WARNING] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }

function Show-Usage {
    Write-Host ""
    Write-Host "TRACIENT IAM - User Registration Script (PowerShell)"
    Write-Host "====================================================="
    Write-Host ""
    Write-Host "Usage: .\register-users.ps1 <command> [options]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  register-worker <user_id> <name> <id_hash> <department> <state> <org>"
    Write-Host "  register-employer <user_id> <name> <id_hash> <department> <state> <max_wage_amount> <org>"
    Write-Host "  register-government <user_id> <name> <id_hash> <department> <state> <org>"
    Write-Host "  register-bank-officer <user_id> <name> <id_hash> <bank_name> <state> <org>"
    Write-Host "  register-auditor <user_id> <name> <id_hash> <org>"
    Write-Host "  register-admin <user_id> <name> <id_hash> <org>"
    Write-Host "  register-sample-users"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\register-users.ps1 register-worker worker001 'John Doe' abc123hash construction Karnataka org1"
    Write-Host ""
}

function Register-Worker {
    param($UserID, $Name, $IDHash, $Department, $State, $Org)
    
    Write-Info "Registering worker: $UserID"
    
    $CAName = if ($Org -eq "org1") { "ca-org1" } else { "ca-org2" }
    $CAPort = if ($Org -eq "org1") { "7054" } else { "8054" }
    $MSPDir = Join-Path $CADir "peerOrganizations\$Org.example.com\users\Admin@$Org.example.com\msp"
    $TLSCert = Join-Path $CADir "fabric-ca\$Org\tls-cert.pem"
    
    $env:FABRIC_CA_CLIENT_HOME = Join-Path $CADir $Org
    
    $attrs = "role=worker:ecert,clearanceLevel=1:ecert,department=${Department}:ecert,state=${State}:ecert,idHash=${IDHash}:ecert,canRecordWage=false:ecert,canRecordUPI=false:ecert,canRegisterUsers=false:ecert,canManageUsers=false:ecert,canUpdateThresholds=false:ecert,canFlagAnomaly=false:ecert,canReviewAnomaly=false:ecert,canGenerateReport=false:ecert,canBatchProcess=false:ecert"
    
    fabric-ca-client register `
        --caname $CAName `
        --id.name $UserID `
        --id.secret "${UserID}pw" `
        --id.type user `
        --id.affiliation "$Org.department1" `
        --id.attrs $attrs `
        --tls.certfiles $TLSCert `
        -u "https://localhost:$CAPort" `
        -M $MSPDir
    
    Write-Success "Worker $UserID registered successfully"
}

function Register-Employer {
    param($UserID, $Name, $IDHash, $Department, $State, $MaxWageAmount, $Org)
    
    Write-Info "Registering employer: $UserID"
    
    $CAName = if ($Org -eq "org1") { "ca-org1" } else { "ca-org2" }
    $CAPort = if ($Org -eq "org1") { "7054" } else { "8054" }
    $MSPDir = Join-Path $CADir "peerOrganizations\$Org.example.com\users\Admin@$Org.example.com\msp"
    $TLSCert = Join-Path $CADir "fabric-ca\$Org\tls-cert.pem"
    
    $env:FABRIC_CA_CLIENT_HOME = Join-Path $CADir $Org
    
    $attrs = "role=employer:ecert,clearanceLevel=5:ecert,department=${Department}:ecert,state=${State}:ecert,idHash=${IDHash}:ecert,maxWageAmount=${MaxWageAmount}:ecert,canRecordWage=true:ecert,canRecordUPI=true:ecert,canBatchProcess=true:ecert,canRegisterUsers=false:ecert,canManageUsers=false:ecert,canUpdateThresholds=false:ecert,canFlagAnomaly=false:ecert,canReviewAnomaly=false:ecert,canGenerateReport=false:ecert"
    
    fabric-ca-client register `
        --caname $CAName `
        --id.name $UserID `
        --id.secret "${UserID}pw" `
        --id.type user `
        --id.affiliation $Org `
        --id.attrs $attrs `
        --tls.certfiles $TLSCert `
        -u "https://localhost:$CAPort" `
        -M $MSPDir
    
    Write-Success "Employer $UserID registered successfully"
}

function Register-GovernmentOfficial {
    param($UserID, $Name, $IDHash, $Department, $State, $Org)
    
    Write-Info "Registering government official: $UserID"
    
    $CAName = if ($Org -eq "org1") { "ca-org1" } else { "ca-org2" }
    $CAPort = if ($Org -eq "org1") { "7054" } else { "8054" }
    $MSPDir = Join-Path $CADir "peerOrganizations\$Org.example.com\users\Admin@$Org.example.com\msp"
    $TLSCert = Join-Path $CADir "fabric-ca\$Org\tls-cert.pem"
    
    $env:FABRIC_CA_CLIENT_HOME = Join-Path $CADir $Org
    
    $attrs = "role=government_official:ecert,clearanceLevel=10:ecert,department=${Department}:ecert,state=${State}:ecert,idHash=${IDHash}:ecert,canRecordWage=false:ecert,canRecordUPI=false:ecert,canBatchProcess=false:ecert,canRegisterUsers=true:ecert,canManageUsers=true:ecert,canUpdateThresholds=true:ecert,canFlagAnomaly=true:ecert,canReviewAnomaly=true:ecert,canGenerateReport=true:ecert,canReadAll=true:ecert,canExport=true:ecert"
    
    fabric-ca-client register `
        --caname $CAName `
        --id.name $UserID `
        --id.secret "${UserID}pw" `
        --id.type user `
        --id.affiliation "$Org.government" `
        --id.attrs $attrs `
        --tls.certfiles $TLSCert `
        -u "https://localhost:$CAPort" `
        -M $MSPDir
    
    Write-Success "Government official $UserID registered successfully"
}

function Register-Admin {
    param($UserID, $Name, $IDHash, $Org)
    
    Write-Info "Registering admin: $UserID"
    
    $CAName = if ($Org -eq "org1") { "ca-org1" } else { "ca-org2" }
    $CAPort = if ($Org -eq "org1") { "7054" } else { "8054" }
    $MSPDir = Join-Path $CADir "peerOrganizations\$Org.example.com\users\Admin@$Org.example.com\msp"
    $TLSCert = Join-Path $CADir "fabric-ca\$Org\tls-cert.pem"
    
    $env:FABRIC_CA_CLIENT_HOME = Join-Path $CADir $Org
    
    $attrs = "role=admin:ecert,clearanceLevel=10:ecert,idHash=${IDHash}:ecert,canRecordWage=true:ecert,canRecordUPI=true:ecert,canBatchProcess=true:ecert,canRegisterUsers=true:ecert,canManageUsers=true:ecert,canUpdateThresholds=true:ecert,canFlagAnomaly=true:ecert,canReviewAnomaly=true:ecert,canGenerateReport=true:ecert,canReadAll=true:ecert,canExport=true:ecert"
    
    fabric-ca-client register `
        --caname $CAName `
        --id.name $UserID `
        --id.secret "${UserID}pw" `
        --id.type admin `
        --id.affiliation $Org `
        --id.attrs $attrs `
        --tls.certfiles $TLSCert `
        -u "https://localhost:$CAPort" `
        -M $MSPDir
    
    Write-Success "Admin $UserID registered successfully"
}

function Register-SampleUsers {
    Write-Info "Registering sample users for testing..."
    
    # Workers
    Register-Worker "worker001" "Ravi Kumar" "wkr001hash" "construction" "Karnataka" "org1"
    Register-Worker "worker002" "Priya Sharma" "wkr002hash" "agriculture" "Maharashtra" "org1"
    
    # Employers
    Register-Employer "employer001" "ABC Construction" "emp001hash" "construction" "Karnataka" "500000" "org1"
    
    # Government Officials
    Register-GovernmentOfficial "govofficial001" "Dr. Lakshmi Nair" "gov001hash" "welfare" "Karnataka" "org1"
    
    # Admins
    Register-Admin "admin001" "System Admin" "adm001hash" "org1"
    
    Write-Success "All sample users registered successfully!"
    Write-Host ""
    Write-Host "Registered users:"
    Write-Host "  - 2 Workers (worker001-002)"
    Write-Host "  - 1 Employer (employer001)"
    Write-Host "  - 1 Government Official (govofficial001)"
    Write-Host "  - 1 Admin (admin001)"
    Write-Host ""
    Write-Host "Password pattern: <user_id>pw (e.g., worker001pw)"
}

# Main
switch ($Command) {
    "register-worker" {
        Register-Worker $UserID $Name $IDHash $Department $State $MaxWageOrOrg
    }
    "register-employer" {
        Register-Employer $UserID $Name $IDHash $Department $State $MaxWageOrOrg $Org
    }
    "register-government" {
        Register-GovernmentOfficial $UserID $Name $IDHash $Department $State $MaxWageOrOrg
    }
    "register-admin" {
        Register-Admin $UserID $Name $IDHash $Department
    }
    "register-sample-users" {
        Register-SampleUsers
    }
    default {
        Show-Usage
    }
}
