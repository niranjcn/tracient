import morgan from 'morgan';
import { httpLogStream, logger } from '../utils/logger.util.js';

/**
 * Custom Morgan token for user ID
 */
morgan.token('user-id', (req) => {
  return req.user?.id || 'anonymous';
});

/**
 * Custom Morgan token for user role
 */
morgan.token('user-role', (req) => {
  return req.user?.role || '-';
});

/**
 * Custom Morgan token for response time in a cleaner format
 */
morgan.token('response-time-clean', (req, res) => {
  const time = morgan['response-time'](req, res);
  return time ? `${time}ms` : '-';
});

/**
 * Development logging format
 */
const devFormat = ':method :url :status :response-time-clean - :user-id';

/**
 * Production logging format (more detailed)
 */
const prodFormat = ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-clean';

/**
 * Get Morgan middleware based on environment
 */
export const httpLogger = morgan(
  process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  { stream: httpLogStream }
);

/**
 * Request logging middleware (detailed)
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request start
  logger.debug('Request received', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userId: req.user?.id
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'debug';
    
    logger[level]('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id
    });
  });
  
  next();
};

/**
 * Slow request warning middleware
 */
export const slowRequestLogger = (thresholdMs = 1000) => {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      if (duration > thresholdMs) {
        logger.warn('Slow request detected', {
          method: req.method,
          path: req.path,
          duration: `${duration}ms`,
          threshold: `${thresholdMs}ms`
        });
      }
    });
    
    next();
  };
};

export default {
  httpLogger,
  requestLogger,
  slowRequestLogger
};
