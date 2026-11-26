const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../server');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const Settlement = require('../models/Settlement');
const AIService = require('../services/aiService');
const PaymentService = require('../services/paymentService');

let server;
let port;
let adminToken = '';
let creatorToken = '';
let donorToken = '';
let testCampaignId = '';

const request = async (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, data: json });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
};

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      console.log(`[Test Server] Running on port ${port}`);
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('1. Health check returns 200 and ONLINE status', async () => {
  const res = await request('GET', '/api/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.status, 'ONLINE');
});

test('2. Authentication: Login as Admin, Creator, and Donor', async () => {
  const adminRes = await request('POST', '/api/auth/login', {
    email: 'admin@crowdfund.ai',
    password: 'Admin@Secure2026!',
  });
  assert.strictEqual(adminRes.status, 200);
  assert.ok(adminRes.data.token);
  assert.strictEqual(adminRes.data.user.role, 'admin');
  adminToken = adminRes.data.token;

  const creatorRes = await request('POST', '/api/auth/login', {
    email: 'creator@crowdfund.ai',
    password: 'Creator@Pass2026!',
  });
  assert.strictEqual(creatorRes.status, 200);
  assert.strictEqual(creatorRes.data.user.role, 'creator');
  creatorToken = creatorRes.data.token;

  const donorRes = await request('POST', '/api/auth/login', {
    email: 'donor@crowdfund.ai',
    password: 'Donor@Pass2026!',
  });
  assert.strictEqual(donorRes.status, 200);
  assert.strictEqual(donorRes.data.user.role, 'donor');
  donorToken = donorRes.data.token;
});

test('3. Role-Based Access Control: Donor forbidden from admin routes', async () => {
  const res = await request('GET', '/api/admin/campaigns', null, donorToken);
  assert.strictEqual(res.status, 403);
});

test('4. Public Campaign Discovery: Lists only approved active campaigns', async () => {
  const res = await request('GET', '/api/campaigns');
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.data.campaigns));
  // Every public campaign must be approved/active or goal reached
  res.data.campaigns.forEach((camp) => {
    assert.ok(['APPROVED', 'ACTIVE', 'GOAL_REACHED'].includes(camp.status));
  });
});

test('5. Campaign Creation & AI Risk Screening', async () => {
  const res = await request(
    'POST',
    '/api/campaigns',
    {
      title: 'Pediatric Cancer Treatment Fund for Baby Ananya',
      description: 'Baby Ananya has been diagnosed with acute leukemia requiring 6 cycles of specialized chemotherapy at Tata Memorial Hospital. Estimated expenses: ₹2,00,000.',
      category: 'Medical',
      targetAmount: 200000,
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      beneficiaryName: 'Ananya Sharma',
      beneficiaryRelationship: 'Daughter',
      contactDetails: '+91 91234 56789',
    },
    creatorToken
  );

  assert.strictEqual(res.status, 201);
  assert.ok(res.data.campaign);
  assert.strictEqual(res.data.campaign.status, 'PENDING_VERIFICATION');
  assert.ok(typeof res.data.campaign.riskScore === 'number');
  testCampaignId = res.data.campaign._id;
});

test('6. Admin Approval Workflow: Approves the pending campaign', async () => {
  const res = await request(
    'PUT',
    `/api/admin/campaigns/${testCampaignId}/review`,
    {
      action: 'APPROVE',
      notes: 'Hospital admission and medical estimates verified with oncology department.',
    },
    adminToken
  );

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.campaign.status, 'ACTIVE');
});

test('7. Donation & Payment Workflow (Demo Mode / Razorpay)', async () => {
  // Create order
  const orderRes = await request('POST', '/api/donations/order', {
    campaignId: testCampaignId,
    amount: 50000,
    isAnonymous: false,
    donorName: 'Aarav Patel',
    donorEmail: 'donor@crowdfund.ai',
    message: 'Stay strong little one! Prayers for recovery.',
    allowDemoFallback: true,
  }, donorToken);

  assert.strictEqual(orderRes.status, 201);
  assert.ok(orderRes.data.donationId);

  // Verify payment
  const verifyRes = await request('POST', '/api/donations/verify', {
    orderId: orderRes.data.orderId,
    paymentId: `pay_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    signature: 'demo_signature',
    donationId: orderRes.data.donationId,
    isSimulated: true,
  }, donorToken);

  assert.strictEqual(verifyRes.status, 200);
  assert.strictEqual(verifyRes.data.success, true);
  assert.strictEqual(verifyRes.data.donation.paymentStatus, 'SUCCESS');

  // Verify campaign fundraising total updated
  const campRes = await request('GET', `/api/campaigns/${testCampaignId}`, null, creatorToken);
  assert.strictEqual(campRes.data.campaign.collectedAmount, 50000);
  assert.strictEqual(campRes.data.campaign.donationCount, 1);
  assert.strictEqual(campRes.data.campaign.remainingAmount, 150000);
});

test('8. Automatic Fundraising Calculations: Reaching goal transitions to GOAL_REACHED', async () => {
  // Donate remaining ₹150,000 to hit ₹200,000 target
  const orderRes = await request('POST', '/api/donations/order', {
    campaignId: testCampaignId,
    amount: 150000,
    donorName: 'Angel Donor',
    allowDemoFallback: true,
  }, donorToken);

  await request('POST', '/api/donations/verify', {
    orderId: orderRes.data.orderId,
    paymentId: `pay_test_goal_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    signature: 'demo_sig_goal',
    donationId: orderRes.data.donationId,
    isSimulated: true,
  });

  const campRes = await request('GET', `/api/campaigns/${testCampaignId}`, null, creatorToken);
  assert.strictEqual(campRes.data.campaign.collectedAmount, 200000);
  assert.strictEqual(campRes.data.campaign.remainingAmount, 0);
  assert.strictEqual(campRes.data.campaign.status, 'GOAL_REACHED');
});

test('9. Beneficiary Settlement Simulation', async () => {
  const res = await request(
    'POST',
    '/api/admin/settlements/simulate',
    {
      campaignId: testCampaignId,
      notes: 'Full target achieved. Beneficiary hospital bank account confirmed.',
    },
    adminToken
  );

  assert.strictEqual(res.status, 201);
  assert.ok(res.data.settlement);
  assert.strictEqual(res.data.settlement.status, 'SIMULATED_SUCCESS');
  assert.strictEqual(res.data.settlement.amountApproved, 200000);
  assert.ok(res.data.settlement.settlementReference.startsWith('SIM_STL_'));

  // Campaign status is now COMPLETED
  const campRes = await request('GET', `/api/campaigns/${testCampaignId}`, null, creatorToken);
  assert.strictEqual(campRes.data.campaign.status, 'COMPLETED');
});

test('10. Admin Analytics Dashboard Aggregations', async () => {
  const res = await request('GET', '/api/admin/analytics', null, adminToken);
  assert.strictEqual(res.status, 200);
  assert.ok(res.data.metrics.totalCampaigns >= 4);
  assert.ok(res.data.metrics.totalAmountRaised >= 200000);
  assert.ok(Array.isArray(res.data.riskDistribution));
  assert.ok(Array.isArray(res.data.categoryBreakdown));
});

test('11. Contact Form Submission', async () => {
  const res = await request('POST', '/api/contact', {
    name: 'Suresh Kumar',
    email: 'suresh@example.com',
    subject: 'Verification Query',
    message: 'How long does medical document verification usually take?',
  });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.data.success, true);
  assert.ok(res.data.contact._id);
});

test('12. Public Platform Statistics', async () => {
  const res = await request('GET', '/api/campaigns/stats');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.success, true);
  assert.ok(typeof res.data.stats.totalRaised === 'number');
  assert.ok(typeof res.data.stats.activeCampaigns === 'number');
  assert.ok(typeof res.data.stats.totalDonations === 'number');
});

test('13. Creator Campaign Management: Update campaign and status tracking', async () => {
  // Update campaign
  const updateRes = await request(
    'PUT',
    `/api/campaigns/${testCampaignId}`,
    {
      beneficiaryName: 'Baby Ananya Sharma (Updated)',
      description: 'Baby Ananya has completed chemotherapy and is now under observation at Tata Memorial Hospital.',
    },
    creatorToken
  );
  assert.strictEqual(updateRes.status, 200);
  assert.strictEqual(updateRes.data.campaign.beneficiaryName, 'Baby Ananya Sharma (Updated)');
});

test('14. Donor Personal Donations & Cancel Order Workflow', async () => {
  // Fetch donor personal donations
  const myDonationsRes = await request('GET', '/api/donations/my', null, donorToken);
  assert.strictEqual(myDonationsRes.status, 200);
  assert.ok(Array.isArray(myDonationsRes.data.donations));
  assert.ok(myDonationsRes.data.donations.length >= 1);

  // Find an active campaign to test donation creation and cancellation
  let activeCampaign = await Campaign.findOne({ status: 'ACTIVE' });
  if (!activeCampaign) {
    const creatorUser = await User.findOne({ role: 'creator' });
    activeCampaign = await Campaign.create({
      creator: creatorUser._id,
      title: 'Active School Supplies Support',
      description: 'Support notebooks, books, and pens for students.',
      category: 'Education',
      targetAmount: 25000,
      collectedAmount: 0,
      remainingAmount: 25000,
      deadline: new Date(Date.now() + 30 * 86400000),
      beneficiaryName: 'Government Primary School',
      status: 'ACTIVE',
    });
  }

  // Create an order and cancel it
  const orderRes = await request('POST', '/api/donations/order', {
    campaignId: activeCampaign._id.toString(),
    amount: 1500,
    donorEmail: 'donor@crowdfund.ai',
    allowDemoFallback: true,
  }, donorToken);
  assert.strictEqual(orderRes.status, 201);
  const pendingDonationId = orderRes.data.donationId;

  // Cancel the pending order
  const cancelRes = await request('POST', '/api/donations/cancel', {
    donationId: pendingDonationId,
    reason: 'Payment cancelled by user in checkout',
  }, donorToken);
  assert.strictEqual(cancelRes.status, 200);
  assert.strictEqual(cancelRes.data.success, true);

  // Check that donation status is FAILED
  const donationDoc = await Donation.findById(pendingDonationId);
  assert.strictEqual(donationDoc.paymentStatus, 'FAILED');
});

test('15. Payment Idempotency: Duplicate payment verification does not double-count funds', async () => {
  const creatorUser = await User.findOne({ role: 'creator' });
  // Create an active campaign with deadline for idempotency test
  const camp = await Campaign.create({
    creator: creatorUser._id,
    title: 'Idempotency Test Campaign',
    description: 'Testing that duplicate verification requests do not double count funds.',
    category: 'Education',
    targetAmount: 50000,
    collectedAmount: 0,
    remainingAmount: 50000,
    donationCount: 0,
    deadline: new Date(Date.now() + 30 * 86400000),
    status: 'ACTIVE',
    beneficiaryName: 'Student Rahul',
    beneficiaryRelationship: 'Self',
  });

  const orderRes = await request('POST', '/api/donations/order', {
    campaignId: camp._id.toString(),
    amount: 10000,
    donorEmail: 'donor@crowdfund.ai',
    allowDemoFallback: true,
  }, donorToken);

  const idemPaymentId = `pay_idem_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // First verification
  const verify1 = await request('POST', '/api/donations/verify', {
    orderId: orderRes.data.orderId,
    paymentId: idemPaymentId,
    signature: 'demo_sig_1',
    donationId: orderRes.data.donationId,
    isSimulated: true,
  }, donorToken);
  assert.strictEqual(verify1.status, 200);

  // Check funds updated once
  let checkCamp = await Campaign.findById(camp._id);
  assert.strictEqual(checkCamp.collectedAmount, 10000);
  assert.strictEqual(checkCamp.donationCount, 1);

  // Second (duplicate) verification with same donation ID
  const verify2 = await request('POST', '/api/donations/verify', {
    orderId: orderRes.data.orderId,
    paymentId: idemPaymentId,
    signature: 'demo_sig_1',
    donationId: orderRes.data.donationId,
    isSimulated: true,
  }, donorToken);
  assert.strictEqual(verify2.status, 200);

  // Confirm funds are NOT double counted
  checkCamp = await Campaign.findById(camp._id);
  assert.strictEqual(checkCamp.collectedAmount, 10000);
  assert.strictEqual(checkCamp.donationCount, 1);
});
