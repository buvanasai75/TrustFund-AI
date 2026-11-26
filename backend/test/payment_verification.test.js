const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://127.0.0.1:5000/api';

async function apiRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api' + path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
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

async function runPaymentTests() {
  console.log('====================================================');
  console.log(' TRUSTFUND AI – PAYMENT FLOW ACCEPTANCE TEST SUITE  ');
  console.log('====================================================\n');

  // 1. Authenticate Donor and Creator
  console.log('[Step 1] Authenticating Donor and Creator...');
  const donorLog = await apiRequest('POST', '/auth/login', {
    email: 'donor@crowdfund.ai',
    password: 'Donor@Pass2026!',
  });
  assert.strictEqual(donorLog.status, 200, 'Donor login must succeed');
  const donorToken = donorLog.body.token;
  console.log('✔ Donor authenticated:', donorLog.body.user.name);

  const creatorLog = await apiRequest('POST', '/auth/login', {
    email: 'creator@crowdfund.ai',
    password: 'Creator@Pass2026!',
  });
  assert.strictEqual(creatorLog.status, 200, 'Creator login must succeed');
  const creatorToken = creatorLog.body.token;
  console.log('✔ Creator authenticated:', creatorLog.body.user.name);

  // 2. Check Gateway Configuration Endpoint
  console.log('\n[Step 2] Testing /api/donations/config endpoint...');
  const configRes = await apiRequest('GET', '/donations/config');
  assert.strictEqual(configRes.status, 200);
  assert.strictEqual(typeof configRes.body.isRazorpayConfigured, 'boolean');
  assert.ok(Array.isArray(configRes.body.supportedModes));
  console.log('✔ Gateway config verified:', JSON.stringify(configRes.body));

  // 3. Get an active campaign for testing
  console.log('\n[Step 3] Fetching an active campaign for tests...');
  const campsRes = await apiRequest('GET', '/campaigns');
  assert.strictEqual(campsRes.status, 200);
  assert.ok(campsRes.body.campaigns.length > 0, 'Must have at least one active campaign');
  const targetCampaign = campsRes.body.campaigns[0];
  const initialFunds = targetCampaign.collectedAmount;
  const initialDonationCount = targetCampaign.donationCount;
  console.log(`✔ Target campaign: "${targetCampaign.title}" (Current funds: ₹${initialFunds})`);

  // 4. Test Successful Payment
  console.log('\n[Step 4] Testing SUCCESSFUL Payment Flow (Demo Mode)...');
  const donationAmount = 2500;
  const orderRes = await apiRequest('POST', '/donations/order', {
    campaignId: targetCampaign._id,
    amount: donationAmount,
    donorName: 'Aarav Patel',
    donorEmail: 'donor@crowdfund.ai',
    allowDemoFallback: true,
  }, donorToken);
  assert.strictEqual(orderRes.status, 201, 'Order creation must succeed');
  assert.ok(orderRes.body.donationId, 'Order must return donationId');
  assert.ok(orderRes.body.transactionReference, 'Order must generate transactionReference');
  console.log('✔ Order created:', orderRes.body.orderId, 'Ref:', orderRes.body.transactionReference);

  const paymentId = `demo_pay_${Date.now()}_test`;
  const verifyRes = await apiRequest('POST', '/donations/verify', {
    orderId: orderRes.body.orderId,
    paymentId,
    signature: 'demo_signature_valid',
    donationId: orderRes.body.donationId,
    isSimulated: true,
  }, donorToken);
  assert.strictEqual(verifyRes.status, 200, 'Payment verification must succeed');
  assert.strictEqual(verifyRes.body.donation.paymentStatus, 'SUCCESS');
  assert.ok(verifyRes.body.transactionReference);
  console.log('✔ Payment verified as SUCCESS. Transaction Reference:', verifyRes.body.transactionReference);

  // Check campaign funds updated exactly once
  const campAfterSuccess = await apiRequest('GET', `/campaigns/${targetCampaign._id}`);
  assert.strictEqual(
    campAfterSuccess.body.campaign.collectedAmount,
    initialFunds + donationAmount,
    'Campaign collected funds must increment by exact donation amount'
  );
  assert.strictEqual(
    campAfterSuccess.body.campaign.donationCount,
    initialDonationCount + 1,
    'Campaign donation count must increment by 1'
  );
  console.log(`✔ Campaign funds successfully increased to: ₹${campAfterSuccess.body.campaign.collectedAmount}`);

  // 5. Test Repeated Payment Verification Request (Idempotency)
  console.log('\n[Step 5] Testing Repeated Payment Requests (Idempotency Protection)...');
  const duplicateVerify = await apiRequest('POST', '/donations/verify', {
    orderId: orderRes.body.orderId,
    paymentId,
    signature: 'demo_signature_valid',
    donationId: orderRes.body.donationId,
    isSimulated: true,
  }, donorToken);
  assert.strictEqual(duplicateVerify.status, 200);
  assert.strictEqual(duplicateVerify.body.alreadyVerified, true, 'Must report alreadyVerified: true');
  console.log('✔ Duplicate verify handled cleanly:', duplicateVerify.body.message);

  const campAfterDuplicate = await apiRequest('GET', `/campaigns/${targetCampaign._id}`);
  assert.strictEqual(
    campAfterDuplicate.body.campaign.collectedAmount,
    initialFunds + donationAmount,
    'Funds MUST NOT be credited twice on repeated requests'
  );
  console.log('✔ Zero double-counting verified. Collected amount remains:', campAfterDuplicate.body.campaign.collectedAmount);

  // 6. Test Failed Payment Flow
  console.log('\n[Step 6] Testing FAILED Payment Flow...');
  const failedOrder = await apiRequest('POST', '/donations/order', {
    campaignId: targetCampaign._id,
    amount: 1000,
    donorName: 'Aarav Patel',
    donorEmail: 'donor@crowdfund.ai',
    allowDemoFallback: true,
  }, donorToken);
  assert.strictEqual(failedOrder.status, 201);

  const failRes = await apiRequest('POST', '/donations/fail', {
    donationId: failedOrder.body.donationId,
    orderId: failedOrder.body.orderId,
    reason: 'Simulated card decline: Insufficient balance.',
    isSimulated: true,
  }, donorToken);
  console.log('DEBUG failRes.body:', JSON.stringify(failRes.body));
  assert.strictEqual(failRes.status, 200);
  assert.strictEqual(failRes.body.donation.paymentStatus, 'FAILED');
  assert.ok(failRes.body.donation.failureReason.includes('decline'));
  console.log('✔ Failed payment recorded. Ref:', failRes.body.transactionReference, 'Reason:', failRes.body.donation.failureReason);

  const campAfterFail = await apiRequest('GET', `/campaigns/${targetCampaign._id}`);
  assert.strictEqual(
    campAfterFail.body.campaign.collectedAmount,
    initialFunds + donationAmount,
    'Campaign funds MUST NOT increase for failed payments'
  );
  console.log('✔ Funds untouched after failed payment:', campAfterFail.body.campaign.collectedAmount);

  // 7. Test Cancelled Payment Flow (Modal dismissal)
  console.log('\n[Step 7] Testing CANCELLED Payment Flow...');
  const cancelOrder = await apiRequest('POST', '/donations/order', {
    campaignId: targetCampaign._id,
    amount: 1500,
    donorName: 'Aarav Patel',
    donorEmail: 'donor@crowdfund.ai',
    allowDemoFallback: true,
  }, donorToken);
  assert.strictEqual(cancelOrder.status, 201);

  const cancelRes = await apiRequest('POST', '/donations/cancel', {
    donationId: cancelOrder.body.donationId,
    reason: 'User dismissed checkout modal without payment.',
  }, donorToken);
  assert.strictEqual(cancelRes.status, 200);
  assert.strictEqual(cancelRes.body.donation.paymentStatus, 'FAILED');
  console.log('✔ Cancelled payment recorded. Ref:', cancelRes.body.transactionReference);

  const campAfterCancel = await apiRequest('GET', `/campaigns/${targetCampaign._id}`);
  assert.strictEqual(
    campAfterCancel.body.campaign.collectedAmount,
    initialFunds + donationAmount,
    'Campaign funds MUST NOT increase for cancelled payments'
  );
  console.log('✔ Funds untouched after cancellation:', campAfterCancel.body.campaign.collectedAmount);

  // 8. Test Page Refresh & Donation History
  console.log('\n[Step 8] Testing Donor History Retrieval (Page Refresh simulation)...');
  const myDonationsRes = await apiRequest('GET', '/donations/my', null, donorToken);
  assert.strictEqual(myDonationsRes.status, 200);
  const myDonations = myDonationsRes.body.donations;
  const successfulDonations = myDonations.filter(d => d.paymentStatus === 'SUCCESS');
  const failedDonations = myDonations.filter(d => d.paymentStatus !== 'SUCCESS');

  assert.ok(successfulDonations.length >= 1, 'Donor must have successful donations');
  assert.ok(failedDonations.length >= 2, 'Donor must have recorded failed/cancelled donations');
  console.log(`✔ History verified: ${successfulDonations.length} Successful, ${failedDonations.length} Failed/Cancelled`);

  // Verify that all returned transactions have a transaction reference and clear payment mode
  myDonations.forEach(d => {
    assert.ok(d.paymentMode, 'Every donation must have a paymentMode');
    assert.ok(d.transactionReference || d.paymentId || d.orderId, 'Every donation must have reference identifier');
  });
  console.log('✔ Every record in donor history has a valid payment mode and reference identifier');

  console.log('\n====================================================');
  console.log(' ALL PAYMENT INTEGRATION ACCEPTANCE TESTS PASSED!   ');
  console.log('====================================================');
}

runPaymentTests().catch(err => {
  console.error('\n❌ Acceptance test failed:', err);
  process.exit(1);
});
