const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    required: [true, 'Reason for report is required'],
  },
  details: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['PENDING', 'INVESTIGATING', 'DISMISSED', 'ACTION_TAKEN'],
    default: 'PENDING',
  },
  adminNotes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
