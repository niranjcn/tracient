import { ROLES, ROLE_HIERARCHY } from '../config/constants.js';
import { forbiddenResponse } from '../utils/response.util.js';

/**
 * Role-based access control middleware
 * Restricts access to specific roles
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return forbiddenResponse(res, 'Authentication required');
    }
    
    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return forbiddenResponse(res, `Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }
    
    next();
  };
};

/**
 * Minimum role level middleware
 * Allows access to users with role level >= required level
 */
export const authorizeMinLevel = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return forbiddenResponse(res, 'Authentication required');
    }
    
    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;
    
    if (userLevel < requiredLevel) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }
    
    next();
  };
};

/**
 * Check if user can access a specific resource
 * Used for resource-level authorization
 */
export const authorizeResource = (getResourceOwnerId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return forbiddenResponse(res, 'Authentication required');
    }
    
    // Admins and government officials can access all resources
    if ([ROLES.ADMIN, ROLES.GOVERNMENT].includes(req.user.role)) {
      return next();
    }
    
    try {
      const ownerId = await getResourceOwnerId(req);
      
      if (!ownerId) {
        return forbiddenResponse(res, 'Resource not found');
      }
      
      // Check if user owns the resource or has idHash match
      const isOwner = ownerId.toString() === req.user.id.toString() ||
                     ownerId === req.user.idHash;
      
      if (!isOwner) {
        return forbiddenResponse(res, 'You do not have access to this resource');
      }
      
      next();
    } catch (error) {
      return forbiddenResponse(res, 'Error checking resource access');
    }
  };
};

/**
 * Self-only middleware
 * Ensures users can only access their own data (with admin override)
 */
export const selfOnly = (paramName = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return forbiddenResponse(res, 'Authentication required');
    }
    
    // Admins can access any user's data
    if (req.user.role === ROLES.ADMIN) {
      return next();
    }
    
    const requestedId = req.params[paramName];
    const userId = req.user.id.toString();
    const userIdHash = req.user.idHash;
    
    // Check if user is accessing their own data
    if (requestedId !== userId && requestedId !== userIdHash) {
      return forbiddenResponse(res, 'You can only access your own data');
    }
    
    next();
  };
};

// Convenience middleware for common role combinations
export const adminOnly = authorize(ROLES.ADMIN);
export const govOnly = authorize(ROLES.GOVERNMENT, ROLES.ADMIN);
export const govOrAdmin = authorize(ROLES.GOVERNMENT, ROLES.ADMIN);
export const employerOnly = authorize(ROLES.EMPLOYER, ROLES.ADMIN);
export const workerOnly = authorize(ROLES.WORKER, ROLES.ADMIN);
export const govOrEmployer = authorize(ROLES.GOVERNMENT, ROLES.EMPLOYER, ROLES.ADMIN);

export default {
  authorize,
  authorizeMinLevel,
  authorizeResource,
  selfOnly,
  adminOnly,
  govOnly,
  govOrAdmin,
  employerOnly,
  workerOnly,
  govOrEmployer
};
