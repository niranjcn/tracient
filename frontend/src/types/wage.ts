// Wage record types matching blockchain structure
export interface WageRecord {
  wageID: string;
  workerIdHash: string;
  employerIdHash: string;
  amount: number;
  currency: string;
  jobType: JobType;
  timestamp: string;
  policyVersion: string;
  blockchainHash?: string;
  blockNumber?: number;
  verificationStatus?: 'verified' | 'pending';
}

export type JobType = 
  | 'construction'
  | 'agriculture'
  | 'retail'
  | 'manufacturing'
  | 'domestic'
  | 'transport'
  | 'hospitality'
  | 'other';

export const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: 'construction', label: 'Construction' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'domestic', label: 'Domestic Work' },
  { value: 'transport', label: 'Transport' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'other', label: 'Other' },
];

export interface WageRecordForm {
  workerID: string;
  amount: number;
  jobType: JobType;
  date: string;
  notes?: string;
}

export interface BulkWageRecord {
  workerID: string;
  amount: number;
  jobType: JobType;
  date: string;
  valid: boolean;
  error?: string;
}

export interface IncomeStats {
  totalIncome: number;
  last30Days: number;
  averageDailyWage: number;
  transactionCount: number;
  percentChange: number;
}

export interface BPLStatus {
  classification: 'BPL' | 'APL';
  annualIncome: number;
  threshold: number;
  lastUpdated: string;
  eligibleSchemes: string[];
}

export interface PaymentSummary {
  totalPaid: number;
  workerCount: number;
  avgWage: number;
  pendingTransactions: number;
  percentChange: number;
}

export interface SectorData {
  sector: string;
  workerCount: number;
  avgWage: number;
  totalDisbursed: number;
  bplCount: number;
  aplCount: number;
}

export interface GeoData {
  state: string;
  workerCount: number;
  totalDisbursed: number;
  bplPercentage: number;
}

export interface Anomaly {
  id: string;
  type: 'duplicate_payment' | 'unusual_amount' | 'frequency_spike' | 'pattern_mismatch';
  severity: 'low' | 'medium' | 'high';
  workerID: string;
  employerID: string;
  description: string;
  timestamp: string;
  status: 'new' | 'investigating' | 'resolved';
  confidence: number;
  details?: Record<string, unknown>;
}

export interface PolicyConfig {
  bplThreshold: number;
  aplThreshold: number;
  effectiveDate: string;
  version: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userID: string;
  userName: string;
  role: string;
  action: string;
  txID?: string;
  status: 'success' | 'failed';
  details?: Record<string, unknown>;
}
