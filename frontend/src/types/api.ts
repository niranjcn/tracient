// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    orgMSP: string;
    idHash?: string;
    status?: string;
    createdAt?: string;
  };
  data?: {
    accessToken?: string;
    refreshToken?: string;
    user?: {
      id: string;
      name: string;
      email: string;
      role: string;
      orgMSP: string;
      idHash?: string;
      status?: string;
      createdAt?: string;
    };
  };
}

export interface LoginCredentials {
  identifier: string; // Aadhaar/PAN/Email
  password: string;
}

export interface RegisterData {
  role: 'worker' | 'employer' | 'government' | 'admin';
  name: string;
  email: string;
  phone: string;
  password: string;
  aadhaar?: string;
  pan?: string;
  gstin?: string;
  businessName?: string;
  department?: string;
  organizationName?: string;
  organizationType?: string;
}

export interface OTPVerification {
  userID: string;
  otp: string;
}

export interface SystemHealth {
  blockchainNodes: NodeStatus[];
  apiStatus: 'healthy' | 'degraded' | 'down';
  databaseStatus: 'connected' | 'disconnected';
  uptime: number;
  requestsPerMinute: number;
  lastUpdated: string;
}

export interface NodeStatus {
  name: string;
  type: 'peer' | 'orderer' | 'ca';
  status: 'running' | 'stopped' | 'error';
  uptime: number;
  lastBlock?: number;
}

export interface Organization {
  orgID: string;
  orgName: string;
  mspID: string;
  peerCount: number;
  userCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface GovAnalytics {
  totalWorkers: number;
  totalWagesDisbursed: number;
  activeEmployers: number;
  bplPercentage: number;
  avgMonthlyIncome: number;
  workerGrowth: number;
  wageGrowth: number;
}
