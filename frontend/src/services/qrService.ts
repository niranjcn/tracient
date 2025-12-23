import { API_BASE_URL } from '@/utils/constants';

export interface QRTokenResponse {
  success: boolean;
  token: string;
  expiresIn: number | null;
  permanent: boolean;
  verifyUrl: string;
  message: string;
}

export interface WorkerVerifyResponse {
  success: boolean;
  workerHash: string;
  name: string;
  phone: string;
  bankAccount: string;
  status: 'verified';
}

export interface UPIReceivePayload {
  token: string;
  amount: number;
  senderName: string;
  senderPhone?: string;
  transactionRef?: string;
}

export interface UPIReceiveResponse {
  success: boolean;
  txId: string;
  status: 'completed';
  message: string;
  workerBalance: number;
}

/**
 * Issue a QR token for a worker
 * Used to generate a personalized QR code for UPI-like payments
 * @param workerHash - The worker's hash identifier
 * @param permanent - If true, token never expires; if false, expires in 5 minutes
 */
export const issueQRToken = async (workerHash: string, permanent: boolean = true): Promise<QRTokenResponse> => {
  const response = await fetch(`${API_BASE_URL}/upi/qr/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ workerHash, permanent }),
  });

  if (!response.ok) {
    throw new Error(`Failed to issue QR token: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Verify a QR token by fetching worker details
 * Simulates scanning the QR and verifying the recipient
 */
export const verifyQRToken = async (token: string): Promise<WorkerVerifyResponse> => {
  const response = await fetch(`${API_BASE_URL}/verify?token=${encodeURIComponent(token)}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to verify QR token: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Send a fake UPI payment to a worker
 * Simulates a UPI transaction using the QR token
 */
export const sendUPIPayment = async (payload: UPIReceivePayload): Promise<UPIReceiveResponse> => {
  const response = await fetch(`${API_BASE_URL}/upi/receive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to send UPI payment: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch all UPI transactions for a worker
 * Used in worker dashboard to show transaction history
 */
export const fetchWorkerTransactions = async (
  workerHash: string
): Promise<{ success: boolean; transactions: any[] }> => {
  const response = await fetch(`${API_BASE_URL}/upi/transactions?workerHash=${encodeURIComponent(workerHash)}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Register a worker account (PoC only)
 * Creates a bank account entry for the worker
 */
export const registerWorker = async (workerHash: string, name: string, phone?: string) => {
  const response = await fetch(`${API_BASE_URL}/workers/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ workerHash, name, phone }),
  });

  if (!response.ok) {
    throw new Error(`Failed to register worker: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch worker account details
 */
export const fetchWorkerAccount = async (workerHash: string) => {
  const response = await fetch(`${API_BASE_URL}/workers/${encodeURIComponent(workerHash)}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch worker account: ${response.statusText}`);
  }

  return response.json();
};
