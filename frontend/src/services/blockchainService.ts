/**
 * Blockchain Service
 * Handles all blockchain-related API calls
 */
import { get, post } from './api';

// Types
export interface BlockchainStatus {
  connected: boolean;
  healthy: boolean;
  channel: string | null;
  chaincode: string | null;
  mspId?: string;
  endpoint?: string;
  error?: string;
  lastCheck?: string;
}

export interface SyncStatus {
  syncInProgress: boolean;
  lastSyncTime: string | null;
  lastSyncResult: {
    synced: number;
    failed: number;
    duration?: number;
  } | null;
  blockchainEnabled: boolean;
  blockchainConnected: boolean;
}

export interface SyncStatistics {
  total: number;
  synced: number;
  pending: number;
  failed: number;
  totalAmount: number;
  syncedAmount: number;
  syncRate: string;
}

export interface TransactionDetails {
  verified: boolean;
  data?: any;
  error?: string;
  timestamp?: string;
  mock?: boolean;
}

export interface WageHistoryItem {
  wageId: string;
  amount: number;
  employerHash: string;
  timestamp: string;
  jobType: string;
  currency: string;
}

export interface PovertyStatus {
  status: 'BPL' | 'APL';
  totalIncome: number;
  threshold: number;
  state: string;
  period: string;
}

export interface BlockchainStatusResponse {
  success: boolean;
  data: {
    status: BlockchainStatus;
    sync: SyncStatus;
  };
}

export interface SyncStatusResponse {
  success: boolean;
  data: {
    status: SyncStatus;
    statistics: SyncStatistics;
  };
}

export interface TransactionResponse {
  success: boolean;
  data: {
    localRecord: any;
    blockchainData: TransactionDetails;
  };
}

export interface HistoryResponse {
  success: boolean;
  data: {
    idHash: string;
    history: WageHistoryItem[];
    count: number;
  };
}

/**
 * Get blockchain network status
 */
export const getBlockchainStatus = async (): Promise<BlockchainStatus & { sync?: SyncStatus }> => {
  try {
    const response = await get<BlockchainStatusResponse>('/blockchain/status');
    return {
      ...response.data.status,
      sync: response.data.sync
    };
  } catch (error) {
    return {
      connected: false,
      healthy: false,
      channel: null,
      chaincode: null,
      error: error instanceof Error ? error.message : 'Failed to fetch status'
    };
  }
};

/**
 * Quick health check (no auth required)
 */
export const getBlockchainHealth = async (): Promise<{ healthy: boolean; connected: boolean }> => {
  try {
    const response = await get<{ success: boolean; data: { healthy: boolean; connected: boolean } }>('/blockchain/health');
    return response.data;
  } catch {
    return { healthy: false, connected: false };
  }
};

/**
 * Get blockchain sync status and statistics
 */
export const getSyncStatus = async (): Promise<{ status: SyncStatus; statistics: SyncStatistics }> => {
  const response = await get<SyncStatusResponse>('/blockchain/sync/status');
  return response.data;
};

/**
 * Verify a transaction on blockchain
 */
export const verifyTransaction = async (transactionId: string): Promise<TransactionDetails> => {
  try {
    const response = await get<TransactionResponse>(`/blockchain/transaction/${transactionId}`);
    return response.data.blockchainData;
  } catch (error) {
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Verification failed'
    };
  }
};

/**
 * Get worker's wage history from blockchain
 */
export const getWorkerWageHistory = async (
  idHash: string, 
  startDate?: string, 
  endDate?: string
): Promise<WageHistoryItem[]> => {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  
  const response = await get<HistoryResponse>(`/blockchain/worker/${idHash}/history`, params);
  return response.data.history;
};

/**
 * Get poverty status from blockchain
 */
export const getPovertyStatus = async (idHash: string, state?: string): Promise<PovertyStatus | null> => {
  const params = state ? { state } : undefined;
  const response = await get<{ success: boolean; data: { povertyStatus: PovertyStatus | null } }>(
    `/blockchain/worker/${idHash}/poverty-status`, 
    params
  );
  return response.data.povertyStatus;
};

/**
 * Trigger manual sync of pending transactions (admin only)
 */
export const triggerBlockchainSync = async (): Promise<{ synced: number; failed: number }> => {
  const response = await post<{ success: boolean; data: { result: { synced: number; failed: number } } }>(
    '/blockchain/sync', 
    {}
  );
  return response.data.result;
};

/**
 * Retry failed syncs (admin only)
 */
export const retryFailedSyncs = async (): Promise<{ retried: number; stillFailed: number }> => {
  const response = await post<{ success: boolean; data: { result: { retried: number; stillFailed: number } } }>(
    '/blockchain/sync/retry', 
    {}
  );
  return response.data.result;
};

/**
 * Force sync a specific wage record (admin only)
 */
export const forceSyncWage = async (wageId: string): Promise<{ success: boolean; txHash?: string; error?: string }> => {
  const response = await post<{ success: boolean; data: { result: { success: boolean; txHash?: string; error?: string } } }>(
    `/blockchain/sync/force/${wageId}`, 
    {}
  );
  return response.data.result;
};

/**
 * Get poverty thresholds
 */
export const getPovertyThresholds = async (state?: string): Promise<{ bpl: any; apl: any }> => {
  const params = state ? { state } : undefined;
  const response = await get<{ success: boolean; data: { bpl: any; apl: any } }>(
    '/blockchain/thresholds', 
    params
  );
  return response.data;
};

/**
 * Get blockchain analytics (admin/gov only)
 */
export const getBlockchainAnalytics = async (): Promise<any> => {
  const response = await get<{ success: boolean; data: { analytics: any } }>('/blockchain/analytics');
  return response.data.analytics;
};

/**
 * Get transaction details with blockchain verification
 */
export const getTransactionWithBlockchain = async (transactionId: string): Promise<{
  localRecord: any;
  blockchainData: TransactionDetails;
}> => {
  const response = await get<{ success: boolean; data: { localRecord: any; blockchainData: TransactionDetails } }>(
    `/blockchain/transaction/${transactionId}`
  );
  return response.data;
};

/**
 * Get all wages for a worker with blockchain verification status
 */
export const getVerifiedWages = async (idHash: string, params?: {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<{
  wages: any[];
  blockchainVerified: number;
  total: number;
}> => {
  const response = await get<{ success: boolean; data: { wages: any[]; blockchainVerified: number; total: number } }>(
    `/blockchain/worker/${idHash}/wages`,
    params
  );
  return response.data;
};

/**
 * Get employer's wages with blockchain verification status
 */
export const getEmployerVerifiedWages = async (employerId: string, params?: {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<{
  wages: any[];
  blockchainVerified: number;
  total: number;
}> => {
  const response = await get<{ success: boolean; data: { wages: any[]; blockchainVerified: number; total: number } }>(
    `/blockchain/employer/${employerId}/wages`,
    params
  );
  return response.data;
};

/**
 * Get total income from blockchain for a worker
 */
export const getBlockchainTotalIncome = async (idHash: string, params?: {
  startDate?: string;
  endDate?: string;
}): Promise<{
  totalIncome: number;
  transactionCount: number;
  period: string;
}> => {
  const response = await get<{ success: boolean; data: { totalIncome: number; transactionCount: number; period: string } }>(
    `/blockchain/worker/${idHash}/income`,
    params
  );
  return response.data;
};

// Export as default object for convenience
export const blockchainService = {
  getBlockchainStatus,
  getBlockchainHealth,
  getSyncStatus,
  verifyTransaction,
  getWorkerWageHistory,
  getPovertyStatus,
  triggerBlockchainSync,
  retryFailedSyncs,
  forceSyncWage,
  getPovertyThresholds,
  getBlockchainAnalytics,
  getTransactionWithBlockchain,
  getVerifiedWages,
  getEmployerVerifiedWages,
  getBlockchainTotalIncome
};

export default blockchainService;
