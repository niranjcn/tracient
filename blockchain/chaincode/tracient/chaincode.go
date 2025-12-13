package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

// SmartContract defines the Tracient wage ledger contract.
type SmartContract struct {
	contractapi.Contract
}

// WageRecord models a single wage transaction stored on ledger.
type WageRecord struct {
	WorkerIDHash   string  `json:"workerIdHash"`
	EmployerIDHash string  `json:"employerIdHash"`
	Amount         float64 `json:"amount"`
	Currency       string  `json:"currency"`
	JobType        string  `json:"jobType,omitempty"`
	Timestamp      string  `json:"timestamp"`
	PolicyVersion  string  `json:"policyVersion"`
}

// InitLedger seeds the ledger with sample wage records for smoke tests.
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	records := []WageRecord{
		{
			WorkerIDHash:   "worker-001",
			EmployerIDHash: "employer-001",
			Amount:         1200.50,
			Currency:       "INR",
			JobType:        "construction",
			Timestamp:      time.Now().UTC().Format(time.RFC3339),
			PolicyVersion:  "2025-Q4",
		},
	}

	for idx, record := range records {
		key := fmt.Sprintf("WAGE%03d", idx+1)
		payload, err := json.Marshal(record)
		if err != nil {
			return fmt.Errorf("marshal wage record: %w", err)
		}
		if err := ctx.GetStub().PutState(key, payload); err != nil {
			return fmt.Errorf("put state: %w", err)
		}
	}

	return nil
}

// RecordWage writes a new wage transaction onto the ledger.
func (s *SmartContract) RecordWage(ctx contractapi.TransactionContextInterface, wageID string, workerIDHash string, employerIDHash string, amount float64, currency string, jobType string, timestamp string, policyVersion string) error {
	if wageID == "" {
		return fmt.Errorf("wageID is required")
	}

	exists, err := s.WageExists(ctx, wageID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("wage record %s already exists", wageID)
	}

	if timestamp == "" {
		timestamp = time.Now().UTC().Format(time.RFC3339)
	}

	record := WageRecord{
		WorkerIDHash:   workerIDHash,
		EmployerIDHash: employerIDHash,
		Amount:         amount,
		Currency:       currency,
		JobType:        jobType,
		Timestamp:      timestamp,
		PolicyVersion:  policyVersion,
	}

	payload, err := json.Marshal(record)
	if err != nil {
		return fmt.Errorf("marshal wage record: %w", err)
	}

	return ctx.GetStub().PutState(wageID, payload)
}

// ReadWage retrieves a wage record by its ID.
func (s *SmartContract) ReadWage(ctx contractapi.TransactionContextInterface, wageID string) (*WageRecord, error) {
	payload, err := ctx.GetStub().GetState(wageID)
	if err != nil {
		return nil, fmt.Errorf("get state: %w", err)
	}
	if payload == nil {
		return nil, fmt.Errorf("wage record %s not found", wageID)
	}

	record := new(WageRecord)
	if err := json.Unmarshal(payload, record); err != nil {
		return nil, fmt.Errorf("unmarshal wage record: %w", err)
	}

	return record, nil
}

// QueryWageHistory streams the state history for a given wage record.
func (s *SmartContract) QueryWageHistory(ctx contractapi.TransactionContextInterface, wageID string) ([]*WageRecord, error) {
	historyIter, err := ctx.GetStub().GetHistoryForKey(wageID)
	if err != nil {
		return nil, fmt.Errorf("get history: %w", err)
	}
	defer historyIter.Close()

	var history []*WageRecord
	for historyIter.HasNext() {
		record, err := historyIter.Next()
		if err != nil {
			return nil, fmt.Errorf("iterate history: %w", err)
		}

		if record.Value == nil {
			continue
		}

		entry := new(WageRecord)
		if err := json.Unmarshal(record.Value, entry); err != nil {
			return nil, fmt.Errorf("unmarshal history record: %w", err)
		}
		history = append(history, entry)
	}

	return history, nil
}

// WageExists checks whether a wage record is already stored.
func (s *SmartContract) WageExists(ctx contractapi.TransactionContextInterface, wageID string) (bool, error) {
	payload, err := ctx.GetStub().GetState(wageID)
	if err != nil {
		return false, fmt.Errorf("get state: %w", err)
	}
	return payload != nil, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(new(SmartContract))
	if err != nil {
		panic(fmt.Errorf("create chaincode: %w", err))
	}

	if err := chaincode.Start(); err != nil {
		panic(fmt.Errorf("start chaincode: %w", err))
	}
}
