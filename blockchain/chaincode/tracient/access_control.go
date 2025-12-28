package main

import (
	"encoding/base64"
	"fmt"
	"strconv"
	"strings"

	"github.com/hyperledger/fabric-chaincode-go/v2/pkg/cid"
	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

// ============================================================================
// ACCESS CONTROL STRUCTURES
// ============================================================================

// AccessRule defines access control requirements for chaincode functions
type AccessRule struct {
	AllowedRoles        []string // Roles allowed to execute (from certificate attribute)
	RequiredPermissions []string // Specific permissions required (e.g., "canRecordWage")
	MinClearanceLevel   int      // Minimum clearance level required (1-10)
	AllowedMSPs         []string // MSP IDs allowed (e.g., "Org1MSP", "Org2MSP")
	AllowSelf           bool     // Allow users to access their own data only
	Description         string   // Human-readable description
}

// AccessDeniedError represents an access denial with details
type AccessDeniedError struct {
	Reason     string
	UserID     string
	Function   string
	RequiredBy string
}

func (e *AccessDeniedError) Error() string {
	return fmt.Sprintf("ACCESS DENIED: %s (function: %s, user: %s, required: %s)", e.Reason, e.Function, e.UserID, e.RequiredBy)
}

// ClientIdentity holds extracted identity information from certificate
type ClientIdentity struct {
	ID             string            // Enrollment ID
	MSPID          string            // Organization MSP ID
	Role           string            // Role attribute from cert
	ClearanceLevel int               // Clearance level from cert
	Permissions    map[string]bool   // Permission flags from cert
	Attributes     map[string]string // All attributes from cert
	Department     string            // Department attribute
	State          string            // State/region attribute
}

// ============================================================================
// ACCESS RULES CONFIGURATION
// ============================================================================

// GetAccessRules returns predefined access rules for each chaincode function
func GetAccessRules() map[string]AccessRule {
	return map[string]AccessRule{
		// WAGE RECORD FUNCTIONS
		"RecordWage": {
			AllowedRoles:        []string{"employer", "admin"},
			RequiredPermissions: []string{"canRecordWage"},
			MinClearanceLevel:   5,
			AllowedMSPs:         []string{"Org1MSP", "Org2MSP"},
			Description:         "Record a new wage transaction",
		},
		"ReadWage": {
			AllowedRoles:      []string{"worker", "employer", "government_official", "auditor", "bank_officer", "admin"},
			MinClearanceLevel: 1,
			AllowedMSPs:       []string{"Org1MSP", "Org2MSP"},
			Description:       "Read wage record by ID",
		},
		"QueryWagesByWorker": {
			AllowedRoles:      []string{"worker", "employer", "government_official", "auditor", "bank_officer", "admin"},
			MinClearanceLevel: 1,
			AllowedMSPs:       []string{"Org1MSP", "Org2MSP"},
			AllowSelf:         true, // Workers can only query their own wages
			Description:       "Query wages by worker ID hash",
		},
		"QueryWagesByEmployer": {
			AllowedRoles:      []string{"employer", "government_official", "auditor", "admin"},
			MinClearanceLevel: 3,
			AllowedMSPs:       []string{"Org1MSP", "Org2MSP"},
			AllowSelf:         true, // Employers can only query their own wages
			Description:       "Query wages by employer ID hash",
		},
		"BatchRecordWages": {
			AllowedRoles:        []string{"employer", "admin"},
			RequiredPermissions: []string{"canRecordWage", "canBatchProcess"},
			MinClearanceLevel:   6,
			AllowedMSPs:         []string{"Org1MSP", "Org2MSP"},
			Description:         "Batch record multiple wages",
		},
		"QueryWageHistory": {
			AllowedRoles:      []string{"worker", "employer", "government_official", "auditor", "admin"},
			MinClearanceLevel: 2,
			AllowedMSPs:       []string{"Org1MSP", "Org2MSP"},
			Description:       "Query wage history for a record",
		},
		"CalculateTotalIncome": {
			AllowedRoles:      []string{"worker", "employer", "government_official", "auditor", "bank_officer", "admin"},
			MinClearanceLevel: 2,
			AllowedMSPs:       []string{"Org1MSP", "Org2MSP"},
			AllowSelf:         true,
			Description:       "Calculate total income for a worker",
		},
		"GetWorkerIncomeHistory": {
			AllowedRoles:      []string{"worker", "employer", "government_official", "auditor", "bank_officer", "admin"},
			MinClearanceLevel: 2,
			AllowedMSPs:       []string{"Org1MSP", "Org2MSP"},
			AllowSelf:         true,
			Description:       "Get monthly income breakdown",
		},

		// UPI TRANSACTION FUNCTIONS
		"RecordUPITransaction": {
			AllowedRoles:        []string{"employer", "bank_officer", "admin"},
			RequiredPermissions: []string{"canRecordUPI"},
			MinClearanceLevel:   5,
			AllowedMSPs:         []string{"Org1MSP", "Org2MSP"},
			Description:         "Record UPI payment transaction",
		},
		"ReadUPITransaction": {
			AllowedRoles:      []string{"worker", "employer", "government_official", "bank_officer", "auditor", "admin"},
			MinClearanceLevel: 2,
			AllowedMSPs:       []string{"Org1MSP", "Org2MSP"},
			Description:       "Read UPI transaction by ID",
		},
		"QueryUPITransactionsByWorker": {
			AllowedRoles:      []string{"worker", "employer", "government_official", "bank_officer", "auditor", "admin"},
			MinClearanceLevel: 2,
			AllowedMSPs:       []string{"Org1MSP", "Org2MSP"},
			AllowSelf:         true,
			Description:       "Query UPI transactions for a worker",
		},

		// USER MANAGEMENT FUNCTIONS
		"RegisterUser": {
			AllowedRoles:        []string{"government_official", "admin"},
			RequiredPermissions: []string{"canRegisterUsers"},
			MinClearanceLevel:   8,
			AllowedMSPs:         []string{"Org1MSP"}, // Only Org1 can register users
			Description:         "Register new user in the system",
		},
		"GetUserProfile": {
			AllowedRoles:      []string{"worker", "employer", "government_official", "bank_officer", "auditor", "admin"},
			MinClearanceLevel: 1,
			AllowedMSPs:       []string{"Org1MSP", "Org2MSP"},
			AllowSelf:         true,
			Description:       "Get user profile by ID hash",
		},
		"UpdateUserStatus": {
			AllowedRoles:        []string{"government_official", "admin"},
			RequiredPermissions: []string{"canManageUsers"},
			MinClearanceLevel:   9,
			AllowedMSPs:         []string{"Org1MSP"},
			Description:         "Update user status (active/inactive/suspended)",
		},
		"VerifyUserRole": {
			AllowedRoles:      []string{"worker", "employer", "government_official", "bank_officer", "auditor", "admin"},
			MinClearanceLevel: 1,
			AllowedMSPs:       []string{"Org1MSP", "Org2MSP"},
			Description:       "Verify user has specific role",
		},

		// POVERTY THRESHOLD FUNCTIONS
		"SetPovertyThreshold": {
			AllowedRoles:        []string{"government_official", "admin"},
			RequiredPermissions: []string{"canUpdateThresholds"},
			MinClearanceLevel:   8,
			AllowedMSPs:         []string{"Org1MSP"}, // Only Org1 can set thresholds
			Description:         "Set BPL/APL poverty threshold",
		},
		"GetPovertyThreshold": {
			AllowedRoles:      []string{"worker", "employer", "government_official", "bank_officer", "auditor", "admin"},
			MinClearanceLevel: 1,
			AllowedMSPs:       []string{"Org1MSP", "Org2MSP"},
			Description:       "Get poverty threshold for state",
		},
		"CheckPovertyStatus": {
			AllowedRoles:      []string{"worker", "employer", "government_official", "bank_officer", "auditor", "admin"},
			MinClearanceLevel: 2,
			AllowedMSPs:       []string{"Org1MSP", "Org2MSP"},
			AllowSelf:         true,
			Description:       "Check if worker is BPL/APL",
		},

		// ANOMALY DETECTION FUNCTIONS
		"FlagAnomaly": {
			AllowedRoles:        []string{"auditor", "government_official", "admin"},
			RequiredPermissions: []string{"canFlagAnomaly"},
			MinClearanceLevel:   7,
			AllowedMSPs:         []string{"Org1MSP", "Org2MSP"},
			Description:         "Flag wage record as suspicious",
		},
		"GetFlaggedWages": {
			AllowedRoles:      []string{"auditor", "government_official", "admin"},
			MinClearanceLevel: 6,
			AllowedMSPs:       []string{"Org1MSP", "Org2MSP"},
			Description:       "Get all flagged anomalies",
		},
		"UpdateAnomalyStatus": {
			AllowedRoles:        []string{"auditor", "government_official", "admin"},
			RequiredPermissions: []string{"canReviewAnomaly"},
			MinClearanceLevel:   7,
			AllowedMSPs:         []string{"Org1MSP", "Org2MSP"},
			Description:         "Update anomaly review status",
		},

		// COMPLIANCE & REPORTING FUNCTIONS
		"GenerateComplianceReport": {
			AllowedRoles:        []string{"government_official", "auditor", "admin"},
			RequiredPermissions: []string{"canGenerateReport"},
			MinClearanceLevel:   6,
			AllowedMSPs:         []string{"Org1MSP", "Org2MSP"},
			Description:         "Generate compliance reports",
		},

		// INITIALIZATION (admin only)
		"InitLedger": {
			AllowedRoles:      []string{"admin"},
			MinClearanceLevel: 10,
			AllowedMSPs:       []string{"Org1MSP"},
			Description:       "Initialize ledger with seed data",
		},

		// EXISTENCE CHECK FUNCTIONS (read-only, all roles)
		"WageExists": {
			AllowedRoles:      []string{"worker", "employer", "government_official", "auditor", "bank_officer", "admin"},
			MinClearanceLevel: 1,
			AllowedMSPs:       []string{"Org1MSP", "Org2MSP"},
			Description:       "Check if wage record exists",
		},
		"UPITransactionExists": {
			AllowedRoles:      []string{"worker", "employer", "government_official", "auditor", "bank_officer", "admin"},
			MinClearanceLevel: 1,
			AllowedMSPs:       []string{"Org1MSP", "Org2MSP"},
			Description:       "Check if UPI transaction exists",
		},
		"UserExists": {
			AllowedRoles:      []string{"worker", "employer", "government_official", "auditor", "bank_officer", "admin"},
			MinClearanceLevel: 1,
			AllowedMSPs:       []string{"Org1MSP", "Org2MSP"},
			Description:       "Check if user exists",
		},
	}
}

// ============================================================================
// IDENTITY EXTRACTION FUNCTIONS
// ============================================================================

// GetClientIdentity extracts all identity information from the client certificate
func GetClientIdentity(ctx contractapi.TransactionContextInterface) (*ClientIdentity, error) {
	identity := &ClientIdentity{
		Permissions: make(map[string]bool),
		Attributes:  make(map[string]string),
	}

	// Get client ID (enrollment ID)
	clientID, err := cid.GetID(ctx.GetStub())
	if err != nil {
		return nil, fmt.Errorf("failed to get client ID: %w", err)
	}
	identity.ID = clientID

	// Get MSP ID
	mspID, err := cid.GetMSPID(ctx.GetStub())
	if err != nil {
		return nil, fmt.Errorf("failed to get MSP ID: %w", err)
	}
	identity.MSPID = mspID

	// Get role attribute
	role, found, err := cid.GetAttributeValue(ctx.GetStub(), "role")
	if err != nil {
		return nil, fmt.Errorf("failed to get role attribute: %w", err)
	}
	if found {
		identity.Role = role
		identity.Attributes["role"] = role
	}

	// AUTO-DETECT ADMIN FROM CERTIFICATE OU (Organizational Unit)
	// This allows default Fabric admin certificates to work without explicit role attributes
	if identity.Role == "" {
		// The clientID from cid.GetID() is base64 encoded, so we need to decode it
		// to check for admin OU. The format is: x509::CN=...,OU=admin,...::...
		decodedID := clientID
		if decoded, err := base64.StdEncoding.DecodeString(clientID); err == nil {
			decodedID = string(decoded)
		}
		
		// Check if user is in admin OU by examining the decoded client ID
		// Default Fabric admin certs have OU=admin in the certificate
		if strings.Contains(decodedID, "OU=admin") || strings.Contains(strings.ToLower(decodedID), ",ou=admin,") {
			identity.Role = "admin"
			identity.Attributes["role"] = "admin"
			identity.ClearanceLevel = 10 // Admin gets highest clearance
			identity.Attributes["clearanceLevel"] = "10"
			// Grant all permissions to admin
			allPermissions := []string{
				"canRecordWage", "canRecordUPI", "canBatchProcess",
				"canRegisterUsers", "canManageUsers",
				"canUpdateThresholds", "canFlagAnomaly", "canReviewAnomaly",
				"canGenerateReport", "canReadAll", "canExport",
			}
			for _, perm := range allPermissions {
				identity.Permissions[perm] = true
				identity.Attributes[perm] = "true"
			}
		}
	}

	// Get clearance level (if not already set by admin detection)
	if identity.ClearanceLevel == 0 {
		clearanceStr, found, err := cid.GetAttributeValue(ctx.GetStub(), "clearanceLevel")
		if err == nil && found {
			clearance, _ := strconv.Atoi(clearanceStr)
			identity.ClearanceLevel = clearance
			identity.Attributes["clearanceLevel"] = clearanceStr
		}
	}

	// AUTO-GRANT PERMISSIONS BASED ON ROLE
	// This makes the system more practical by deriving permissions from roles
	switch identity.Role {
	case "admin":
		// Admin gets all permissions (already handled above)
	case "government_official":
		// Government officials can update thresholds, register users, flag anomalies
		identity.Permissions["canUpdateThresholds"] = true
		identity.Permissions["canRegisterUsers"] = true
		identity.Permissions["canManageUsers"] = true
		identity.Permissions["canFlagAnomaly"] = true
		identity.Permissions["canReviewAnomaly"] = true
		identity.Permissions["canGenerateReport"] = true
		identity.Permissions["canReadAll"] = true
		if identity.ClearanceLevel == 0 {
			identity.ClearanceLevel = 8 // Default high clearance for govt
		}
	case "auditor":
		// Auditors can flag and review anomalies, generate reports
		identity.Permissions["canFlagAnomaly"] = true
		identity.Permissions["canReviewAnomaly"] = true
		identity.Permissions["canGenerateReport"] = true
		identity.Permissions["canReadAll"] = true
		if identity.ClearanceLevel == 0 {
			identity.ClearanceLevel = 6 // Default medium-high for auditor
		}
	case "bank_officer":
		// Bank officers can record UPI, verify
		identity.Permissions["canRecordUPI"] = true
		identity.Permissions["canReadAll"] = true
		if identity.ClearanceLevel == 0 {
			identity.ClearanceLevel = 5 // Default medium
		}
	case "employer":
		// Employers can record wages and batch process
		identity.Permissions["canRecordWage"] = true
		identity.Permissions["canRecordUPI"] = true
		identity.Permissions["canBatchProcess"] = true
		if identity.ClearanceLevel == 0 {
			identity.ClearanceLevel = 6 // Default medium-high for batch ops
		}
	case "worker":
		// Workers have minimal permissions
		if identity.ClearanceLevel == 0 {
			identity.ClearanceLevel = 2 // Default low
		}
	}

	// Get department
	department, found, _ := cid.GetAttributeValue(ctx.GetStub(), "department")
	if found {
		identity.Department = department
		identity.Attributes["department"] = department
	}

	// Get state
	state, found, _ := cid.GetAttributeValue(ctx.GetStub(), "state")
	if found {
		identity.State = state
		identity.Attributes["state"] = state
	}

	// Get permission flags
	permissionAttrs := []string{
		"canRecordWage", "canRecordUPI", "canBatchProcess",
		"canRegisterUsers", "canManageUsers",
		"canUpdateThresholds", "canFlagAnomaly", "canReviewAnomaly",
		"canGenerateReport", "canReadAll", "canExport",
	}

	for _, perm := range permissionAttrs {
		permValue, found, err := cid.GetAttributeValue(ctx.GetStub(), perm)
		if err == nil && found {
			identity.Permissions[perm] = permValue == "true"
			identity.Attributes[perm] = permValue
		}
	}

	// Get idHash (for self-access checks)
	idHash, found, _ := cid.GetAttributeValue(ctx.GetStub(), "idHash")
	if found {
		identity.Attributes["idHash"] = idHash
	}

	return identity, nil
}

// ============================================================================
// ACCESS CONTROL FUNCTIONS
// ============================================================================

// CheckAccess verifies if the client meets access requirements for a function
func CheckAccess(ctx contractapi.TransactionContextInterface, functionName string) (*ClientIdentity, error) {
	// Get access rules
	rules := GetAccessRules()
	rule, exists := rules[functionName]
	if !exists {
		// If no rule defined, deny by default (secure by default)
		return nil, &AccessDeniedError{
			Reason:     "No access rule defined for function",
			Function:   functionName,
			RequiredBy: "system",
		}
	}

	// Get client identity
	identity, err := GetClientIdentity(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get client identity: %w", err)
	}

	// Check MSP ID
	if len(rule.AllowedMSPs) > 0 {
		allowed := false
		for _, allowedMSP := range rule.AllowedMSPs {
			if identity.MSPID == allowedMSP {
				allowed = true
				break
			}
		}
		if !allowed {
			return nil, &AccessDeniedError{
				Reason:     fmt.Sprintf("MSP '%s' not allowed", identity.MSPID),
				UserID:     identity.ID,
				Function:   functionName,
				RequiredBy: fmt.Sprintf("AllowedMSPs: %v", rule.AllowedMSPs),
			}
		}
	}

	// Check role
	if len(rule.AllowedRoles) > 0 {
		if identity.Role == "" {
			return nil, &AccessDeniedError{
				Reason:     "No role attribute found in certificate",
				UserID:     identity.ID,
				Function:   functionName,
				RequiredBy: fmt.Sprintf("AllowedRoles: %v", rule.AllowedRoles),
			}
		}

		allowed := false
		for _, allowedRole := range rule.AllowedRoles {
			if identity.Role == allowedRole {
				allowed = true
				break
			}
		}
		if !allowed {
			return nil, &AccessDeniedError{
				Reason:     fmt.Sprintf("Role '%s' not allowed", identity.Role),
				UserID:     identity.ID,
				Function:   functionName,
				RequiredBy: fmt.Sprintf("AllowedRoles: %v", rule.AllowedRoles),
			}
		}
	}

	// Check clearance level
	if rule.MinClearanceLevel > 0 {
		if identity.ClearanceLevel < rule.MinClearanceLevel {
			return nil, &AccessDeniedError{
				Reason:     fmt.Sprintf("Clearance level %d below required %d", identity.ClearanceLevel, rule.MinClearanceLevel),
				UserID:     identity.ID,
				Function:   functionName,
				RequiredBy: fmt.Sprintf("MinClearanceLevel: %d", rule.MinClearanceLevel),
			}
		}
	}

	// Check required permissions
	for _, perm := range rule.RequiredPermissions {
		if !identity.Permissions[perm] {
			return nil, &AccessDeniedError{
				Reason:     fmt.Sprintf("Missing required permission: %s", perm),
				UserID:     identity.ID,
				Function:   functionName,
				RequiredBy: fmt.Sprintf("RequiredPermissions: %v", rule.RequiredPermissions),
			}
		}
	}

	return identity, nil
}

// CheckSelfAccess verifies if the user is accessing their own data
// This is a soft check - if idHash is not set, we allow access based on role alone
// In production with strict self-access requirements, idHash must be set in certificates
func CheckSelfAccess(identity *ClientIdentity, functionName string, targetIDHash string) error {
	rules := GetAccessRules()
	rule, exists := rules[functionName]
	if !exists {
		return nil
	}

	// If self-access is enabled
	if rule.AllowSelf {
		// Privileged roles can access any data
		privilegedRoles := map[string]bool{
			"admin":               true,
			"government_official": true,
			"auditor":             true,
		}

		if privilegedRoles[identity.Role] {
			return nil // Privileged roles bypass self-access check
		}

		// For other roles, check if they are in the allowed roles for this function
		// If the role passed the CheckAccess call, they should be allowed
		roleAllowed := false
		for _, allowedRole := range rule.AllowedRoles {
			if identity.Role == allowedRole {
				roleAllowed = true
				break
			}
		}

		// If role is allowed for this function, allow access
		// Self-access is more of a guidance than a hard restriction in this implementation
		// For strict self-access enforcement, uncomment the idHash check below
		if roleAllowed {
			// Check if idHash is set - if so, enforce self-access
			userIDHash, exists := identity.Attributes["idHash"]
			if exists && userIDHash != "" && userIDHash != targetIDHash {
				// idHash is set but doesn't match - deny access
				return &AccessDeniedError{
					Reason:     "Can only access own data",
					UserID:     identity.ID,
					Function:   functionName,
					RequiredBy: "Self-access only",
				}
			}
			// idHash not set or matches - allow access
			return nil
		}

		// Role not allowed
		return &AccessDeniedError{
			Reason:     "Role not allowed for this function",
			UserID:     identity.ID,
			Function:   functionName,
			RequiredBy: fmt.Sprintf("AllowedRoles: %v", rule.AllowedRoles),
		}
	}

	return nil
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// GetAttributeValue retrieves a single attribute from the certificate
func GetAttributeValue(ctx contractapi.TransactionContextInterface, attrName string) (string, bool, error) {
	return cid.GetAttributeValue(ctx.GetStub(), attrName)
}

// HasRole checks if the client has a specific role
func HasRole(ctx contractapi.TransactionContextInterface, role string) (bool, error) {
	identity, err := GetClientIdentity(ctx)
	if err != nil {
		return false, err
	}
	return identity.Role == role, nil
}

// HasAnyRole checks if the client has any of the specified roles
func HasAnyRole(ctx contractapi.TransactionContextInterface, roles ...string) (bool, error) {
	identity, err := GetClientIdentity(ctx)
	if err != nil {
		return false, err
	}
	for _, role := range roles {
		if identity.Role == role {
			return true, nil
		}
	}
	return false, nil
}

// HasPermission checks if the client has a specific permission
func HasPermission(ctx contractapi.TransactionContextInterface, permission string) (bool, error) {
	identity, err := GetClientIdentity(ctx)
	if err != nil {
		return false, err
	}
	return identity.Permissions[permission], nil
}

// GetCallerMSPID returns the caller's MSP ID
func GetCallerMSPID(ctx contractapi.TransactionContextInterface) (string, error) {
	return cid.GetMSPID(ctx.GetStub())
}

// GetCallerID returns the caller's enrollment ID
func GetCallerID(ctx contractapi.TransactionContextInterface) (string, error) {
	return cid.GetID(ctx.GetStub())
}

// IsOrgMember checks if the caller belongs to a specific organization
func IsOrgMember(ctx contractapi.TransactionContextInterface, orgMSP string) (bool, error) {
	mspID, err := cid.GetMSPID(ctx.GetStub())
	if err != nil {
		return false, err
	}
	return mspID == orgMSP, nil
}

// AssertAttributeValue checks if an attribute has a specific value
func AssertAttributeValue(ctx contractapi.TransactionContextInterface, attrName string, expectedValue string) error {
	value, found, err := cid.GetAttributeValue(ctx.GetStub(), attrName)
	if err != nil {
		return fmt.Errorf("failed to get attribute %s: %w", attrName, err)
	}
	if !found {
		return fmt.Errorf("attribute %s not found", attrName)
	}
	if value != expectedValue {
		return fmt.Errorf("attribute %s value '%s' does not match expected '%s'", attrName, value, expectedValue)
	}
	return nil
}

// GetDepartmentFilter returns department-based data filter for the caller
func GetDepartmentFilter(ctx contractapi.TransactionContextInterface) (string, error) {
	identity, err := GetClientIdentity(ctx)
	if err != nil {
		return "", err
	}
	return identity.Department, nil
}

// GetStateFilter returns state-based data filter for the caller
func GetStateFilter(ctx contractapi.TransactionContextInterface) (string, error) {
	identity, err := GetClientIdentity(ctx)
	if err != nil {
		return "", err
	}
	return identity.State, nil
}

// ValidateWageAmountLimit checks if wage amount is within employer's limit
func ValidateWageAmountLimit(ctx contractapi.TransactionContextInterface, amount float64) error {
	maxAmountStr, found, err := cid.GetAttributeValue(ctx.GetStub(), "maxWageAmount")
	if err != nil || !found {
		return nil // No limit set
	}

	maxAmount, err := strconv.ParseFloat(maxAmountStr, 64)
	if err != nil {
		return nil // Invalid limit, skip check
	}

	if amount > maxAmount {
		return fmt.Errorf("wage amount %.2f exceeds authorized limit %.2f", amount, maxAmount)
	}

	return nil
}

// FormatAccessDenied creates a formatted access denied message
func FormatAccessDenied(function string, reason string) string {
	return fmt.Sprintf("ACCESS DENIED [%s]: %s", function, reason)
}

// LogAccessAttempt logs an access attempt (success or failure) for auditing
func LogAccessAttempt(ctx contractapi.TransactionContextInterface, function string, success bool, details string) {
	identity, _ := GetClientIdentity(ctx)
	userID := "unknown"
	mspID := "unknown"
	role := "unknown"

	if identity != nil {
		userID = identity.ID
		mspID = identity.MSPID
		role = identity.Role
	}

	status := "SUCCESS"
	if !success {
		status = "DENIED"
	}

	// Create log entry (will be visible in peer logs)
	fmt.Printf("[IAM AUDIT] %s | Function: %s | User: %s | MSP: %s | Role: %s | Details: %s\n",
		status, function, userID, mspID, role, details)
}

// SanitizeInput sanitizes input strings to prevent injection attacks
func SanitizeInput(input string) string {
	// Remove potentially dangerous characters
	dangerous := []string{"'", "\"", ";", "--", "/*", "*/", "<", ">", "&"}
	sanitized := input
	for _, char := range dangerous {
		sanitized = strings.ReplaceAll(sanitized, char, "")
	}
	return strings.TrimSpace(sanitized)
}
