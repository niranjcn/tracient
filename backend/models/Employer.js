import mongoose from 'mongoose';
import { VERIFICATION_STATUS } from '../config/constants.js';

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  pincode: String,
  district: String
}, { _id: false });

// Bank account sub-schema for multiple accounts
const bankAccountSchema = new mongoose.Schema({
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
  accountType: {
    type: String,
    enum: ['savings', 'current', 'other'],
    default: 'current'
  },
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

const employerSchema = new mongoose.Schema({
  // Reference to User
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Business Information
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  companyType: {
    type: String,
    enum: ['individual', 'partnership', 'pvt_ltd', 'public_ltd', 'llp', 'govt', 'ngo', 'other'],
    default: 'individual'
  },
  registrationNumber: String,
  gstin: String,
  panNumber: String,
  
  // Contact
  contactPerson: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  website: String,
  
  // Address
  address: addressSchema,
  
  // Financial - Multiple Bank Accounts
  bankAccounts: [bankAccountSchema],
  
  // Legacy single account (for backward compatibility)
  bankAccount: String,
  ifscCode: String,
  bankName: String,
  upiId: String,
  
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
  verificationDocuments: [{
    type: String,
    name: String,
    url: String,
    uploadedAt: Date
  }],
  
  // Worker Management
  totalWorkers: {
    type: Number,
    default: 0
  },
  activeWorkers: {
    type: Number,
    default: 0
  },
  
  // Statistics
  totalWagesPaid: {
    type: Number,
    default: 0
  },
  totalTransactions: {
    type: Number,
    default: 0
  },
  
  // Industry
  industry: String,
  sector: {
    type: String,
    enum: ['agriculture', 'manufacturing', 'construction', 'services', 'retail', 'hospitality', 'other']
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  suspendedAt: Date,
  suspensionReason: String,
  
  // Blockchain
  blockchainTxIds: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
employerSchema.index({ verificationStatus: 1 });
employerSchema.index({ 'address.state': 1, 'address.district': 1 });
employerSchema.index({ sector: 1 });

// Virtual for workers
employerSchema.virtual('workers', {
  ref: 'Worker',
  localField: '_id',
  foreignField: 'currentEmployerId'
});

// Virtual for transactions
employerSchema.virtual('transactions', {
  ref: 'WageRecord',
  localField: '_id',
  foreignField: 'employerId'
});

// Methods
employerSchema.methods.updateWageStats = async function(amount) {
  this.totalWagesPaid += amount;
  this.totalTransactions += 1;
  return this.save();
};

employerSchema.methods.updateWorkerCount = async function(active, total) {
  this.activeWorkers = active;
  this.totalWorkers = total;
  return this.save();
};

// Statics
employerSchema.statics.getVerified = function() {
  return this.find({ verificationStatus: VERIFICATION_STATUS.VERIFIED, isActive: true });
};

export const Employer = mongoose.model('Employer', employerSchema);
