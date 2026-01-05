/**
 * IAM (Identity and Access Management) Service
 * Handles blockchain identity management API calls
 */
import { get, post, put } from './api';

// Types
export interface BlockchainIdentity {
  userId: string;
  role: string;
  clearanceLevel: number;
  permissions: string[];
  status: 'active' | 'suspended' | 'revoked';
  registeredAt?: string;
}

export interface IAMUser {
  id: string;
  _id: string;
  name: string;
  email: string;
  role: string;
  idHash: string;
  blockchainRegistered: boolean;
  blockchainIdentity?: BlockchainIdentity;
  createdAt: string;
}

export interface IAMRole {
  name: string;
  clearanceLevel: number;
  permissions: string[];
  description: string;
}

export interface IAMPermission {
  id: string;
  name: string;
  description: string;
}

export interface FileIdentity {
  username: string;
  role: string;
  hasValidCert: boolean;
  certPath: string;
  keystorePath: string;
  location: string;
  certDetails?: {
    expiresAt: string;
    subject: string;
  };
}

export interface IdentitiesResponse {
  success: boolean;
  data: {
    identities: FileIdentity[];
    currentIdentity: string;
    totalCount: number;
    validCertCount: number;
  };
}

export interface UsersResponse {
  success: boolean;
  data: {
    users: IAMUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface UserIdentityResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      idHash: string;
    };
    localIdentity: BlockchainIdentity | null;
    chainIdentity: any | null;
    blockchainRegistered: boolean;
  };
}

export interface RegisterUserResponse {
  success: boolean;
  message: string;
  data?: {
    blockchainIdentity: BlockchainIdentity;
  };
  error?: string;
}

export interface BatchRegisterResponse {
  success: boolean;
  message: string;
  data: {
    successful: Array<{ userId: string; identity: BlockchainIdentity }>;
    failed: Array<{ userId: string; error: string }>;
  };
}

/**
 * Get all file-based blockchain identities
 */
export const getFileIdentities = async (): Promise<IdentitiesResponse['data']> => {
  const response = await get<IdentitiesResponse>('/iam/identities');
  return response.data;
};

/**
 * Get certificate details for a specific identity
 */
export const getIdentityCertificate = async (username: string): Promise<{ certificate: string; details: string }> => {
  const response = await get<{ success: boolean; data: { certificate: string; details: string } }>(`/iam/identities/${username}/certificate`);
  return response.data;
};

/**
 * Set active blockchain identity (requires backend restart)
 */
export const setActiveIdentity = async (username: string): Promise<{ username: string; requiresRestart: boolean }> => {
  const response = await post<{ success: boolean; data: { username: string; requiresRestart: boolean } }>('/iam/identities/set-active', { username });
  return response.data;
};

/**
 * Get IAM role definitions
 */
export const getIAMRoles = async (): Promise<IAMRole[]> => {
  const response = await get<{ success: boolean; data: IAMRole[] }>('/iam/roles');
  return response.data;
};

/**
 * Get all available permissions
 */
export const getPermissions = async (): Promise<IAMPermission[]> => {
  const response = await get<{ success: boolean; data: IAMPermission[] }>('/iam/permissions');
  return response.data;
};

/**
 * Get all users with their blockchain identity status
 */
export const getIAMUsers = async (params?: {
  role?: string;
  blockchainRegistered?: boolean;
  page?: number;
  limit?: number;
}): Promise<UsersResponse['data']> => {
  const response = await get<UsersResponse>('/iam/users', params);
  return response.data;
};

/**
 * Get user's blockchain identity details
 */
export const getUserIdentity = async (userId: string): Promise<UserIdentityResponse['data']> => {
  const response = await get<UserIdentityResponse>(`/iam/users/${userId}/identity`);
  return response.data;
};

/**
 * Register user on blockchain manually
 */
export const registerUserOnBlockchain = async (
  userId: string, 
  options?: { permissions?: string[]; clearanceLevel?: number }
): Promise<RegisterUserResponse> => {
  return post<RegisterUserResponse>(`/iam/users/${userId}/register`, options || {});
};

/**
 * Update user's blockchain permissions
 */
export const updateUserPermissions = async (
  userId: string, 
  data: { permissions: string[]; clearanceLevel?: number }
): Promise<RegisterUserResponse> => {
  return put<RegisterUserResponse>(`/iam/users/${userId}/permissions`, data);
};

/**
 * Update user's blockchain status
 */
export const updateUserBlockchainStatus = async (
  userId: string, 
  data: { status: 'active' | 'suspended' | 'revoked'; reason?: string }
): Promise<RegisterUserResponse> => {
  return put<RegisterUserResponse>(`/iam/users/${userId}/status`, data);
};

/**
 * Batch register users on blockchain
 */
export const batchRegisterUsers = async (userIds: string[]): Promise<BatchRegisterResponse> => {
  return post<BatchRegisterResponse>('/iam/users/batch-register', { userIds });
};

// Default export as object
export const iamService = {
  getFileIdentities,
  getIdentityCertificate,
  setActiveIdentity,
  getIAMRoles,
  getPermissions,
  getIAMUsers,
  getUserIdentity,
  registerUserOnBlockchain,
  updateUserPermissions,
  updateUserBlockchainStatus,
  batchRegisterUsers
};

export default iamService;
