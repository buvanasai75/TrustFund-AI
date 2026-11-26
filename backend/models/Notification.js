const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      'CAMPAIGN_SUBMITTED',
      'CAMPAIGN_APPROVED',
      'CAMPAIGN_REJECTED',
      'ADDITIONAL_INFO_REQUESTED',
      'NEW_DONATION',
      'GOAL_REACHED',
      'SETTLEMENT_UPDATED',
      'GENERAL'
    ],
    default: 'GENERAL',
  },
  relatedId: {
    type: String,
    default: '',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
