const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  beneficiaryName: {
    type: String,
    required: true,
  },
  amountRaised: {
    type: Number,
    required: true,
  },
  amountApproved: {
    type: Number,
    required: true,
  },
  settlementDate: {
    type: Date,
    default: Date.now,
  },
  settlementReference: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: [
      'NOT_ELIGIBLE',
      'PENDING',
      'UNDER_REVIEW',
      'SIMULATED_SUCCESS',
      'TRANSFER_PENDING',
      'TRANSFERRED',
      'FAILED'
    ],
    default: 'PENDING',
  },
  mode: {
    type: String,
    enum: ['SIMULATED', 'RAZORPAY_ROUTE'],
    default: 'SIMULATED',
  },
  bankDetails: {
    accountHolderName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    bankName: { type: String, default: '' },
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: {
    type: String,
    default: 'Academic Simulation: Settlement funds recorded in demonstration ledger.',
  },
}, { timestamps: true });

module.exports = mongoose.model('Settlement', settlementSchema);
