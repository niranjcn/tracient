import mongoose from 'mongoose';
import { logger } from '../utils/logger.util.js';

export const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tracient';
    console.log('[DB] Connecting to MongoDB...');
    console.log('[DB] URI:', MONGODB_URI.substring(0, 30) + '...');
    const conn = await mongoose.connect(MONGODB_URI, {
      connectTimeoutMS: 60000,
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 60000,
    });
    console.log('[DB] Connection successful!');

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('[DB] CRITICAL ERROR:',  error.message);
    logger.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
  }
};

export default { connectDB, disconnectDB };
