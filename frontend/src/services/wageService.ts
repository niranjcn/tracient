import { get, post, put, uploadFile } from './api';
import { 
  WageRecord, 
  IncomeStats, 
  BPLStatus, 
  PaymentSummary,
  WageRecordForm,
  PaginatedResponse 
} from '@/types';

export interface WageQueryParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  jobType?: string;
}

export const wageService = {
  // Record a new wage
  recordWage: async (data: WageRecordForm): Promise<{ success: boolean; wageID: string; txID: string; blockNumber: number }> => {
    return post('/wages/record', data);
  },

  // Get single wage record
  getWage: async (wageID: string): Promise<{ wage: WageRecord; blockchainProof: string }> => {
    return get(`/wages/${wageID}`);
  },

  // Get wages for a worker
  getWorkerWages: async (workerIDHash: string, params?: WageQueryParams): Promise<PaginatedResponse<WageRecord>> => {
    return get(`/wages/worker/${workerIDHash}`, params);
  },

  // Get wages by employer
  getEmployerWages: async (employerIDHash: string, params?: WageQueryParams): Promise<PaginatedResponse<WageRecord>> => {
    return get(`/wages/employer/${employerIDHash}`, params);
  },

  // Bulk upload wages
  bulkUpload: async (file: File): Promise<{ success: number; failed: number; errors: Array<{ row: number; error: string }> }> => {
    const formData = new FormData();
    formData.append('file', file);
    return uploadFile('/wages/bulk-upload', formData);
  },

  // Verify wage on blockchain
  verifyWage: async (wageID: string): Promise<{ valid: boolean; blockchainHash: string; timestamp: string }> => {
    return get(`/wages/verify/${wageID}`);
  },

  // Get worker income stats
  getWorkerStats: async (workerIDHash: string): Promise<IncomeStats> => {
    return get(`/workers/stats/${workerIDHash}`);
  },

  // Get worker BPL status
  getWorkerBPLStatus: async (workerIDHash: string): Promise<BPLStatus> => {
    return get(`/workers/bpl-status/${workerIDHash}`);
  },

  // Generate QR code for worker
  generateWorkerQR: async (workerIDHash: string): Promise<{ qrData: string; expiresAt: string }> => {
    return post(`/upi/qr/generate`, { workerHash: workerIDHash });
  },

  // Get worker profile
  getWorkerProfile: async (): Promise<any> => {
    return get('/workers/profile');
  },

  // Update worker profile
  updateWorkerProfile: async (data: any): Promise<any> => {
    return put('/workers/profile', data);
  },

  // Generate QR code for bank account
  generateQRCode: async (accountId: string): Promise<any> => {
    return post('/workers/qr/generate', { accountId });
  },

  // Verify QR token
  verifyQRToken: async (token: string): Promise<any> => {
    return post('/workers/qr/verify', { token });
  },

  // Process payment via QR
  processQRPayment: async (token: string, amount: number, payerName?: string): Promise<any> => {
    return post('/workers/qr/deposit', { token, amount, payerName });
  },

  // Get employer payment summary
  getEmployerPaymentSummary: async (employerIDHash: string, month?: number, year?: number): Promise<PaymentSummary> => {
    return get(`/employer/payment-summary/${employerIDHash}`, { month, year });
  },

  // Get employer worker roster
  getEmployerRoster: async (employerIDHash: string): Promise<{ workers: Array<{ workerID: string; name: string; totalPaid: number; lastPayment: string }> }> => {
    return get(`/employer/roster/${employerIDHash}`);
  },

  // Add worker to employer roster
  addWorkerToRoster: async (employerIDHash: string, workerName: string, workerAadhaar: string): Promise<{ success: boolean; workerID: string }> => {
    return post('/employer/add-worker', { employerIDHash, workerName, workerAadhaar });
  },

  // Get wage history for chart
  getWageHistory: async (idHash: string, type: 'worker' | 'employer', months: number = 12): Promise<Array<{ month: string; total: number; count: number }>> => {
    return get(`/wages/history/${type}/${idHash}`, { months });
  },

  // Get wage breakdown by job type
  getWageBreakdown: async (idHash: string, type: 'worker' | 'employer'): Promise<Array<{ jobType: string; total: number; percentage: number }>> => {
    return get(`/wages/breakdown/${type}/${idHash}`);
  },

  // Download wage report
  downloadReport: async (idHash: string, type: 'worker' | 'employer', format: 'pdf' | 'excel', params?: WageQueryParams): Promise<Blob> => {
    return get(`/wages/report/${type}/${idHash}`, { ...params, format });
  },
};

export default wageService;
