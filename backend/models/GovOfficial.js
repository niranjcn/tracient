import mongoose from 'mongoose';

const govOfficialSchema = new mongoose.Schema({
  // Reference to User
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Official Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  designation: {
    type: String,
    required: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Department
  department: {
    type: String,
    required: true
  },
  ministry: String,
  
  // Jurisdiction
  jurisdiction: {
    level: {
      type: String,
      enum: ['national', 'state', 'district', 'block', 'village'],
      default: 'district'
    },
    state: String,
    district: String,
    block: String,
    villages: [String]
  },
  
  // Contact
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  officeAddress: {
    building: String,
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  
  // Permissions
  permissions: {
    canVerifyWorkers: {
      type: Boolean,
      default: true
    },
    canVerifyEmployers: {
      type: Boolean,
      default: true
    },
    canApproveSchemes: {
      type: Boolean,
      default: false
    },
    canViewAnalytics: {
      type: Boolean,
      default: true
    },
    canGenerateReports: {
      type: Boolean,
      default: true
    },
    canManageAnomalies: {
      type: Boolean,
      default: true
    }
  },
  
  // Statistics
  verificationsCompleted: {
    type: Number,
    default: 0
  },
  schemesApproved: {
    type: Number,
    default: 0
  },
  anomaliesResolved: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  lastActiveAt: Date,
  
  // Verification by admin
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  verifiedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
govOfficialSchema.index({ department: 1 });
govOfficialSchema.index({ 'jurisdiction.state': 1, 'jurisdiction.district': 1 });

// Methods
govOfficialSchema.methods.incrementVerifications = function() {
  this.verificationsCompleted += 1;
  this.lastActiveAt = new Date();
  return this.save();
};

govOfficialSchema.methods.hasJurisdictionOver = function(state, district) {
  const { level, state: jState, district: jDistrict } = this.jurisdiction;
  
  if (level === 'national') return true;
  if (level === 'state' && jState === state) return true;
  if (level === 'district' && jState === state && jDistrict === district) return true;
  
  return false;
};

// Statics
govOfficialSchema.statics.findByJurisdiction = function(state, district) {
  return this.find({
    isActive: true,
    isVerified: true,
    $or: [
      { 'jurisdiction.level': 'national' },
      { 'jurisdiction.level': 'state', 'jurisdiction.state': state },
      { 'jurisdiction.level': 'district', 'jurisdiction.state': state, 'jurisdiction.district': district }
    ]
  });
};

export const GovOfficial = mongoose.model('GovOfficial', govOfficialSchema);
