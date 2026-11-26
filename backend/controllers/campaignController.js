const path = require('path');
const Campaign = require('../models/Campaign');
const Document = require('../models/Document');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const Donation = require('../models/Donation');
const AIService = require('../services/aiService');
const NotificationService = require('../services/notificationService');

exports.createCampaign = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      targetAmount,
      deadline,
      beneficiaryName,
      beneficiaryRelationship,
      contactDetails,
    } = req.body;

    if (!title || !description || !category || !targetAmount || !deadline || !beneficiaryName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, category, targetAmount, deadline, beneficiaryName.',
      });
    }

    // Process uploaded images & documents
    const images = [];
    const documentFiles = [];

    if (req.files) {
      if (req.files.images) {
        req.files.images.forEach(f => {
          images.push(`/uploads/images/${f.filename}`);
        });
      }
      if (req.files.documents) {
        req.files.documents.forEach(f => {
          documentFiles.push(f);
        });
      }
    }

    // Default placeholder image if none uploaded
    if (images.length === 0) {
      images.push('https://images.unsplash.com/photo-1532629345422-7515f3d16bb9?auto=format&fit=crop&w=1000&q=80');
    }

    const campaign = new Campaign({
      title,
      description,
      category,
      targetAmount: Number(targetAmount),
      collectedAmount: 0,
      remainingAmount: Number(targetAmount),
      deadline: new Date(deadline),
      beneficiaryName,
      beneficiaryRelationship: beneficiaryRelationship || 'Self',
      contactDetails: contactDetails || '',
      images,
      creator: req.user._id,
      status: 'PENDING_VERIFICATION',
    });

    await campaign.save();

    // Process and associate documents
    const createdDocuments = [];
    for (const f of documentFiles) {
      const doc = new Document({
        campaign: campaign._id,
        fileName: f.originalname,
        fileUrl: `/uploads/documents/${f.filename}`,
        localPath: f.path,
        fileType: f.mimetype,
        fileSize: f.size,
        uploadedBy: req.user._id,
        status: 'PROCESSING',
      });

      // Trigger AI OCR & Entity extraction
      const extraction = await AIService.extractDocument(f.path, f.originalname, {
        title: campaign.title,
        beneficiaryName: campaign.beneficiaryName,
        targetAmount: campaign.targetAmount,
        category: campaign.category,
      });

      doc.extractedText = extraction.extracted_text || '';
      doc.ocrData = extraction.entities || {};
      doc.aiWarnings = extraction.warnings || [];
      doc.status = (extraction.warnings && extraction.warnings.length > 0) ? 'INCONSISTENCY_DETECTED' : 'VERIFIED';

      await doc.save();
      createdDocuments.push(doc);
      campaign.documents.push(doc._id);
    }

    // Fetch existing campaigns for AI similarity detection
    const existingCampaigns = await Campaign.find({ _id: { $ne: campaign._id } })
      .select('title description category beneficiaryName targetAmount')
      .limit(50);

    // Trigger AI Risk Assessment
    const riskAssessment = await AIService.assessRisk({
      ...campaign.toObject(),
      documents: createdDocuments,
    }, existingCampaigns);

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

    // Notify creator
    await NotificationService.notifyCampaignSubmitted(campaign);

    // Audit log
    await AuditLog.create({
      action: 'CAMPAIGN_CREATED',
      performedBy: req.user._id,
      targetType: 'CAMPAIGN',
      targetId: campaign._id.toString(),
      details: { title: campaign.title, riskScore: campaign.riskScore, riskLevel: campaign.riskLevel },
    });

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully and submitted for intelligent verification.',
      campaign,
    });
  } catch (error) {
    next(error);
  }
};

exports.getPublicCampaigns = async (req, res, next) => {
  try {
    const { category, search, sort = 'createdAt', page = 1, limit = 9 } = req.query;

    const query = {
      status: { $in: ['APPROVED', 'ACTIVE', 'GOAL_REACHED'] },
    };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { beneficiaryName: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const sortOptions = {};
    if (sort === 'targetAmountAsc') sortOptions.targetAmount = 1;
    else if (sort === 'targetAmountDesc') sortOptions.targetAmount = -1;
    else if (sort === 'deadline') sortOptions.deadline = 1;
    else if (sort === 'collected') sortOptions.collectedAmount = -1;
    else sortOptions.createdAt = -1;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 9;
    const skip = (pageNum - 1) * limitNum;

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate('creator', 'name avatar')
        .sort(sortOptions)
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

exports.getCampaignById = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('creator', 'name email phone avatar isVerified')
      .populate('documents');

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    // Only creator or admin can view unapproved campaigns
    if (!['APPROVED', 'ACTIVE', 'GOAL_REACHED', 'COMPLETED'].includes(campaign.status)) {
      if (!req.user || (req.user.role !== 'admin' && campaign.creator._id.toString() !== req.user.id)) {
        return res.status(403).json({
          success: false,
          message: 'This campaign is pending verification and is not publicly accessible.',
        });
      }
    }

    res.json({ success: true, campaign });
  } catch (error) {
    next(error);
  }
};

exports.getMyCampaigns = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find({ creator: req.user._id })
      .populate('documents')
      .sort({ createdAt: -1 });

    res.json({ success: true, campaigns });
  } catch (error) {
    next(error);
  }
};

exports.updateCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    if (campaign.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this campaign.' });
    }

    const { title, description, category, targetAmount, deadline, beneficiaryName, beneficiaryRelationship, contactDetails } = req.body;

    if (title) campaign.title = title;
    if (description) campaign.description = description;
    if (category) campaign.category = category;
    if (targetAmount) campaign.targetAmount = Number(targetAmount);
    if (deadline) campaign.deadline = new Date(deadline);
    if (beneficiaryName) campaign.beneficiaryName = beneficiaryName;
    if (beneficiaryRelationship) campaign.beneficiaryRelationship = beneficiaryRelationship;
    if (contactDetails) campaign.contactDetails = contactDetails;

    // If campaign was in ADDITIONAL_INFORMATION_REQUIRED, resubmit for review
    if (campaign.status === 'ADDITIONAL_INFORMATION_REQUIRED') {
      campaign.status = 'PENDING_VERIFICATION';
    }

    await campaign.save();

    res.json({ success: true, message: 'Campaign updated successfully.', campaign });
  } catch (error) {
    next(error);
  }
};

exports.reportCampaign = async (req, res, next) => {
  try {
    const { reason, details } = req.body;
    const campaignId = req.params.id;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Please provide a reason for the report.' });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    const report = await Report.create({
      campaign: campaign._id,
      reportedBy: req.user._id,
      reason,
      details: details || '',
      status: 'PENDING',
    });

    campaign.isFlagged = true;
    await campaign.save();

    res.status(201).json({
      success: true,
      message: 'Report submitted. Our integrity and compliance team will investigate.',
      report,
    });
  } catch (error) {
    next(error);
  }
};

exports.getPlatformStats = async (req, res, next) => {
  try {
    const [
      totalCampaigns,
      activeCampaigns,
      donationsAgg,
      totalUsers,
    ] = await Promise.all([
      Campaign.countDocuments({ status: { $in: ['APPROVED', 'ACTIVE', 'GOAL_REACHED', 'COMPLETED'] } }),
      Campaign.countDocuments({ status: 'ACTIVE' }),
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
      User.countDocuments(),
    ]);

    const totalAmount = donationsAgg.length > 0 ? donationsAgg[0].totalAmount : 0;
    const totalDonations = donationsAgg.length > 0 ? donationsAgg[0].totalDonations : 0;

    res.json({
      success: true,
      stats: {
        totalRaised: totalAmount,
        activeCampaigns: activeCampaigns,
        totalDonations: totalDonations,
        verifiedCauses: totalCampaigns,
        communityMembers: totalUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};
