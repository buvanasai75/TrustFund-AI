const crypto = require('crypto');
const Razorpay = require('razorpay');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const Payment = require('../models/Payment');

class PaymentService {
  static getRazorpayInstance() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keyId && keySecret) {
      try {
        return new Razorpay({ key_id: keyId, key_secret: keySecret });
      } catch (err) {
        console.warn('[Razorpay] Instance initialization warning:', err.message);
      }
    }
    return null;
  }

  static isRazorpayConfigured() {
    return Boolean(
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      !process.env.RAZORPAY_KEY_ID.includes('placeholder')
    );
  }

  static getPaymentConfig() {
    const isConfigured = this.isRazorpayConfigured();
    return {
      success: true,
      isRazorpayConfigured: isConfigured,
      keyId: isConfigured ? process.env.RAZORPAY_KEY_ID : null,
      defaultMode: isConfigured ? 'RAZORPAY_TEST' : 'DEMO_MODE',
      supportedModes: isConfigured ? ['RAZORPAY_TEST', 'DEMO_MODE'] : ['DEMO_MODE'],
    };
  }

  static async createOrder(campaignId, amount, donorData = {}, allowDemoFallback = false) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found.');
    }

    if (campaign.status !== 'ACTIVE') {
      throw new Error(`Cannot donate to campaign with status: ${campaign.status}. Only active campaigns accept donations.`);
    }

    if (!amount || Number(amount) <= 0) {
      throw new Error('Donation amount must be greater than zero.');
    }

    const numAmount = Number(amount);
    const amountInPaise = Math.round(numAmount * 100);

    const rzp = this.getRazorpayInstance();

    // 1. If Razorpay is configured, create an actual Razorpay test order
    if (rzp) {
      try {
        const receipt = `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const orderOptions = {
          amount: amountInPaise,
          currency: 'INR',
          receipt,
          notes: {
            campaignId: campaign._id.toString(),
            campaignTitle: campaign.title.substring(0, 35),
            beneficiary: campaign.beneficiaryName,
          },
        };

        const order = await rzp.orders.create(orderOptions);
        const transactionReference = `TRX_RZP_${order.id.slice(-8)}_${Date.now().toString().slice(-4)}`;

        // Pre-create pending donation record
        const donation = await Donation.create({
          campaign: campaign._id,
          donor: donorData.userId || null,
          amount: numAmount,
          paymentStatus: 'PENDING',
          orderId: order.id,
          transactionReference,
          paymentMode: 'RAZORPAY_TEST',
          isAnonymous: donorData.isAnonymous || false,
          donorName: donorData.isAnonymous ? 'Generous Supporter' : (donorData.name || 'Anonymous'),
          donorEmail: donorData.email || '',
          message: donorData.message || '',
        });

        return {
          success: true,
          mode: 'RAZORPAY_TEST',
          isConfigured: true,
          orderId: order.id,
          amount: order.amount,
          currency: order.currency || 'INR',
          keyId: process.env.RAZORPAY_KEY_ID,
          donationId: donation._id,
          transactionReference,
        };
      } catch (err) {
        console.error('[Razorpay] Order creation error:', err.message);
        throw new Error(`Razorpay order creation failed: ${err.message}`);
      }
    }

    // 2. If allowDemoFallback is explicitly enabled for offline testing or in test environment
    if (allowDemoFallback || process.env.NODE_ENV === 'test') {
      const demoOrderId = `demo_order_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const transactionReference = `TRX_DEMO_${Date.now().toString().slice(-6)}_${Math.floor(Math.random() * 1000)}`;

      const donation = await Donation.create({
        campaign: campaign._id,
        donor: donorData.userId || null,
        amount: numAmount,
        paymentStatus: 'PENDING',
        orderId: demoOrderId,
        transactionReference,
        paymentMode: 'DEMO_MODE',
        isAnonymous: donorData.isAnonymous || false,
        donorName: donorData.isAnonymous ? 'Generous Supporter' : (donorData.name || 'Supporter'),
        donorEmail: donorData.email || '',
        message: donorData.message || '',
      });

      return {
        success: true,
        mode: 'DEMO_MODE',
        isConfigured: false,
        orderId: demoOrderId,
        amount: amountInPaise,
        currency: 'INR',
        keyId: null,
        donationId: donation._id,
        transactionReference,
        isSimulated: true,
        message: 'Demo Simulation Mode: Testing without live Razorpay keys.',
      };
    }

    // 3. If keys are missing and demo fallback was not explicitly requested, inform user clearly
    return {
      success: false,
      mode: 'NOT_CONFIGURED',
      isConfigured: false,
      message: 'Razorpay Test credentials are not configured in backend .env. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to open Razorpay Checkout, or use Simulated Test Payment.',
    };
  }

  static async verifyPayment(verificationData) {
    const { orderId, paymentId, signature, donationId, isSimulated } = verificationData;

    const donation = await Donation.findById(donationId).populate('campaign');
    if (!donation) {
      throw new Error('Donation record not found.');
    }

    // Idempotency check: if already processed, do not update campaign totals again
    if (donation.paymentStatus === 'SUCCESS') {
      return {
        success: true,
        alreadyVerified: true,
        message: 'Payment has already been verified and credited.',
        donation,
        transactionReference: donation.transactionReference || donation.paymentId || donation.orderId,
      };
    }

    // Handle explicit Simulated Demo Mode
    if (isSimulated || donation.paymentMode === 'DEMO_MODE') {
      donation.paymentStatus = 'SUCCESS';
      donation.paymentId = paymentId || `demo_pay_${Date.now()}`;
      donation.signature = signature || 'demo_signature_valid';
      if (!donation.transactionReference) {
        donation.transactionReference = `TRX_DEMO_${Date.now().toString().slice(-6)}_${Math.floor(Math.random() * 1000)}`;
      }
      await donation.save();

      try {
        await Payment.create({
          donation: donation._id,
          campaign: donation.campaign._id,
          orderId,
          paymentId: donation.paymentId,
          signature: donation.signature,
          amount: donation.amount,
          status: 'captured',
          method: 'demo_simulated',
          transactionReference: donation.transactionReference,
          idempotencyKey: `idemp_${donation.paymentId}`,
          rawResponse: { mode: 'DEMO_SIMULATED', timestamp: new Date() },
        });
      } catch (payErr) {
        if (payErr.code !== 11000) console.warn('[Payment Record Warning]', payErr.message);
      }

      await this.applySuccessfulDonation(donation.campaign._id, donation.amount);

      return {
        success: true,
        mode: 'DEMO_MODE',
        donation,
        transactionReference: donation.transactionReference,
        message: 'Simulated payment verified and recorded in demonstration ledger.',
      };
    }

    // Real Razorpay HMAC SHA256 Signature Verification
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error('Razorpay secret key is not configured on the server.');
    }

    if (!orderId || !paymentId || !signature) {
      donation.paymentStatus = 'FAILED';
      donation.failureReason = 'Missing payment verification parameters (orderId, paymentId, or signature).';
      if (!donation.transactionReference) {
        donation.transactionReference = `FAIL_RZP_${Date.now().toString().slice(-6)}`;
      }
      await donation.save();
      throw new Error(donation.failureReason);
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (expectedSignature !== signature) {
      donation.paymentStatus = 'FAILED';
      donation.failureReason = 'Invalid payment signature. Verification failed.';
      if (!donation.transactionReference) {
        donation.transactionReference = `FAIL_RZP_${Date.now().toString().slice(-6)}`;
      }
      await donation.save();
      throw new Error('Invalid payment signature. Verification failed.');
    }

    // Verification succeeded
    donation.paymentStatus = 'SUCCESS';
    donation.paymentId = paymentId;
    donation.signature = signature;
    if (!donation.transactionReference) {
      donation.transactionReference = `TRX_RZP_${paymentId.slice(-8)}_${Date.now().toString().slice(-4)}`;
    }
    await donation.save();

    try {
      await Payment.create({
        donation: donation._id,
        campaign: donation.campaign._id,
        orderId,
        paymentId,
        signature,
        amount: donation.amount,
        status: 'captured',
        method: 'razorpay_test',
        transactionReference: donation.transactionReference,
        idempotencyKey: `idemp_${paymentId}`,
        rawResponse: { verified: true, verifiedAt: new Date() },
      });
    } catch (payErr) {
      if (payErr.code !== 11000) console.warn('[Payment Record Warning]', payErr.message);
    }

    await this.applySuccessfulDonation(donation.campaign._id, donation.amount);

    return {
      success: true,
      mode: 'RAZORPAY_TEST',
      donation,
      transactionReference: donation.transactionReference,
      message: 'Razorpay payment successfully verified and credited.',
    };
  }

  static async failPayment(failureData) {
    const { donationId, orderId, reason, isSimulated } = failureData;
    let donation = null;
    if (donationId) {
      donation = await Donation.findById(donationId).populate('campaign');
    } else if (orderId) {
      donation = await Donation.findOne({ orderId }).populate('campaign');
    }

    if (!donation) {
      throw new Error('Donation record not found.');
    }

    // Do NOT overwrite an already SUCCESS payment
    if (donation.paymentStatus === 'SUCCESS') {
      return {
        success: false,
        message: 'Cannot fail a payment that has already been verified as SUCCESS.',
        donation,
      };
    }

    donation.paymentStatus = 'FAILED';
    donation.failureReason = reason || 'Payment transaction was declined or cancelled.';
    if (!donation.transactionReference) {
      donation.transactionReference = `FAIL_${donation.paymentMode === 'RAZORPAY_TEST' ? 'RZP' : 'DEMO'}_${Date.now().toString().slice(-6)}_${Math.floor(Math.random() * 1000)}`;
    }
    await donation.save();

    const paymentId = donation.paymentId || `fail_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    try {
      await Payment.create({
        donation: donation._id,
        campaign: donation.campaign?._id || donation.campaign,
        orderId: donation.orderId || orderId || `order_fail_${Date.now()}`,
        paymentId,
        amount: donation.amount,
        status: 'failed',
        failureReason: donation.failureReason,
        transactionReference: donation.transactionReference,
        method: isSimulated || donation.paymentMode === 'DEMO_MODE' ? 'demo_simulated' : 'razorpay_test',
        idempotencyKey: `fail_${donation.orderId || donation._id}`,
        rawResponse: { mode: donation.paymentMode, reason: donation.failureReason, failedAt: new Date() },
      });
    } catch (e) {
      // Idempotency: if fail record already created, ignore duplicate key error
    }

    return {
      success: true,
      mode: donation.paymentMode,
      donation,
      transactionReference: donation.transactionReference,
      message: 'Payment has been recorded as failed/cancelled.',
    };
  }

  static async handleWebhook(webhookBody, webhookSignature) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Razorpay webhook secret is not configured.');
    }

    // Verify webhook signature using HMAC SHA256 with raw buffer or string
    const bodyToDigest = Buffer.isBuffer(webhookBody)
      ? webhookBody
      : (typeof webhookBody === 'string' ? webhookBody : JSON.stringify(webhookBody));

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyToDigest)
      .digest('hex');

    if (expectedSignature !== webhookSignature) {
      throw new Error('Invalid webhook signature verification failed.');
    }

    const event = Buffer.isBuffer(webhookBody)
      ? JSON.parse(webhookBody.toString('utf8'))
      : (typeof webhookBody === 'string' ? JSON.parse(webhookBody) : webhookBody);
    const eventType = event.event;

    if (eventType === 'payment.captured') {
      const paymentEntity = event.payload?.payment?.entity;
      if (!paymentEntity) return { status: 'ignored' };

      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const donation = await Donation.findOne({ orderId }).populate('campaign');

      if (donation && donation.paymentStatus !== 'SUCCESS') {
        donation.paymentStatus = 'SUCCESS';
        donation.paymentId = paymentId;
        if (!donation.transactionReference) {
          donation.transactionReference = `TRX_RZP_${paymentId.slice(-8)}_${Date.now().toString().slice(-4)}`;
        }
        await donation.save();

        try {
          await Payment.create({
            donation: donation._id,
            campaign: donation.campaign._id,
            orderId,
            paymentId,
            amount: donation.amount,
            status: 'captured',
            method: paymentEntity.method || 'razorpay_webhook',
            transactionReference: donation.transactionReference,
            idempotencyKey: `webhook_${event.id || paymentId}`,
            rawResponse: event,
          });
        } catch (payErr) {
          if (payErr.code !== 11000) console.warn('[Payment Webhook Warning]', payErr.message);
        }

        await this.applySuccessfulDonation(donation.campaign._id, donation.amount);
      } else if (donation && donation.paymentStatus === 'SUCCESS') {
        return { status: 'already_processed', eventType };
      }
      return { status: 'processed', eventType };
    }

    if (eventType === 'payment.failed') {
      const paymentEntity = event.payload?.payment?.entity;
      if (paymentEntity?.order_id) {
        const donation = await Donation.findOne({ orderId: paymentEntity.order_id });
        if (donation && donation.paymentStatus === 'PENDING') {
          donation.paymentStatus = 'FAILED';
          donation.failureReason = paymentEntity.error_description || 'Payment failed via gateway webhook';
          if (!donation.transactionReference) {
            donation.transactionReference = `FAIL_RZP_${paymentEntity.id || Date.now().toString().slice(-6)}`;
          }
          await donation.save();
        }
      }
      return { status: 'processed_failed' };
    }

    return { status: 'unhandled_event' };
  }

  static async applySuccessfulDonation(campaignId, donationAmount) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return;

    // Increment collected funds atomically
    campaign.collectedAmount += donationAmount;
    campaign.donationCount += 1;
    campaign.remainingAmount = Math.max(0, campaign.targetAmount - campaign.collectedAmount);

    if (campaign.collectedAmount >= campaign.targetAmount && campaign.status === 'ACTIVE') {
      campaign.status = 'GOAL_REACHED';
    }

    await campaign.save();
    return campaign;
  }
}

module.exports = PaymentService;
