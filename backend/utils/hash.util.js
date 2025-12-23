import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { logger } from './logger.util.js';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw error;
  }
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error('Error comparing password:', error);
    throw error;
  }
};

/**
 * Generate SHA-256 hash of Aadhaar number for idHash
 */
export const generateIdHash = (aadhaarNumber) => {
  try {
    // Remove any spaces or special characters
    const cleanAadhaar = aadhaarNumber.replace(/\D/g, '');
    
    if (cleanAadhaar.length !== 12) {
      throw new Error('Invalid Aadhaar number: must be 12 digits');
    }

    // Create SHA-256 hash
    const hash = crypto.createHash('sha256')
      .update(cleanAadhaar)
      .digest('hex');

    return hash;
  } catch (error) {
    logger.error('Error generating ID hash:', error);
    throw error;
  }
};

/**
 * Generate a random token
 */
export const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a short verification code
 */
export const generateVerificationCode = (length = 6) => {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
};

/**
 * Generate transaction hash for blockchain
 */
export const generateTransactionHash = (transactionData) => {
  try {
    const dataString = JSON.stringify({
      ...transactionData,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex')
    });

    return crypto.createHash('sha256')
      .update(dataString)
      .digest('hex');
  } catch (error) {
    logger.error('Error generating transaction hash:', error);
    throw error;
  }
};

/**
 * Mask Aadhaar number (show only last 4 digits)
 */
export const maskAadhaar = (aadhaarNumber) => {
  const clean = aadhaarNumber.replace(/\D/g, '');
  if (clean.length < 4) return '****';
  return 'XXXX-XXXX-' + clean.slice(-4);
};

/**
 * Validate Aadhaar number format
 */
export const isValidAadhaar = (aadhaarNumber) => {
  const clean = aadhaarNumber.replace(/\D/g, '');
  return clean.length === 12 && /^[2-9]\d{11}$/.test(clean);
};

/**
 * Validate UPI ID format
 */
export const isValidUPI = (upiId) => {
  const upiRegex = /^[\w.-]+@[\w]+$/;
  return upiRegex.test(upiId);
};

/**
 * Generate unique reference number
 */
export const generateReferenceNumber = (prefix = 'TXN') => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

export default {
  hashPassword,
  comparePassword,
  generateIdHash,
  generateRandomToken,
  generateVerificationCode,
  generateTransactionHash,
  maskAadhaar,
  isValidAadhaar,
  isValidUPI,
  generateReferenceNumber
};
