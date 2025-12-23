import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  // Action Details
  action: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['auth', 'user', 'worker', 'employer', 'transaction', 'verification', 'scheme', 'policy', 'system', 'blockchain'],
    required: true
  },
  
  // Actor
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userRole: String,
  userEmail: String,
  
  // Target Resource
  resourceType: String,
  resourceId: mongoose.Schema.Types.ObjectId,
  resourceName: String,
  
  // Change Details
  previousValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  changes: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }],
  
  // Request Info
  ipAddress: String,
  userAgent: String,
  requestMethod: String,
  requestPath: String,
  requestBody: mongoose.Schema.Types.Mixed,
  
  // Response
  statusCode: Number,
  responseTime: Number,  // in ms
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: String,
  
  // Metadata
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  
  // Blockchain
  blockchainTxId: String
}, {
  timestamps: true
});

// Indexes
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ category: 1, action: 1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

// TTL index - keep logs for 2 years
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

// Statics
auditLogSchema.statics.log = async function(data) {
  try {
    const log = new this(data);
    return await log.save();
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the app
    return null;
  }
};

auditLogSchema.statics.logAuth = function(action, userId, userEmail, success, req, error = null) {
  return this.log({
    action,
    category: 'auth',
    userId,
    userEmail,
    success,
    errorMessage: error,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    requestMethod: req.method,
    requestPath: req.originalUrl
  });
};

auditLogSchema.statics.logTransaction = function(action, userId, transactionId, details, req) {
  return this.log({
    action,
    category: 'transaction',
    userId,
    resourceType: 'WageRecord',
    resourceId: transactionId,
    ...details,
    ipAddress: req?.ip,
    userAgent: req?.get('user-agent'),
    requestMethod: req?.method,
    requestPath: req?.originalUrl
  });
};

auditLogSchema.statics.logVerification = function(action, officialId, targetType, targetId, details) {
  return this.log({
    action,
    category: 'verification',
    userId: officialId,
    resourceType: targetType,
    resourceId: targetId,
    ...details
  });
};

auditLogSchema.statics.getUserLogs = function(userId, options = {}) {
  const query = { userId };
  if (options.category) query.category = options.category;
  if (options.startDate || options.endDate) {
    query.createdAt = {};
    if (options.startDate) query.createdAt.$gte = options.startDate;
    if (options.endDate) query.createdAt.$lte = options.endDate;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 100);
};

auditLogSchema.statics.getResourceLogs = function(resourceType, resourceId, limit = 50) {
  return this.find({ resourceType, resourceId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

auditLogSchema.statics.getSecurityEvents = function(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.find({
    category: 'auth',
    createdAt: { $gte: since },
    $or: [
      { success: false },
      { action: { $in: ['password_reset', 'role_change', 'account_locked'] } }
    ]
  }).sort({ createdAt: -1 });
};

auditLogSchema.statics.getActivitySummary = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          category: '$category',
          action: '$action',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
        },
        count: { $sum: 1 },
        successCount: {
          $sum: { $cond: ['$success', 1, 0] }
        }
      }
    },
    {
      $group: {
        _id: { category: '$_id.category', date: '$_id.date' },
        actions: {
          $push: {
            action: '$_id.action',
            count: '$count',
            successCount: '$successCount'
          }
        },
        totalActions: { $sum: '$count' }
      }
    },
    { $sort: { '_id.date': -1 } }
  ]);
};

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
