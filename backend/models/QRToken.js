import mongoose from 'mongoose';

const qrTokenSchema = new mongoose.Schema({
  // Token
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Worker Reference
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true
  },
  workerIdHash: {
    type: String,
    required: true,
    index: true
  },
  workerName: String,
  workerAccount: String,
  
  // Purpose
  purpose: {
    type: String,
    enum: ['payment', 'verification', 'registration'],
    default: 'payment'
  },
  
  // Amount (optional - for fixed amount QRs)
  fixedAmount: {
    type: Number,
    min: 0
  },
  minAmount: Number,
  maxAmount: Number,
  
  // Validity
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  isExpired: {
    type: Boolean,
    default: false
  },
  
  // Usage
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: Date,
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer'
  },
  maxUses: {
    type: Number,
    default: 1
  },
  useCount: {
    type: Number,
    default: 0
  },
  
  // Related Transactions
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UPITransaction'
  }],
  
  // QR Code Data
  qrData: String,
  qrImageUrl: String,
  
  // Security
  securityCode: String,  // Additional PIN if needed
  
  // Metadata
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'generatedByModel'
  },
  generatedByModel: {
    type: String,
    enum: ['Worker', 'Employer', 'Admin']
  },
  deviceInfo: {
    ip: String,
    userAgent: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
qrTokenSchema.index({ workerId: 1, createdAt: -1 });

// Virtual for checking validity
qrTokenSchema.virtual('isValid').get(function() {
  return !this.isExpired && 
         !this.isUsed && 
         new Date() < this.expiresAt &&
         this.useCount < this.maxUses;
});

// Methods
qrTokenSchema.methods.markUsed = function(employerId, transactionId) {
  this.useCount += 1;
  this.usedAt = new Date();
  this.usedBy = employerId;
  
  if (transactionId) {
    this.transactions.push(transactionId);
  }
  
  if (this.useCount >= this.maxUses) {
    this.isUsed = true;
  }
  
  return this.save();
};

qrTokenSchema.methods.checkExpiry = function() {
  if (new Date() > this.expiresAt && !this.isExpired) {
    this.isExpired = true;
    return this.save();
  }
  return this;
};

// Pre-save hook to check expiry
qrTokenSchema.pre('save', function(next) {
  if (new Date() > this.expiresAt) {
    this.isExpired = true;
  }
  next();
});

// Statics
qrTokenSchema.statics.findValidToken = function(token) {
  return this.findOne({
    token,
    isExpired: false,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  }).populate('workerId', 'name idHash bankAccount upiId');
};

qrTokenSchema.statics.getWorkerActiveTokens = function(workerId) {
  return this.find({
    workerId,
    isExpired: false,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

qrTokenSchema.statics.cleanupExpired = async function() {
  return this.updateMany(
    {
      isExpired: false,
      expiresAt: { $lt: new Date() }
    },
    {
      $set: { isExpired: true }
    }
  );
};

export const QRToken = mongoose.model('QRToken', qrTokenSchema);
