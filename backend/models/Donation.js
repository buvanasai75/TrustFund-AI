const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  amount: {
    type: Number,
    required: [true, 'Donation amount in INR is required'],
    min: [1, 'Donation must be at least ₹1'],
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
    default: 'PENDING',
  },
  orderId: {
    type: String,
    default: '',
  },
  paymentId: {
    type: String,
    default: '',
  },
  signature: {
    type: String,
    default: '',
  },
  transactionReference: {
    type: String,
    default: '',
  },
  failureReason: {
    type: String,
    default: '',
  },
  paymentMode: {
    type: String,
    enum: ['RAZORPAY_TEST', 'DEMO_MODE'],
    default: 'DEMO_MODE',
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  donorName: {
    type: String,
    default: 'Generous Supporter',
  },
  donorEmail: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    default: '',
  },
}, { timestamps: true });

donationSchema.index({ campaign: 1, paymentStatus: 1 });
donationSchema.index({ donor: 1, createdAt: -1 });

module.exports = mongoose.model('Donation', donationSchema);
