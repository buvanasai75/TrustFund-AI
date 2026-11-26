const http = require('http');
const crypto = require('crypto');
const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const Payment = require('../models/Payment');
const connectDB = require('../config/db');

async function apiRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api' + path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runSecurityTests() {
  console.log('====================================================');
  console.log(' PAYMENT SECURITY & WEBHOOK IDEMPOTENCY TEST SUITE ');
  console.log('====================================================\n');

  await connectDB();

  // Test 1: Forged Webhook signature must be rejected
  console.log('[Test 1] Testing Forged Webhook Signature Rejection...');
  const forgedPayload = JSON.stringify({
    event: 'payment.captured',
    payload: { payment: { entity: { id: 'pay_hack_123', order_id: 'order_hack_456' } } }
  });
  const forgedRes = await apiRequest('POST', '/donations/webhook', forgedPayload, {
    'x-razorpay-signature': 'forged_invalid_signature_hex_12345'
  });
  assert.strictEqual(forgedRes.status, 400, 'Forged webhook must be rejected with 400');
  console.log('✔ Forged webhook signature successfully rejected with 400 Bad Request');

  // Test 2: Valid Webhook Signature & Idempotency
  console.log('\n[Test 2] Testing Valid Webhook Processing & Idempotency...');
  // Temporary webhook secret for testing
  const testSecret = 'whsec_test_secret_for_suite_2026';
  process.env.RAZORPAY_WEBHOOK_SECRET = testSecret;

  // Create an active campaign and pending donation in database for webhook test
  const activeCamp = await Campaign.findOne({ status: 'ACTIVE' });
  const initialFunds = activeCamp.collectedAmount;
  const testOrder = `order_wh_${Date.now()}`;
  const testPayId = `pay_wh_${Date.now()}`;
  const testDonation = await Donation.create({
    campaign: activeCamp._id,
    amount: 3000,
    paymentStatus: 'PENDING',
    orderId: testOrder,
    paymentMode: 'RAZORPAY_TEST',
    donorName: 'Webhook Supporter',
  });

  const webhookBody = {
    event: 'payment.captured',
    id: `evt_${Date.now()}`,
    payload: {
      payment: {
        entity: {
          id: testPayId,
          order_id: testOrder,
          amount: 300000,
          currency: 'INR',
          method: 'upi',
        }
      }
    }
  };
  const bodyString = JSON.stringify(webhookBody);
  const validSignature = crypto
    .createHmac('sha256', testSecret)
    .update(bodyString)
    .digest('hex');

  // First webhook delivery
  const whRes1 = await apiRequest('POST', '/donations/webhook', bodyString, {
    'x-razorpay-signature': validSignature
  });
  assert.strictEqual(whRes1.status, 200);
  assert.strictEqual(whRes1.body.status, 'processed');
  console.log('✔ First webhook delivery: successfully processed and captured payment.');

  // Check database updated
  const updatedDonation = await Donation.findById(testDonation._id);
  assert.strictEqual(updatedDonation.paymentStatus, 'SUCCESS');
  assert.strictEqual(updatedDonation.paymentId, testPayId);

  const updatedCamp = await Campaign.findById(activeCamp._id);
  assert.strictEqual(updatedCamp.collectedAmount, initialFunds + 3000);
  console.log(`✔ Campaign funds credited once: ₹${updatedCamp.collectedAmount}`);

  // Duplicate webhook delivery with identical payload and signature
  console.log('\n[Test 3] Testing DUPLICATE Webhook Delivery (Idempotency Protection)...');
  const whRes2 = await apiRequest('POST', '/donations/webhook', bodyString, {
    'x-razorpay-signature': validSignature
  });
  assert.strictEqual(whRes2.status, 200);
  assert.strictEqual(whRes2.body.status, 'already_processed', 'Duplicate webhook must return already_processed');
  console.log('✔ Duplicate webhook delivery safely recognized as already_processed.');

  const campAfterDupWh = await Campaign.findById(activeCamp._id);
  assert.strictEqual(campAfterDupWh.collectedAmount, initialFunds + 3000, 'Funds MUST NOT be double credited');
  console.log('✔ Zero double-counting verified. Collected amount strictly preserved.');

  // Test 4: Webhook payment.failed event
  console.log('\n[Test 4] Testing Webhook payment.failed event handling...');
  const failOrder = `order_wh_fail_${Date.now()}`;
  const failDonation = await Donation.create({
    campaign: activeCamp._id,
    amount: 5000,
    paymentStatus: 'PENDING',
    orderId: failOrder,
    paymentMode: 'RAZORPAY_TEST',
  });

  const failWebhookBody = {
    event: 'payment.failed',
    id: `evt_fail_${Date.now()}`,
    payload: {
      payment: {
        entity: {
          id: `pay_wh_failed_${Date.now()}`,
          order_id: failOrder,
          error_description: 'Card expired or bank gateway timeout',
        }
      }
    }
  };
  const failBodyString = JSON.stringify(failWebhookBody);
  const failSignature = crypto
    .createHmac('sha256', testSecret)
    .update(failBodyString)
    .digest('hex');

  const failWhRes = await apiRequest('POST', '/donations/webhook', failBodyString, {
    'x-razorpay-signature': failSignature
  });
  assert.strictEqual(failWhRes.status, 200);
  assert.strictEqual(failWhRes.body.status, 'processed_failed');

  const checkedFailDonation = await Donation.findById(failDonation._id);
  assert.strictEqual(checkedFailDonation.paymentStatus, 'FAILED');
  assert.ok(checkedFailDonation.failureReason.includes('expired'));
  console.log('✔ payment.failed webhook correctly transitioned donation to FAILED with reason.');

  const finalCamp = await Campaign.findById(activeCamp._id);
  assert.strictEqual(finalCamp.collectedAmount, initialFunds + 3000, 'Failed webhook MUST NOT increase funds');
  console.log('✔ Funds strictly untouched by failed webhook event.');

  console.log('\n====================================================');
  console.log(' ALL SECURITY & WEBHOOK TESTS PASSED SUCCESSFULLY!  ');
  console.log('====================================================');

  process.exit(0);
}

runSecurityTests().catch(err => {
  console.error('\n❌ Security test failed:', err);
  process.exit(1);
});
