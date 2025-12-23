import { validationResult } from 'express-validator';
import { validationError } from '../utils/response.util.js';

/**
 * Validation middleware
 * Checks express-validator results and returns errors if any
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));
    
    return validationError(res, formattedErrors);
  }
  
  next();
};

/**
 * Sanitize request body
 * Removes undefined and null values, trims strings
 */
export const sanitize = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Recursively sanitize an object
 */
const sanitizeObject = (obj) => {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip undefined and null
    if (value === undefined || value === null) {
      continue;
    }
    
    // Trim strings
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed !== '') {
        sanitized[key] = trimmed;
      }
    }
    // Recursively sanitize nested objects (but not arrays)
    else if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      sanitized[key] = sanitizeObject(value);
    }
    // Keep arrays, dates, numbers, booleans as-is
    else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Validate MongoDB ObjectId parameter
 */
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return validationError(res, [{ field: paramName, message: `${paramName} is required` }]);
    }
    
    // MongoDB ObjectId regex
    const objectIdRegex = /^[a-fA-F0-9]{24}$/;
    
    if (!objectIdRegex.test(id)) {
      return validationError(res, [{ field: paramName, message: `Invalid ${paramName} format` }]);
    }
    
    next();
  };
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;
  
  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return validationError(res, [{ field: 'page', message: 'Page must be a positive integer' }]);
  }
  
  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return validationError(res, [{ field: 'limit', message: 'Limit must be between 1 and 100' }]);
  }
  
  next();
};

export default {
  validate,
  sanitize,
  validateObjectId,
  validatePagination
};
