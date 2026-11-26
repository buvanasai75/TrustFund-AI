const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Campaign title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Campaign description is required'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Medical', 'Education', 'Emergency', 'Startup', 'Social Causes', 'Other'],
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount in INR is required'],
    min: [100, 'Target amount must be at least ₹100'],
  },
  collectedAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  remainingAmount: {
    type: Number,
    default: function () {
      return this.targetAmount;
    },
  },
  deadline: {
    type: Date,
    required: [true, 'Campaign deadline is required'],
  },
  beneficiaryName: {
    type: String,
    required: [true, 'Beneficiary name is required'],
    trim: true,
  },
  beneficiaryRelationship: {
    type: String,
    default: 'Self',
  },
  contactDetails: {
    type: String,
    default: '',
  },
  images: [{
    type: String,
  }],
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: [
      'DRAFT',
      'PENDING_VERIFICATION',
      'UNDER_REVIEW',
      'ADDITIONAL_INFORMATION_REQUIRED',
      'APPROVED',
      'REJECTED',
      'ACTIVE',
      'GOAL_REACHED',
      'COMPLETED',
      'EXPIRED'
    ],
    default: 'PENDING_VERIFICATION',
  },
  donationCount: {
    type: Number,
    default: 0,
  },
  isFlagged: {
    type: Boolean,
    default: false,
  },
  riskScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'LOW',
  },
  fraudReasons: [{
    type: String,
  }],
  similarCampaigns: [{
    campaignId: String,
    title: String,
    similarityScore: Number,
    similarityPercentage: String,
  }],
  aiRecommendation: {
    type: String,
    default: 'Awaiting administrative verification.',
  },
  verificationNotes: {
    type: String,
    default: '',
  },
  requestedInfoNotes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

// Pre-save calculation helper for remaining amount
campaignSchema.pre('save', function (next) {
  if (this.targetAmount !== undefined && this.collectedAmount !== undefined) {
    this.remainingAmount = Math.max(0, this.targetAmount - this.collectedAmount);
    if (this.collectedAmount >= this.targetAmount && this.status === 'ACTIVE') {
      this.status = 'GOAL_REACHED';
    }
  }
  next();
});

campaignSchema.index({ title: 'text', description: 'text' });
campaignSchema.index({ status: 1, category: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);
