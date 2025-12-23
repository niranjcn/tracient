import jwt from 'jsonwebtoken';
import { logger } from './logger.util.js';

const JWT_SECRET = process.env.JWT_SECRET || 'tracient-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'tracient-refresh-secret-key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

/**
 * Generate access token
 */
export const generateAccessToken = (payload) => {
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  } catch (error) {
    logger.error('Error generating access token:', error);
    throw error;
  }
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload) => {
  try {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw error;
  }
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokens = (user) => {
  const payload = {
    id: user._id || user.id,
    email: user.email,
    role: user.role,
    idHash: user.idHash
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken({ id: payload.id }),
    expiresIn: JWT_EXPIRY
  };
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Decode token without verification
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Generate QR token (short-lived)
 */
export const generateQRToken = (data, expiresIn = '5m') => {
  try {
    return jwt.sign(data, JWT_SECRET, { expiresIn });
  } catch (error) {
    logger.error('Error generating QR token:', error);
    throw error;
  }
};

/**
 * Generate password reset token
 */
export const generateResetToken = (userId) => {
  try {
    return jwt.sign({ id: userId, purpose: 'reset' }, JWT_SECRET, { expiresIn: '1h' });
  } catch (error) {
    logger.error('Error generating reset token:', error);
    throw error;
  }
};

export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  generateQRToken,
  generateResetToken
};
