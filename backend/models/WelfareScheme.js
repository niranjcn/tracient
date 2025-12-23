import mongoose from 'mongoose';

const welfareSchemeSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Category
  category: {
    type: String,
    enum: ['food', 'housing', 'education', 'health', 'employment', 'pension', 'skill', 'other'],
    required: true
  },
  
  // Eligibility
  eligibilityCriteria: {
    incomeCategory: {
      type: String,
      enum: ['BPL', 'APL', 'both'],
      default: 'BPL'
    },
    maxAnnualIncome: Number,
    minAge: Number,
    maxAge: Number,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'all'],
      default: 'all'
    },
    occupations: [String],
    states: [String],
    districts: [String],
    customCriteria: mongoose.Schema.Types.Mixed
  },
  
  // Benefits
  benefits: {
    type: {
      type: String,
      enum: ['cash', 'kind', 'service', 'subsidy', 'mixed']
    },
    amount: Number,
    frequency: {
      type: String,
      enum: ['one_time', 'monthly', 'quarterly', 'annual']
    },
    description: String
  },
  
  // Budget
  totalBudget: Number,
  allocatedBudget: Number,
  disbursedAmount: {
    type: Number,
    default: 0
  },
  
  // Enrollment
  maxBeneficiaries: Number,
  currentBeneficiaries: {
    type: Number,
    default: 0
  },
  
  // Dates
  startDate: Date,
  endDate: Date,
  enrollmentStartDate: Date,
  enrollmentEndDate: Date,
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'suspended', 'closed'],
    default: 'draft'
  },
  
  // Documents Required
  requiredDocuments: [{
    name: String,
    description: String,
    mandatory: Boolean
  }],
  
  // Authority
  ministry: String,
  department: String,
  implementingAgency: String,
  
  // Contact
  helplineNumber: String,
  email: String,
  website: String,
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
welfareSchemeSchema.index({ category: 1, status: 1 });
welfareSchemeSchema.index({ 'eligibilityCriteria.incomeCategory': 1 });

// Virtual for checking if enrollment is open
welfareSchemeSchema.virtual('isEnrollmentOpen').get(function() {
  const now = new Date();
  return this.status === 'active' &&
         (!this.enrollmentStartDate || now >= this.enrollmentStartDate) &&
         (!this.enrollmentEndDate || now <= this.enrollmentEndDate) &&
         (!this.maxBeneficiaries || this.currentBeneficiaries < this.maxBeneficiaries);
});

// Methods
welfareSchemeSchema.methods.checkEligibility = function(worker) {
  const criteria = this.eligibilityCriteria;
  
  // Income category check
  if (criteria.incomeCategory !== 'both' && worker.incomeCategory !== criteria.incomeCategory) {
    return { eligible: false, reason: 'Income category mismatch' };
  }
  
  // Max income check
  if (criteria.maxAnnualIncome && worker.annualIncome > criteria.maxAnnualIncome) {
    return { eligible: false, reason: 'Annual income exceeds limit' };
  }
  
  // Age check (if DOB available)
  if (worker.dateOfBirth) {
    const age = Math.floor((Date.now() - worker.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000));
    if (criteria.minAge && age < criteria.minAge) {
      return { eligible: false, reason: 'Below minimum age' };
    }
    if (criteria.maxAge && age > criteria.maxAge) {
      return { eligible: false, reason: 'Above maximum age' };
    }
  }
  
  // Gender check
  if (criteria.gender !== 'all' && worker.gender && worker.gender !== criteria.gender) {
    return { eligible: false, reason: 'Gender criteria not met' };
  }
  
  // State check
  if (criteria.states?.length > 0 && worker.address?.state) {
    if (!criteria.states.includes(worker.address.state)) {
      return { eligible: false, reason: 'State not covered' };
    }
  }
  
  return { eligible: true };
};

welfareSchemeSchema.methods.incrementBeneficiaries = function() {
  this.currentBeneficiaries += 1;
  return this.save();
};

// Statics
welfareSchemeSchema.statics.getActiveSchemes = function() {
  return this.find({ status: 'active' });
};

welfareSchemeSchema.statics.getEligibleSchemes = function(worker) {
  return this.find({ status: 'active' }).then(schemes => {
    return schemes.filter(scheme => scheme.checkEligibility(worker).eligible);
  });
};

export const WelfareScheme = mongoose.model('WelfareScheme', welfareSchemeSchema);
