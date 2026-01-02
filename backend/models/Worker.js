import mongoose from 'mongoose';
import { VERIFICATION_STATUS, INCOME_CATEGORIES } from '../config/constants.js';

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  pincode: String,
  district: String
}, { _id: false });

// Bank account sub-schema for multiple accounts
const bankAccountSchema = new mongoose.Schema({
  // Link to worker's Aadhaar hash (auto-assigned)
  workerIdHash: {
    type: String,
    required: true,
    index: true
  },
  
  // User-provided account details
  accountNumber: {
    type: String,
    required: true
  },
  accountHolderName: {
    type: String,
    required: true
  },
  bankName: {
    type: String,
    required: true
  },
  ifscCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    default: 'IN',
    enum: ['IN', 'US', 'GB', 'AU', 'CA', 'NZ']
  },
  accountType: {
    type: String,
    enum: ['savings', 'current', 'other'],
    default: 'savings'
  },
  
  // Balance and income tracking
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  balanceLastUpdated: Date,
  monthlyIncome: {
    type: Number,
    default: 0
  },
  
  // Blockchain metadata (for future integration)
  blockchainMetadata: {
    totalTransactionCount: {
      type: Number,
      default: 0
    },
    lastBlockHash: String,
    lastSyncedAt: Date
  },
  
  // AI Model Features (minimal - for future anomaly detection)
  aiFeatures: {
    unverified_rate: { type: Number, default: 0 },
    weekend_pct: { type: Number, default: 0 },
    night_hours_pct: { type: Number, default: 0 },
    num_unique_sources: { type: Number, default: 0 },
    income_cv: { type: Number, default: 0 },
    lastCalculated: Date
  },
  
  // Anomaly detection results (for future use)
  anomalyDetection: {
    isAnomaly: { type: Boolean, default: false },
    anomalyProbability: { type: Number, default: 0 },
    lastChecked: Date
  },
  
  // Metadata
  isDefault: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const workerSchema = new mongoose.Schema({
  // Reference to User model
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Identity
  idHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  aadhaarLast4: {
    type: String,
    maxlength: 4
  },
  
  // Personal Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  
  // Contact
  phone: {
    type: String,
    required: true
  },
  alternatePhone: String,
  address: addressSchema,
  
  // Financial - Multiple Bank Accounts
  bankAccounts: [bankAccountSchema],
  
  // Legacy single account (for backward compatibility)
  bankAccount: {
    type: String,
    sparse: true
  },
  ifscCode: String,
  bankName: String,
  upiId: String,
  
  // Income & Classification
  balance: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  incomeCategory: {
    type: String,
    enum: Object.values(INCOME_CATEGORIES),
    default: INCOME_CATEGORIES.BPL
  },
  annualIncome: {
    type: Number,
    default: 0
  },
  lastClassificationDate: Date,
  
  // Employment
  employmentType: {
    type: String,
    enum: ['formal', 'informal'],
    default: 'informal'
  },
  isFarmer: {
    type: Boolean,
    default: false
  },
  kccLimit: {
    type: Number,
    min: 0,
    default: 0
  },
  currentEmployerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer'
  },
  employmentHistory: [{
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer'
    },
    startDate: Date,
    endDate: Date,
    designation: String
  }],
  skills: [String],
  occupation: String,
  
  // Verification
  verificationStatus: {
    type: String,
    enum: Object.values(VERIFICATION_STATUS),
    default: VERIFICATION_STATUS.PENDING
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GovOfficial'
  },
  verifiedAt: Date,
  verificationNotes: String,
  
  // Welfare
  eligibleSchemes: [String],
  enrolledSchemes: [{
    schemeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WelfareScheme'
    },
    enrolledAt: Date,
    status: String
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  registered: {
    type: Boolean,
    default: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: Date,
  
  // Blockchain
  blockchainTxIds: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
workerSchema.index({ incomeCategory: 1 });
workerSchema.index({ verificationStatus: 1 });
workerSchema.index({ currentEmployerId: 1 });
workerSchema.index({ 'address.state': 1, 'address.district': 1 });

// Virtual for masked Aadhaar
workerSchema.virtual('maskedAadhaar').get(function() {
  return this.aadhaarLast4 ? `XXXX-XXXX-${this.aadhaarLast4}` : null;
});

// Virtual for wage records
workerSchema.virtual('wageRecords', {
  ref: 'WageRecord',
  localField: '_id',
  foreignField: 'workerId'
});

// Methods
workerSchema.methods.updateIncome = async function(amount) {
  this.totalEarnings += amount;
  this.balance += amount;
  this.lastActiveAt = new Date();
  return this.save();
};

workerSchema.methods.classifyBPL = function(annualIncome, threshold) {
  this.annualIncome = annualIncome;
  this.incomeCategory = annualIncome < threshold ? INCOME_CATEGORIES.BPL : INCOME_CATEGORIES.APL;
  this.lastClassificationDate = new Date();
  return this.save();
};

// Statics
workerSchema.statics.findByIdHash = function(idHash) {
  return this.findOne({ idHash });
};

workerSchema.statics.getBPLWorkers = function() {
  return this.find({ incomeCategory: INCOME_CATEGORIES.BPL, isActive: true });
};

export const Worker = mongoose.model('Worker', workerSchema);
