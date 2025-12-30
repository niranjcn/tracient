// Application constants
export const APP_NAME = 'Tracient';
export const APP_VERSION = '2.0.0';

// AI Model API Configuration
export const AI_CONFIG = {
  API_URL: process.env.AI_API_URL || 'http://localhost:5001',
  TIMEOUT: parseInt(process.env.AI_API_TIMEOUT) || 30000,
  ENABLED: process.env.AI_ENABLED !== 'false'
};

// User roles
export const ROLES = {
  ADMIN: 'admin',
  GOVERNMENT: 'government',
  EMPLOYER: 'employer',
  WORKER: 'worker'
};

// Role hierarchy (higher number = more privileges)
export const ROLE_HIERARCHY = {
  [ROLES.WORKER]: 1,
  [ROLES.EMPLOYER]: 2,
  [ROLES.GOVERNMENT]: 3,
  [ROLES.ADMIN]: 4
};

// Verification status
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
};

// Payment status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

// Transaction types
export const TRANSACTION_TYPES = {
  WAGE: 'wage',
  BONUS: 'bonus',
  WELFARE: 'welfare',
  REFUND: 'refund'
};

// Income categories for BPL classification
export const INCOME_CATEGORIES = {
  BPL: 'BPL',
  APL: 'APL'
};

// BPL threshold (annual income in INR)
export const BPL_THRESHOLD = parseInt(process.env.BPL_THRESHOLD) || 120000;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// Token expiry times
export const TOKEN_EXPIRY = {
  ACCESS: '24h',
  REFRESH: '7d',
  QR: 5 * 60 * 1000,  // 5 minutes
  RESET_PASSWORD: 60 * 60 * 1000  // 1 hour
};

// Rate limiting
export const RATE_LIMIT = {
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,  // 15 minutes
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
};

// File upload limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024,  // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf']
};

// Blockchain settings
export const BLOCKCHAIN = {
  CHANNEL_NAME: process.env.FABRIC_CHANNEL || 'tracientchannel',
  CHAINCODE_NAME: process.env.FABRIC_CHAINCODE || 'tracient',
  MSP_ID: {
    ORG1: 'Org1MSP',
    ORG2: 'Org2MSP'
  }
};

// Welfare schemes
export const WELFARE_SCHEMES = {
  FOOD_SUBSIDY: 'food_subsidy',
  HOUSING_ASSISTANCE: 'housing_assistance',
  EDUCATION_GRANT: 'education_grant',
  HEALTH_INSURANCE: 'health_insurance',
  EMPLOYMENT_GUARANTEE: 'employment_guarantee'
};

// Anomaly detection thresholds
export const ANOMALY_THRESHOLDS = {
  INCOME_SPIKE_PERCENT: 300,  // 300% increase
  TRANSACTION_FREQUENCY: 50,  // Max transactions per day
  DUPLICATE_WINDOW_HOURS: 24
};

// API response messages
export const MESSAGES = {
  SUCCESS: {
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    FETCHED: 'Resource fetched successfully',
    LOGIN: 'Login successful',
    LOGOUT: 'Logout successful',
    VERIFIED: 'Verification successful',
    PAYMENT: 'Payment processed successfully'
  },
  ERROR: {
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    VALIDATION: 'Validation error',
    DUPLICATE: 'Resource already exists',
    SERVER: 'Internal server error',
    INVALID_CREDENTIALS: 'Invalid credentials',
    TOKEN_EXPIRED: 'Token has expired',
    RATE_LIMIT: 'Too many requests, please try again later'
  }
};

export default {
  APP_NAME,
  APP_VERSION,
  ROLES,
  ROLE_HIERARCHY,
  VERIFICATION_STATUS,
  PAYMENT_STATUS,
  TRANSACTION_TYPES,
  INCOME_CATEGORIES,
  BPL_THRESHOLD,
  PAGINATION,
  TOKEN_EXPIRY,
  RATE_LIMIT,
  UPLOAD_LIMITS,
  BLOCKCHAIN,
  WELFARE_SCHEMES,
  ANOMALY_THRESHOLDS,
  MESSAGES
};
