import rateLimit from 'express-rate-limit';
import { RATE_LIMIT } from '../config/constants.js';
import { rateLimitResponse } from '../utils/response.util.js';
import { logger } from '../utils/logger.util.js';

/**
 * Default rate limiter
 */
export const defaultLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later',
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path
    });
    return rateLimitResponse(res);
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again after 15 minutes',
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email
    });
    return rateLimitResponse(res, 'Too many login attempts. Please try again after 15 minutes.');
  },
  skipSuccessfulRequests: true // Don't count successful logins
});

/**
 * Rate limiter for password reset
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts
  message: 'Too many password reset attempts, please try again after an hour',
  handler: (req, res) => {
    logger.warn('Password reset rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email
    });
    return rateLimitResponse(res, 'Too many password reset attempts. Please try again after an hour.');
  }
});

/**
 * Rate limiter for QR code generation
 */
export const qrLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 QR codes per minute
  message: 'Too many QR code requests',
  handler: (req, res) => {
    logger.warn('QR rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id
    });
    return rateLimitResponse(res, 'Too many QR code requests. Please wait a moment.');
  }
});

/**
 * Rate limiter for transactions
 */
export const transactionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 transactions per minute
  message: 'Too many transaction requests',
  handler: (req, res) => {
    logger.warn('Transaction rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id
    });
    return rateLimitResponse(res, 'Too many transaction requests. Please slow down.');
  }
});

/**
 * Rate limiter for API endpoints (more generous)
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many API requests',
  handler: (req, res) => {
    logger.warn('API rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      path: req.path
    });
    return rateLimitResponse(res);
  }
});

/**
 * Rate limiter for report generation
 */
export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 reports per hour
  message: 'Too many report generation requests',
  handler: (req, res) => {
    logger.warn('Report rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id
    });
    return rateLimitResponse(res, 'Too many report requests. Please try again later.');
  }
});

export default {
  defaultLimiter,
  authLimiter,
  passwordResetLimiter,
  qrLimiter,
  transactionLimiter,
  apiLimiter,
  reportLimiter
};
