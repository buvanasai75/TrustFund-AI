const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your full name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide a valid email address'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  },
  subject: {
    type: String,
    required: [true, 'Please enter a subject'],
    trim: true,
  },
  message: {
    type: String,
    required: [true, 'Please enter your message'],
    minlength: [10, 'Message must be at least 10 characters long'],
  },
  status: {
    type: String,
    enum: ['NEW', 'IN_REVIEW', 'RESOLVED'],
    default: 'NEW',
  },
}, { timestamps: true });

contactSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Contact', contactSchema);
