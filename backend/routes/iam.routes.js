/**
 * IAM (Identity and Access Management) Routes
 * Manages blockchain identities and their roles
 */
import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/role.middleware.js';
import logger from '../utils/logger.util.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { User } from '../models/index.js';
import { 
  registerUserOnChain, 
  updateUserPermissions, 
  getUserBlockchainIdentity,
  updateUserStatus as updateUserBlockchainStatus
} from '../services/fabric.service.js';
import { isBlockchainEnabled } from '../config/blockchain.config.js';

const execAsync = promisify(exec);
const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all blockchain identities
router.get('/identities', authenticate, adminOnly, async (req, res) => {
  try {
    const identitiesDir = path.resolve(__dirname, '../../blockchain/scripts/users');
    const networkUsersDir = path.resolve(__dirname, '../../blockchain/network/test-network/organizations/peerOrganizations/org1.example.com/users');
    
    const identities = [];
    
    // Check scripts/users directory (IAM-enabled identities)
    try {
      const users = await fs.readdir(identitiesDir);
      
      for (const user of users) {
        const userPath = path.join(identitiesDir, user);
        const stat = await fs.stat(userPath);
        
        if (stat.isDirectory()) {
          const certPath = path.join(userPath, 'msp', 'signcerts', 'cert.pem');
          const keystorePath = path.join(userPath, 'msp', 'keystore');
          
          let hasValidCert = false;
          let role = 'unknown';
          let certDetails = null;
          
          try {
            await fs.access(certPath);
            const certContent = await fs.readFile(certPath, 'utf8');
            hasValidCert = true;
            
            // Extract role from username (testadmin -> admin, testworker -> worker)
            role = user.replace('test', '').toLowerCase();
            
            // Try to get cert expiry
            try {
              const { stdout } = await execAsync(`openssl x509 -in "${certPath}" -noout -enddate -subject`);
              const lines = stdout.split('\n');
              const notAfter = lines.find(l => l.startsWith('notAfter='))?.replace('notAfter=', '').trim();
              const subject = lines.find(l => l.startsWith('subject='))?.replace('subject=', '').trim();
              
              certDetails = {
                expiresAt: notAfter,
                subject: subject
              };
            } catch (err) {
              logger.warn(`Could not parse certificate for ${user}:`, err.message);
            }
          } catch (err) {
            // No valid certificate
          }
          
          identities.push({
            username: user,
            role: role,
            hasValidCert,
            certPath,
            keystorePath,
            location: 'scripts/users (IAM-enabled)',
            certDetails
          });
        }
      }
    } catch (err) {
      logger.warn('Could not read scripts/users directory:', err.message);
    }
    
    // Check network users directory (standard Fabric identities)
    try {
      const users = await fs.readdir(networkUsersDir);
      
      for (const user of users) {
        const userPath = path.join(networkUsersDir, user);
        const stat = await fs.stat(userPath);
        
        if (stat.isDirectory() && user !== 'Admin@org1.example.com') {
          const certPath = path.join(userPath, 'msp', 'signcerts', 'cert.pem');
          
          let hasValidCert = false;
          try {
            await fs.access(certPath);
            hasValidCert = true;
          } catch (err) {
            // No valid certificate
          }
          
          identities.push({
            username: user,
            role: 'client',
            hasValidCert,
            certPath,
            keystorePath: path.join(userPath, 'msp', 'keystore'),
            location: 'network/users (No IAM)',
            certDetails: null
          });
        }
      }
    } catch (err) {
      logger.warn('Could not read network users directory:', err.message);
    }
    
    // Get current active identity
    const currentIdentity = process.env.FABRIC_USER_NAME || 'User1@org1.example.com';
    
    res.json({
      success: true,
      data: {
        identities,
        currentIdentity,
        totalCount: identities.length,
        validCertCount: identities.filter(i => i.hasValidCert).length
      }
    });
  } catch (error) {
    logger.error('Error fetching identities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blockchain identities',
      error: error.message
    });
  }
});

// Get certificate details for a specific identity
router.get('/identities/:username/certificate', authenticate, adminOnly, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Try scripts/users first
    let certPath = path.resolve(__dirname, `../../blockchain/scripts/users/${username}/msp/signcerts/cert.pem`);
    
    try {
      await fs.access(certPath);
    } catch {
      // Try network users
      certPath = path.resolve(__dirname, `../../blockchain/network/test-network/organizations/peerOrganizations/org1.example.com/users/${username}/msp/signcerts/cert.pem`);
    }
    
    const certContent = await fs.readFile(certPath, 'utf8');
    
    // Parse certificate details using openssl
    const { stdout } = await execAsync(`openssl x509 -in "${certPath}" -text -noout`);
    
    res.json({
      success: true,
      data: {
        username,
        certificate: certContent,
        details: stdout
      }
    });
  } catch (error) {
    logger.error(`Error fetching certificate for ${req.params.username}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificate',
      error: error.message
    });
  }
});

// Set active identity
router.post('/identities/set-active', authenticate, adminOnly, async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }
    
    // Verify the identity exists and has valid certificates
    let certPath;
    try {
      certPath = path.resolve(__dirname, `../../blockchain/scripts/users/${username}/msp/signcerts/cert.pem`);
      await fs.access(certPath);
    } catch {
      try {
        certPath = path.resolve(__dirname, `../../blockchain/network/test-network/organizations/peerOrganizations/org1.example.com/users/${username}/msp/signcerts/cert.pem`);
        await fs.access(certPath);
      } catch {
        return res.status(404).json({
          success: false,
          message: `Identity '${username}' not found or has no valid certificate`
        });
      }
    }
    
    // Update .env file
    const envPath = path.resolve(__dirname, '../.env');
    let envContent = await fs.readFile(envPath, 'utf8');
    
    // Replace FABRIC_USER_NAME
    envContent = envContent.replace(
      /FABRIC_USER_NAME=.*/,
      `FABRIC_USER_NAME=${username}`
    );
    
    await fs.writeFile(envPath, envContent, 'utf8');
    
    res.json({
      success: true,
      message: `Active identity set to '${username}'. Restart the backend to apply changes.`,
      data: {
        username,
        requiresRestart: true
      }
    });
  } catch (error) {
    logger.error('Error setting active identity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set active identity',
      error: error.message
    });
  }
});

// Get IAM role definitions
router.get('/roles', authenticate, adminOnly, async (req, res) => {
  const roles = [
    {
      name: 'admin',
      clearanceLevel: 99,
      permissions: [
        'canRecordWage',
        'canRecordUPI',
        'canRegisterUsers',
        'canManageUsers',
        'canUpdateThresholds',
        'canFlagAnomaly',
        'canReviewAnomaly',
        'canGenerateReport',
        'canBatchProcess',
        'canReadAll',
        'canExport'
      ],
      description: 'Full system access with all permissions'
    },
    {
      name: 'government_official',
      clearanceLevel: 10,
      permissions: [
        'canRegisterUsers',
        'canManageUsers',
        'canUpdateThresholds',
        'canFlagAnomaly',
        'canReviewAnomaly',
        'canGenerateReport',
        'canReadAll',
        'canExport'
      ],
      description: 'Government officials with high-level access'
    },
    {
      name: 'auditor',
      clearanceLevel: 8,
      permissions: [
        'canFlagAnomaly',
        'canReviewAnomaly',
        'canGenerateReport',
        'canReadAll'
      ],
      description: 'Auditors can review and flag anomalies'
    },
    {
      name: 'bank_officer',
      clearanceLevel: 7,
      permissions: [
        'canRecordUPI',
        'canGenerateReport'
      ],
      description: 'Bank officers can record UPI transactions'
    },
    {
      name: 'employer',
      clearanceLevel: 5,
      permissions: [
        'canRecordWage',
        'canRecordUPI',
        'canBatchProcess'
      ],
      description: 'Employers can record wages and payments'
    },
    {
      name: 'worker',
      clearanceLevel: 1,
      permissions: [],
      description: 'Workers can view their own data'
    }
  ];
  
  res.json({
    success: true,
    data: roles
  });
});

// Get all users with their blockchain identity status
router.get('/users', authenticate, adminOnly, async (req, res) => {
  try {
    const { role, blockchainRegistered, page = 1, limit = 20 } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (blockchainRegistered !== undefined) {
      filter.blockchainRegistered = blockchainRegistered === 'true';
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(filter)
      .select('name email role idHash blockchainRegistered blockchainIdentity createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching IAM users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Get user's blockchain identity details
router.get('/users/:userId/identity', authenticate, adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('name email role idHash blockchainRegistered blockchainIdentity');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Try to fetch blockchain identity if connected
    let chainIdentity = null;
    if (isBlockchainEnabled() && user.idHash) {
      const result = await getUserBlockchainIdentity(user.idHash);
      if (result.success) {
        chainIdentity = result.data;
      }
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          idHash: user.idHash
        },
        localIdentity: user.blockchainIdentity,
        chainIdentity,
        blockchainRegistered: user.blockchainRegistered
      }
    });
  } catch (error) {
    logger.error('Error fetching user identity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user identity',
      error: error.message
    });
  }
});

// Register user on blockchain manually (admin only)
router.post('/users/:userId/register', authenticate, adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions, clearanceLevel } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!isBlockchainEnabled()) {
      return res.status(400).json({
        success: false,
        message: 'Blockchain is not enabled'
      });
    }
    
    // Register user on blockchain
    const result = await registerUserOnChain({
      userId: user._id,
      idHash: user.idHash,
      name: user.name,
      role: user.role,
      email: user.email,
      phone: user.phone,
      permissions,
      clearanceLevel,
      registeredAt: new Date()
    });
    
    if (result.success) {
      user.blockchainRegistered = true;
      user.blockchainIdentity = result.blockchainIdentity;
      await user.save();
      
      logger.info('User registered on blockchain manually', { 
        userId: user._id, 
        role: user.role,
        registeredBy: req.user.id
      });
      
      res.json({
        success: true,
        message: 'User registered on blockchain successfully',
        data: {
          blockchainIdentity: result.blockchainIdentity
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to register user on blockchain',
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error registering user on blockchain:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user on blockchain',
      error: error.message
    });
  }
});

// Update user's blockchain permissions (admin only)
router.put('/users/:userId/permissions', authenticate, adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions, clearanceLevel } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!user.blockchainRegistered) {
      return res.status(400).json({
        success: false,
        message: 'User is not registered on blockchain. Register first.'
      });
    }
    
    if (!isBlockchainEnabled()) {
      return res.status(400).json({
        success: false,
        message: 'Blockchain is not enabled'
      });
    }
    
    // Update permissions on blockchain
    const result = await updateUserPermissions({
      idHash: user.idHash,
      permissions,
      clearanceLevel
    });
    
    if (result.success) {
      // Update local record
      user.blockchainIdentity = {
        ...user.blockchainIdentity,
        permissions,
        clearanceLevel
      };
      await user.save();
      
      logger.info('User permissions updated on blockchain', { 
        userId: user._id,
        updatedBy: req.user.id
      });
      
      res.json({
        success: true,
        message: 'User permissions updated successfully',
        data: {
          blockchainIdentity: user.blockchainIdentity
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update permissions on blockchain',
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error updating user permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user permissions',
      error: error.message
    });
  }
});

// Update user's blockchain status (activate/suspend/revoke)
router.put('/users/:userId/status', authenticate, adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;
    
    if (!['active', 'suspended', 'revoked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: active, suspended, or revoked'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!user.blockchainRegistered) {
      return res.status(400).json({
        success: false,
        message: 'User is not registered on blockchain'
      });
    }
    
    if (!isBlockchainEnabled()) {
      return res.status(400).json({
        success: false,
        message: 'Blockchain is not enabled'
      });
    }
    
    // Update status on blockchain
    const result = await updateUserBlockchainStatus(user.idHash, status, reason);
    
    if (result.success) {
      // Update local record
      user.blockchainIdentity = {
        ...user.blockchainIdentity,
        status
      };
      user.isActive = status === 'active';
      await user.save();
      
      logger.info('User blockchain status updated', { 
        userId: user._id,
        status,
        updatedBy: req.user.id
      });
      
      res.json({
        success: true,
        message: `User status updated to ${status}`,
        data: {
          status,
          blockchainIdentity: user.blockchainIdentity
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update status on blockchain',
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
});

// Batch register users on blockchain (admin only)
router.post('/users/batch-register', authenticate, adminOnly, async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'userIds array is required'
      });
    }
    
    if (!isBlockchainEnabled()) {
      return res.status(400).json({
        success: false,
        message: 'Blockchain is not enabled'
      });
    }
    
    const results = {
      successful: [],
      failed: []
    };
    
    for (const userId of userIds) {
      try {
        const user = await User.findById(userId);
        
        if (!user) {
          results.failed.push({ userId, error: 'User not found' });
          continue;
        }
        
        if (user.blockchainRegistered) {
          results.failed.push({ userId, error: 'Already registered on blockchain' });
          continue;
        }
        
        const result = await registerUserOnChain({
          userId: user._id,
          idHash: user.idHash,
          name: user.name,
          role: user.role,
          email: user.email,
          registeredAt: new Date()
        });
        
        if (result.success) {
          user.blockchainRegistered = true;
          user.blockchainIdentity = result.blockchainIdentity;
          await user.save();
          results.successful.push({ userId, identity: result.blockchainIdentity });
        } else {
          results.failed.push({ userId, error: result.error });
        }
      } catch (error) {
        results.failed.push({ userId, error: error.message });
      }
    }
    
    logger.info('Batch blockchain registration completed', { 
      successful: results.successful.length,
      failed: results.failed.length,
      registeredBy: req.user.id
    });
    
    res.json({
      success: true,
      message: `Registered ${results.successful.length} users, ${results.failed.length} failed`,
      data: results
    });
  } catch (error) {
    logger.error('Error in batch registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to batch register users',
      error: error.message
    });
  }
});

// Get all available permissions
router.get('/permissions', authenticate, adminOnly, async (req, res) => {
  const permissions = [
    { id: 'canRecordWage', name: 'Record Wage', description: 'Can record wage transactions' },
    { id: 'canRecordUPI', name: 'Record UPI', description: 'Can record UPI transactions' },
    { id: 'canBatchProcess', name: 'Batch Process', description: 'Can process batch uploads' },
    { id: 'canRegisterUsers', name: 'Register Users', description: 'Can register new users on blockchain' },
    { id: 'canManageUsers', name: 'Manage Users', description: 'Can update user status' },
    { id: 'canUpdateThresholds', name: 'Update Thresholds', description: 'Can set BPL/APL thresholds' },
    { id: 'canFlagAnomaly', name: 'Flag Anomaly', description: 'Can flag suspicious transactions' },
    { id: 'canReviewAnomaly', name: 'Review Anomaly', description: 'Can review and dismiss anomalies' },
    { id: 'canGenerateReport', name: 'Generate Report', description: 'Can generate compliance reports' },
    { id: 'canReadAll', name: 'Read All', description: 'Can read all data (not just own)' },
    { id: 'canExport', name: 'Export Data', description: 'Can export data from system' }
  ];
  
  res.json({
    success: true,
    data: permissions
  });
});

export default router;
