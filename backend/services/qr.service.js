/**
 * QR Code Generation Service
 */
import QRCode from 'qrcode';
import crypto from 'crypto';
import { logger } from '../utils/logger.util.js';
import { QRToken } from '../models/QRToken.js';
import { generateQRToken } from '../utils/jwt.util.js';

const QR_VALIDITY_MINUTES = parseInt(process.env.QR_VALIDITY_MINUTES) || 5;

/**
 * Generate payment QR code for a worker
 */
export const generatePaymentQR = async (workerData, options = {}) => {
  try {
    const {
      workerId,
      workerIdHash,
      workerName,
      workerAccount,
      fixedAmount,
      minAmount,
      maxAmount
    } = workerData;
    
    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calculate expiry
    const validityMinutes = options.validityMinutes || QR_VALIDITY_MINUTES;
    const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000);
    
    // Create QR token record
    const qrToken = await QRToken.create({
      token,
      workerId,
      workerIdHash,
      workerName,
      workerAccount,
      purpose: 'payment',
      fixedAmount,
      minAmount,
      maxAmount,
      expiresAt,
      maxUses: options.maxUses || 1,
      generatedBy: options.generatedBy,
      generatedByModel: options.generatedByModel || 'Worker',
      deviceInfo: options.deviceInfo
    });
    
    // Generate QR data
    const qrData = JSON.stringify({
      token,
      workerHash: workerIdHash,
      workerName,
      amount: fixedAmount,
      expiresAt: expiresAt.toISOString(),
      type: 'TRACIENT_PAYMENT'
    });
    
    // Generate QR code image
    const qrImageDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    // Update QR token with image URL
    qrToken.qrData = qrData;
    qrToken.qrImageUrl = qrImageDataUrl;
    await qrToken.save();
    
    logger.info('Payment QR generated', { workerIdHash, token: token.substring(0, 8) });
    
    return {
      success: true,
      qrCode: qrImageDataUrl,
      token,
      expiresAt,
      validityMinutes,
      qrTokenId: qrToken._id
    };
  } catch (error) {
    logger.error('Failed to generate payment QR:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Validate a QR token
 */
export const validateQRToken = async (token) => {
  try {
    const qrToken = await QRToken.findValidToken(token);
    
    if (!qrToken) {
      return {
        success: false,
        valid: false,
        error: 'Invalid or expired QR code'
      };
    }
    
    // Check if expired
    if (new Date() > qrToken.expiresAt) {
      qrToken.isExpired = true;
      await qrToken.save();
      return {
        success: false,
        valid: false,
        error: 'QR code has expired'
      };
    }
    
    // Check usage limit
    if (qrToken.useCount >= qrToken.maxUses) {
      return {
        success: false,
        valid: false,
        error: 'QR code has already been used'
      };
    }
    
    return {
      success: true,
      valid: true,
      qrToken: {
        token: qrToken.token,
        workerId: qrToken.workerId,
        workerIdHash: qrToken.workerIdHash,
        workerName: qrToken.workerName,
        workerAccount: qrToken.workerAccount,
        fixedAmount: qrToken.fixedAmount,
        minAmount: qrToken.minAmount,
        maxAmount: qrToken.maxAmount,
        expiresAt: qrToken.expiresAt,
        remainingUses: qrToken.maxUses - qrToken.useCount
      }
    };
  } catch (error) {
    logger.error('Failed to validate QR token:', error.message);
    return { success: false, valid: false, error: error.message };
  }
};

/**
 * Use a QR token (mark as used after payment)
 */
export const useQRToken = async (token, employerId, transactionId) => {
  try {
    const qrToken = await QRToken.findOne({ token });
    
    if (!qrToken) {
      return { success: false, error: 'QR token not found' };
    }
    
    await qrToken.markUsed(employerId, transactionId);
    
    logger.info('QR token used', { token: token.substring(0, 8), employerId });
    
    return { success: true };
  } catch (error) {
    logger.error('Failed to use QR token:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Generate verification QR for worker registration
 */
export const generateVerificationQR = async (workerData) => {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    const qrToken = await QRToken.create({
      token,
      workerId: workerData.workerId,
      workerIdHash: workerData.workerIdHash,
      workerName: workerData.workerName,
      purpose: 'verification',
      expiresAt,
      maxUses: 1
    });
    
    const qrData = JSON.stringify({
      token,
      workerHash: workerData.workerIdHash,
      purpose: 'verification',
      type: 'TRACIENT_VERIFY'
    });
    
    const qrImageDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      width: 300
    });
    
    qrToken.qrData = qrData;
    qrToken.qrImageUrl = qrImageDataUrl;
    await qrToken.save();
    
    return {
      success: true,
      qrCode: qrImageDataUrl,
      token,
      expiresAt
    };
  } catch (error) {
    logger.error('Failed to generate verification QR:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get active QR tokens for a worker
 */
export const getWorkerActiveQRs = async (workerId) => {
  try {
    const tokens = await QRToken.getWorkerActiveTokens(workerId);
    return {
      success: true,
      tokens: tokens.map(t => ({
        token: t.token,
        purpose: t.purpose,
        fixedAmount: t.fixedAmount,
        expiresAt: t.expiresAt,
        remainingUses: t.maxUses - t.useCount,
        qrCode: t.qrImageUrl
      }))
    };
  } catch (error) {
    logger.error('Failed to get worker QR tokens:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Cleanup expired QR tokens
 */
export const cleanupExpiredTokens = async () => {
  try {
    const result = await QRToken.cleanupExpired();
    logger.info(`Cleaned up ${result.modifiedCount} expired QR tokens`);
    return { success: true, cleaned: result.modifiedCount };
  } catch (error) {
    logger.error('Failed to cleanup QR tokens:', error.message);
    return { success: false, error: error.message };
  }
};

export default {
  generatePaymentQR,
  validateQRToken,
  useQRToken,
  generateVerificationQR,
  getWorkerActiveQRs,
  cleanupExpiredTokens
};
