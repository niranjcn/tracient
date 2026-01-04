/**
 * Authentication Controller
 */
import { User, Worker, Employer, GovOfficial, Admin, AuditLog } from '../models/index.js';
import { generateTokens, verifyRefreshToken, generateResetToken } from '../utils/jwt.util.js';
import { generateIdHash, hashPassword, comparePassword } from '../utils/hash.util.js';
import { successResponse, createdResponse, errorResponse, unauthorizedResponse } from '../utils/response.util.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/email.service.js';
import { registerWorkerOnChain, registerUserOnChain } from '../services/fabric.service.js';
import { syncFamilyMemberCount } from '../services/family-sync.service.js';
import { logger } from '../utils/logger.util.js';
import { ROLES } from '../config/constants.js';
import { isBlockchainEnabled, logBlockchainSkip } from '../config/blockchain.config.js';

/**
 * Register a new user
 */
export const register = async (req, res) => {
  try {
    const { email, password, name, role, phone, aadhaarNumber, ...additionalData } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'Email already registered', 409);
    }
    
    // Generate idHash from Aadhaar if provided
    let idHash = null;
    if (aadhaarNumber) {
      idHash = generateIdHash(aadhaarNumber);
      
      // Check for duplicate idHash
      const existingIdHash = await User.findOne({ idHash });
      if (existingIdHash) {
        return errorResponse(res, 'Aadhaar number already registered', 409);
      }
    } else {
      // Generate idHash from email for non-worker roles without Aadhaar
      idHash = generateIdHash(email + Date.now().toString());
    }
    
    // Create user
    const user = await User.create({
      email,
      password,
      name,
      role,
      phone,
      idHash,
      ration_no: additionalData.ration_no || null
    });
    
    // Auto-sync family member count if user has ration number
    if (user.ration_no) {
      try {
        await syncFamilyMemberCount(user.ration_no);
      } catch (syncError) {
        logger.error('Family sync failed during registration:', syncError.message);
        // Don't fail registration if sync fails
      }
    }
    
    // Create role-specific profile and blockchain identity
    let profile = null;
    let blockchainIdentity = null;
    
    switch (role) {
      case ROLES.WORKER:
        profile = await Worker.create({
          userId: user._id,
          idHash,
          name,
          phone,
          aadhaarLast4: aadhaarNumber?.slice(-4),
          bankAccount: additionalData.bankAccount || 'PENDING',
          employmentType: additionalData.employmentType || 'informal',
          isFarmer: additionalData.isFarmer || false,
          kccLimit: additionalData.kccLimit || 0,
          ...additionalData
        });
        
        // Register on blockchain (only if enabled)
        if (idHash && isBlockchainEnabled()) {
          // Use the new registerUserOnChain for consistent identity management
          const result = await registerUserOnChain({
            userId: user._id,
            idHash,
            name,
            role: 'worker',
            email,
            phone,
            state: additionalData.state,
            district: additionalData.district,
            registeredAt: new Date()
          });
          if (result.success) {
            blockchainIdentity = result.blockchainIdentity;
            // Store blockchain registration status
            user.blockchainRegistered = true;
            user.blockchainIdentity = result.blockchainIdentity;
            await user.save();
          }
        } else if (idHash) {
          logBlockchainSkip('RegisterWorker', logger);
        }
        break;
        
      case ROLES.EMPLOYER:
        profile = await Employer.create({
          userId: user._id,
          companyName: additionalData.companyName || name,
          contactPerson: name,
          email,
          phone,
          ...additionalData
        });
        
        // Register employer on blockchain
        if (idHash && isBlockchainEnabled()) {
          const result = await registerUserOnChain({
            userId: user._id,
            idHash,
            name,
            role: 'employer',
            email,
            phone,
            companyName: additionalData.companyName || name,
            state: additionalData.state,
            district: additionalData.district,
            registeredAt: new Date()
          });
          if (result.success) {
            blockchainIdentity = result.blockchainIdentity;
            user.blockchainRegistered = true;
            user.blockchainIdentity = result.blockchainIdentity;
            await user.save();
          }
        } else {
          logBlockchainSkip('RegisterEmployer', logger);
        }
        break;
        
      case ROLES.GOVERNMENT:
        profile = await GovOfficial.create({
          userId: user._id,
          name,
          email,
          phone,
          designation: additionalData.designation || 'Official',
          department: additionalData.department || 'General',
          employeeId: additionalData.employeeId || `GOV${Date.now()}`,
          ...additionalData
        });
        
        // Register government official on blockchain
        if (idHash && isBlockchainEnabled()) {
          const result = await registerUserOnChain({
            userId: user._id,
            idHash,
            name,
            role: 'government',
            email,
            phone,
            department: additionalData.department || 'General',
            designation: additionalData.designation || 'Official',
            employeeId: additionalData.employeeId || `GOV${Date.now()}`,
            state: additionalData.state,
            district: additionalData.district,
            registeredAt: new Date()
          });
          if (result.success) {
            blockchainIdentity = result.blockchainIdentity;
            user.blockchainRegistered = true;
            user.blockchainIdentity = result.blockchainIdentity;
            await user.save();
          }
        } else {
          logBlockchainSkip('RegisterGovernment', logger);
        }
        break;
        
      case ROLES.ADMIN:
        profile = await Admin.create({
          userId: user._id,
          name,
          email,
          phone,
          employeeId: additionalData.employeeId || `ADM${Date.now()}`,
          ...additionalData
        });
        
        // Register admin on blockchain
        if (idHash && isBlockchainEnabled()) {
          const result = await registerUserOnChain({
            userId: user._id,
            idHash,
            name,
            role: 'admin',
            email,
            phone,
            employeeId: additionalData.employeeId || `ADM${Date.now()}`,
            registeredAt: new Date()
          });
          if (result.success) {
            blockchainIdentity = result.blockchainIdentity;
            user.blockchainRegistered = true;
            user.blockchainIdentity = result.blockchainIdentity;
            await user.save();
          }
        } else {
          logBlockchainSkip('RegisterAdmin', logger);
        }
        break;
    }
    
    // Generate tokens
    const tokens = generateTokens(user);
    
    // Save refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();
    
    // Log registration
    AuditLog.logAuth('register', user._id, email, true, req);
    
    // Send welcome email
    sendWelcomeEmail(user);
    
    logger.info('User registered', { userId: user._id, role, blockchainRegistered: !!blockchainIdentity });
    
    return createdResponse(res, {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        idHash: user.idHash
      },
      profile: profile ? { id: profile._id } : null,
      blockchainIdentity,
      ...tokens
    }, 'Registration successful');
    
  } catch (error) {
    logger.error('Registration error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Login user
 */
export const login = async (req, res) => {
  try {
    // Support both 'email' and 'identifier' field names
    const email = req.body.email || req.body.identifier;
    const { password } = req.body;
    
    console.log('Login attempt:', { email, hasPassword: !!password });
    
    if (!email) {
      return errorResponse(res, 'Email is required', 400);
    }
    
    // Find user by credentials
    const user = await User.findByCredentials(email, password);
    
    console.log('User found:', { userId: user._id, role: user.role });
    
    // Generate tokens
    const tokens = generateTokens(user);
    
    // Update refresh token
    user.refreshToken = tokens.refreshToken;
    user.lastLogin = new Date();
    await user.save();
    
    // Log login
    AuditLog.logAuth('login', user._id, email, true, req);
    
    logger.info('User logged in', { userId: user._id, role: user.role });
    
    return successResponse(res, {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        idHash: user.idHash
      },
      ...tokens
    }, 'Login successful');
    
  } catch (error) {
    console.log('Login error:', error.message);
    // Log failed login attempt
    const loginEmail = req.body.email || req.body.identifier;
    AuditLog.logAuth('login_failed', null, loginEmail, false, req, error.message);
    
    logger.warn('Login failed:', error.message);
    return unauthorizedResponse(res, error.message);
  }
};

/**
 * Logout user
 */
export const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user) {
      user.refreshToken = null;
      await user.save();
      
      AuditLog.logAuth('logout', user._id, user.email, true, req);
    }
    
    return successResponse(res, null, 'Logout successful');
  } catch (error) {
    logger.error('Logout error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return unauthorizedResponse(res, 'Refresh token required');
    }
    
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Find user
    const user = await User.findById(decoded.id).select('+refreshToken');
    
    if (!user || user.refreshToken !== refreshToken) {
      return unauthorizedResponse(res, 'Invalid refresh token');
    }
    
    // Generate new tokens
    const tokens = generateTokens(user);
    
    // Update refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();
    
    return successResponse(res, tokens, 'Token refreshed');
  } catch (error) {
    logger.warn('Token refresh failed:', error.message);
    return unauthorizedResponse(res, error.message);
  }
};

/**
 * Get current user profile
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    
    // Get role-specific profile
    let profile = null;
    
    switch (user.role) {
      case ROLES.WORKER:
        profile = await Worker.findOne({ userId: user._id });
        break;
      case ROLES.EMPLOYER:
        profile = await Employer.findOne({ userId: user._id });
        break;
      case ROLES.GOVERNMENT:
        profile = await GovOfficial.findOne({ userId: user._id });
        break;
      case ROLES.ADMIN:
        profile = await Admin.findOne({ userId: user._id });
        break;
    }
    
    return successResponse(res, {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        idHash: user.idHash,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      },
      profile
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Change password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return errorResponse(res, 'Current password is incorrect', 400);
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    AuditLog.logAuth('password_change', user._id, user.email, true, req);
    
    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    logger.error('Password change error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Forgot password - send reset email
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal if email exists
      return successResponse(res, null, 'If email exists, reset link will be sent');
    }
    
    // Generate reset token
    const resetToken = generateResetToken(user._id);
    
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();
    
    // Send reset email
    await sendPasswordResetEmail(user, resetToken);
    
    AuditLog.logAuth('password_reset_request', user._id, email, true, req);
    
    return successResponse(res, null, 'Password reset email sent');
  } catch (error) {
    logger.error('Forgot password error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return errorResponse(res, 'Invalid or expired reset token', 400);
    }
    
    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    AuditLog.logAuth('password_reset', user._id, user.email, true, req);
    
    return successResponse(res, null, 'Password reset successful');
  } catch (error) {
    logger.error('Reset password error:', error);
    return errorResponse(res, error.message, 500);
  }
};

export default {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword
};
