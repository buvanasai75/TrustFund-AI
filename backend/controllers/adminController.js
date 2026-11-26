const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Document = require('../models/Document');
const Donation = require('../models/Donation');
const Settlement = require('../models/Settlement');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const NotificationService = require('../services/notificationService');
const AIService = require('../services/aiService');

exports.getAllCampaigns = async (req, res, next) => {
  try {
    const { status, riskLevel, isFlagged, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (riskLevel && riskLevel !== 'ALL') {
      query.riskLevel = riskLevel;
    }
    if (isFlagged === 'true') {
      query.isFlagged = true;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate('creator', 'name email phone')
        .populate('documents')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Campaign.countDocuments(query),
    ]);

    res.json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      campaigns,
    });
  } catch (error) {
    next(error);
  }
};

exports.reviewCampaign = async (req, res, next) => {
  try {
    const { action, notes } = req.body; // action: 'APPROVE', 'REJECT', 'REQUEST_INFO'
    const campaignId = req.params.id;

    const campaign = await Campaign.findById(campaignId).populate('creator', 'name email');
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    if (action === 'APPROVE') {
      campaign.status = 'ACTIVE';
      campaign.verificationNotes = notes || 'Campaign verified and approved by administrator.';
      await campaign.save();
      await NotificationService.notifyCampaignApproved(campaign);
    } else if (action === 'REJECT') {
      campaign.status = 'REJECTED';
      campaign.verificationNotes = notes || 'Verification criteria not met.';
      await campaign.save();
      await NotificationService.notifyCampaignRejected(campaign, notes);
    } else if (action === 'REQUEST_INFO') {
      campaign.status = 'ADDITIONAL_INFORMATION_REQUIRED';
      campaign.requestedInfoNotes = notes || 'Additional supporting documents or details needed.';
      await campaign.save();
      await NotificationService.notifyInfoRequested(campaign, notes);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action. Choose APPROVE, REJECT, or REQUEST_INFO.' });
    }

    await AuditLog.create({
      action: `CAMPAIGN_${action}`,
      performedBy: req.user._id,
      targetType: 'CAMPAIGN',
      targetId: campaign._id.toString(),
      details: { notes, newStatus: campaign.status },
    });

    res.json({
      success: true,
      message: `Campaign successfully updated with status: ${campaign.status}`,
      campaign,
    });
  } catch (error) {
    next(error);
  }
};

exports.reassessRisk = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('documents');
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    const existingCampaigns = await Campaign.find({ _id: { $ne: campaign._id } })
      .select('title description category beneficiaryName targetAmount')
      .limit(50);

    const riskAssessment = await AIService.assessRisk(campaign.toObject(), existingCampaigns);

    campaign.riskScore = riskAssessment.risk_score;
    campaign.riskLevel = riskAssessment.risk_level;
    campaign.fraudReasons = riskAssessment.reasons || [];
    campaign.similarCampaigns = (riskAssessment.similar_campaigns || []).map(s => ({
      campaignId: s.campaign_id,
      title: s.title,
      similarityScore: s.similarity_score,
      similarityPercentage: s.similarity_percentage,
    }));
    campaign.aiRecommendation = riskAssessment.recommendation;
    campaign.isFlagged = riskAssessment.risk_level === 'HIGH' || riskAssessment.risk_score >= 60;

    await campaign.save();

    await AuditLog.create({
      action: 'AI_RISK_REASSESSED',
      performedBy: req.user._id,
      targetType: 'CAMPAIGN',
      targetId: campaign._id.toString(),
      details: { riskScore: campaign.riskScore, riskLevel: campaign.riskLevel },
    });

    res.json({
      success: true,
      message: 'AI risk assessment successfully updated.',
      campaign,
      assessment: riskAssessment,
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyDocument = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body; // status: 'VERIFIED', 'REJECTED'
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    doc.adminVerificationStatus = status === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    doc.status = status === 'APPROVED' ? 'VERIFIED' : 'REJECTED';
    if (adminNotes) doc.adminNotes = adminNotes;
    await doc.save();

    res.json({ success: true, message: 'Document verification updated.', document: doc });
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

exports.getReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .populate('campaign', 'title status riskScore')
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (error) {
    next(error);
  }
};

exports.updateReport = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    if (status) report.status = status;
    if (adminNotes) report.adminNotes = adminNotes;
    await report.save();

    res.json({ success: true, message: 'Report status updated.', report });
  } catch (error) {
    next(error);
  }
};

exports.getSettlements = async (req, res, next) => {
  try {
    const settlements = await Settlement.find()
      .populate('campaign', 'title category targetAmount collectedAmount status')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, settlements });
  } catch (error) {
    next(error);
  }
};

exports.simulateSettlement = async (req, res, next) => {
  try {
    const { campaignId, notes, bankDetails } = req.body;
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    if (campaign.collectedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot settle campaign with ₹0 raised funds.',
      });
    }

    // Generate unique settlement reference
    const ref = `SIM_STL_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const settlement = await Settlement.create({
      campaign: campaign._id,
      beneficiaryName: campaign.beneficiaryName,
      amountRaised: campaign.collectedAmount,
      amountApproved: campaign.collectedAmount,
      settlementDate: new Date(),
      settlementReference: ref,
      status: 'SIMULATED_SUCCESS',
      mode: 'SIMULATED',
      bankDetails: bankDetails || {
        accountHolderName: campaign.beneficiaryName,
        accountNumber: 'XXXX-XXXX-9842',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank (Simulated)',
      },
      reviewedBy: req.user._id,
      notes: notes || 'Beneficiary disbursement approved and executed.',
    });

    campaign.status = 'COMPLETED';
    await campaign.save();

    await NotificationService.notifySettlementUpdated(campaign, 'SIMULATED_SUCCESS', ref);

    await AuditLog.create({
      action: 'SETTLEMENT_SIMULATED',
      performedBy: req.user._id,
      targetType: 'SETTLEMENT',
      targetId: settlement._id.toString(),
      details: { campaignId: campaign._id, amount: campaign.collectedAmount, reference: ref },
    });

    res.status(201).json({
      success: true,
      message: 'Beneficiary settlement approved and processed successfully.',
      settlement,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalCreators,
      totalDonors,
      totalCampaigns,
      pendingCampaigns,
      approvedCampaigns,
      rejectedCampaigns,
      activeCampaigns,
      completedCampaigns,
      flaggedCampaigns,
      donationsAgg,
      failedDonations,
      riskDistributionAgg,
      categoryAgg,
      settlementsAgg,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'creator' }),
      User.countDocuments({ role: 'donor' }),
      Campaign.countDocuments(),
      Campaign.countDocuments({ status: { $in: ['PENDING_VERIFICATION', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED'] } }),
      Campaign.countDocuments({ status: { $in: ['APPROVED', 'ACTIVE'] } }),
      Campaign.countDocuments({ status: 'REJECTED' }),
      Campaign.countDocuments({ status: 'ACTIVE' }),
      Campaign.countDocuments({ status: { $in: ['GOAL_REACHED', 'COMPLETED'] } }),
      Campaign.countDocuments({ isFlagged: true }),
      Donation.aggregate([
        { $match: { paymentStatus: 'SUCCESS' } },
        {
          $group: {
            _id: null,
            totalDonations: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
      Donation.countDocuments({ paymentStatus: { $in: ['FAILED', 'CANCELLED'] } }),
      Campaign.aggregate([
        {
          $group: {
            _id: '$riskLevel',
            count: { $sum: 1 },
          },
        },
      ]),
      Campaign.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalRaised: { $sum: '$collectedAmount' },
          },
        },
      ]),
      Settlement.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalSettled: { $sum: '$amountApproved' },
          },
        },
      ]),
    ]);

    const totalDonationsCount = donationsAgg[0]?.totalDonations || 0;
    const totalAmountRaised = donationsAgg[0]?.totalAmount || 0;

    // Format risk distribution
    const riskStats = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    riskDistributionAgg.forEach(r => {
      if (r._id) riskStats[r._id] = r.count;
    });

    // Recent donations for timeline chart
    const recentDonations = await Donation.aggregate([
      { $match: { paymentStatus: 'SUCCESS' } },
      { $sort: { createdAt: -1 } },
      { $limit: 15 },
      {
        $project: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          amount: '$amount',
        },
      },
    ]);

    res.json({
      success: true,
      metrics: {
        totalUsers,
        totalCreators,
        totalDonors,
        totalCampaigns,
        pendingCampaigns,
        approvedCampaigns,
        rejectedCampaigns,
        activeCampaigns,
        completedCampaigns,
        flaggedCampaigns,
        totalDonations: totalDonationsCount,
        totalAmountRaised,
        failedDonations,
      },
      riskDistribution: [
        { name: 'Low Risk', value: riskStats.LOW, fill: '#10B981' },
        { name: 'Medium Risk', value: riskStats.MEDIUM, fill: '#F59E0B' },
        { name: 'High Risk', value: riskStats.HIGH, fill: '#EF4444' },
      ],
      categoryBreakdown: categoryAgg.map(c => ({
        category: c._id,
        count: c.count,
        raised: c.totalRaised,
      })),
      recentDonationsTimeline: recentDonations.reverse(),
      settlementStats: settlementsAgg,
    });
  } catch (error) {
    next(error);
  }
};
