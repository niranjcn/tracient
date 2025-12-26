package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

// ============================================================================
// AUDIT LOG DATA STRUCTURES
// ============================================================================

// AuditLog represents an immutable audit log entry on the blockchain
type AuditLog struct {
	DocType      string `json:"docType"`
	LogID        string `json:"logId"`
	Timestamp    string `json:"timestamp"`
	EventType    string `json:"eventType"`    // ACCESS_GRANTED, ACCESS_DENIED, DATA_READ, DATA_WRITE, etc.
	Function     string `json:"function"`     // Chaincode function name
	CallerID     string `json:"callerId"`     // Enrollment ID from certificate
	CallerMSP    string `json:"callerMsp"`    // MSP ID
	CallerRole   string `json:"callerRole"`   // Role from certificate
	TargetID     string `json:"targetId"`     // Target resource ID (e.g., wageID, userIDHash)
	TargetType   string `json:"targetType"`   // Type of target (wage, user, threshold, etc.)
	Status       string `json:"status"`       // success, denied, error
	Details      string `json:"details"`      // Additional details or error message
	TxID         string `json:"txId"`         // Fabric transaction ID
	IPAddress    string `json:"ipAddress"`    // If available from client
	RiskLevel    string `json:"riskLevel"`    // low, medium, high, critical
}

// AuditQuery represents query parameters for audit log retrieval
type AuditQuery struct {
	StartDate   string   `json:"startDate"`
	EndDate     string   `json:"endDate"`
	EventTypes  []string `json:"eventTypes"`
	CallerID    string   `json:"callerId"`
	TargetID    string   `json:"targetId"`
	Status      string   `json:"status"`
	RiskLevel   string   `json:"riskLevel"`
	Limit       int      `json:"limit"`
}

// AuditSummary represents aggregated audit statistics
type AuditSummary struct {
	TotalEvents       int            `json:"totalEvents"`
	SuccessCount      int            `json:"successCount"`
	DeniedCount       int            `json:"deniedCount"`
	ErrorCount        int            `json:"errorCount"`
	EventsByType      map[string]int `json:"eventsByType"`
	EventsByFunction  map[string]int `json:"eventsByFunction"`
	EventsByRiskLevel map[string]int `json:"eventsByRiskLevel"`
	Period            string         `json:"period"`
}

// ============================================================================
// EVENT TYPES
// ============================================================================

const (
	// Access Events
	EventAccessGranted  = "ACCESS_GRANTED"
	EventAccessDenied   = "ACCESS_DENIED"
	EventAccessAttempt  = "ACCESS_ATTEMPT"

	// Data Events
	EventDataRead       = "DATA_READ"
	EventDataWrite      = "DATA_WRITE"
	EventDataDelete     = "DATA_DELETE"
	EventDataExport     = "DATA_EXPORT"

	// User Events
	EventUserRegistered = "USER_REGISTERED"
	EventUserUpdated    = "USER_UPDATED"
	EventUserSuspended  = "USER_SUSPENDED"
	EventUserActivated  = "USER_ACTIVATED"

	// Security Events
	EventAnomalyFlagged = "ANOMALY_FLAGGED"
	EventAnomalyReviewed = "ANOMALY_REVIEWED"
	EventThresholdChanged = "THRESHOLD_CHANGED"
	EventReportGenerated = "REPORT_GENERATED"

	// System Events
	EventLedgerInitialized = "LEDGER_INITIALIZED"
	EventConfigChanged = "CONFIG_CHANGED"
)

// ============================================================================
// RISK LEVELS
// ============================================================================

const (
	RiskLow      = "low"
	RiskMedium   = "medium"
	RiskHigh     = "high"
	RiskCritical = "critical"
)

// DetermineRiskLevel determines the risk level of an operation
func DetermineRiskLevel(eventType string, function string, status string) string {
	// High-risk functions
	highRiskFunctions := map[string]bool{
		"SetPovertyThreshold": true,
		"UpdateUserStatus":    true,
		"RegisterUser":        true,
		"InitLedger":          true,
	}

	// Medium-risk functions
	mediumRiskFunctions := map[string]bool{
		"RecordWage":             true,
		"BatchRecordWages":       true,
		"RecordUPITransaction":   true,
		"FlagAnomaly":            true,
		"UpdateAnomalyStatus":    true,
		"GenerateComplianceReport": true,
	}

	// Access denied is always concerning
	if status == "denied" || eventType == EventAccessDenied {
		if highRiskFunctions[function] {
			return RiskCritical
		}
		return RiskHigh
	}

	// Check by function
	if highRiskFunctions[function] {
		return RiskHigh
	}
	if mediumRiskFunctions[function] {
		return RiskMedium
	}

	return RiskLow
}

// ============================================================================
// AUDIT LOGGING FUNCTIONS
// ============================================================================

// LogAccess creates an audit log entry for an access event
func (s *SmartContract) LogAccess(ctx contractapi.TransactionContextInterface, eventType string, function string, targetID string, targetType string, status string, details string) error {
	// Get caller identity
	identity, err := GetClientIdentity(ctx)
	callerID := "unknown"
	callerMSP := "unknown"
	callerRole := "unknown"

	if err == nil && identity != nil {
		callerID = identity.ID
		callerMSP = identity.MSPID
		callerRole = identity.Role
	}

	// Determine risk level
	riskLevel := DetermineRiskLevel(eventType, function, status)

	// Generate unique log ID
	timestamp := time.Now().UTC()
	txID := ctx.GetStub().GetTxID()
	logID := fmt.Sprintf("AUDIT_%s_%s", timestamp.Format("20060102150405"), txID[:8])

	auditLog := AuditLog{
		DocType:    "audit_log",
		LogID:      logID,
		Timestamp:  timestamp.Format(time.RFC3339),
		EventType:  eventType,
		Function:   function,
		CallerID:   callerID,
		CallerMSP:  callerMSP,
		CallerRole: callerRole,
		TargetID:   targetID,
		TargetType: targetType,
		Status:     status,
		Details:    details,
		TxID:       txID,
		RiskLevel:  riskLevel,
	}

	payload, err := json.Marshal(auditLog)
	if err != nil {
		return fmt.Errorf("marshal audit log: %w", err)
	}

	// Store audit log
	if err := ctx.GetStub().PutState(logID, payload); err != nil {
		return fmt.Errorf("store audit log: %w", err)
	}

	// Emit event for high-risk activities
	if riskLevel == RiskHigh || riskLevel == RiskCritical {
		eventData, _ := json.Marshal(map[string]string{
			"logId":     logID,
			"eventType": eventType,
			"riskLevel": riskLevel,
			"function":  function,
			"callerId":  callerID,
		})
		ctx.GetStub().SetEvent("HighRiskActivity", eventData)
	}

	return nil
}

// LogAccessGranted logs a successful access
func (s *SmartContract) LogAccessGranted(ctx contractapi.TransactionContextInterface, function string, targetID string, targetType string) error {
	return s.LogAccess(ctx, EventAccessGranted, function, targetID, targetType, "success", "Access granted")
}

// LogAccessDenied logs an access denial
func (s *SmartContract) LogAccessDenied(ctx contractapi.TransactionContextInterface, function string, targetID string, targetType string, reason string) error {
	return s.LogAccess(ctx, EventAccessDenied, function, targetID, targetType, "denied", reason)
}

// LogDataRead logs a data read operation
func (s *SmartContract) LogDataRead(ctx contractapi.TransactionContextInterface, function string, targetID string, targetType string) error {
	return s.LogAccess(ctx, EventDataRead, function, targetID, targetType, "success", "Data read")
}

// LogDataWrite logs a data write operation
func (s *SmartContract) LogDataWrite(ctx contractapi.TransactionContextInterface, function string, targetID string, targetType string, details string) error {
	return s.LogAccess(ctx, EventDataWrite, function, targetID, targetType, "success", details)
}

// ============================================================================
// AUDIT QUERY FUNCTIONS
// ============================================================================

// GetAuditLogs retrieves audit logs based on query parameters
func (s *SmartContract) GetAuditLogs(ctx contractapi.TransactionContextInterface, queryJSON string) ([]*AuditLog, error) {
	// Check access - only admins and auditors can view audit logs
	identity, err := CheckAccess(ctx, "GetFlaggedWages") // Using similar permission level
	if err != nil {
		s.LogAccessDenied(ctx, "GetAuditLogs", "", "audit_log", err.Error())
		return nil, err
	}

	var query AuditQuery
	if queryJSON != "" {
		if err := json.Unmarshal([]byte(queryJSON), &query); err != nil {
			return nil, fmt.Errorf("invalid query parameters: %w", err)
		}
	}

	// Set default limit
	if query.Limit <= 0 || query.Limit > 1000 {
		query.Limit = 100
	}

	// Query audit logs
	iterator, err := ctx.GetStub().GetStateByRange("AUDIT_", "AUDIT_~")
	if err != nil {
		return nil, fmt.Errorf("get audit logs: %w", err)
	}
	defer iterator.Close()

	var logs []*AuditLog
	for iterator.HasNext() {
		queryResponse, err := iterator.Next()
		if err != nil {
			continue
		}

		var log AuditLog
		if err := json.Unmarshal(queryResponse.Value, &log); err != nil {
			continue
		}

		// Apply filters
		if query.CallerID != "" && log.CallerID != query.CallerID {
			continue
		}
		if query.TargetID != "" && log.TargetID != query.TargetID {
			continue
		}
		if query.Status != "" && log.Status != query.Status {
			continue
		}
		if query.RiskLevel != "" && log.RiskLevel != query.RiskLevel {
			continue
		}

		// Date range filter
		if query.StartDate != "" && query.EndDate != "" {
			logTime, err := time.Parse(time.RFC3339, log.Timestamp)
			if err != nil {
				continue
			}
			start, _ := time.Parse("2006-01-02", query.StartDate)
			end, _ := time.Parse("2006-01-02", query.EndDate)
			if logTime.Before(start) || logTime.After(end.Add(24*time.Hour)) {
				continue
			}
		}

		// Event type filter
		if len(query.EventTypes) > 0 {
			found := false
			for _, et := range query.EventTypes {
				if log.EventType == et {
					found = true
					break
				}
			}
			if !found {
				continue
			}
		}

		logs = append(logs, &log)

		// Apply limit
		if len(logs) >= query.Limit {
			break
		}
	}

	// Log this access
	s.LogDataRead(ctx, "GetAuditLogs", fmt.Sprintf("count:%d", len(logs)), "audit_log")

	// Also log who accessed audit logs
	fmt.Printf("[AUDIT ACCESS] User %s (role: %s) accessed %d audit log entries\n",
		identity.ID, identity.Role, len(logs))

	return logs, nil
}

// GetAuditSummary generates an aggregated summary of audit logs
func (s *SmartContract) GetAuditSummary(ctx contractapi.TransactionContextInterface, startDate string, endDate string) (*AuditSummary, error) {
	// Check access
	_, err := CheckAccess(ctx, "GenerateComplianceReport")
	if err != nil {
		s.LogAccessDenied(ctx, "GetAuditSummary", "", "audit_log", err.Error())
		return nil, err
	}

	summary := &AuditSummary{
		EventsByType:      make(map[string]int),
		EventsByFunction:  make(map[string]int),
		EventsByRiskLevel: make(map[string]int),
		Period:            fmt.Sprintf("%s to %s", startDate, endDate),
	}

	iterator, err := ctx.GetStub().GetStateByRange("AUDIT_", "AUDIT_~")
	if err != nil {
		return nil, fmt.Errorf("get audit logs: %w", err)
	}
	defer iterator.Close()

	for iterator.HasNext() {
		queryResponse, err := iterator.Next()
		if err != nil {
			continue
		}

		var log AuditLog
		if err := json.Unmarshal(queryResponse.Value, &log); err != nil {
			continue
		}

		// Date range filter
		if startDate != "" && endDate != "" {
			logTime, err := time.Parse(time.RFC3339, log.Timestamp)
			if err != nil {
				continue
			}
			start, _ := time.Parse("2006-01-02", startDate)
			end, _ := time.Parse("2006-01-02", endDate)
			if logTime.Before(start) || logTime.After(end.Add(24*time.Hour)) {
				continue
			}
		}

		summary.TotalEvents++

		switch log.Status {
		case "success":
			summary.SuccessCount++
		case "denied":
			summary.DeniedCount++
		default:
			summary.ErrorCount++
		}

		summary.EventsByType[log.EventType]++
		summary.EventsByFunction[log.Function]++
		summary.EventsByRiskLevel[log.RiskLevel]++
	}

	s.LogDataRead(ctx, "GetAuditSummary", fmt.Sprintf("period:%s", summary.Period), "audit_summary")

	return summary, nil
}

// GetUserActivityLog retrieves all audit logs for a specific user
func (s *SmartContract) GetUserActivityLog(ctx contractapi.TransactionContextInterface, userIDHash string) ([]*AuditLog, error) {
	// Check access - user can see their own activity, admins/auditors can see all
	identity, err := CheckAccess(ctx, "GetUserProfile")
	if err != nil {
		return nil, err
	}

	// Check self-access
	if err := CheckSelfAccess(identity, "GetUserActivityLog", userIDHash); err != nil {
		s.LogAccessDenied(ctx, "GetUserActivityLog", userIDHash, "user_activity", err.Error())
		return nil, err
	}

	queryJSON := fmt.Sprintf(`{"callerId":"%s","limit":500}`, userIDHash)
	return s.GetAuditLogs(ctx, queryJSON)
}

// GetHighRiskEvents retrieves all high-risk and critical audit events
func (s *SmartContract) GetHighRiskEvents(ctx contractapi.TransactionContextInterface, limit int) ([]*AuditLog, error) {
	// Check access - only admins and government officials
	identity, err := CheckAccess(ctx, "GenerateComplianceReport")
	if err != nil {
		s.LogAccessDenied(ctx, "GetHighRiskEvents", "", "audit_log", err.Error())
		return nil, err
	}

	if limit <= 0 || limit > 500 {
		limit = 100
	}

	iterator, err := ctx.GetStub().GetStateByRange("AUDIT_", "AUDIT_~")
	if err != nil {
		return nil, fmt.Errorf("get audit logs: %w", err)
	}
	defer iterator.Close()

	var logs []*AuditLog
	for iterator.HasNext() {
		queryResponse, err := iterator.Next()
		if err != nil {
			continue
		}

		var log AuditLog
		if err := json.Unmarshal(queryResponse.Value, &log); err != nil {
			continue
		}

		if log.RiskLevel == RiskHigh || log.RiskLevel == RiskCritical {
			logs = append(logs, &log)
		}

		if len(logs) >= limit {
			break
		}
	}

	s.LogDataRead(ctx, "GetHighRiskEvents", fmt.Sprintf("count:%d", len(logs)), "audit_log")

	fmt.Printf("[SECURITY AUDIT] User %s accessed %d high-risk events\n", identity.ID, len(logs))

	return logs, nil
}

// GetAccessDenials retrieves all access denial events (security monitoring)
func (s *SmartContract) GetAccessDenials(ctx contractapi.TransactionContextInterface, startDate string, endDate string) ([]*AuditLog, error) {
	// Check access - only admins
	identity, err := CheckAccess(ctx, "UpdateUserStatus")
	if err != nil {
		return nil, err
	}

	iterator, err := ctx.GetStub().GetStateByRange("AUDIT_", "AUDIT_~")
	if err != nil {
		return nil, fmt.Errorf("get audit logs: %w", err)
	}
	defer iterator.Close()

	var logs []*AuditLog
	for iterator.HasNext() {
		queryResponse, err := iterator.Next()
		if err != nil {
			continue
		}

		var log AuditLog
		if err := json.Unmarshal(queryResponse.Value, &log); err != nil {
			continue
		}

		if log.EventType != EventAccessDenied && log.Status != "denied" {
			continue
		}

		// Date range filter
		if startDate != "" && endDate != "" {
			logTime, err := time.Parse(time.RFC3339, log.Timestamp)
			if err != nil {
				continue
			}
			start, _ := time.Parse("2006-01-02", startDate)
			end, _ := time.Parse("2006-01-02", endDate)
			if logTime.Before(start) || logTime.After(end.Add(24*time.Hour)) {
				continue
			}
		}

		logs = append(logs, &log)
	}

	s.LogDataRead(ctx, "GetAccessDenials", fmt.Sprintf("count:%d", len(logs)), "audit_log")

	fmt.Printf("[SECURITY AUDIT] User %s retrieved %d access denial records\n", identity.ID, len(logs))

	return logs, nil
}
