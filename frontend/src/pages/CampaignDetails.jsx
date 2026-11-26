import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { campaignAPI, donationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import VerificationBadge from '../components/VerificationBadge';
import RiskBadge from '../components/RiskBadge';
import DonationModal from '../components/DonationModal';
import DocumentViewerModal from '../components/DocumentViewerModal';
import {
  FaHeart,
  FaCalendarAlt,
  FaUser,
  FaFileAlt,
  FaShieldAlt,
  FaFlag,
  FaCheckCircle,
  FaClock,
  FaShareAlt,
  FaExclamationCircle,
} from 'react-icons/fa';

export const CampaignDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');

  const fetchDetails = async () => {
    try {
      const [campRes, donRes] = await Promise.all([
        campaignAPI.getById(id),
        donationAPI.getCampaignDonations(id),
      ]);
      setCampaign(campRes.data.campaign);
      setDonations(donRes.data.donations || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load campaign.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleDonationSuccess = (newDonation) => {
    setCampaign((prev) => ({
      ...prev,
      collectedAmount: prev.collectedAmount + newDonation.amount,
      donationCount: prev.donationCount + 1,
    }));
    setDonations((prev) => [newDonation, ...prev]);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportReason) return;
    try {
      await campaignAPI.report(id, { reason: reportReason, details: reportDetails });
      setReportSuccess('Report submitted. Our integrity compliance team has flagged this campaign for review.');
      setTimeout(() => {
        setIsReportOpen(false);
        setReportSuccess('');
      }, 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit report.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-xs font-semibold">Loading verified campaign details...</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <FaExclamationCircle className="text-4xl text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Campaign Unavailable</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{error || 'This campaign could not be found.'}</p>
          <Link to="/campaigns" className="inline-block py-2 px-4 bg-brand-600 text-white rounded-xl text-xs font-bold">
            Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  const percent = campaign.targetAmount > 0
    ? Math.min(Math.round((campaign.collectedAmount / campaign.targetAmount) * 100), 100)
    : 0;

  const daysLeft = campaign.deadline
    ? Math.max(0, Math.ceil((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  const defaultCategoryImages = {
    Medical: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
    Education: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    Emergency: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
    Startup: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80',
    'Social Causes': 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80',
    Other: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80',
  };

  const isGoalReached = campaign.collectedAmount >= campaign.targetAmount || campaign.status === 'GOAL_REACHED';
  const mainImage = campaign.images?.[0] || defaultCategoryImages[campaign.category] || defaultCategoryImages.Medical;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner & Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-brand-50 text-brand-700 text-xs font-bold rounded-full border border-brand-200">
            {campaign.category}
          </span>
          <VerificationBadge status={campaign.status} />
          {user?.role === 'admin' && (
            <RiskBadge score={campaign.riskScore} level={campaign.riskLevel} />
          )}
        </div>

        <button
          onClick={() => setIsReportOpen(true)}
          className="text-xs font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors"
        >
          <FaFlag className="text-[10px]" /> Report suspicious campaign
        </button>
      </div>

      {/* Main Grid: Left content, Right fundraising card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {campaign.title}
            </h1>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <span>Organized by <strong>{campaign.creator?.name || 'Campaign Creator'}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FaCalendarAlt className="text-slate-400" />
                Created {new Date(campaign.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Main Campaign Image */}
          <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 max-h-[420px]">
            <img
              src={mainImage}
              alt={campaign.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = defaultCategoryImages[campaign.category] || defaultCategoryImages.Medical;
              }}
            />
          </div>

          {/* Beneficiary Card */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center text-xl font-bold">
                <FaUser />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Beneficiary</span>
                <h4 className="text-sm font-bold text-slate-800">{campaign.beneficiaryName}</h4>
                <p className="text-xs text-slate-500">Relationship: {campaign.beneficiaryRelationship}</p>
              </div>
            </div>
            {campaign.contactDetails && (
              <div className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                <strong>Contact:</strong> {campaign.contactDetails}
              </div>
            )}
          </div>

          {/* Story / Description */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">About the Fundraiser</h3>
            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {campaign.description}
            </p>
          </div>

          {/* Verified Supporting Documents */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FaShieldAlt className="text-teal-600" /> Supporting Documents & AI Verification
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Extracted via OCR text parsing and verified by administrators. Click to view OCR details.
                </p>
              </div>
            </div>

            {(!campaign.documents || campaign.documents.length === 0) ? (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-2xl">
                No supporting documents uploaded for this campaign.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {campaign.documents.map((doc) => (
                  <button
                    key={doc._id}
                    onClick={() => { setSelectedDocument(doc); setIsDocModalOpen(true); }}
                    className="p-4 bg-slate-50 hover:bg-brand-50/50 border border-slate-200 hover:border-brand-300 rounded-2xl text-left transition-all group flex items-start gap-3"
                  >
                    <div className="p-2.5 bg-white rounded-xl text-brand-600 shadow-sm group-hover:scale-105 transition-transform">
                      <FaFileAlt />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-slate-800 text-xs truncate block">{doc.fileName}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Status: <strong className="text-emerald-700">{doc.status}</strong>
                      </span>
                      {doc.ocrData?.billAmount && (
                        <span className="text-[10px] font-semibold text-slate-600 block">
                          Parsed Amount: ₹{Number(doc.ocrData.billAmount).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent Donors List */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FaHeart className="text-rose-500" /> Supporter Community ({donations.length})
            </h3>

            {donations.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-2xl">
                Be the first generous donor to support this verified campaign!
              </p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto custom-scrollbar">
                {donations.map((d) => (
                  <div key={d._id} className="py-3 flex items-start justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{d.isAnonymous ? 'Generous Supporter' : d.donorName}</span>
                      {d.message && <p className="text-slate-600 mt-0.5 italic text-[11px]">"{d.message}"</p>}
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="font-extrabold text-brand-800 bg-brand-50 px-2.5 py-1 rounded-lg">
                      ₹{Number(d.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Donation Action Card (Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-lg space-y-6">
            <div>
              <span className="text-3xl font-black text-slate-900">
                ₹{Number(campaign.collectedAmount).toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500 ml-1.5 font-medium">
                raised of ₹{Number(campaign.targetAmount).toLocaleString('en-IN')} target
              </span>
            </div>

            {/* Progress bar */}
            <div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isGoalReached ? 'bg-indigo-600' : 'bg-brand-600'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs text-slate-600 font-semibold mt-2">
                <span>{percent}% Funded</span>
                <span>₹{Number(campaign.remainingAmount).toLocaleString('en-IN')} Remaining</span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <div>
                <span className="text-lg font-black text-slate-900">{campaign.donationCount}</span>
                <span className="block text-[11px] text-slate-500">Donations</span>
              </div>
              <div>
                <span className="text-lg font-black text-slate-900">{daysLeft}</span>
                <span className="block text-[11px] text-slate-500">Days Left</span>
              </div>
            </div>

            {/* Donate Button */}
            {!isGoalReached && campaign.status === 'ACTIVE' ? (
              <button
                onClick={() => setIsDonationOpen(true)}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <FaHeart className="text-rose-300" /> Contribute Now
              </button>
            ) : (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-center text-xs text-indigo-800">
                <FaCheckCircle className="text-base text-indigo-600 mx-auto mb-1" />
                <p className="font-bold">Fundraising Target Achieved!</p>
                <p className="text-[11px] text-indigo-600 mt-0.5">Further donations are disabled while settlement is prepared.</p>
              </div>
            )}

            {/* Razorpay Test Mode pill */}
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-slate-600 space-y-1">
              <p className="font-semibold text-brand-900 flex items-center gap-1.5">
                <FaShieldAlt className="text-brand-600" /> Razorpay Test & Demo Mode
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                Razorpay Test Mode enabled. Test payments verify cryptographic signatures and update campaign progress securely.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Donation Modal */}
      <DonationModal
        campaign={campaign}
        isOpen={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
        onSuccess={handleDonationSuccess}
      />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        document={selectedDocument}
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
      />

      {/* Report Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FaFlag className="text-rose-500" /> Report Suspicious Campaign
            </h3>
            <p className="text-slate-600">
              Help maintain integrity. If you suspect false documents, copied descriptions, or fraud, notify our administrators.
            </p>

            {reportSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
                {reportSuccess}
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Reason for Report</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl"
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="Fake or fabricated medical documents">Fake or fabricated medical documents</option>
                    <option value="Plagiarized campaign description">Plagiarized campaign description</option>
                    <option value="Incorrect beneficiary information">Incorrect beneficiary information</option>
                    <option value="Suspicious funding amount">Suspicious funding amount</option>
                    <option value="Other integrity violation">Other integrity violation</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Additional Details (Optional)</label>
                  <textarea
                    rows="3"
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide any links or specific observations..."
                    className="w-full p-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignDetails;
