// User types
export type UserRole = 'worker' | 'employer' | 'government' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orgMSP: string;
  idHash: string; // Hashed Aadhaar for workers, hashed PAN for employers
  phone?: string;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  lastLogin?: string;
  profileImage?: string;
}

export interface Worker extends User {
  role: 'worker';
  aadhaarVerified: boolean;
  bplStatus?: 'BPL' | 'APL';
  totalIncome?: number;
}

export interface Employer extends User {
  role: 'employer';
  businessName: string;
  gstin?: string;
  panVerified: boolean;
  workerCount?: number;
}

export interface GovOfficial extends User {
  role: 'government';
  department: string;
  designation: string;
  employeeId: string;
}

export interface Admin extends User {
  role: 'admin';
  permissions: string[];
}
