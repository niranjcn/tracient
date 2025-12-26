/**
 * Routes Index
 * Central route aggregator
 */
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import workerRoutes from './worker.routes.js';
import wageRoutes from './wage.routes.js';
import upiRoutes from './upi.routes.js';
import governmentRoutes from './government.routes.js';
import employerRoutes from './employer.routes.js';
import adminRoutes from './admin.routes.js';
import analyticsRoutes from './analytics.routes.js';
import blockchainRoutes from './blockchain.routes.js';
import familyRoutes from './family.routes.js';

const router = Router();

// API Health Check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Tracient API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/workers', workerRoutes);
router.use('/wages', wageRoutes);
router.use('/upi', upiRoutes);
router.use('/qr', upiRoutes); // Alias for QR routes
router.use('/government', governmentRoutes);
router.use('/employers', employerRoutes);
router.use('/admin', adminRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/blockchain', blockchainRoutes);
router.use('/family', familyRoutes);

export default router;
