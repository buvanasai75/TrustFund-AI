const express = require('express');
const router = express.Router();
const {
  getPaymentConfig,
  createDonationOrder,
  verifyDonationPayment,
  failDonationPayment,
  cancelDonationOrder,
  handleRazorpayWebhook,
  getMyDonations,
  getCampaignDonations,
} = require('../controllers/donationController');
const { protect } = require('../middleware/auth');

const optionalProtect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
};

router.get('/config', getPaymentConfig);
router.post('/order', optionalProtect, createDonationOrder);
router.post('/verify', optionalProtect, verifyDonationPayment);
router.post('/fail', optionalProtect, failDonationPayment);
router.post('/cancel', optionalProtect, cancelDonationOrder);
router.post('/webhook', handleRazorpayWebhook);
router.get('/my', protect, getMyDonations);
router.get('/campaign/:campaignId', getCampaignDonations);

module.exports = router;
