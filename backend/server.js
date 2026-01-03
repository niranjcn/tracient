/**
 * TRACIENT Backend Server
 * Production-ready Express.js application
 */
console.log('=== Server.js starting ===');
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import { connectDB } from './config/database.js';
import { initFabricGateway } from './config/fabric.js';
import { startScheduledJobs, stopScheduledJobs } from './jobs/scheduler.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { requestLogger } from './middleware/logger.middleware.js';
import { defaultLimiter } from './middleware/rateLimit.middleware.js';
import logger from './utils/logger.util.js';

const app = express();
const PORT = process.env.PORT || 5000;

// =============================================================================
// MIDDLEWARE SETUP
// =============================================================================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production'
}));

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression
app.use(compression());

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Request logging
app.use(requestLogger);

// Rate limiting (applied to all routes)
app.use(defaultLimiter);

// =============================================================================
// ROUTES
// =============================================================================

// Mount all API routes under /api
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TRACIENT API Server',
    version: '2.0.0',
    documentation: '/api/health'
  });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// =============================================================================
// SERVER STARTUP
// =============================================================================

const startServer = async () => {
  try {
    // Connect to MongoDB
    console.log('Attempting to connect to MongoDB...');
    await connectDB();
    console.log('MongoDB connected successfully!');
    
    // Initialize Hyperledger Fabric Gateway
    if (process.env.FABRIC_ENABLED === 'true') {
      console.log('Initializing Hyperledger Fabric Gateway...');
      try {
        const fabricStatus = await initFabricGateway();
        if (fabricStatus) {
          logger.info('✓ Hyperledger Fabric Gateway initialized successfully');
        } else {
          logger.warn('⚠ Fabric Gateway not available - using mock mode');
        }
      } catch (fabricError) {
        logger.warn('⚠ Fabric initialization warning:', fabricError.message);
      }
    } else {
      logger.info('ℹ Fabric integration is disabled (set FABRIC_ENABLED=true to enable)');
    }
    
    // Start Express server
    app.listen(PORT, () => {
      logger.info(`
╔══════════════════════════════════════════════════════════════════╗
║              TRACIENT Backend Server v2.0.0                      ║
╠══════════════════════════════════════════════════════════════════╣
║  Status:      Running                                            ║
║  Port:        ${PORT}                                                ║
║  Environment: ${process.env.NODE_ENV || 'development'}                                      ║
║  API Base:    http://localhost:${PORT}/api                           ║
╠══════════════════════════════════════════════════════════════════╣
║  Endpoints:                                                      ║
║  • Health:     GET  /api/health                                  ║
║  • Auth:       POST /api/auth/login, /api/auth/register          ║
║  • Workers:    GET  /api/workers                                 ║
║  • Wages:      POST /api/wages                                   ║
║  • UPI:        POST /api/upi/generate-qr                         ║
║  • Government: GET  /api/government/dashboard                    ║
║  • Family Sync: POST /api/family/sync/all (Admin/Gov)            ║
╠══════════════════════════════════════════════════════════════════╣
║  Scheduled Jobs: ✓ Started                                       ║
║  • Daily Family Sync: 2:00 AM IST                                ║
╚══════════════════════════════════════════════════════════════════╝
      `);
      
      // Start scheduled background jobs
      startScheduledJobs();
    });
  } catch (error) {
    console.error('CRITICAL ERROR:', error);
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  stopScheduledJobs();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  stopScheduledJobs();
  process.exit(0);
});

startServer();
