# COMPREHENSIVE BLOCKCHAIN IDENTITY & ACCESS MANAGEMENT (IAM) IMPLEMENTATION PROMPT
## TRACIENT Hyperledger Fabric IAM System v2.0

**Generated:** December 25, 2025  
**Scope:** Blockchain-based Identity & Access Management using Hyperledger Fabric  
**Status:** Implementation Specification  
**Network:** Hyperledger Fabric 2.5.14 | Channel: `mychannel` | Chaincode: `tracient`

---

## 📋 TABLE OF CONTENTS

1. [Blockchain IAM Overview](#blockchain-iam-overview)
2. [Current State Analysis](#current-state-analysis)
3. [Fabric MSP & Certificate Management](#fabric-msp-certificate-management)
4. [Attribute-Based Access Control (ABAC)](#attribute-based-access-control)
5. [Chaincode Access Control Implementation](#chaincode-access-control)
6. [Private Data Collections](#private-data-collections)
7. [Channel Access Control Policies](#channel-access-control-policies)
8. [Identity Verification & Registration](#identity-verification-registration)
9. [Certificate Authority (CA) Management](#certificate-authority-management)
10. [Testing & Deployment](#testing-deployment)

---

## 🔍 BLOCKCHAIN IAM OVERVIEW

### **Hyperledger Fabric Identity Model**

Hyperledger Fabric uses **X.509 digital certificates** for identity management, not traditional username/password authentication. Every transaction must be signed by a valid certificate.

#### **Key Concepts:**

1. **MSP (Membership Service Provider):**
   - Defines which CAs are trusted
   - Provides identity validation
   - Maps certificates to roles
   - Currently: `Org1MSP`, `Org2MSP`

2. **Identity Components:**
   - **Certificate:** Public key + identity info (signed by CA)
   - **Private Key:** Used to sign transactions
   - **MSP ID:** Organization identifier
   - **Attributes:** Custom key-value pairs in certificate

3. **Identity Types:**
   - **User Identities:** End users (workers, employers)
   - **Admin Identities:** Organization admins
   - **Peer Identities:** Blockchain nodes
   - **Orderer Identities:** Ordering service nodes

4. **Access Control Levels:**
   - **Network Level:** Who can join the network
   - **Channel Level:** Who can access specific channels
   - **Chaincode Level:** Function-level permissions
   - **Data Level:** Private data collections

---

## 🔍 CURRENT STATE ANALYSIS

### **Existing IAM Implementation**

#### ✅ Implemented:
- **Basic MSP Setup**: Org1MSP, Org2MSP configured
- **Certificate Authorities**: 3 CAs (ca_org1, ca_org2, ca_orderer)
- **Chaincode User Registration**: `RegisterUser` function
- **Role-Based Functions**: 6 roles in chaincode (worker, employer, government_official, bank_officer, auditor, admin)
- **User Verification**: `VerifyUserRole`, `UserExists` functions
- **Basic Access Control**: Role validation in chaincode functions

#### ❌ Missing:
- **Attribute-Based Access Control (ABAC)** in certificates
- **Certificate Attributes** for fine-grained permissions
- **Private Data Collections** for sensitive data
- **Channel ACLs** (Access Control Lists)
- **Endorsement Policies** customization per role
- **Identity Revocation** mechanism
- **Cross-Organization Access Control**
- **Time-based Access Restrictions**
- **Audit Trail** for all identity operations
- **Certificate Rotation** automation
- **Multi-Signature Requirements** for sensitive operations
- **Hierarchical Identity Management**

---

## 🎯 FABRIC MSP & CERTIFICATE MANAGEMENT

### **Phase 1: Certificate Attributes for ABAC (Week 1-2)**

#### **1.1 Understanding Certificate Attributes**

Fabric CA allows embedding custom attributes in X.509 certificates. These attributes can be used for fine-grained access control in chaincode.

**Example Certificate with Attributes:**
```json
{
  "enrollmentID": "worker001",
  "type": "user",
  "affiliation": "org1.department1",
  "attrs": [
    {"name": "role", "value": "worker", "ecert": true},
---

## 🔐 ATTRIBUTE-BASED ACCESS CONTROL (ABAC)

### **Phase 2: Implement ABAC in Chaincode (Week 2-3)**

#### **2.1 Read Certificate Attributes in Chaincode**

**File:** `blockchain/chaincode/tracient/chaincode.go`

**Add helper function to read attributes:**

```go
import (
	"github.com/hyperledger/fabric-chaincode-go/pkg/cid"
)

// GetClientAttribute retrieves an attribute from the client's certificate
func (s *SmartContract) GetClientAttribute(ctx contractapi.TransactionContextInterface, attrName string) (string, bool, error) {
	value, found, err := cid.GetAttributeValue(ctx.GetStub(), attrName)
	if err != nil {
		return "", false, fmt.Errorf("failed to get attribute %s: %w", attrName, err)
	}
	return value, found, nil
}

// GetClientID retrieves the client's enrollment ID
func (s *SmartContract) GetClientID(ctx contractapi.TransactionContextInterface) (string, error) {
	clientID, err := cid.GetID(ctx.GetStub())
	if err != nil {
		return "", fmt.Errorf("failed to get client ID: %w", err)
	}
	return clientID, nil
}

// GetClientMSPID retrieves the client's MSP ID
func (s *SmartContract) GetClientMSPID(ctx contractapi.TransactionContextInterface) (string, error) {
	mspID, err := cid.GetMSPID(ctx.GetStub())
	if err != nil {
		return "", fmt.Errorf("failed to get MSP ID: %w", err)
	}
	return mspID, nil
}

// CheckClientRole verifies if the client has the required role
func (s *SmartContract) CheckClientRole(ctx contractapi.TransactionContextInterface, requiredRole string) error {
	role, found, err := s.GetClientAttribute(ctx, "role")
	if err != nil {
		return fmt.Errorf("failed to get role attribute: %w", err)
	}
	
	if !found {
		return fmt.Errorf("role attribute not found in certificate")
	}
	
	if role != requiredRole {
		return fmt.Errorf("access denied: required role '%s', but client has role '%s'", requiredRole, role)
	}
	
	return nil
}

// CheckClearanceLevel verifies if the client has sufficient clearance
func (s *SmartContract) CheckClearanceLevel(ctx contractapi.TransactionContextInterface, requiredLevel int) error {
	clearanceStr, found, err := s.GetClientAttribute(ctx, "clearanceLevel")
	if err != nil {
		return fmt.Errorf("failed to get clearance level: %w", err)
	}
	
	if !found {
		return fmt.Errorf("clearance level not found in certificate")
	}
	
	clearance, err := strconv.Atoi(clearanceStr)
	if err != nil {
		return fmt.Errorf("invalid clearance level format: %w", err)
	}
	
	if clearance < requiredLevel {
		return fmt.Errorf("access denied: required clearance level %d, client has %d", requiredLevel, clearance)
	}
	
	return nil
}

// CheckPermission verifies if the client has a specific permission
func (s *SmartContract) CheckPermission(ctx contractapi.TransactionContextInterface, permission string) error {
	permValue, found, err := s.GetClientAttribute(ctx, permission)
	if err != nil {
		return fmt.Errorf("failed to get permission %s: %w", permission, err)
	}
	
	if !found || permValue != "true" {
		return fmt.Errorf("access denied: client does not have permission '%s'", permission)
	}
	
	return nil
}
```

#### **2.2 Update Existing Functions with ABAC**
---

## 🔒 CHAINCODE ACCESS CONTROL IMPLEMENTATION

### **Phase 3: Function-Level Access Control (Week 3-4)**

#### **3.1 Create Access Control Decorator**

**File:** `blockchain/chaincode/tracient/access_control.go`

```go
package main

import (
	"fmt"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/hyperledger/fabric-chaincode-go/pkg/cid"
)

// AccessRule defines access control requirements
type AccessRule struct {
	AllowedRoles      []string
	RequiredPermissions []string
	MinClearanceLevel int
	AllowedMSPs       []string
}

// CheckAccess verifies if client meets access requirements
func CheckAccess(ctx contractapi.TransactionContextInterface, rule AccessRule) error {
	// Check MSP ID
	if len(rule.AllowedMSPs) > 0 {
		mspID, err := cid.GetMSPID(ctx.GetStub())
		if err != nil {
			return fmt.Errorf("failed to get MSP ID: %w", err)
		}
		
		allowed := false
		for _, allowedMSP := range rule.AllowedMSPs {
			if mspID == allowedMSP {
				allowed = true
				break
			}
		}
		
		if !allowed {
			return fmt.Errorf("access denied: MSP %s not allowed", mspID)
		}
	}
	
	// Check role
	if len(rule.AllowedRoles) > 0 {
		role, found, err := cid.GetAttributeValue(ctx.GetStub(), "role")
		if err != nil {
			return fmt.Errorf("failed to get role: %w", err)
		}
		
		if !found {
			return fmt.Errorf("role attribute not found")
		}
		
		allowed := false
		for _, allowedRole := range rule.AllowedRoles {
			if role == allowedRole {
				allowed = true
				break
			}
		}
		
		if !allowed {
			return fmt.Errorf("access denied: role %s not allowed", role)
		}
	}
	
	// Check clearance level
	if rule.MinClearanceLevel > 0 {
		clearanceStr, found, err := cid.GetAttributeValue(ctx.GetStub(), "clearanceLevel")
		if err != nil {
			return fmt.Errorf("failed to get clearance level: %w", err)
		}
		
		if !found {
			return fmt.Errorf("clearance level not found")
		}
		
		clearance, err := strconv.Atoi(clearanceStr)
		if err != nil {
			return fmt.Errorf("invalid clearance level: %w", err)
		}
		
		if clearance < rule.MinClearanceLevel {
			return fmt.Errorf("access denied: clearance level %d < required %d", clearance, rule.MinClearanceLevel)
		}
	}
	
	// Check permissions
	for _, permission := range rule.RequiredPermissions {
		permValue, found, err := cid.GetAttributeValue(ctx.GetStub(), permission)
		if err != nil {
			return fmt.Errorf("failed to get permission %s: %w", permission, err)
		}
		
		if !found || permValue != "true" {
			return fmt.Errorf("access denied: missing permission %s", permission)
		}
	}
	
	return nil
}

// GetAccessRules returns predefined access rules for each function
func GetAccessRules() map[string]AccessRule {
	return map[string]AccessRule{
		"RecordWage": {
			AllowedRoles: []string{"employer", "admin"},
			RequiredPermissions: []string{"canRecordWage"},
			MinClearanceLevel: 5,
			AllowedMSPs: []string{"Org1MSP", "Org2MSP"},
		},
		"SetPovertyThreshold": {
			AllowedRoles: []string{"government_official", "admin"},
			RequiredPermissions: []string{"canUpdateThresholds"},
			MinClearanceLevel: 8,
			AllowedMSPs: []string{"Org1MSP"},  // Only Org1 can set thresholds
		},
		"GenerateComplianceReport": {
			AllowedRoles: []string{"government_official", "auditor", "admin"},
			RequiredPermissions: []string{"canGenerateReport"},
			MinClearanceLevel: 6,
			AllowedMSPs: []string{"Org1MSP", "Org2MSP"},
		},
		"UpdateUserStatus": {
			AllowedRoles: []string{"government_official", "admin"},
			RequiredPermissions: []string{"canManageUsers"},
			MinClearanceLevel: 9,
			AllowedMSPs: []string{"Org1MSP"},
		},
		"FlagAnomaly": {
			AllowedRoles: []string{"auditor", "government_official", "admin"},
			RequiredPermissions: []string{"canFlagAnomaly"},
			MinClearanceLevel: 7,
			AllowedMSPs: []string{"Org1MSP", "Org2MSP"},
		},
		"ReadWage": {
			AllowedRoles: []string{"worker", "employer", "government_official", "auditor", "admin"},
			MinClearanceLevel: 1,
			AllowedMSPs: []string{"Org1MSP", "Org2MSP"},
		},
		"QueryWagesByWorker": {
			AllowedRoles: []string{"worker", "employer", "government_official", "admin"},
			MinClearanceLevel: 1,
			AllowedMSPs: []string{"Org1MSP", "Org2MSP"},
		},
	}
}
```

#### **3.2 Apply Access Control to All Functions**

**Update chaincode.go with access control:**

```go
// RecordWage with access control
func (s *SmartContract) RecordWage(ctx contractapi.TransactionContextInterface, wageID string, workerIDHash string, employerIDHash string, amount float64, currency string, jobType string, timestamp string, policyVersion string) error {
	// Apply access control
	rules := GetAccessRules()
	if err := CheckAccess(ctx, rules["RecordWage"]); err != nil {
		return fmt.Errorf("access denied: %w", err)
	}
	
	// Get caller identity for audit
	callerID, _ := cid.GetID(ctx.GetStub())
	
	// Existing logic...
	// ...
	
	// Emit event
	ctx.GetStub().SetEvent("WageRecorded", []byte(wageID))
	
	return nil
}

// SetPovertyThreshold with access control
func (s *SmartContract) SetPovertyThreshold(ctx contractapi.TransactionContextInterface, state string, category string, amount float64, setBy string) error {
	// Apply access control
	rules := GetAccessRules()
	if err := CheckAccess(ctx, rules["SetPovertyThreshold"]); err != nil {
		return fmt.Errorf("access denied: %w", err)
	}
	
	// Get caller identity
	callerID, _ := cid.GetID(ctx.GetStub())
	
	// Existing logic...
	// ...
	
	return nil
}

// UpdateUserStatus with access control
func (s *SmartContract) UpdateUserStatus(ctx contractapi.TransactionContextInterface, userIDHash string, status string, updatedBy string) error {
	// Apply access control
	rules := GetAccessRules()
	if err := CheckAccess(ctx, rules["UpdateUserStatus"]); err != nil {
		return fmt.Errorf("access denied: %w", err)
	}
	
	// Existing logic...
	// ...
	
	return nil
}
```
	
	// Check if client is an employer
	if err := s.CheckClientRole(ctx, "employer"); err != nil {
		return err
	}
	
	// Check wage amount against employer's limit
	maxAmountStr, found, _ := s.GetClientAttribute(ctx, "maxWageAmount")
	if found {
		maxAmount, err := strconv.ParseFloat(maxAmountStr, 64)
		if err == nil && amount > maxAmount {
			return fmt.Errorf("wage amount %f exceeds employer limit %f", amount, maxAmount)
		}
	}
	
	// Get client identity for audit
	clientID, err := s.GetClientID(ctx)
	if err != nil {
		return err
	}
	
	// Existing wage recording logic...
	if wageID == "" || workerIDHash == "" || employerIDHash == "" {
		return fmt.Errorf("wageID, workerIDHash, and employerIDHash are required")
	}
	
	// ... rest of the function
	
	// Log the access
	s.LogAccessEvent(ctx, clientID, "RecordWage", wageID, "success")
	
	return nil
}
```

**Update SetPovertyThreshold with ABAC:**

```go
// SetPovertyThreshold sets the BPL/APL threshold for a state (government officials only)
func (s *SmartContract) SetPovertyThreshold(ctx contractapi.TransactionContextInterface, state string, category string, amount float64, setBy string) error {
	// Check if client is government official
	if err := s.CheckClientRole(ctx, "government_official"); err != nil {
		return err
	}
	
	// Check if client has permission to update thresholds
	if err := s.CheckPermission(ctx, "canUpdateThresholds"); err != nil {
		return err
	}
	
	// Check clearance level (require level 8 or higher)
	if err := s.CheckClearanceLevel(ctx, 8); err != nil {
		return err
	}
	
	// Get client identity
	clientID, err := s.GetClientID(ctx)
	if err != nil {
		return err
	}
	
	// Existing threshold setting logic...
	// ...
	
	// Log the access
	s.LogAccessEvent(ctx, clientID, "SetPovertyThreshold", fmt.Sprintf("%s_%s", state, category), "success")
	
	return nil
}
```

**Update GenerateComplianceReport with ABAC:**

```go
// GenerateComplianceReport generates various compliance reports (ABAC-enhanced)
func (s *SmartContract) GenerateComplianceReport(ctx contractapi.TransactionContextInterface, reportType string, startDate string, endDate string, filters string) (*ComplianceReport, error) {
	// Check if client has permission to generate reports
	if err := s.CheckPermission(ctx, "canGenerateReport"); err != nil {
		return nil, err
	}
	
	// Get client role and MSP ID
	role, _, _ := s.GetClientAttribute(ctx, "role")
	mspID, _ := s.GetClientMSPID(ctx)
	clientID, _ := s.GetClientID(ctx)
	
	// Employers can only generate reports for their own data
	if role == "employer" {
		// Filter by employer's own ID hash
		employerHash, _, _ := s.GetClientAttribute(ctx, "idHash")
		// Apply filter in report generation
		// ...
	}
	
	// Government officials can generate all reports
	if role == "government_official" {
		// No restrictions
	}
	
	// ... rest of report generation logic
	
	// Log the access
	s.LogAccessEvent(ctx, clientID, "GenerateComplianceReport", reportType, "success")
	
	return report, nil
}
```
```bash
#!/bin/bash
# Register user with custom attributes

FABRIC_CA_HOME="/path/to/ca"
CA_URL="https://localhost:7054"
ADMIN_CERT="/path/to/admin/cert.pem"
ADMIN_KEY="/path/to/admin/key.pem"

# Register worker with attributes
fabric-ca-client register \
  --caname ca-org1 \
  --id.name worker001 \
  --id.secret worker001pw \
  --id.type user \
  --id.affiliation org1.department1 \
  --id.attrs 'role=worker:ecert,department=construction:ecert,clearanceLevel=3:ecert,state=Karnataka:ecert,canRecordWage=false:ecert' \
  --tls.certfiles "${FABRIC_CA_HOME}/ca-cert.pem"

# Register employer with attributes
fabric-ca-client register \
  --caname ca-org1 \
  --id.name employer001 \
  --id.secret employer001pw \
  --id.type user \
  --id.affiliation org1 \
  --id.attrs 'role=employer:ecert,department=construction:ecert,clearanceLevel=5:ecert,canRecordWage=true:ecert,canGenerateReport=true:ecert,maxWageAmount=500000:ecert' \
  --tls.certfiles "${FABRIC_CA_HOME}/ca-cert.pem"

# Register government official with attributes
fabric-ca-client register \
  --caname ca-org1 \
  --id.name govofficial001 \
  --id.secret gov001pw \
  --id.type user \
  --id.affiliation org1.government \
  --id.attrs 'role=government_official:ecert,department=welfare:ecert,clearanceLevel=10:ecert,canReadAll=true:ecert,canUpdateThresholds=true:ecert,canGenerateReport=true:ecert' \
  --tls.certfiles "${FABRIC_CA_HOME}/ca-cert.pem"

echo "✓ Users registered with attributes"
```

#### **1.3 Enroll Users and Get Certificates**

**File:** `blockchain/scripts/enroll-user.sh`

```bash
#!/bin/bash
# Enroll user and get certificate with attributes

USERNAME=$1
PASSWORD=$2
ORG=$3

if [ "$ORG" == "org1" ]; then
  CA_URL="https://localhost:7054"
  CA_NAME="ca-org1"
else
  CA_URL="https://localhost:8054"
  CA_NAME="ca-org2"
fi

# Enroll user
fabric-ca-client enroll \
  -u https://${USERNAME}:${PASSWORD}@localhost:7054 \
  --caname ${CA_NAME} \
  -M /tmp/msp/${USERNAME} \
  --tls.certfiles "${FABRIC_CA_HOME}/ca-cert.pem"

echo "✓ User ${USERNAME} enrolled successfully"
echo "Certificate: /tmp/msp/${USERNAME}/signcerts/cert.pem"
echo "Private Key: /tmp/msp/${USERNAME}/keystore/*_sk"
```

#### **FR2: Single Sign-On (SSO)**
- **Priority:** MEDIUM
- **Description:** Support OAuth2 and SAML for government/employer integrations
- **Actors:** Government officials, Employers
- **Providers:**
  - Google OAuth2 (for employers)
  - Government SSO (SAML 2.0 - eSign/DigiLocker integration)
  - Microsoft Azure AD (for corporate employers)
- **Implementation:**
  - Passport.js integration
  - Identity provider (IdP) metadata configuration
  - Attribute mapping (email, name, role)
  - Just-in-Time (JIT) user provisioning

#### **FR3: Session Management**
- **Priority:** HIGH
- **Description:** Manage user sessions with concurrent login control
- **Features:**
  - Track active sessions per user
  - Limit concurrent sessions (configurable per role)
  - Remote session termination (logout all devices)
  - Session activity monitoring
  - Idle timeout (15 minutes for government, 30 for others)
  - Session hijacking detection (IP/User-Agent changes)

#### **FR4: Fine-Grained Permissions**
- **Priority:** HIGH
- **Description:** Implement permission-based access beyond roles
- **Structure:**
```javascript
{
  "role": "employer",
  "permissions": [
    "wage:create",
    "wage:read:own",
    "wage:update:own",
    "worker:read:assigned",
    "report:generate:own",
    "qr:generate"
  ]
}
```
- **Permission Scopes:**
  - `*` - All
  - `own` - Own resources only
  - `assigned` - Assigned resources
  - `department` - Department-level
  - `organization` - Organization-level

#### **FR5: API Key Management**
- **Priority:** MEDIUM
- **Description:** Issue API keys for third-party integrations
- **Features:**
  - Generate API keys with scopes
  - Key rotation (auto-rotate every 90 days)
  - Usage monitoring & rate limiting
  - Revocation and expiry
  - Separate read/write keys

#### **FR6: Device Management**
- **Priority:** MEDIUM
- **Description:** Track and manage trusted devices
- **Features:**
  - Device fingerprinting (browser, OS, IP)
  - Trusted device list per user
  - New device notifications
  - Block/unblock devices
  - Device-based MFA exemption

#### **FR7: Biometric Authentication**
- **Priority:** LOW (future enhancement)
- **Description:** Support fingerprint/face recognition for workers
- **Implementation:**
  - WebAuthn/FIDO2 for web
  - Device biometric APIs for mobile
  - Fallback to PIN/password

#### **FR8: IP Whitelisting**
- **Priority:** MEDIUM
- **Description:** Restrict access by IP address for government officials
- **Features:**
  - IP range whitelisting
  - VPN detection
  - Geofencing (allow only from India)
  - Anomaly detection for location changes

#### **FR9: Delegation & Impersonation**
- **Priority:** MEDIUM
- **Description:** Allow admins/government to act on behalf of users
- **Features:**
  - Time-limited delegation
  - Audit trail for impersonation
  - Read-only impersonation option
  - User consent requirement (for non-government)

#### **FR10: Advanced Audit Logging**
- **Priority:** HIGH
- **Description:** Comprehensive activity logging for compliance
- **Log Events:**
  - Authentication (login, logout, MFA, SSO)
  - Authorization (permission checks, access denials)
  - Data access (wage records, worker profiles)
  - Administrative actions (user creation, role changes)
  - Blockchain transactions
  - Configuration changes
  - Security events (failed logins, suspicious activity)

#### **FR11: User Lifecycle Management**
- **Priority:** MEDIUM
- **Description:** Automate user onboarding/offboarding
- **Workflows:**
  - **Onboarding:**
    1. User registration → Email verification → ID verification → Role assignment → Access provisioning
  - **Offboarding:**
    1. Deactivation request → Access revocation → Data retention → Account deletion (after 6 months)
- **Features:**
  - Approval workflows for government users
  - Automated role expiry (temporary access)
  - Re-activation workflow

#### **FR12: Risk-Based Authentication (RBA)**
- **Priority:** LOW (future enhancement)
- **Description:** Adaptive authentication based on risk score
- **Risk Factors:**
  - Location change (different city/country)
  - New device
  - Time of access (unusual hours)
  - Failed login attempts
  - VPN usage
  - Transaction amount (high-value wage records)
- **Actions:**
  - Require MFA for high-risk
  - Block access for very high-risk
  - Email/SMS notification

---

## 🔧 BACKEND IAM IMPLEMENTATION

### **Phase 1: MFA Implementation (Week 1-2)**

#### **1.1 Install Dependencies**
```bash
npm install speakeasy qrcode twilio otplib
```

#### **1.2 Update User Model**
**File:** `backend/models/User.js`

**Add Fields:**
```javascript
// MFA fields
mfaEnabled: {
  type: Boolean,
  default: false
},
mfaSecret: {
  type: String,
  select: false  // Don't return in queries by default
},
backupCodes: [{
  code: String,
  used: Boolean,
  usedAt: Date
}],
mfaMethod: {
  type: String,
  enum: ['totp', 'sms', 'email'],
  default: 'totp'
},

// Device management
trustedDevices: [{
  deviceId: String,
  deviceName: String,
  fingerprint: String,
  lastUsed: Date,
  trusted: { type: Boolean, default: false },
  addedAt: Date
}],

// Session management
sessions: [{
  sessionId: String,
  ipAddress: String,
  userAgent: String,
  location: String,
  loginAt: Date,
  lastActivity: Date,
  expiresAt: Date
}]
```

#### **1.3 Create MFA Service**
**File:** `backend/services/mfa.service.js`

```javascript
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { sendSMS } from './sms.service.js';

/**
 * Generate MFA secret and QR code
 */
export const generateMFASecret = async (userId) => {
  const user = await User.findById(userId);
  
  const secret = speakeasy.generateSecret({
    name: `Tracient (${user.email})`,
    issuer: 'Tracient'
  });
  
  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
  
  return {
    secret: secret.base32,
    qrCode: qrCodeUrl,
    otpauth_url: secret.otpauth_url
  };
};

/**
 * Verify TOTP code
 */
export const verifyTOTP = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2  // Allow 2 time steps before/after (60 seconds window)
  });
};

/**
 * Enable MFA for user
 */
export const enableMFA = async (userId, secret, verificationToken) => {
  // Verify the token first
  const isValid = verifyTOTP(secret, verificationToken);
  
  if (!isValid) {
    throw new Error('Invalid verification code');
  }
  
  // Generate backup codes
  const backupCodes = generateBackupCodes(10);
  
  await User.findByIdAndUpdate(userId, {
    mfaEnabled: true,
    mfaSecret: secret,
    mfaMethod: 'totp',
    backupCodes: backupCodes.map(code => ({ code, used: false }))
  });
  
  return backupCodes;
};

/**
 * Generate backup codes
 */
export const generateBackupCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
};

/**
 * Verify backup code
 */
export const verifyBackupCode = async (userId, code) => {
  const user = await User.findById(userId);
  
  const backupCode = user.backupCodes.find(
    bc => bc.code === code.toUpperCase() && !bc.used
  );
  
  if (!backupCode) {
    return false;
  }
  
  // Mark as used
  backupCode.used = true;
  backupCode.usedAt = new Date();
  await user.save();
  
  return true;
};

/**
 * Send SMS OTP
 */
export const sendSMSOTP = async (userId) => {
  const user = await User.findById(userId);
  const otp = crypto.randomInt(100000, 999999).toString();
  
  // Store OTP with 5-minute expiry
  await User.findByIdAndUpdate(userId, {
    otpCode: otp,
    otpExpires: new Date(Date.now() + 5 * 60 * 1000)
  });
  
  // Send SMS
  await sendSMS(user.phone, `Your Tracient verification code is: ${otp}`);
  
  return true;
};

/**
 * Verify SMS OTP
 */
export const verifySMSOTP = async (userId, otp) => {
  const user = await User.findById(userId);
  
  if (!user.otpCode || !user.otpExpires) {
    return false;
  }
  
  if (new Date() > user.otpExpires) {
    return false;  // Expired
  }
  
  if (user.otpCode !== otp) {
    return false;  // Invalid
  }
  
  // Clear OTP
  await User.findByIdAndUpdate(userId, {
    $unset: { otpCode: 1, otpExpires: 1 }
  });
  
  return true;
};
```

#### **1.4 Create MFA Controller**
**File:** `backend/controllers/mfa.controller.js`

```javascript
import * as mfaService from '../services/mfa.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

/**
 * Setup MFA - Generate QR code
 */
export const setupMFA = async (req, res) => {
  try {
    const result = await mfaService.generateMFASecret(req.user.id);
    return successResponse(res, result, 'MFA setup initiated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

/**
 * Enable MFA - Verify and activate
 */
export const enableMFA = async (req, res) => {
  try {
    const { secret, token } = req.body;
    const backupCodes = await mfaService.enableMFA(req.user.id, secret, token);
    
    return successResponse(res, { backupCodes }, 'MFA enabled successfully');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

/**
 * Disable MFA
 */
export const disableMFA = async (req, res) => {
  try {
    const { password } = req.body;
    
    // Verify password before disabling
    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return errorResponse(res, 'Invalid password', 401);
    }
    
    await User.findByIdAndUpdate(req.user.id, {
      mfaEnabled: false,
      $unset: { mfaSecret: 1, backupCodes: 1 }
    });
    
    return successResponse(res, null, 'MFA disabled successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

/**
 * Verify MFA code during login
 */
export const verifyMFA = async (req, res) => {
  try {
    const { userId, token, isBackupCode } = req.body;
    
    const user = await User.findById(userId).select('+mfaSecret');
    
    let isValid = false;
    
    if (isBackupCode) {
      isValid = await mfaService.verifyBackupCode(userId, token);
    } else if (user.mfaMethod === 'totp') {
      isValid = mfaService.verifyTOTP(user.mfaSecret, token);
    } else if (user.mfaMethod === 'sms') {
      isValid = await mfaService.verifySMSOTP(userId, token);
    }
    
    if (!isValid) {
      return errorResponse(res, 'Invalid verification code', 401);
    }
    
    return successResponse(res, { verified: true }, 'MFA verification successful');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

/**
 * Regenerate backup codes
 */
export const regenerateBackupCodes = async (req, res) => {
  try {
    const backupCodes = mfaService.generateBackupCodes(10);
    
    await User.findByIdAndUpdate(req.user.id, {
      backupCodes: backupCodes.map(code => ({ code, used: false }))
    });
    
    return successResponse(res, { backupCodes }, 'Backup codes regenerated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
```

#### **1.5 Update Auth Controller for MFA**
**File:** `backend/controllers/auth.controller.js`

**Modify login function:**
```javascript
export const login = async (req, res) => {
  try {
    const email = req.body.email || req.body.identifier;
    const { password } = req.body;
    
    const user = await User.findByCredentials(email, password);
    
    // Check if MFA is enabled
    if (user.mfaEnabled) {
      // Return temporary token for MFA verification
      const mfaToken = generateMFAToken(user);
      
      return successResponse(res, {
        mfaRequired: true,
        mfaToken,
        userId: user._id,
        mfaMethod: user.mfaMethod
      }, 'MFA verification required');
    }
    
    // Generate tokens (existing logic)
    const tokens = generateTokens(user);
    
    // ... rest of existing login logic
  } catch (error) {
    // ... error handling
  }
};

/**
 * Complete MFA login
 */
export const completeMFALogin = async (req, res) => {
  try {
    const { mfaToken, verificationCode, isBackupCode } = req.body;
    
    // Verify MFA token
    const decoded = verifyMFAToken(mfaToken);
    const user = await User.findById(decoded.userId);
    
    // Verify MFA code
    let isValid = false;
    if (isBackupCode) {
      isValid = await mfaService.verifyBackupCode(user._id, verificationCode);
    } else {
      isValid = mfaService.verifyTOTP(user.mfaSecret, verificationCode);
    }
    
    if (!isValid) {
      return errorResponse(res, 'Invalid verification code', 401);
    }
    
    // Generate actual tokens
    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    user.lastLogin = new Date();
    await user.save();
    
    AuditLog.logAuth('mfa_login', user._id, user.email, true, req);
    
    return successResponse(res, {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        idHash: user.idHash
      },
      ...tokens
    }, 'Login successful');
  } catch (error) {
    return errorResponse(res, error.message, 401);
  }
};
```

#### **1.6 Create MFA Routes**
**File:** `backend/routes/mfa.routes.js`

```javascript
import { Router } from 'express';
import * as mfaController from '../controllers/mfa.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route POST /api/mfa/setup
 * @desc Generate MFA secret and QR code
 * @access Private
 */
router.post('/setup', authenticate, mfaController.setupMFA);

/**
 * @route POST /api/mfa/enable
 * @desc Enable MFA after verification
 * @access Private
 */
router.post('/enable', authenticate, mfaController.enableMFA);

/**
 * @route POST /api/mfa/disable
 * @desc Disable MFA
 * @access Private
 */
router.post('/disable', authenticate, mfaController.disableMFA);

/**
 * @route POST /api/mfa/verify
 * @desc Verify MFA code during login
 * @access Public
 */
router.post('/verify', mfaController.verifyMFA);

/**
 * @route POST /api/mfa/backup-codes/regenerate
 * @desc Regenerate backup codes
 * @access Private
 */
router.post('/backup-codes/regenerate', authenticate, mfaController.regenerateBackupCodes);

export default router;
```

---

### **Phase 2: Session Management (Week 3)**

#### **2.1 Create Session Service**
**File:** `backend/services/session.service.js`

```javascript
import crypto from 'crypto';
import { User } from '../models/User.js';
import geoip from 'geoip-lite';

/**
 * Create session
 */
export const createSession = async (userId, req) => {
  const sessionId = crypto.randomUUID();
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const geo = geoip.lookup(ipAddress);
  const location = geo ? `${geo.city}, ${geo.country}` : 'Unknown';
  
  const session = {
    sessionId,
    ipAddress,
    userAgent,
    location,
    loginAt: new Date(),
    lastActivity: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)  // 7 days
  };
  
  await User.findByIdAndUpdate(userId, {
    $push: { sessions: session }
  });
  
  return sessionId;
};

/**
 * Update session activity
 */
export const updateSessionActivity = async (userId, sessionId) => {
  await User.updateOne(
    { _id: userId, 'sessions.sessionId': sessionId },
    { $set: { 'sessions.$.lastActivity': new Date() } }
  );
};

/**
 * Get active sessions
 */
export const getActiveSessions = async (userId) => {
  const user = await User.findById(userId);
  
  // Filter expired sessions
  const now = new Date();
  const activeSessions = user.sessions.filter(s => s.expiresAt > now);
  
  return activeSessions;
};

/**
 * Terminate session
 */
export const terminateSession = async (userId, sessionId) => {
  await User.updateOne(
    { _id: userId },
    { $pull: { sessions: { sessionId } } }
  );
};

/**
 * Terminate all sessions except current
 */
export const terminateAllSessions = async (userId, currentSessionId) => {
  await User.updateOne(
    { _id: userId },
    { $pull: { sessions: { sessionId: { $ne: currentSessionId } } } }
  );
};

/**
 * Check concurrent session limit
 */
export const checkSessionLimit = async (userId, role) => {
  const limits = {
    worker: 2,
    employer: 5,
    government: 3,
    admin: 10
  };
  
  const activeSessions = await getActiveSessions(userId);
  const limit = limits[role] || 2;
  
  if (activeSessions.length >= limit) {
    // Remove oldest session
    const oldestSession = activeSessions.sort((a, b) => a.loginAt - b.loginAt)[0];
    await terminateSession(userId, oldestSession.sessionId);
  }
};
```

#### **2.2 Create Session Controller**
**File:** `backend/controllers/session.controller.js`

```javascript
import * as sessionService from '../services/session.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

/**
 * Get active sessions
 */
export const getActiveSessions = async (req, res) => {
  try {
    const sessions = await sessionService.getActiveSessions(req.user.id);
    return successResponse(res, { sessions }, 'Active sessions retrieved');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

/**
 * Terminate session
 */
export const terminateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    await sessionService.terminateSession(req.user.id, sessionId);
    return successResponse(res, null, 'Session terminated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

/**
 * Terminate all sessions
 */
export const terminateAllSessions = async (req, res) => {
  try {
    await sessionService.terminateAllSessions(req.user.id, req.sessionId);
    return successResponse(res, null, 'All other sessions terminated');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
```

---

### **Phase 3: Fine-Grained Permissions (Week 4)**

#### **3.1 Create Permission Model**
**File:** `backend/models/Permission.js`

```javascript
import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  resource: {
    type: String,
    required: true  // wage, worker, employer, report, etc.
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'read', 'update', 'delete', 'execute']
  },
  scope: {
    type: String,
    enum: ['*', 'own', 'assigned', 'department', 'organization'],
    default: 'own'
  },
  description: String
}, {
  timestamps: true
});

permissionSchema.index({ resource: 1, action: 1 });

export const Permission = mongoose.model('Permission', permissionSchema);
```

#### **3.2 Create Role-Permission Mapping**
**File:** `backend/config/permissions.js`

```javascript
export const PERMISSIONS = {
  // Wage permissions
  WAGE_CREATE: 'wage:create',
  WAGE_READ_ALL: 'wage:read:*',
  WAGE_READ_OWN: 'wage:read:own',
  WAGE_READ_ASSIGNED: 'wage:read:assigned',
  WAGE_UPDATE_OWN: 'wage:update:own',
  WAGE_DELETE_OWN: 'wage:delete:own',
  
  // Worker permissions
  WORKER_CREATE: 'worker:create',
  WORKER_READ_ALL: 'worker:read:*',
  WORKER_READ_OWN: 'worker:read:own',
  WORKER_READ_ASSIGNED: 'worker:read:assigned',
  WORKER_UPDATE_OWN: 'worker:update:own',
  WORKER_UPDATE_ALL: 'worker:update:*',
  WORKER_DELETE: 'worker:delete',
  
  // Employer permissions
  EMPLOYER_CREATE: 'employer:create',
  EMPLOYER_READ_ALL: 'employer:read:*',
  EMPLOYER_READ_OWN: 'employer:read:own',
  EMPLOYER_UPDATE_OWN: 'employer:update:own',
  EMPLOYER_UPDATE_ALL: 'employer:update:*',
  
  // Report permissions
  REPORT_GENERATE_OWN: 'report:generate:own',
  REPORT_GENERATE_ALL: 'report:generate:*',
  REPORT_READ_ALL: 'report:read:*',
  
  // QR Token permissions
  QR_GENERATE: 'qr:generate',
  QR_READ_OWN: 'qr:read:own',
  QR_READ_ALL: 'qr:read:*',
  
  // Admin permissions
  USER_CREATE: 'user:create',
  USER_READ_ALL: 'user:read:*',
  USER_UPDATE_ALL: 'user:update:*',
  USER_DELETE: 'user:delete',
  ROLE_ASSIGN: 'role:assign',
  PERMISSION_MANAGE: 'permission:manage',
  
  // System permissions
  AUDIT_LOG_READ: 'audit:read',
  SYSTEM_CONFIG: 'system:config',
  ANALYTICS_VIEW: 'analytics:view'
};

export const ROLE_PERMISSIONS = {
  worker: [
    PERMISSIONS.WAGE_READ_OWN,
    PERMISSIONS.WORKER_READ_OWN,
    PERMISSIONS.WORKER_UPDATE_OWN,
    PERMISSIONS.QR_READ_OWN
  ],
  
  employer: [
    PERMISSIONS.WAGE_CREATE,
    PERMISSIONS.WAGE_READ_OWN,
    PERMISSIONS.WAGE_UPDATE_OWN,
    PERMISSIONS.WORKER_READ_ASSIGNED,
    PERMISSIONS.REPORT_GENERATE_OWN,
    PERMISSIONS.QR_GENERATE,
    PERMISSIONS.QR_READ_OWN
  ],
  
  government: [
    PERMISSIONS.WAGE_READ_ALL,
    PERMISSIONS.WORKER_READ_ALL,
    PERMISSIONS.WORKER_UPDATE_ALL,
    PERMISSIONS.EMPLOYER_READ_ALL,
    PERMISSIONS.EMPLOYER_UPDATE_ALL,
    PERMISSIONS.REPORT_GENERATE_ALL,
    PERMISSIONS.REPORT_READ_ALL,
    PERMISSIONS.QR_READ_ALL,
    PERMISSIONS.AUDIT_LOG_READ,
    PERMISSIONS.ANALYTICS_VIEW
  ],
  
  admin: [
    '*'  // All permissions
  ]
};
```

#### **3.3 Create Permission Middleware**
**File:** `backend/middleware/permission.middleware.js`

```javascript
import { ROLE_PERMISSIONS } from '../config/permissions.js';
import { forbiddenResponse } from '../utils/response.util.js';

/**
 * Check if user has permission
 */
export const hasPermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return forbiddenResponse(res, 'Authentication required');
    }
    
    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    
    // Admin has all permissions
    if (userPermissions.includes('*')) {
      return next();
    }
    
    // Check if user has any of the required permissions
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasPermission) {
      return forbiddenResponse(res, 
        `Permission denied. Required: ${requiredPermissions.join(' or ')}`
      );
    }
    
    next();
  };
};

/**
 * Check resource ownership
 */
export const checkResourceOwnership = (getResourceOwnerId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return forbiddenResponse(res, 'Authentication required');
    }
    
    // Admins and government can access any resource
    if (['admin', 'government'].includes(req.user.role)) {
      return next();
    }
    
    try {
      const ownerId = await getResourceOwnerId(req);
      
      if (ownerId.toString() !== req.user.id.toString() &&
          ownerId !== req.user.idHash) {
        return forbiddenResponse(res, 'Access denied. Not the resource owner.');
      }
      
      next();
    } catch (error) {
      return forbiddenResponse(res, 'Error checking resource ownership');
    }
  };
};
```

---

### **Phase 4: Advanced Features (Week 5-6)**

#### **4.1 API Key Management**
**File:** `backend/models/ApiKey.js`

```javascript
import mongoose from 'mongoose';
import crypto from 'crypto';

const apiKeySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  prefix: {
    type: String,
    required: true  // First 8 chars for display
  },
  scopes: [{
    type: String
  }],
  permissions: [{
    type: String
  }],
  rateLimit: {
    type: Number,
    default: 100  // requests per minute
  },
  expiresAt: {
    type: Date,
    required: true
  },
  lastUsed: Date,
  usageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  ipWhitelist: [String],
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Generate API key
apiKeySchema.statics.generateKey = function() {
  const key = crypto.randomBytes(32).toString('hex');
  const prefix = key.substring(0, 8);
  return { key: `tracient_${key}`, prefix };
};

// Auto-index for expiry
apiKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ApiKey = mongoose.model('ApiKey', apiKeySchema);
```

#### **4.2 Audit Log Enhancement**
**File:** `backend/models/AuditLog.js`

**Add detailed logging:**
```javascript
// Add to existing AuditLog model
eventType: {
  type: String,
  enum: [
    'auth',           // Authentication events
    'access',         // Resource access
    'modification',   // Data changes
    'admin',          // Admin actions
    'security',       // Security events
    'blockchain',     // Blockchain transactions
    'config'          // Configuration changes
  ],
  required: true
},
resourceType: String,    // wage, worker, employer, etc.
resourceId: String,
actionDetails: {
  before: mongoose.Schema.Types.Mixed,
  after: mongoose.Schema.Types.Mixed,
  changes: mongoose.Schema.Types.Mixed
},
risk level: {
  type: String,
  enum: ['low', 'medium', 'high', 'critical'],
  default: 'low'
},
geoLocation: {
  country: String,
  city: String,
  latitude: Number,
  longitude: Number
},
deviceInfo: {
  browser: String,
  os: String,
  device: String
},
sessionId: String
```

---

## 🎨 FRONTEND IAM IMPLEMENTATION

### **Phase 1: MFA UI Components (Week 7)**

#### **1.1 MFA Setup Component**
**File:** `frontend/src/components/security/MFASetup.tsx`

```tsx
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { authService } from '../../services/auth.service';
import { Button, Input, Card } from '../common';

interface MFASetupProps {
  onSuccess: () => void;
}

export const MFASetup: React.FC<MFASetupProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<'qr' | 'verify' | 'backup'>('qr');
  const [qrCode, setQRCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const handleSetupMFA = async () => {
    setLoading(true);
    try {
      const response = await authService.setupMFA();
      setQRCode(response.qrCode);
      setSecret(response.secret);
      setStep('verify');
    } catch (error) {
      console.error('MFA setup failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyAndEnable = async () => {
    setLoading(true);
    try {
      const response = await authService.enableMFA(secret, verificationCode);
      setBackupCodes(response.backupCodes);
      setStep('backup');
    } catch (error) {
      console.error('MFA verification failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadBackupCodes = () => {
    const text = backupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tracient-backup-codes.txt';
    a.click();
  };
  
  return (
    <Card className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Enable Two-Factor Authentication</h2>
      
      {step === 'qr' && (
        <div className="space-y-4">
          <p className="text-gray-600">
            Secure your account by enabling two-factor authentication (2FA).
          </p>
          <Button onClick={handleSetupMFA} loading={loading} fullWidth>
            Get Started
          </Button>
        </div>
      )}
      
      {step === 'verify' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </p>
          <div className="flex justify-center p-4 bg-white">
            <QRCodeSVG value={qrCode} size={200} />
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Manual entry key:</p>
            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
              {secret}
            </code>
          </div>
          <Input
            label="Verification Code"
            placeholder="000000"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            maxLength={6}
          />
          <Button onClick={handleVerifyAndEnable} loading={loading} fullWidth>
            Verify & Enable
          </Button>
        </div>
      )}
      
      {step === 'backup' && (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="text-sm font-semibold mb-2">⚠️ Save Your Backup Codes</p>
            <p className="text-xs text-gray-700">
              Store these codes in a safe place. Each can be used once if you lose access to your authenticator.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 bg-gray-50 p-4 rounded">
            {backupCodes.map((code, index) => (
              <code key={index} className="text-sm font-mono">
                {code}
              </code>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDownloadBackupCodes} variant="outline">
              Download Codes
            </Button>
            <Button onClick={onSuccess} fullWidth>
              Complete Setup
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
```

#### **1.2 MFA Verification Component**
**File:** `frontend/src/components/auth/MFAVerification.tsx`

```tsx
import React, { useState } from 'react';
import { Input, Button, Card } from '../common';
import { authService } from '../../services/auth.service';

interface MFAVerificationProps {
  mfaToken: string;
  userId: string;
  onSuccess: (tokens: any) => void;
}

export const MFAVerification: React.FC<MFAVerificationProps> = ({
  mfaToken,
  userId,
  onSuccess
}) => {
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleVerify = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await authService.completeMFALogin(
        mfaToken,
        code,
        useBackupCode
      );
      onSuccess(response);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Two-Factor Authentication</h2>
      <p className="text-gray-600 mb-6">
        {useBackupCode
          ? 'Enter one of your backup codes'
          : 'Enter the code from your authenticator app'}
      </p>
      
      <Input
        label={useBackupCode ? 'Backup Code' : 'Verification Code'}
        placeholder={useBackupCode ? 'XXXXXXXX' : '000000'}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={useBackupCode ? 8 : 6}
        autoFocus
      />
      
      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}
      
      <Button
        onClick={handleVerify}
        loading={loading}
        disabled={code.length < (useBackupCode ? 8 : 6)}
        fullWidth
        className="mt-4"
      >
        Verify
      </Button>
      
      <button
        onClick={() => setUseBackupCode(!useBackupCode)}
        className="text-sm text-blue-600 hover:underline mt-4 w-full text-center"
      >
        {useBackupCode ? 'Use authenticator code' : 'Use backup code instead'}
      </button>
    </Card>
  );
};
```

#### **1.3 Session Management UI**
**File:** `frontend/src/pages/security/Sessions.tsx`

```tsx
import React, { useState, useEffect } from 'react';
import { sessionService } from '../../services/session.service';
import { Card, Button } from '../../components/common';
import { format } from 'date-fns';

interface Session {
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  loginAt: string;
  lastActivity: string;
}

export const SessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadSessions();
  }, []);
  
  const loadSessions = async () => {
    try {
      const data = await sessionService.getActiveSessions();
      setSessions(data.sessions);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTerminateSession = async (sessionId: string) => {
    if (confirm('Are you sure you want to terminate this session?')) {
      await sessionService.terminateSession(sessionId);
      loadSessions();
    }
  };
  
  const handleTerminateAll = async () => {
    if (confirm('Terminate all other sessions? You will remain logged in on this device.')) {
      await sessionService.terminateAllSessions();
      loadSessions();
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Active Sessions</h1>
        <Button
          onClick={handleTerminateAll}
          variant="outline"
          disabled={sessions.length <= 1}
        >
          Log Out All Other Devices
        </Button>
      </div>
      
      <div className="space-y-4">
        {sessions.map((session) => (
          <Card key={session.sessionId} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{parseUserAgent(session.userAgent)}</h3>
                <p className="text-sm text-gray-600">{session.location}</p>
                <p className="text-xs text-gray-500 mt-2">
                  IP: {session.ipAddress}
                </p>
                <p className="text-xs text-gray-500">
                  Last active: {format(new Date(session.lastActivity), 'PPpp')}
                </p>
              </div>
              <Button
                onClick={() => handleTerminateSession(session.sessionId)}
                variant="danger"
                size="sm"
              >
                Revoke
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
```

---

## 🔗 BLOCKCHAIN IAM INTEGRATION

### **Chaincode Enhancements**

#### **Add Permission Verification**
**File:** `blockchain/chaincode/tracient/chaincode.go`

```go
// VerifyPermission checks if a user has specific permission
func (s *SmartContract) VerifyPermission(ctx contractapi.TransactionContextInterface, userIDHash string, requiredPermission string) (bool, error) {
	// Get user
	user, err := s.GetUserProfile(ctx, userIDHash)
	if err != nil {
		return false, err
	}
	
	// Check if user is active
	if user.Status != "active" {
		return false, fmt.Errorf("user is not active")
	}
	
	// Role-based permission check
	rolePermissions := map[string][]string{
		"admin":               []string{"*"},
		"government_official": []string{"read_all", "update_threshold", "generate_report"},
		"employer":            []string{"record_wage", "read_own_wages", "generate_qr"},
		"worker":              []string{"read_own_data", "check_poverty_status"},
	}
	
	permissions, exists := rolePermissions[user.Role]
	if !exists {
		return false, fmt.Errorf("invalid role: %s", user.Role)
	}
	
	// Admin has all permissions
	for _, perm := range permissions {
		if perm == "*" || perm == requiredPermission {
			return true, nil
		}
	}
	
	return false, nil
}

// LogAccessEvent logs an access event for audit
func (s *SmartContract) LogAccessEvent(ctx contractapi.TransactionContextInterface, userIDHash string, action string, resourceType string, resourceID string, result string) error {
	timestamp := time.Now().UTC().Format(time.RFC3339)
	
	accessLog := AccessLog{
		DocType:      "access_log",
		UserIDHash:   userIDHash,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		Result:       result,  // "success" or "denied"
		Timestamp:    timestamp,
	}
	
	key := fmt.Sprintf("ACCESS_LOG_%s_%s", userIDHash, timestamp)
	payload, err := json.Marshal(accessLog)
	if err != nil {
		return fmt.Errorf("marshal access log: %w", err)
	}
	
	return ctx.GetStub().PutState(key, payload)
}
```

---

## 🔒 SECURITY & COMPLIANCE

### **Security Requirements**

#### **1. Data Protection**
- Encrypt MFA secrets using AES-256
- Hash API keys with SHA-256
- Use bcrypt for password hashing (cost factor: 12)
- Implement data masking for sensitive fields in logs

#### **2. Network Security**
- Enforce HTTPS/TLS 1.3
- Implement CORS policies
- Rate limiting: 100 req/min per IP
- DDoS protection via Cloudflare/AWS Shield

#### **3. Compliance**
- **GDPR Compliance:**
  - Data retention policies (7 years for wage data, 3 years for audit logs)
  - Right to erasure (anonymization after 6 months of account deletion)
  - Data portability (export user data in JSON format)
  
- **IT Act 2000 (India):**
  - Digital signature support for government officials
  - Data localization (host in India for PII)
  - Incident reporting (notify CERT-In within 6 hours)

#### **4. Audit & Monitoring**
- Log all authentication events
- Monitor failed login attempts (alert on 10+ failures)
- Track privilege escalation
- Generate monthly security reports

---

## 🧪 TESTING STRATEGY

### **Test Categories**

#### **1. Unit Tests**
```javascript
// backend/tests/unit/mfa.service.test.js
describe('MFA Service', () => {
  test('should generate valid TOTP secret', async () => {
    const result = await mfaService.generateMFASecret('user123');
    expect(result).toHaveProperty('secret');
    expect(result).toHaveProperty('qrCode');
  });
  
  test('should verify valid TOTP code', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const token = generateTOTPToken(secret);
    const isValid = mfaService.verifyTOTP(secret, token);
    expect(isValid).toBe(true);
  });
  
  test('should reject invalid backup code', async () => {
    const isValid = await mfaService.verifyBackupCode('user123', 'INVALID');
    expect(isValid).toBe(false);
  });
});
```

#### **2. Integration Tests**
```javascript
// backend/tests/integration/auth.test.js
describe('MFA Login Flow', () => {
  test('should require MFA for enabled users', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@tracient.com', password: 'password123' });
    
    expect(response.status).toBe(200);
    expect(response.body.data.mfaRequired).toBe(true);
    expect(response.body.data).toHaveProperty('mfaToken');
  });
  
  test('should complete login after MFA verification', async () => {
    // ... test implementation
  });
});
```

#### **3. E2E Tests**
```typescript
// frontend/cypress/e2e/mfa.cy.ts
describe('MFA Setup', () => {
  it('should setup MFA successfully', () => {
    cy.login('test@tracient.com', 'password123');
    cy.visit('/settings/security');
    cy.contains('Enable Two-Factor Authentication').click();
    
    // Scan QR code (mocked)
    cy.get('[data-testid="verification-code"]').type('123456');
    cy.get('[data-testid="verify-button"]').click();
    
    // Verify backup codes displayed
    cy.contains('Save Your Backup Codes').should('be.visible');
    cy.get('[data-testid="backup-code"]').should('have.length', 10);
  });
});
```

---

## 📦 DEPLOYMENT PLAN

### **Phase 1: Development (Week 1-6)**
- Backend IAM implementation
- Frontend components
- Unit & integration tests

### **Phase 2: Staging (Week 7-8)**
- Deploy to staging environment
- E2E testing
- Security audit
- Performance testing

### **Phase 3: Pilot (Week 9-10)**
- Deploy to pilot environment
- 50 users (10 from each role)
- Gather feedback
- Bug fixes

### **Phase 4: Production (Week 11-12)**
- Gradual rollout (10% → 50% → 100%)
- Monitor authentication success rate
- Track MFA adoption
- Performance monitoring

---

## 📊 SUCCESS METRICS

### **KPIs**

1. **MFA Adoption Rate:** Target 60% within 3 months
2. **Authentication Success Rate:** > 99.5%
3. **Average Login Time:** < 3 seconds (including MFA)
4. **Session Hijacking Incidents:** 0
5. **Failed Login Attempts:** < 1% of total logins
6. **API Key Usage:** 100+ third-party integrations
7. **Security Incidents:** 0 major breaches

---

## 🔗 API ENDPOINTS SUMMARY

### **MFA Endpoints**
- `POST /api/mfa/setup` - Generate QR code
- `POST /api/mfa/enable` - Enable MFA
- `POST /api/mfa/disable` - Disable MFA
- `POST /api/mfa/verify` - Verify MFA code
- `POST /api/mfa/backup-codes/regenerate` - Regenerate backup codes

### **Session Endpoints**
- `GET /api/sessions` - Get active sessions
- `DELETE /api/sessions/:id` - Terminate session
- `DELETE /api/sessions/all` - Terminate all sessions

### **Permission Endpoints**
- `GET /api/permissions` - List all permissions
- `GET /api/permissions/user/:id` - Get user permissions
- `POST /api/permissions/assign` - Assign permission
- `DELETE /api/permissions/revoke` - Revoke permission

### **API Key Endpoints**
- `POST /api/api-keys` - Create API key
- `GET /api/api-keys` - List API keys
- `DELETE /api/api-keys/:id` - Revoke API key
- `PUT /api/api-keys/:id/rotate` - Rotate API key

### **Audit Endpoints**
- `GET /api/audit/logs` - Get audit logs
- `GET /api/audit/user/:id` - Get user activity
- `GET /api/audit/export` - Export audit logs

---

## ✅ IMPLEMENTATION CHECKLIST

### **Chaincode IAM (COMPLETED)**
- [x] Create `access_control.go` with ABAC functions
- [x] Create `audit_log.go` with audit logging
- [x] Define access rules for all 24 functions
- [x] Implement `CheckAccess()` function
- [x] Implement `CheckSelfAccess()` for self-only data access
- [x] Implement `GetClientIdentity()` to extract certificate attributes
- [x] Add IAM checks to all chaincode functions
- [x] Create `collections_config.json` for private data
- [x] Create user registration scripts (bash and PowerShell)
- [x] Update deployment scripts for collections
- [x] Create comprehensive IAM test script

### **Access Control Rules Implemented**
| Function | Allowed Roles | Permissions Required | Clearance Level |
|----------|---------------|---------------------|-----------------|
| RecordWage | employer, admin | canRecordWage | 5 |
| ReadWage | all roles | - | 1 |
| QueryWagesByWorker | all roles (self-access for workers) | - | 1 |
| QueryWagesByEmployer | employer, gov, auditor, admin | - | 3 |
| BatchRecordWages | employer, admin | canRecordWage, canBatchProcess | 6 |
| RecordUPITransaction | employer, bank_officer, admin | canRecordUPI | 5 |
| RegisterUser | government_official, admin | canRegisterUsers | 8 |
| UpdateUserStatus | government_official, admin | canManageUsers | 9 |
| SetPovertyThreshold | government_official, admin | canUpdateThresholds | 8 |
| FlagAnomaly | auditor, government, admin | canFlagAnomaly | 7 |
| GetFlaggedWages | auditor, government, admin | - | 6 |
| UpdateAnomalyStatus | auditor, government, admin | canReviewAnomaly | 7 |
| GenerateComplianceReport | government, auditor, admin | canGenerateReport | 6 |
| InitLedger | admin only | - | 10 |

### **Files Created**
```
blockchain/chaincode/tracient/
├── chaincode.go           # Updated with IAM checks on all functions
├── access_control.go      # NEW: ABAC implementation (~500 lines)
├── audit_log.go           # NEW: Audit logging (~400 lines)
├── collections_config.json # NEW: Private data collections
└── go.mod                 # Updated dependencies

blockchain/scripts/
├── register-users.sh      # NEW: User registration with attributes (bash)
└── register-users.ps1     # NEW: User registration (PowerShell)

blockchain/
├── deploy-chaincode.sh    # Updated for collections support
└── test-iam.sh            # NEW: IAM test suite
```

---

## 🎯 PRIORITY MATRIX

| Feature | Priority | Complexity | Status |
|---------|----------|------------|--------|
| ABAC in Chaincode | HIGH | High | ✅ COMPLETE |
| Audit Logging | HIGH | Medium | ✅ COMPLETE |
| Access Rules | HIGH | Medium | ✅ COMPLETE |
| Self-Access Control | HIGH | Medium | ✅ COMPLETE |
| Private Data Collections | MEDIUM | Medium | ✅ COMPLETE |
| User Registration Scripts | MEDIUM | Low | ✅ COMPLETE |
| Certificate Attributes | MEDIUM | Medium | 📋 READY |
| Cross-Org Access | MEDIUM | High | 📋 READY |
| Time-based Restrictions | LOW | Medium | Future |
| Certificate Rotation | LOW | High | Future |

---

## 🚀 HOW TO USE

### **1. Deploy Chaincode with IAM**
```bash
cd blockchain
./deploy-chaincode.sh
```

### **2. Register Users with Attributes**
```bash
# Register sample users
./scripts/register-users.sh register-sample-users

# Register individual user
./scripts/register-users.sh register-worker worker001 "John Doe" abc123hash construction Karnataka org1
```

### **3. Test IAM Implementation**
```bash
./test-iam.sh
```

### **4. Enroll User and Get Certificate**
```bash
./scripts/register-users.sh enroll worker001 org1 ./users
```

---

## 📝 NOTES

- **IAMEnabled Flag**: Set `const IAMEnabled = false` in chaincode.go to disable IAM for testing
- All audit logs are stored on-chain with key prefix `AUDIT_`
- High-risk events emit blockchain events for monitoring
- Self-access checks allow workers to only access their own data
- Privileged roles (admin, government, auditor) can access all data

---

**END OF IAM IMPLEMENTATION PROMPT**

This IAM system is now fully implemented in the blockchain chaincode. The implementation includes:
- ✅ Attribute-Based Access Control (ABAC)
- ✅ Role-Based Access Control with 6 roles
- ✅ Clearance level validation
- ✅ Permission-based function access
- ✅ Self-access restrictions for sensitive data
- ✅ Comprehensive audit logging
- ✅ High-risk event detection
- ✅ Private data collection configuration
- ✅ User registration scripts with certificate attributes
