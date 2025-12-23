import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  // Reference to User
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Admin Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Contact
  email: {
    type: String,
    required: true
  },
  phone: String,
  
  // Role & Permissions
  adminLevel: {
    type: String,
    enum: ['super', 'senior', 'standard'],
    default: 'standard'
  },
  permissions: {
    manageUsers: {
      type: Boolean,
      default: true
    },
    manageWorkers: {
      type: Boolean,
      default: true
    },
    manageEmployers: {
      type: Boolean,
      default: true
    },
    manageGovOfficials: {
      type: Boolean,
      default: false
    },
    manageAdmins: {
      type: Boolean,
      default: false
    },
    manageSchemes: {
      type: Boolean,
      default: true
    },
    managePolicies: {
      type: Boolean,
      default: false
    },
    viewAnalytics: {
      type: Boolean,
      default: true
    },
    viewAuditLogs: {
      type: Boolean,
      default: true
    },
    manageBlockchain: {
      type: Boolean,
      default: false
    },
    systemSettings: {
      type: Boolean,
      default: false
    }
  },
  
  // Statistics
  actionsPerformed: {
    type: Number,
    default: 0
  },
  lastActionAt: Date,
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // MFA
  mfaEnabled: {
    type: Boolean,
    default: false
  },
  mfaSecret: {
    type: String,
    select: false
  },
  
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
adminSchema.index({ adminLevel: 1 });

// Methods
adminSchema.methods.hasPermission = function(permission) {
  if (this.adminLevel === 'super') return true;
  return this.permissions[permission] === true;
};

adminSchema.methods.logAction = function() {
  this.actionsPerformed += 1;
  this.lastActionAt = new Date();
  return this.save();
};

// Statics
adminSchema.statics.getSuperAdmins = function() {
  return this.find({ adminLevel: 'super', isActive: true });
};

export const Admin = mongoose.model('Admin', adminSchema);
