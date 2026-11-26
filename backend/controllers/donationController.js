const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const PaymentService = require('../services/paymentService');
const NotificationService = require('../services/notificationService');

exports.getPaymentConfig = (req, res) => {
  try {
    const config = PaymentService.getPaymentConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createDonationOrder = async (req, res, next) => {
  try {
    const { campaignId, amount, isAnonymous, donorName, donorEmail, message, allowDemoFallback } = req.body;

    if (!campaignId || !amount) {
      return res.status(400).json({ success: false, message: 'Please provide campaignId and donation amount.' });
    }

    const orderData = await PaymentService.createOrder(
      campaignId,
      Number(amount),
      {
        userId: req.user ? req.user._id : null,
        name: donorName || (req.user ? req.user.name : 'Anonymous Donor'),
        email: donorEmail || (req.user ? req.user.email : ''),
        isAnonymous: Boolean(isAnonymous),
        message: message || '',
      },
      Boolean(allowDemoFallback)
    );

    if (!orderData.success && orderData.mode === 'NOT_CONFIGURED') {
      return res.status(400).json(orderData);
    }

    res.status(201).json(orderData);
  } catch (error) {
    next(error);
  }
};

exports.verifyDonationPayment = async (req, res, next) => {
  try {
    const { orderId, paymentId, signature, donationId, isSimulated } = req.body;

    if (!orderId || !donationId) {
      return res.status(400).json({ success: false, message: 'Please provide orderId and donationId.' });
    }

    const result = await PaymentService.verifyPayment({
      orderId,
      paymentId,
      signature,
      donationId,
      isSimulated: Boolean(isSimulated),
    });

    // Notify campaign creator only if newly verified as SUCCESS
    const donation = result.donation;
    if (donation && donation.campaign && donation.paymentStatus === 'SUCCESS' && !result.alreadyVerified) {
      const campaign = await Campaign.findById(donation.campaign);
      if (campaign) {
        await NotificationService.notifyNewDonation(
          campaign,
          donation.amount,
          donation.isAnonymous ? 'An Anonymous Supporter' : donation.donorName
        );

        if (campaign.status === 'GOAL_REACHED') {
          await NotificationService.notifyGoalReached(campaign);
        }
      }
    }

    res.json({
      success: true,
      message: result.message,
      donation: result.donation,
      transactionReference: result.transactionReference,
      alreadyVerified: Boolean(result.alreadyVerified),
      mode: result.mode,
    });
  } catch (error) {
    next(error);
  }
};

exports.failDonationPayment = async (req, res, next) => {
  try {
    const { donationId, orderId, reason, isSimulated } = req.body;

    if (!donationId && !orderId) {
      return res.status(400).json({ success: false, message: 'Please provide donationId or orderId.' });
    }

    const result = await PaymentService.failPayment({
      donationId,
      orderId,
      reason,
      isSimulated: Boolean(isSimulated),
    });

    res.json({
      success: true,
      message: result.message,
      donation: result.donation,
      transactionReference: result.transactionReference,
      mode: result.mode,
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelDonationOrder = async (req, res, next) => {
  try {
    const { donationId, orderId, reason } = req.body;
    if (!donationId && !orderId) {
      return res.status(400).json({ success: false, message: 'Missing donationId or orderId.' });
    }

    const result = await PaymentService.failPayment({
      donationId,
      orderId,
      reason: reason || 'Payment cancelled by user in checkout.',
      isSimulated: false,
    });

    res.json({
      success: true,
      message: 'Donation order cancelled.',
      donation: result.donation,
      transactionReference: result.transactionReference,
    });
  } catch (error) {
    next(error);
  }
};

exports.handleRazorpayWebhook = async (req, res, next) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    if (!webhookSignature) {
      return res.status(400).json({ success: false, message: 'Missing x-razorpay-signature header.' });
    }

    const rawBody = req.rawBody || req.body;
    const result = await PaymentService.handleWebhook(rawBody, webhookSignature);

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[Razorpay Webhook Error]', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMyDonations = async (req, res, next) => {
  try {
    const query = {
      $or: [
        { donor: req.user._id },
        { donorEmail: (req.user.email || '').toLowerCase() },
      ],
    };
    const donations = await Donation.find(query)
      .populate('campaign', 'title category targetAmount collectedAmount images status')
      .sort({ createdAt: -1 });

    res.json({ success: true, donations });
  } catch (error) {
    next(error);
  }
};

exports.getCampaignDonations = async (req, res, next) => {
  try {
    const donations = await Donation.find({
      campaign: req.params.campaignId,
      paymentStatus: 'SUCCESS',
    })
      .select('amount isAnonymous donorName message transactionReference createdAt')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, donations });
  } catch (error) {
    next(error);
  }
};
