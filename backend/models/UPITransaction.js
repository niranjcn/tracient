import mongoose from 'mongoose';
import { PAYMENT_STATUS } from '../config/constants.js';

const upiTransactionSchema = new mongoose.Schema({
  // Transaction ID
  txId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // References
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker'
  },
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer'
  },
  wageRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WageRecord'
  },
  qrTokenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QRToken'
  },
  
  // Worker Details
  workerHash: {
    type: String,
    required: true,
    index: true
  },
  workerName: {
    type: String,
    required: true
  },
  workerAccount: {
    type: String,
    required: true
  },
  workerUPI: String,
  
  // Amount
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Sender Details
  senderName: {
    type: String,
    required: true
  },
  senderPhone: String,
  senderUPI: String,
  senderAccount: String,
  
  // Transaction Details
  transactionRef: {
    type: String,
    default: function() {
      return 'UPI' + Date.now().toString(36).toUpperCase();
    }
  },
  upiRef: String,  // UPI reference from payment gateway
  
  // Status
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  statusHistory: [{
    status: String,
    timestamp: Date,
    note: String
  }],
  
  // Mode
  mode: {
    type: String,
    enum: ['UPI', 'QR_SCAN', 'UPI_COLLECT', 'UPI_INTENT'],
    default: 'UPI'
  },
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now
  },
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  
  // Failure details
  failureReason: String,
  failureCode: String,
  
  // Blockchain
  blockchainTxId: String,
  verifiedOnChain: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  deviceInfo: {
    ip: String,
    userAgent: String,
    deviceId: String
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  remarks: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
upiTransactionSchema.index({ workerHash: 1, timestamp: -1 });
upiTransactionSchema.index({ status: 1, timestamp: -1 });
upiTransactionSchema.index({ employerId: 1, timestamp: -1 });

// Methods
upiTransactionSchema.methods.markCompleted = function(upiRef, blockchainTxId) {
  this.status = PAYMENT_STATUS.COMPLETED;
  this.completedAt = new Date();
  this.upiRef = upiRef;
  this.statusHistory.push({
    status: PAYMENT_STATUS.COMPLETED,
    timestamp: new Date(),
    note: 'Transaction completed successfully'
  });
  
  if (blockchainTxId) {
    this.blockchainTxId = blockchainTxId;
    this.verifiedOnChain = true;
  }
  
  return this.save();
};

upiTransactionSchema.methods.markFailed = function(reason, code) {
  this.status = PAYMENT_STATUS.FAILED;
  this.failureReason = reason;
  this.failureCode = code;
  this.statusHistory.push({
    status: PAYMENT_STATUS.FAILED,
    timestamp: new Date(),
    note: reason
  });
  
  return this.save();
};

// Statics
upiTransactionSchema.statics.getByWorkerHash = function(workerHash, limit = 50) {
  return this.find({ workerHash })
    .sort({ timestamp: -1 })
    .limit(limit);
};

upiTransactionSchema.statics.getDailyStats = async function(date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
};

export const UPITransaction = mongoose.model('UPITransaction', upiTransactionSchema);
