const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crowdfunding_ai';
    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Error: ${error.message}`);
    // Non-fatal fallback for development/demo test mode
    console.warn('[MongoDB] Running with warning: ensure local MongoDB daemon is active.');
    return null;
  }
};

module.exports = connectDB;
