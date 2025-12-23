/**
 * Hyperledger Fabric Service
 * Handles all blockchain interactions
 */
import { submitTransaction, evaluateTransaction, initFabricGateway } from '../config/fabric.js';
import { logger } from '../utils/logger.util.js';
import { generateTransactionHash } from '../utils/hash.util.js';

/**
 * Initialize Fabric connection
 */
export const initBlockchain = async () => {
  try {
    await initFabricGateway();
    logger.info('Blockchain service initialized');
  } catch (error) {
    logger.error('Failed to initialize blockchain service:', error.message);
  }
};

/**
 * Record a wage payment on the blockchain
 */
export const recordWagePayment = async (wageData) => {
  try {
    const { workerId, workerIdHash, employerId, amount, referenceNumber, timestamp } = wageData;
    
    const txHash = generateTransactionHash({
      workerIdHash,
      employerId,
      amount,
      referenceNumber
    });
    
    const result = await submitTransaction(
      'RecordWage',
      JSON.stringify({
        txId: txHash,
        workerHash: workerIdHash,
        employerId: employerId.toString(),
        amount: amount.toString(),
        referenceNumber,
        timestamp: timestamp || new Date().toISOString()
      })
    );
    
    logger.info('Wage payment recorded on blockchain', { txHash, workerIdHash, amount });
    return { success: true, txHash, result };
  } catch (error) {
    logger.error('Failed to record wage on blockchain:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Register a worker on the blockchain
 */
export const registerWorkerOnChain = async (workerData) => {
  try {
    const { idHash, name, registeredAt } = workerData;
    
    const result = await submitTransaction(
      'RegisterWorker',
      JSON.stringify({
        idHash,
        name,
        registeredAt: registeredAt || new Date().toISOString()
      })
    );
    
    logger.info('Worker registered on blockchain', { idHash });
    return { success: true, result };
  } catch (error) {
    logger.error('Failed to register worker on blockchain:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get worker's wage history from blockchain
 */
export const getWorkerWageHistory = async (workerIdHash) => {
  try {
    const result = await evaluateTransaction('GetWorkerWages', workerIdHash);
    return { success: true, data: result };
  } catch (error) {
    logger.error('Failed to get worker wage history:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get worker information from blockchain
 */
export const getWorkerFromChain = async (workerIdHash) => {
  try {
    const result = await evaluateTransaction('GetWorker', workerIdHash);
    return { success: true, data: result };
  } catch (error) {
    logger.error('Failed to get worker from blockchain:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Update worker classification on blockchain
 */
export const updateWorkerClassification = async (workerIdHash, category, annualIncome) => {
  try {
    const result = await submitTransaction(
      'UpdateClassification',
      JSON.stringify({
        workerHash: workerIdHash,
        category,
        annualIncome: annualIncome.toString(),
        updatedAt: new Date().toISOString()
      })
    );
    
    logger.info('Worker classification updated on blockchain', { workerIdHash, category });
    return { success: true, result };
  } catch (error) {
    logger.error('Failed to update classification on blockchain:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Record verification on blockchain
 */
export const recordVerification = async (verificationData) => {
  try {
    const { entityType, entityId, verifiedBy, status, timestamp } = verificationData;
    
    const result = await submitTransaction(
      'RecordVerification',
      JSON.stringify({
        entityType,
        entityId,
        verifiedBy: verifiedBy.toString(),
        status,
        timestamp: timestamp || new Date().toISOString()
      })
    );
    
    logger.info('Verification recorded on blockchain', { entityType, entityId, status });
    return { success: true, result };
  } catch (error) {
    logger.error('Failed to record verification on blockchain:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get transaction history for audit
 */
export const getTransactionHistory = async (filters = {}) => {
  try {
    const result = await evaluateTransaction(
      'GetTransactionHistory',
      JSON.stringify(filters)
    );
    return { success: true, data: result };
  } catch (error) {
    logger.error('Failed to get transaction history:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Verify transaction on blockchain
 */
export const verifyTransaction = async (txId) => {
  try {
    const result = await evaluateTransaction('VerifyTransaction', txId);
    return { success: true, data: result, verified: result?.exists || false };
  } catch (error) {
    logger.error('Failed to verify transaction:', error.message);
    return { success: false, error: error.message, verified: false };
  }
};

export default {
  initBlockchain,
  recordWagePayment,
  registerWorkerOnChain,
  getWorkerWageHistory,
  getWorkerFromChain,
  updateWorkerClassification,
  recordVerification,
  getTransactionHistory,
  verifyTransaction
};
