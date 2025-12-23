import mongoose from 'mongoose';

const policyConfigSchema = new mongoose.Schema({
  // Key
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Value
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  valueType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'array', 'object'],
    required: true
  },
  
  // Metadata
  name: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['bpl', 'welfare', 'payment', 'security', 'notification', 'system', 'other'],
    default: 'other'
  },
  
  // Validation
  validation: {
    min: Number,
    max: Number,
    pattern: String,
    enum: [mongoose.Schema.Types.Mixed]
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isEditable: {
    type: Boolean,
    default: true
  },
  requiresRestart: {
    type: Boolean,
    default: false
  },
  
  // Audit
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  modificationHistory: [{
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    modifiedBy: mongoose.Schema.Types.ObjectId,
    modifiedAt: Date,
    reason: String
  }]
}, {
  timestamps: true
});

// Indexes
policyConfigSchema.index({ category: 1 });

// Methods
policyConfigSchema.methods.updateValue = function(newValue, adminId, reason) {
  this.modificationHistory.push({
    oldValue: this.value,
    newValue,
    modifiedBy: adminId,
    modifiedAt: new Date(),
    reason
  });
  
  this.value = newValue;
  this.lastModifiedBy = adminId;
  
  return this.save();
};

// Statics
policyConfigSchema.statics.getByKey = async function(key) {
  const config = await this.findOne({ key, isActive: true });
  return config ? config.value : null;
};

policyConfigSchema.statics.setByKey = async function(key, value, adminId, options = {}) {
  let config = await this.findOne({ key });
  
  if (!config) {
    config = new this({
      key,
      value,
      valueType: typeof value,
      name: options.name || key,
      description: options.description,
      category: options.category || 'other',
      lastModifiedBy: adminId
    });
  } else {
    config.modificationHistory.push({
      oldValue: config.value,
      newValue: value,
      modifiedBy: adminId,
      modifiedAt: new Date(),
      reason: options.reason
    });
    config.value = value;
    config.lastModifiedBy = adminId;
  }
  
  return config.save();
};

policyConfigSchema.statics.getByCategory = function(category) {
  return this.find({ category, isActive: true });
};

policyConfigSchema.statics.getAllConfig = async function() {
  const configs = await this.find({ isActive: true });
  const result = {};
  configs.forEach(config => {
    result[config.key] = config.value;
  });
  return result;
};

// Initialize default policies
policyConfigSchema.statics.initializeDefaults = async function() {
  const defaults = [
    {
      key: 'bpl_threshold',
      value: 120000,
      valueType: 'number',
      name: 'BPL Threshold',
      description: 'Annual income threshold for BPL classification (INR)',
      category: 'bpl',
      validation: { min: 0 }
    },
    {
      key: 'max_qr_validity_minutes',
      value: 5,
      valueType: 'number',
      name: 'QR Code Validity',
      description: 'Maximum validity period for QR codes in minutes',
      category: 'payment',
      validation: { min: 1, max: 60 }
    },
    {
      key: 'max_transaction_amount',
      value: 100000,
      valueType: 'number',
      name: 'Max Transaction Amount',
      description: 'Maximum single transaction amount (INR)',
      category: 'payment',
      validation: { min: 100 }
    },
    {
      key: 'anomaly_income_spike_percent',
      value: 300,
      valueType: 'number',
      name: 'Anomaly Income Spike Threshold',
      description: 'Percentage increase in income to flag as anomaly',
      category: 'security',
      validation: { min: 100, max: 1000 }
    },
    {
      key: 'session_timeout_hours',
      value: 24,
      valueType: 'number',
      name: 'Session Timeout',
      description: 'User session timeout in hours',
      category: 'security',
      validation: { min: 1, max: 168 }
    }
  ];
  
  for (const config of defaults) {
    const exists = await this.findOne({ key: config.key });
    if (!exists) {
      await this.create(config);
    }
  }
};

export const PolicyConfig = mongoose.model('PolicyConfig', policyConfigSchema);
