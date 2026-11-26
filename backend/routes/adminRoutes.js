const express = require('express');
const router = express.Router();
const {
  getAllCampaigns,
  reviewCampaign,
  reassessRisk,
  verifyDocument,
  getUsers,
  getReports,
  updateReport,
  getSettlements,
  simulateSettlement,
  getAnalytics,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication and 'admin' role
router.use(protect);
router.use(authorize('admin'));

router.get('/campaigns', getAllCampaigns);
router.put('/campaigns/:id/review', reviewCampaign);
router.post('/campaigns/:id/reassess-risk', reassessRisk);
router.put('/documents/:id/verify', verifyDocument);
router.get('/users', getUsers);
router.get('/reports', getReports);
router.put('/reports/:id', updateReport);
router.get('/settlements', getSettlements);
router.post('/settlements/simulate', simulateSettlement);
router.get('/analytics', getAnalytics);

module.exports = router;
