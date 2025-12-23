import { verifyAccessToken } from '../utils/jwt.util.js';
import { User } from '../models/User.js';
import { unauthorizedResponse } from '../utils/response.util.js';
import { logger } from '../utils/logger.util.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse(res, 'No authentication token provided');
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return unauthorizedResponse(res, 'No authentication token provided');
    }
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return unauthorizedResponse(res, 'User not found');
    }
    
    if (!user.isActive) {
      return unauthorizedResponse(res, 'User account is deactivated');
    }
    
    // Attach user to request
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      idHash: user.idHash || decoded.idHash,
      name: user.name
    };
    
    next();
  } catch (error) {
    logger.warn('Authentication failed:', error.message);
    
    if (error.message === 'Token has expired') {
      return unauthorizedResponse(res, 'Token has expired. Please login again.');
    }
    
    return unauthorizedResponse(res, 'Invalid authentication token');
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't fail if not present
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }
    
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    
    if (user && user.isActive) {
      req.user = {
        id: user._id,
        email: user.email,
        role: user.role,
        idHash: user.idHash || decoded.idHash,
        name: user.name
      };
    }
    
    next();
  } catch (error) {
    // Token invalid but that's okay for optional auth
    next();
  }
};

export default { authenticate, optionalAuth };
