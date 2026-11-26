const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Document = require('../models/Document');
const Donation = require('../models/Donation');
const Payment = require('../models/Payment');
const Settlement = require('../models/Settlement');
const Notification = require('../models/Notification');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seed] Clearing existing demo collections...');

    await Promise.all([
      User.deleteMany({}),
      Campaign.deleteMany({}),
      Document.deleteMany({}),
      Donation.deleteMany({}),
      Payment.deleteMany({}),
      Settlement.deleteMany({}),
      Notification.deleteMany({}),
      Report.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('[Seed] Creating demo accounts (neutral profile initials)...');

    const admin = await User.create({
      name: 'System Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@crowdfund.ai',
      password: process.env.ADMIN_PASSWORD || 'Admin@Secure2026!',
      role: 'admin',
      phone: '+91 98765 43210',
      avatar: '',
      isVerified: true,
    });

    const creator = await User.create({
      name: 'Dr. Priya Sharma',
      email: 'creator@crowdfund.ai',
      password: 'Creator@Pass2026!',
      role: 'creator',
      phone: '+91 98111 22334',
      avatar: '',
      isVerified: true,
    });

    const donor = await User.create({
      name: 'Aarav Patel',
      email: 'donor@crowdfund.ai',
      password: 'Donor@Pass2026!',
      role: 'donor',
      phone: '+91 99887 66554',
      avatar: '',
      isVerified: true,
    });

    console.log('[Seed] Creating sample verified campaigns and documents...');

    // 1. Campaign: Medical (Active, Approved) - Clean medical equipment illustration
    const medDoc = await Document.create({
      campaign: new mongoose.Types.ObjectId(),
      fileName: 'apollo_hospital_estimate_ramesh.pdf',
      fileUrl: '/uploads/documents/apollo_estimate_sample.pdf',
      fileType: 'application/pdf',
      fileSize: 245000,
      extractedText: 'Apollo Hospitals Chennai. Estimate Certificate for Ramesh Kumar (Age 52). Diagnosis: Coronary Artery Disease. Treatment: CABG Open Heart Surgery. Total Estimate Cost: INR 60,000. Date: 12/11/2026. Authorized by Dr. M. Swaminathan.',
      ocrData: {
        beneficiaryName: 'Ramesh Kumar',
        institutionName: 'Apollo Hospitals Chennai',
        billAmount: 60000,
        documentDate: '12/11/2026',
        key_terms: ['treatment', 'surgery', 'estimate'],
      },
      aiWarnings: [],
      status: 'VERIFIED',
      adminVerificationStatus: 'APPROVED',
      adminNotes: 'Hospital estimate verified with Apollo administration.',
      uploadedBy: creator._id,
    });

    const medCampaign = await Campaign.create({
      title: 'Emergency Open Heart Surgery Support for Ramesh Kumar',
      description: 'My father Ramesh Kumar has been diagnosed with severe coronary artery disease requiring urgent open-heart surgery at Apollo Hospitals. We need financial assistance of ₹60,000 to cover the remaining surgical estimate.',
      category: 'Medical',
      targetAmount: 60000,
      collectedAmount: 25000,
      remainingAmount: 35000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      beneficiaryName: 'Ramesh Kumar',
      beneficiaryRelationship: 'Father',
      contactDetails: 'dr.priya.sharma@example.com / +91 98111 22334',
      images: [
        'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1000&q=80'
      ],
      documents: [medDoc._id],
      creator: creator._id,
      status: 'ACTIVE',
      donationCount: 2,
      riskScore: 12,
      riskLevel: 'LOW',
      fraudReasons: ['No immediate risk flags detected. Campaign meets standard integrity heuristics.'],
      aiRecommendation: 'Low risk. Campaign details and documentation appear consistent. Proceed with standard approval.',
      verificationNotes: 'Approved by Administrator after hospital document verification.',
    });

    medDoc.campaign = medCampaign._id;
    await medDoc.save();

    // 2. Campaign: Education (Goal Reached, Eligible for Settlement) - Books and graduation setting
    const eduDoc = await Document.create({
      campaign: new mongoose.Types.ObjectId(),
      fileName: 'iit_admission_fee_structure.pdf',
      fileUrl: '/uploads/documents/iit_fee_structure.pdf',
      fileType: 'application/pdf',
      fileSize: 180000,
      extractedText: 'Indian Institute of Technology. Official Semester Fee Structure for Student: Sneha Verma. Program: M.Tech Computer Science. Total Tuition and Hostel Fees: ₹1,50,000. Verified by Academic Registrar.',
      ocrData: {
        beneficiaryName: 'Sneha Verma',
        institutionName: 'Indian Institute of Technology',
        billAmount: 150000,
        documentDate: '01/11/2026',
        key_terms: ['tuition', 'semester', 'admission'],
      },
      aiWarnings: [],
      status: 'VERIFIED',
      adminVerificationStatus: 'APPROVED',
      uploadedBy: creator._id,
    });

    const eduCampaign = await Campaign.create({
      title: 'Higher Education Scholarship for Sneha Verma at IIT',
      description: 'Sneha Verma secured an All India Rank in GATE and received admission into M.Tech at IIT. Coming from an underprivileged rural background, she requires ₹1,50,000 for her initial semester and laboratory fees.',
      category: 'Education',
      targetAmount: 150000,
      collectedAmount: 150000,
      remainingAmount: 0,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      beneficiaryName: 'Sneha Verma',
      beneficiaryRelationship: 'Student Mentee',
      contactDetails: '+91 97766 55443',
      images: [
        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80'
      ],
      documents: [eduDoc._id],
      creator: creator._id,
      status: 'GOAL_REACHED',
      donationCount: 3,
      riskScore: 8,
      riskLevel: 'LOW',
      fraudReasons: ['Clean submission with verified university fee structure.'],
      aiRecommendation: 'Low risk. Verified educational documentation.',
      verificationNotes: 'Approved. Target achieved successfully.',
    });

    eduDoc.campaign = eduCampaign._id;
    await eduDoc.save();

    // 3. Campaign: High Risk / Flagged Campaign - Emergency food supply relief
    const flaggedCampaign = await Campaign.create({
      title: 'Urgent Urgent Cash Required No Questions Asked',
      description: 'Need urgent money for personal emergency. Please transfer funds immediately.',
      category: 'Emergency',
      targetAmount: 300000,
      collectedAmount: 0,
      remainingAmount: 300000,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      beneficiaryName: 'Unknown',
      beneficiaryRelationship: 'Friend',
      images: [
        'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1000&q=80'
      ],
      documents: [],
      creator: creator._id,
      status: 'UNDER_REVIEW',
      donationCount: 0,
      riskScore: 88,
      riskLevel: 'HIGH',
      isFlagged: true,
      fraudReasons: [
        'Missing supporting documents: No verification documents uploaded.',
        'Vague or unusually brief campaign description (under 60 characters).',
        'Missing or incomplete beneficiary name.',
        'High funding target with zero supporting evidence.'
      ],
      aiRecommendation: 'High risk detected. In-depth manual review and request for additional primary documentation required before approval.',
      verificationNotes: 'Under integrity investigation due to AI risk flags.',
    });

    // 4. Campaign: Pending Verification (Under Admin Review)
    const pendingCampaign = await Campaign.create({
      title: 'Solar Powered Irrigation Unit for Rural Farmers in Vidarbha',
      description: 'We are installing an eco-friendly solar submersible pump system for 20 smallholder farming families in drought-prone Vidarbha to secure clean year-round crop irrigation.',
      category: 'Social Causes',
      targetAmount: 85000,
      collectedAmount: 0,
      remainingAmount: 85000,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      beneficiaryName: 'Vidarbha Farmers Cooperative',
      beneficiaryRelationship: 'Community Organizer',
      contactDetails: '+91 94221 00998',
      images: [
        'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1000&q=80'
      ],
      documents: [],
      creator: creator._id,
      status: 'PENDING_VERIFICATION',
      donationCount: 0,
      riskScore: 22,
      riskLevel: 'LOW',
      fraudReasons: ['Standard community development proposal. Documents under primary review.'],
      aiRecommendation: 'Low-to-moderate risk. Verify cooperative registration certificate.',
      verificationNotes: 'Pending administrator queue review.',
    });

    // Seed Donations
    const don1 = await Donation.create({
      campaign: medCampaign._id,
      donor: donor._id,
      amount: 15000,
      paymentStatus: 'SUCCESS',
      orderId: 'order_demo_1001',
      paymentId: 'pay_demo_2001',
      signature: 'sig_demo_3001',
      paymentMode: 'DEMO_MODE',
      donorName: 'Aarav Patel',
      donorEmail: 'donor@crowdfund.ai',
      message: 'Wishing your father a speedy recovery! Stay strong.',
    });

    const don2 = await Donation.create({
      campaign: medCampaign._id,
      amount: 10000,
      paymentStatus: 'SUCCESS',
      orderId: 'order_demo_1002',
      paymentId: 'pay_demo_2002',
      signature: 'sig_demo_3002',
      paymentMode: 'DEMO_MODE',
      isAnonymous: true,
      donorName: 'Generous Supporter',
      message: 'Prayers with your family.',
    });

    const don3 = await Donation.create({
      campaign: medCampaign._id,
      donor: donor._id,
      amount: 5000,
      paymentStatus: 'FAILED',
      orderId: 'order_demo_1003',
      paymentMode: 'RAZORPAY_TEST',
      donorName: 'Aarav Patel',
      donorEmail: 'donor@crowdfund.ai',
      message: 'Cancelled by user during checkout',
    });

    // Seed Notifications
    await Notification.create({
      recipient: creator._id,
      title: 'Campaign Approved & Active',
      message: `Your campaign "${medCampaign.title}" has been verified and is now live for public donations!`,
      type: 'CAMPAIGN_APPROVED',
      relatedId: medCampaign._id.toString(),
    });

    await Notification.create({
      recipient: creator._id,
      title: 'Fundraising Target Achieved!',
      message: `Your campaign "${eduCampaign.title}" has reached 100% of its target goal! It is ready for simulated settlement.`,
      type: 'GOAL_REACHED',
      relatedId: eduCampaign._id.toString(),
    });

    console.log('[Seed] Database populated successfully with demo data!');
    console.log('[Seed] Admin Login:   admin@crowdfund.ai   / Admin@Secure2026!');
    console.log('[Seed] Creator Login: creator@crowdfund.ai / Creator@Pass2026!');
    console.log('[Seed] Donor Login:   donor@crowdfund.ai   / Donor@Pass2026!');

    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
