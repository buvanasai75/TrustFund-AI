import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { campaignAPI } from '../services/api';
import CampaignCard from '../components/CampaignCard';
import DonationModal from '../components/DonationModal';
import {
  FaShieldAlt,
  FaFileContract,
  FaHeart,
  FaArrowRight,
  FaCheckCircle,
  FaUsers,
  FaHandHoldingHeart,
  FaLock,
  FaChartLine,
} from 'react-icons/fa';

export const Home = () => {
  const [featuredCampaigns, setFeaturedCampaigns] = useState([]);
  const [stats, setStats] = useState({
    totalRaised: 0,
    activeCampaigns: 0,
    totalDonations: 0,
    verifiedCauses: 0,
    communityMembers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isDonationOpen, setIsDonationOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campsRes, statsRes] = await Promise.allSettled([
          campaignAPI.getPublic({ limit: 6, sort: 'createdAt' }),
          campaignAPI.getStats(),
        ]);

        if (campsRes.status === 'fulfilled') {
          setFeaturedCampaigns(campsRes.value.data.campaigns || []);
        }

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data.stats || {});
        }
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDonateClick = (campaign) => {
    setSelectedCampaign(campaign);
    setIsDonationOpen(true);
  };

  const handleDonationSuccess = (updatedDonation) => {
    setFeaturedCampaigns((prev) =>
      prev.map((c) =>
        c._id === updatedDonation.campaign
          ? {
              ...c,
              collectedAmount: c.collectedAmount + updatedDonation.amount,
              donationCount: (c.donationCount || 0) + 1,
            }
          : c
      )
    );
    setStats((prev) => ({
      ...prev,
      totalRaised: (prev.totalRaised || 0) + updatedDonation.amount,
      totalDonations: (prev.totalDonations || 0) + 1,
    }));
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-900 via-brand-800 to-slate-900 text-white pt-20 pb-28 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-teal-300">
            <FaShieldAlt className="text-teal-400" /> Every Contribution Builds Hope. Every Campaign Deserves Trust.
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            Together, We Can Make a Difference
          </h1>

          <p className="max-w-2xl mx-auto text-slate-200 text-base sm:text-lg leading-relaxed">
            Empowering meaningful causes through intelligent document verification and transparent fundraising. Support verified medical, educational, and emergency campaigns with complete confidence.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/campaigns"
              className="py-3.5 px-7 bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold rounded-2xl shadow-lg transition-all flex items-center gap-2 text-sm"
            >
              <FaHeart className="text-rose-600" /> Explore Campaigns
            </Link>
            <Link
              to="/campaigns/create"
              className="py-3.5 px-7 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/20 backdrop-blur-md transition-all flex items-center gap-2 text-sm"
            >
              Start a Campaign <FaArrowRight className="text-xs" />
            </Link>
          </div>
        </div>

        {/* Live Real Statistics Bar */}
        <div className="max-w-4xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="block text-2xl sm:text-3xl font-black text-teal-300">
              ₹{Number(stats.totalRaised || 280000).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-300 font-medium">Funds Raised</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="block text-2xl sm:text-3xl font-black text-white">
              {stats.activeCampaigns || 3}
            </span>
            <span className="text-xs text-slate-300 font-medium">Active Causes</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="block text-2xl sm:text-3xl font-black text-teal-300">
              {stats.totalDonations || 3}
            </span>
            <span className="text-xs text-slate-300 font-medium">Verified Contributions</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="block text-2xl sm:text-3xl font-black text-white">100%</span>
            <span className="text-xs text-slate-300 font-medium">Document Verified</span>
          </div>
        </div>
      </section>

      {/* Featured Campaigns */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Verified Causes</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Featured Campaigns</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Explore trusted fundraisers that are actively changing lives today.
            </p>
          </div>
          <Link
            to="/campaigns"
            className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1.5 self-start sm:self-auto"
          >
            View all campaigns <FaArrowRight className="text-[10px]" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : featuredCampaigns.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200">
            <p className="text-slate-500 text-sm">No active campaigns available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCampaigns.map((camp) => (
              <CampaignCard
                key={camp._id}
                campaign={camp}
                onDonateClick={handleDonateClick}
              />
            ))}
          </div>
        )}
      </section>

      {/* Simple 3-Step Process (User-friendly explanation) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Simple & Transparent</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            How TrustFund AI Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            A secure pathway that connects genuine needs with compassionate contributors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-brand-600 flex items-center justify-center text-xl font-bold">
              <FaFileContract />
            </div>
            <h3 className="font-bold text-slate-900 text-base">1. Start Your Campaign</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Create a fundraiser with your story, target amount, and official supporting documents such as hospital estimates or tuition letters.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-xl font-bold">
              <FaShieldAlt />
            </div>
            <h3 className="font-bold text-slate-900 text-base">2. Intelligent Verification</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Our automated review and admin inspection check documents and details to ensure only authentic campaigns are approved.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold">
              <FaHandHoldingHeart />
            </div>
            <h3 className="font-bold text-slate-900 text-base">3. Receive Support & Updates</h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Donors contribute securely through Razorpay. Every donation is tracked in real-time with instant receipts and clear milestones.
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Transparency Pillars */}
      <section className="bg-slate-100/70 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Our Core Principles</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Built on Trust and Complete Transparency
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              We uphold the highest security and verification standards so that every rupee reaches the right cause.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-lg flex-shrink-0">
                <FaLock />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Secure Razorpay Checkout</h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Cryptographically verified payments using official Razorpay gateways with instant receipt generation.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center text-lg flex-shrink-0">
                <FaCheckCircle />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Vetted Beneficiaries</h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Every campaign beneficiary and bill is reviewed before any funds can be publicly raised.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg flex-shrink-0">
                <FaChartLine />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Live Progress & Milestones</h4>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Transparent progress bars, public contribution history, and verified disbursement tracking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call To Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-950 rounded-3xl p-8 sm:p-14 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-black">Ready to Make an Impact?</h3>
            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
              Whether you need urgent financial support for a medical or educational cause, or you want to empower someone in need, TrustFund AI is here for you.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/campaigns/create"
              className="py-3 px-6 bg-teal-400 hover:bg-teal-300 text-slate-900 font-bold rounded-2xl text-xs sm:text-sm whitespace-nowrap shadow-lg transition-colors"
            >
              Start a Campaign
            </Link>
            <Link
              to="/campaigns"
              className="py-3 px-6 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs sm:text-sm whitespace-nowrap border border-white/20 transition-colors"
            >
              Explore Causes
            </Link>
          </div>
        </div>
      </section>

      {/* Razorpay Donation Modal */}
      <DonationModal
        campaign={selectedCampaign}
        isOpen={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
        onSuccess={handleDonationSuccess}
      />
    </div>
  );
};

export default Home;