/**
 * Worker Controller
 */
import { Worker, User, WageRecord, AuditLog } from '../models/index.js';
import { generateIdHash } from '../utils/hash.util.js';
import { calculateBPLStatus, calculateIncomeTrend } from '../utils/bpl.util.js';
import { successResponse, createdResponse, errorResponse, notFoundResponse, paginatedResponse } from '../utils/response.util.js';
import { paginateQuery } from '../utils/pagination.util.js';
import { registerWorkerOnChain, updateWorkerClassification } from '../services/fabric.service.js';
import { classifyBPL } from '../services/ai.service.js';
import { logger } from '../utils/logger.util.js';
import { VERIFICATION_STATUS, ROLES } from '../config/constants.js';
import { isBlockchainEnabled, logBlockchainSkip } from '../config/blockchain.config.js';

/**
 * Create a new worker
 */
export const createWorker = async (req, res) => {
  try {
    const { aadhaarNumber, name, phone, bankAccount, ...additionalData } = req.body;
    
    // Generate idHash
    const idHash = generateIdHash(aadhaarNumber);
    
    // Check for existing worker
    const existingWorker = await Worker.findOne({ idHash });
    if (existingWorker) {
      return errorResponse(res, 'Worker with this Aadhaar already registered', 409);
    }
    
    // Create user account if not exists
    let user = await User.findOne({ idHash });
    if (!user) {
      user = await User.create({
        email: `worker_${idHash.substring(0, 8)}@tracient.local`,
        password: phone, // Temporary password
        name,
        role: ROLES.WORKER,
        idHash,
        phone
      });
    }
    
    // Create worker profile
    const worker = await Worker.create({
      userId: user._id,
      idHash,
      name,
      phone,
      bankAccount,
      aadhaarLast4: aadhaarNumber.slice(-4),
      ...additionalData
    });
    
    // Register on blockchain (only if enabled)
    if (isBlockchainEnabled()) {
      registerWorkerOnChain({ idHash, name, registeredAt: worker.registeredAt });
    } else {
      logBlockchainSkip('RegisterWorker in createWorker', logger);
    }
    
    // Log
    AuditLog.log({
      action: 'worker_created',
      category: 'worker',
      userId: req.user?.id,
      resourceType: 'Worker',
      resourceId: worker._id,
      description: `Worker ${name} created`
    });
    
    logger.info('Worker created', { workerId: worker._id, idHash: idHash.substring(0, 8) });
    
    return createdResponse(res, {
      worker: {
        id: worker._id,
        idHash: worker.idHash,
        name: worker.name,
        phone: worker.phone,
        maskedAadhaar: worker.maskedAadhaar,
        verificationStatus: worker.verificationStatus
      }
    }, 'Worker registered successfully');
    
  } catch (error) {
    logger.error('Create worker error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get all workers (with pagination)
 */
export const getWorkers = async (req, res) => {
  try {
    const { status, category, search } = req.query;
    
    const query = {};
    
    if (status) {
      query.verificationStatus = status;
    }
    
    if (category) {
      query.incomeCategory = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const { data, pagination } = await paginateQuery(Worker, query, {
      ...req.query,
      select: '-blockchainTxIds',
      defaultSort: '-createdAt'
    });
    
    return paginatedResponse(res, data, pagination, 'Workers retrieved successfully');
    
  } catch (error) {
    logger.error('Get workers error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get worker by ID
 */
export const getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id)
      .populate('currentEmployerId', 'companyName')
      .populate('verifiedBy', 'name designation');
    
    if (!worker) {
      return notFoundResponse(res, 'Worker not found');
    }
    
    return successResponse(res, worker);
    
  } catch (error) {
    logger.error('Get worker by ID error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get worker by idHash
 */
export const getWorkerByIdHash = async (req, res) => {
  try {
    const worker = await Worker.findByIdHash(req.params.idHash);
    
    if (!worker) {
      return notFoundResponse(res, 'Worker not found');
    }
    
    // Don't expose sensitive data for non-owner requests
    const isOwner = req.user?.idHash === worker.idHash;
    const isPrivileged = [ROLES.ADMIN, ROLES.GOVERNMENT, ROLES.EMPLOYER].includes(req.user?.role);
    
    if (!isOwner && !isPrivileged) {
      return successResponse(res, {
        idHash: worker.idHash,
        name: worker.name,
        verificationStatus: worker.verificationStatus,
        incomeCategory: worker.incomeCategory
      });
    }
    
    return successResponse(res, worker);
    
  } catch (error) {
    logger.error('Get worker by idHash error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update worker
 */
export const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove protected fields
    delete updates.idHash;
    delete updates.userId;
    delete updates.verificationStatus;
    delete updates.verifiedBy;
    
    const worker = await Worker.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!worker) {
      return notFoundResponse(res, 'Worker not found');
    }
    
    AuditLog.log({
      action: 'worker_updated',
      category: 'worker',
      userId: req.user.id,
      resourceType: 'Worker',
      resourceId: worker._id,
      changes: Object.keys(updates).map(key => ({
        field: key,
        newValue: updates[key]
      }))
    });
    
    return successResponse(res, worker, 'Worker updated successfully');
    
  } catch (error) {
    logger.error('Update worker error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Verify worker (Government official action)
 */
export const verifyWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const worker = await Worker.findById(id);
    
    if (!worker) {
      return notFoundResponse(res, 'Worker not found');
    }
    
    worker.verificationStatus = status;
    worker.verifiedBy = req.user.id;
    worker.verifiedAt = new Date();
    worker.verificationNotes = notes;
    
    await worker.save();
    
    // Update user verification status
    await User.findOneAndUpdate(
      { idHash: worker.idHash },
      { isVerified: status === VERIFICATION_STATUS.VERIFIED }
    );
    
    AuditLog.logVerification('worker_verified', req.user.id, 'Worker', id, {
      newValue: { status, notes }
    });
    
    logger.info('Worker verified', { workerId: id, status });
    
    return successResponse(res, worker, `Worker ${status}`);
    
  } catch (error) {
    logger.error('Verify worker error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get worker income summary
 */
export const getWorkerIncomeSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const { months = 12 } = req.query;
    
    const worker = await Worker.findById(id);
    
    if (!worker) {
      return notFoundResponse(res, 'Worker not found');
    }
    
    // Get wage records
    const wageRecords = await WageRecord.find({
      workerId: id,
      status: 'completed'
    }).sort({ createdAt: -1 });
    
    // Calculate BPL status
    const bplStatus = await classifyBPL(wageRecords);
    
    // Calculate trend
    const trend = calculateIncomeTrend(wageRecords, parseInt(months));
    
    // Update worker if classification changed
    if (bplStatus.category !== worker.incomeCategory) {
      worker.incomeCategory = bplStatus.category;
      worker.annualIncome = bplStatus.annualIncome;
      worker.lastClassificationDate = new Date();
      await worker.save();
      
      // Update on blockchain
      updateWorkerClassification(worker.idHash, bplStatus.category, bplStatus.annualIncome);
    }
    
    return successResponse(res, {
      worker: {
        id: worker._id,
        name: worker.name,
        incomeCategory: worker.incomeCategory
      },
      income: bplStatus,
      trend,
      transactionCount: wageRecords.length
    });
    
  } catch (error) {
    logger.error('Get income summary error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get worker transactions
 */
export const getWorkerTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    
    const worker = await Worker.findById(id);
    
    if (!worker) {
      return notFoundResponse(res, 'Worker not found');
    }
    
    const { data, pagination } = await paginateQuery(
      WageRecord,
      { workerId: id },
      {
        ...req.query,
        populate: 'employerId',
        defaultSort: '-createdAt'
      }
    );
    
    return paginatedResponse(res, data, pagination);
    
  } catch (error) {
    logger.error('Get worker transactions error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get BPL workers
 */
export const getBPLWorkers = async (req, res) => {
  try {
    const { data, pagination } = await paginateQuery(
      Worker,
      { 
        incomeCategory: 'BPL',
        verificationStatus: VERIFICATION_STATUS.VERIFIED,
        isActive: true 
      },
      {
        ...req.query,
        select: 'idHash name phone incomeCategory annualIncome address',
        defaultSort: 'annualIncome'
      }
    );
    
    return paginatedResponse(res, data, pagination, 'BPL workers retrieved');
    
  } catch (error) {
    logger.error('Get BPL workers error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Delete worker (Admin only)
 */
export const deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;
    
    const worker = await Worker.findById(id);
    
    if (!worker) {
      return notFoundResponse(res, 'Worker not found');
    }
    
    // Soft delete - just mark as inactive
    worker.isActive = false;
    await worker.save();
    
    // Also deactivate user
    await User.findByIdAndUpdate(worker.userId, { isActive: false });
    
    AuditLog.log({
      action: 'worker_deleted',
      category: 'worker',
      userId: req.user.id,
      resourceType: 'Worker',
      resourceId: id
    });
    
    return successResponse(res, null, 'Worker deactivated successfully');
    
  } catch (error) {
    logger.error('Delete worker error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get current worker's profile
 */
export const getMyProfile = async (req, res) => {
  try {
    const worker = await Worker.findOne({ userId: req.user.id })
      .populate('userId', 'email role isActive lastLogin');
    
    if (!worker) {
      return notFoundResponse(res, 'Worker profile not found');
    }
    
    return successResponse(res, { worker });
  } catch (error) {
    logger.error('Get my profile error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update current worker's profile
 */
export const updateMyProfile = async (req, res) => {
  try {
    const { name, phone, bankAccount, ifscCode, bankName, upiId, address } = req.body;
    
    const worker = await Worker.findOne({ userId: req.user.id });
    
    if (!worker) {
      return notFoundResponse(res, 'Worker profile not found');
    }
    
    // Update allowed fields
    if (name) worker.name = name;
    if (phone) worker.phone = phone;
    if (bankAccount) worker.bankAccount = bankAccount;
    if (ifscCode) worker.ifscCode = ifscCode;
    if (bankName) worker.bankName = bankName;
    if (upiId) worker.upiId = upiId;
    if (address) worker.address = address;
    
    await worker.save();
    
    // Also update user name if provided
    if (name) {
      await User.findByIdAndUpdate(worker.userId, { name });
    }
    
    logger.info('Worker profile updated', { workerId: worker._id });
    
    return successResponse(res, { worker }, 'Profile updated successfully');
  } catch (error) {
    logger.error('Update my profile error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get current worker's income summary
 */
export const getMyIncomeSummary = async (req, res) => {
  try {
    const worker = await Worker.findOne({ userId: req.user.id });
    
    if (!worker) {
      return notFoundResponse(res, 'Worker profile not found');
    }
    
    // Get wage records
    const wageRecords = await WageRecord.find({
      workerId: worker._id,
      status: 'completed'
    }).sort({ createdAt: -1 });
    
    // Calculate statistics
    const totalIncome = wageRecords.reduce((sum, w) => sum + w.amount, 0);
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const last30Days = wageRecords
      .filter(w => new Date(w.createdAt) >= thirtyDaysAgo)
      .reduce((sum, w) => sum + w.amount, 0);
    
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const annualIncome = wageRecords
      .filter(w => new Date(w.createdAt) >= yearStart)
      .reduce((sum, w) => sum + w.amount, 0);
    
    const transactionCount = wageRecords.length;
    const averageDailyWage = transactionCount > 0 
      ? Math.round(totalIncome / transactionCount) 
      : 0;
    
    // BPL threshold from env
    const bplThreshold = parseInt(process.env.BPL_THRESHOLD) || 120000;
    const classification = annualIncome < bplThreshold ? 'BPL' : 'APL';
    
    return successResponse(res, {
      totalIncome,
      last30Days,
      annualIncome,
      transactionCount,
      averageDailyWage,
      classification,
      bplThreshold,
      lastUpdated: new Date()
    });
  } catch (error) {
    logger.error('Get my income summary error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get current worker's transactions
 */
export const getMyTransactions = async (req, res) => {
  try {
    const worker = await Worker.findOne({ userId: req.user.id });
    
    if (!worker) {
      return notFoundResponse(res, 'Worker profile not found');
    }
    
    const { page = 1, limit = 10, startDate, endDate, status } = req.query;
    
    const query = { workerId: worker._id };
    
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const result = await paginateQuery(WageRecord, query, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: { path: 'employerId', select: 'companyName contactPerson' }
    });
    
    return paginatedResponse(res, result);
  } catch (error) {
    logger.error('Get my transactions error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get current worker's bank accounts
 */
export const getMyBankAccounts = async (req, res) => {
  try {
    const worker = await Worker.findOne({ userId: req.user.id });
    
    if (!worker) {
      return notFoundResponse(res, 'Worker profile not found');
    }
    
    return successResponse(res, {
      bankAccounts: worker.bankAccounts || [],
      defaultAccount: worker.bankAccounts?.find(acc => acc.isDefault) || null
    });
  } catch (error) {
    logger.error('Get bank accounts error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Add a bank account to current worker
 */
export const addBankAccount = async (req, res) => {
  try {
    const { accountNumber, accountHolderName, bankName, ifscCode, accountType, isDefault } = req.body;
    
    const worker = await Worker.findOne({ userId: req.user.id });
    
    if (!worker) {
      return notFoundResponse(res, 'Worker profile not found');
    }
    
    // Initialize bankAccounts array if not exists
    if (!worker.bankAccounts) {
      worker.bankAccounts = [];
    }
    
    // Check for duplicate account number
    const accountExists = worker.bankAccounts.some(acc => acc.accountNumber === accountNumber);
    if (accountExists) {
      return errorResponse(res, 'This bank account is already added', 409);
    }
    
    // If this is the first account or marked as default, set it as default
    const shouldBeDefault = isDefault || worker.bankAccounts.length === 0;
    
    // Remove default from other accounts if this should be default
    if (shouldBeDefault) {
      worker.bankAccounts.forEach(acc => acc.isDefault = false);
    }
    
    // Add new account
    const newAccount = {
      accountNumber,
      accountHolderName,
      bankName,
      ifscCode,
      accountType: accountType || 'savings',
      isDefault: shouldBeDefault,
      isVerified: false,
      createdAt: new Date()
    };
    
    worker.bankAccounts.push(newAccount);
    await worker.save();
    
    logger.info('Bank account added', { workerId: worker._id, account: accountNumber.slice(-4) });
    
    return createdResponse(res, {
      account: worker.bankAccounts[worker.bankAccounts.length - 1]
    }, 'Bank account added successfully');
  } catch (error) {
    logger.error('Add bank account error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update a bank account
 */
export const updateBankAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { accountHolderName, bankName, ifscCode, accountType } = req.body;
    
    const worker = await Worker.findOne({ userId: req.user.id });
    
    if (!worker) {
      return notFoundResponse(res, 'Worker profile not found');
    }
    
    const account = worker.bankAccounts?.id(accountId);
    if (!account) {
      return notFoundResponse(res, 'Bank account not found');
    }
    
    if (accountHolderName) account.accountHolderName = accountHolderName;
    if (bankName) account.bankName = bankName;
    if (ifscCode) account.ifscCode = ifscCode;
    if (accountType) account.accountType = accountType;
    
    await worker.save();
    
    logger.info('Bank account updated', { workerId: worker._id, accountId });
    
    return successResponse(res, { account }, 'Bank account updated successfully');
  } catch (error) {
    logger.error('Update bank account error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Delete a bank account
 */
export const deleteBankAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    
    const worker = await Worker.findOne({ userId: req.user.id });
    
    if (!worker) {
      return notFoundResponse(res, 'Worker profile not found');
    }
    
    const account = worker.bankAccounts?.id(accountId);
    if (!account) {
      return notFoundResponse(res, 'Bank account not found');
    }
    
    const wasDefault = account.isDefault;
    account.deleteOne();
    
    // If deleted account was default, set new default
    if (wasDefault && worker.bankAccounts.length > 0) {
      worker.bankAccounts[0].isDefault = true;
    }
    
    await worker.save();
    
    logger.info('Bank account deleted', { workerId: worker._id, accountId });
    
    return successResponse(res, null, 'Bank account deleted successfully');
  } catch (error) {
    logger.error('Delete bank account error:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Set a bank account as default
 */
export const setDefaultBankAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    
    const worker = await Worker.findOne({ userId: req.user.id });
    
    if (!worker) {
      return notFoundResponse(res, 'Worker profile not found');
    }
    
    const account = worker.bankAccounts?.id(accountId);
    if (!account) {
      return notFoundResponse(res, 'Bank account not found');
    }
    
    // Remove default from all accounts
    worker.bankAccounts.forEach(acc => acc.isDefault = false);
    
    // Set new default
    account.isDefault = true;
    
    await worker.save();
    
    logger.info('Default bank account changed', { workerId: worker._id, accountId });
    
    return successResponse(res, { account }, 'Default bank account updated');
  } catch (error) {
    logger.error('Set default bank account error:', error);
    return errorResponse(res, error.message, 500);
  }
};

export default {
  createWorker,
  getWorkers,
  getWorkerById,
  getWorkerByIdHash,
  updateWorker,
  verifyWorker,
  getWorkerIncomeSummary,
  getWorkerTransactions,
  getBPLWorkers,
  deleteWorker,
  getMyProfile,
  updateMyProfile,
  getMyIncomeSummary,
  getMyTransactions,
  getMyBankAccounts,
  addBankAccount,
  updateBankAccount,
  deleteBankAccount,
  setDefaultBankAccount
};
