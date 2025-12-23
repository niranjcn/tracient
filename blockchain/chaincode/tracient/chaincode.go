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

// UPITransaction models a UPI payment transaction for mock integration.
type UPITransaction struct {
	TxID             string  `json:"txId"`
	WorkerIDHash     string  `json:"workerIdHash"`
	Amount           float64 `json:"amount"`
	Currency         string  `json:"currency"`
	SenderName       string  `json:"senderName"`
	SenderPhone      string  `json:"senderPhone,omitempty"`
	TransactionRef   string  `json:"transactionRef,omitempty"`
	Timestamp        string  `json:"timestamp"`
	PaymentMethod    string  `json:"paymentMethod"` // "UPI"
	OnChainReference string  `json:"onChainReference,omitempty"`
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

// RecordUPITransaction records a UPI payment transaction on the ledger.
// Called during integration stage when a fake UPI payment is received.
func (s *SmartContract) RecordUPITransaction(ctx contractapi.TransactionContextInterface, txID string, workerIDHash string, amount float64, currency string, senderName string, senderPhone string, transactionRef string, paymentMethod string) (string, error) {
	if txID == "" {
		return "", fmt.Errorf("txID is required")
	}

	exists, err := s.UPITransactionExists(ctx, txID)
	if err != nil {
		return "", err
	}
	if exists {
		return "", fmt.Errorf("upi transaction %s already recorded", txID)
	}

	if paymentMethod == "" {
		paymentMethod = "UPI"
	}

	timestamp := time.Now().UTC().Format(time.RFC3339)

	tx := UPITransaction{
		TxID:           txID,
		WorkerIDHash:   workerIDHash,
		Amount:         amount,
		Currency:       currency,
		SenderName:     senderName,
		SenderPhone:    senderPhone,
		TransactionRef: transactionRef,
		Timestamp:      timestamp,
		PaymentMethod:  paymentMethod,
	}

	payload, err := json.Marshal(tx)
	if err != nil {
		return "", fmt.Errorf("marshal upi transaction: %w", err)
	}

	// Store with prefix "UPI_" for easy filtering
	key := fmt.Sprintf("UPI_%s", txID)
	if err := ctx.GetStub().PutState(key, payload); err != nil {
		return "", fmt.Errorf("put state: %w", err)
	}

	// Emit event for external listeners (e.g., dashboard)
	if err := ctx.GetStub().SetEvent("UPITransactionRecorded", []byte(txID)); err != nil {
		fmt.Printf("warning: failed to emit event: %v\n", err)
	}

	return key, nil
}

// UPITransactionExists checks whether a UPI transaction has been recorded.
func (s *SmartContract) UPITransactionExists(ctx contractapi.TransactionContextInterface, txID string) (bool, error) {
	key := fmt.Sprintf("UPI_%s", txID)
	payload, err := ctx.GetStub().GetState(key)
	if err != nil {
		return false, fmt.Errorf("get state: %w", err)
	}
	return payload != nil, nil
}

// ReadUPITransaction retrieves a UPI transaction record by ID.
func (s *SmartContract) ReadUPITransaction(ctx contractapi.TransactionContextInterface, txID string) (*UPITransaction, error) {
	key := fmt.Sprintf("UPI_%s", txID)
	payload, err := ctx.GetStub().GetState(key)
	if err != nil {
		return nil, fmt.Errorf("get state: %w", err)
	}
	if payload == nil {
		return nil, fmt.Errorf("upi transaction %s not found", txID)
	}

	tx := new(UPITransaction)
	if err := json.Unmarshal(payload, tx); err != nil {
		return nil, fmt.Errorf("unmarshal upi transaction: %w", err)
	}

	return tx, nil
}

// QueryUPITransactionsByWorker retrieves all UPI transactions for a worker.
func (s *SmartContract) QueryUPITransactionsByWorker(ctx contractapi.TransactionContextInterface, workerIDHash string) ([]*UPITransaction, error) {
	queryString := fmt.Sprintf(`{"selector":{"docType":{"$regex":"^UPI"},"workerIdHash":"%s"}}`, workerIDHash)

	resultsIterator, err := ctx.GetStub().GetQueryResultsForQueryString(queryString)
	if err != nil {
		return nil, fmt.Errorf("query failed: %w", err)
	}
	defer resultsIterator.Close()

	var transactions []*UPITransaction
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("iterate results: %w", err)
		}

		tx := new(UPITransaction)
		if err := json.Unmarshal(queryResponse.Value, tx); err != nil {
			return nil, fmt.Errorf("unmarshal transaction: %w", err)
		}
		transactions = append(transactions, tx)
	}

	return transactions, nil
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
