const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  localPath: {
    type: String,
    default: '',
  },
  fileType: {
    type: String,
    default: 'application/pdf',
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  extractedText: {
    type: String,
    default: '',
  },
  ocrData: {
    beneficiaryName: { type: String, default: null },
    institutionName: { type: String, default: null },
    billAmount: { type: Number, default: null },
    documentDate: { type: String, default: null },
    keyTerms: [{ type: String }],
  },
  aiWarnings: [{
    type: String,
  }],
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'VERIFIED', 'INCONSISTENCY_DETECTED', 'REJECTED'],
    default: 'PENDING',
  },
  adminVerificationStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
  },
  adminNotes: {
    type: String,
    default: '',
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
