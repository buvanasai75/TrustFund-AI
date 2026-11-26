const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  donation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
  },
  orderId: {
    type: String,
    required: true,
  },
  paymentId: {
    type: String,
    default: '',
  },
  signature: {
    type: String,
    default: '',
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  status: {
    type: String,
    enum: ['created', 'authorized', 'captured', 'refunded', 'failed'],
    default: 'created',
  },
  method: {
    type: String,
    default: 'upi/card/netbanking',
  },
  transactionReference: {
    type: String,
    default: '',
  },
  failureReason: {
    type: String,
    default: '',
  },
  idempotencyKey: {
    type: String,
    sparse: true,
    unique: true,
  },
  rawResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
