const express = require('express');
const router = express.Router();
const {
  createCampaign,
  getPublicCampaigns,
  getCampaignById,
  getMyCampaigns,
  updateCampaign,
  reportCampaign,
  getPlatformStats,
} = require('../controllers/campaignController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getPublicCampaigns);
router.get('/stats', getPlatformStats);
router.get('/my', protect, getMyCampaigns);
router.get('/:id', getCampaignById);

// Protected creator routes
router.post(
  '/',
  protect,
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'documents', maxCount: 5 },
  ]),
  createCampaign
);

router.put('/:id', protect, updateCampaign);
router.post('/:id/report', protect, reportCampaign);

module.exports = router;
