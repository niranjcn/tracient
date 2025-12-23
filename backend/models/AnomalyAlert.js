import mongoose from 'mongoose';

const anomalyAlertSchema = new mongoose.Schema({
  // Alert Type
  alertType: {
    type: String,
    enum: [
      'income_spike',
      'duplicate_transaction',
      'unusual_pattern',
      'bpl_fraud',
      'identity_mismatch',
      'high_frequency',
      'location_anomaly',
      'amount_anomaly',
      'other'
    ],
    required: true
  },
  
  // Severity
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  
  // Related Entity
  entityType: {
    type: String,
    enum: ['worker', 'employer', 'transaction'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'entityModel'
  },
  entityModel: {
    type: String,
    enum: ['Worker', 'Employer', 'WageRecord', 'UPITransaction']
  },
  
  // Worker Reference (if applicable)
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker'
  },
  workerIdHash: String,
  
  // Description
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Detection Details
  detectedAt: {
    type: Date,
    default: Date.now
  },
  detectionMethod: {
    type: String,
    enum: ['ai_model', 'rule_based', 'manual', 'blockchain'],
    default: 'rule_based'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Evidence
  evidence: {
    expectedValue: mongoose.Schema.Types.Mixed,
    actualValue: mongoose.Schema.Types.Mixed,
    threshold: mongoose.Schema.Types.Mixed,
    relatedTransactions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WageRecord'
    }],
    additionalData: mongoose.Schema.Types.Mixed
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'dismissed', 'escalated'],
    default: 'pending'
  },
  
  // Resolution
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GovOfficial'
  },
  resolution: {
    action: {
      type: String,
      enum: ['no_action', 'warning', 'account_suspended', 'benefits_revoked', 'reported_fraud', 'data_corrected']
    },
    notes: String,
    followUpRequired: Boolean,
    followUpDate: Date
  },
  
  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GovOfficial'
  },
  assignedAt: Date,
  
  // Audit Trail
  activityLog: [{
    action: String,
    performedBy: mongoose.Schema.Types.ObjectId,
    performedAt: Date,
    notes: String
  }],
  
  // Notifications
  notificationsSent: [{
    channel: String,
    sentAt: Date,
    recipient: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
anomalyAlertSchema.index({ status: 1, severity: 1 });
anomalyAlertSchema.index({ alertType: 1, detectedAt: -1 });
anomalyAlertSchema.index({ workerId: 1, detectedAt: -1 });
anomalyAlertSchema.index({ assignedTo: 1, status: 1 });

// Methods
anomalyAlertSchema.methods.assign = function(officialId) {
  this.assignedTo = officialId;
  this.assignedAt = new Date();
  this.status = 'investigating';
  this.activityLog.push({
    action: 'assigned',
    performedBy: officialId,
    performedAt: new Date(),
    notes: 'Alert assigned for investigation'
  });
  return this.save();
};

anomalyAlertSchema.methods.resolve = function(officialId, resolution) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolvedBy = officialId;
  this.resolution = resolution;
  this.activityLog.push({
    action: 'resolved',
    performedBy: officialId,
    performedAt: new Date(),
    notes: resolution.notes
  });
  return this.save();
};

anomalyAlertSchema.methods.dismiss = function(officialId, reason) {
  this.status = 'dismissed';
  this.resolvedAt = new Date();
  this.resolvedBy = officialId;
  this.resolution = {
    action: 'no_action',
    notes: reason
  };
  this.activityLog.push({
    action: 'dismissed',
    performedBy: officialId,
    performedAt: new Date(),
    notes: reason
  });
  return this.save();
};

anomalyAlertSchema.methods.escalate = function(officialId, notes) {
  this.status = 'escalated';
  this.severity = 'critical';
  this.activityLog.push({
    action: 'escalated',
    performedBy: officialId,
    performedAt: new Date(),
    notes
  });
  return this.save();
};

// Statics
anomalyAlertSchema.statics.getPendingAlerts = function(filters = {}) {
  const query = { status: { $in: ['pending', 'investigating'] } };
  if (filters.severity) query.severity = filters.severity;
  if (filters.alertType) query.alertType = filters.alertType;
  
  return this.find(query)
    .sort({ severity: -1, detectedAt: -1 })
    .populate('workerId', 'name idHash')
    .populate('assignedTo', 'name');
};

anomalyAlertSchema.statics.getAlertStats = async function() {
  return this.aggregate([
    {
      $group: {
        _id: { status: '$status', severity: '$severity' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.status',
        bySeverity: {
          $push: {
            severity: '$_id.severity',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    }
  ]);
};

export const AnomalyAlert = mongoose.model('AnomalyAlert', anomalyAlertSchema);
