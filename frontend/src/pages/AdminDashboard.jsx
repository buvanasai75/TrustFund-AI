import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import VerificationBadge from '../components/VerificationBadge';
import RiskBadge from '../components/RiskBadge';
import {
  FaShieldAlt,
  FaFileContract,
  FaExclamationTriangle,
  FaMoneyCheckAlt,
  FaUsers,
  FaChartBar,
  FaCheckCircle,
  FaClock,
  FaEye,
  FaExchangeAlt,
  FaClipboardList,
  FaHandHoldingHeart,
  FaHistory,
  FaTimesCircle,
  FaCheck,
  FaTimes,
  FaSync,
  FaInfoCircle,
} from 'react-icons/fa';

export const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [pendingCampaigns, setPendingCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Action Modal State
  const [reviewingCamp, setReviewingCamp] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVE'); // 'APPROVE', 'REJECT', 'REQUEST_INFO'
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setActionSuccess('');
    try {
      const [statsRes, campsRes] = await Promise.allSettled([
        adminAPI.getAnalytics(),
        adminAPI.getCampaigns({ status: 'PENDING_VERIFICATION', limit: 10 }),
      ]);

      if (statsRes.status === 'fulfilled') {
        setAnalytics(statsRes.value.data);
      }
      if (campsRes.status === 'fulfilled') {
        setPendingCampaigns(campsRes.value.data.campaigns || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const metrics = analytics?.metrics || {};

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewingCamp) return;

    setReviewSubmitting(true);
    try {
      await adminAPI.reviewCampaign(reviewingCamp._id, {
        action: reviewAction,
        notes: reviewNotes || (reviewAction === 'APPROVE' ? 'Approved after administrator review.' : 'Verification criteria not satisfied.'),
      });

      setActionSuccess(`Campaign "${reviewingCamp.title}" marked as ${reviewAction === 'APPROVE' ? 'ACTIVE' : reviewAction === 'REJECT' ? 'REJECTED' : 'ADDITIONAL_INFO_REQUIRED'}`);

      // Refresh data
      fetchData();

      setTimeout(() => {
        setReviewingCamp(null);
        setReviewNotes('');
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review decision.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const modules = [
    {
      title: 'Campaign Verification',
      desc: 'Review submitted fundraisers and approve or reject listings.',
      to: '/admin/campaigns',
      icon: <FaFileContract className="text-brand-600" />,
      badge: `${metrics.pendingCampaigns || 0} Pending`,
    },
    {
      title: 'Document Review',
      desc: 'Inspect hospital invoices, fee structures, and identity proofs.',
      to: '/admin/campaigns',
      icon: <FaClipboardList className="text-teal-600" />,
      badge: 'Active Queue',
    },
    {
      title: 'AI Risk Assessment',
      desc: 'Analyze explainable fraud scores, TF-IDF text flags, and heuristics.',
      to: '/admin/ai-risk',
      icon: <FaShieldAlt className="text-indigo-600" />,
      badge: 'Intelligent Engine',
    },
    {
      title: 'User Management',
      desc: 'Manage creators, donors, permissions, and account statuses.',
      to: '/admin/users',
      icon: <FaUsers className="text-blue-600" />,
      badge: `${metrics.totalUsers || 0} Users`,
    },
    {
      title: 'Donation Management',
      desc: 'Monitor Razorpay test transactions, receipts, and order statuses.',
      to: '/admin/analytics',
      icon: <FaHandHoldingHeart className="text-rose-600" />,
      badge: `${metrics.totalDonations || 0} Donations`,
    },
    {
      title: 'Settlement Management',
      desc: 'Review completed campaigns and authorize beneficiary disbursements.',
      to: '/admin/settlements',
      icon: <FaExchangeAlt className="text-emerald-600" />,
      badge: 'Disbursements',
    },
    {
      title: 'Reports and Analytics',
      desc: 'Platform-wide growth metrics, category trends, and risk distribution.',
      to: '/admin/analytics',
      icon: <FaChartBar className="text-purple-600" />,
      badge: 'Live Insights',
    },
    {
      title: 'Audit Logs',
      desc: 'Complete tamper-proof audit trails for administrative operations.',
      to: '/admin/analytics',
      icon: <FaHistory className="text-amber-600" />,
      badge: 'Audit Trail',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200 mb-2">
            <FaShieldAlt /> Authorized Administrative Console
          </div>
          <h1 className="text-3xl font-black text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
            Manage campaigns, review verification requests, and monitor platform activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <button
            onClick={fetchData}
            disabled={loading}
            className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            title="Refresh statistics"
          >
            <FaSync className={loading ? 'animate-spin text-purple-600' : 'text-slate-400'} /> Refresh
          </button>
          <Link
            to="/admin/campaigns"
            className="py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <FaFileContract /> Verification Queue
          </Link>
          <Link
            to="/admin/ai-risk"
            className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <FaShieldAlt /> AI Risk Analysis
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <FaCheckCircle className="text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Real Database Statistics Grid (All requested metrics) */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Platform Overview & Metrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          {/* 1. Total Users */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <FaUsers /> Total Users
            </span>
            <p className="text-2xl font-black text-slate-900">{metrics.totalUsers || 0}</p>
            <span className="text-[11px] text-slate-500 font-medium block">
              {metrics.totalCreators || 0} Creators • {metrics.totalDonors || 0} Donors
            </span>
          </div>

          {/* 2. Total Campaigns */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">Total Campaigns</span>
            <p className="text-2xl font-black text-brand-900">{metrics.totalCampaigns || 0}</p>
            <span className="text-[11px] text-slate-500 font-medium">All registered fundraisers</span>
          </div>

          {/* 3. Pending Reviews */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1">
              <FaClock /> Pending Reviews
            </span>
            <p className="text-2xl font-black text-amber-600">{metrics.pendingCampaigns || 0}</p>
            <span className="text-[11px] text-slate-500 font-medium">Awaiting decision</span>
          </div>

          {/* 4. Approved Campaigns */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 flex items-center gap-1">
              <FaCheckCircle /> Approved Campaigns
            </span>
            <p className="text-2xl font-black text-teal-700">{metrics.approvedCampaigns || 0}</p>
            <span className="text-[11px] text-slate-500 font-medium">Live on platform</span>
          </div>

          {/* 5. Rejected Campaigns */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1">
              <FaTimesCircle /> Rejected Campaigns
            </span>
            <p className="text-2xl font-black text-rose-600">{metrics.rejectedCampaigns || 0}</p>
            <span className="text-[11px] text-slate-500 font-medium">Declined or flagged</span>
          </div>

          {/* 6. Successful Donations */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
              <FaCheckCircle /> Successful Donations
            </span>
            <p className="text-2xl font-black text-indigo-700">{metrics.totalDonations || 0}</p>
            <span className="text-[11px] text-slate-500 font-medium">Confirmed ledger payments</span>
          </div>

          {/* 7. Total Funds Raised */}
          <div className="p-5 bg-gradient-to-r from-brand-900 to-indigo-950 text-white rounded-2xl shadow-md space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">Total Funds Collected</span>
            <p className="text-2xl font-black">₹{Number(metrics.totalAmountRaised || 0).toLocaleString('en-IN')}</p>
            <span className="text-[11px] text-slate-300 font-medium">From successful payments</span>
          </div>

          {/* 8. Failed Transactions */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Failed / Cancelled</span>
            <p className="text-2xl font-black text-slate-700">{metrics.failedDonations || 0}</p>
            <span className="text-[11px] text-slate-500 font-medium">Zero effect on campaign total</span>
          </div>
        </div>
      </div>

      {/* Module Directory: 8 Core Administrative Workflows */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Administrative Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((m, idx) => (
            <Link
              key={idx}
              to={m.to}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-brand-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-brand-50 flex items-center justify-center text-lg transition-colors">
                    {m.icon}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {m.badge}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors">
                  {m.title}
                </h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  {m.desc}
                </p>
              </div>
              <div className="text-xs font-bold text-brand-600 flex items-center gap-1 pt-1">
                Open Module →
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Immediate Verification Queue (Functional Review) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Campaign Verification Queue</h2>
            <p className="text-xs text-slate-500 mt-0.5">Inspect campaign details and documents, then approve or reject listings</p>
          </div>
          <Link
            to="/admin/campaigns"
            className="text-xs font-bold text-brand-600 hover:text-brand-800"
          >
            Full Review Console ({metrics.pendingCampaigns || 0}) →
          </Link>
        </div>

        {loading ? (
          <div className="p-10 text-center text-xs text-slate-400">Loading pending campaigns...</div>
        ) : pendingCampaigns.length === 0 ? (
          <div className="p-10 text-center text-xs text-emerald-700 bg-emerald-50/50">
            <FaCheckCircle className="text-xl text-emerald-500 mx-auto mb-2" />
            <p className="font-bold">Verification queue is clear!</p>
            <p className="text-[11px] text-slate-500 mt-0.5">No campaigns currently awaiting administrator review.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {pendingCampaigns.map((camp) => (
              <div key={camp._id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="space-y-1 max-w-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{camp.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {camp.category}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] line-clamp-1">{camp.description}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span>Beneficiary: <strong>{camp.beneficiaryName}</strong></span>
                    <span>Target: <strong>₹{Number(camp.targetAmount || 0).toLocaleString('en-IN')}</strong></span>
                    <span>Docs: <strong>{camp.documents?.length || 0} uploaded</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                  <RiskBadge score={camp.riskScore} level={camp.riskLevel} />
                  <button
                    onClick={() => {
                      setReviewingCamp(camp);
                      setReviewAction('APPROVE');
                      setReviewNotes('');
                      setActionSuccess('');
                    }}
                    className="py-1.5 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <FaCheck className="text-[10px]" /> Review / Decide
                  </button>
                  <Link
                    to="/admin/campaigns"
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <FaEye className="text-[10px]" /> Full Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review & Decision Modal */}
      {reviewingCamp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Campaign Verification Decision</h3>
                <p className="text-xs text-slate-500">Approve, reject, or request further evidence</p>
              </div>
              <button
                onClick={() => setReviewingCamp(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <FaTimes />
              </button>
            </div>

            {/* Campaign Summary */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{reviewingCamp.title}</h4>
                  <span className="text-[11px] text-slate-500">
                    Beneficiary: <strong>{reviewingCamp.beneficiaryName}</strong> ({reviewingCamp.beneficiaryRelationship})
                  </span>
                </div>
                <RiskBadge score={reviewingCamp.riskScore} level={reviewingCamp.riskLevel} />
              </div>
              <div className="flex gap-4 text-[11px] text-slate-600 pt-1">
                <span>Target: <strong>₹{Number(reviewingCamp.targetAmount || 0).toLocaleString('en-IN')}</strong></span>
                <span>Category: <strong>{reviewingCamp.category}</strong></span>
                <span>Documents: <strong>{reviewingCamp.documents?.length || 0} attached</strong></span>
              </div>
              {reviewingCamp.aiRecommendation && (
                <div className="mt-2 p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-slate-700">
                  <strong className="text-brand-800">AI Recommendation:</strong> {reviewingCamp.aiRecommendation}
                </div>
              )}
            </div>

            {/* Decision Form */}
            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Administrative Action</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewAction('APPROVE')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                      reviewAction === 'APPROVE'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FaCheck className="text-emerald-600 text-xs" /> Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewAction('REJECT')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                      reviewAction === 'REJECT'
                        ? 'border-rose-600 bg-rose-50 text-rose-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FaTimes className="text-rose-600 text-xs" /> Reject
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewAction('REQUEST_INFO')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                      reviewAction === 'REQUEST_INFO'
                        ? 'border-amber-600 bg-amber-50 text-amber-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FaInfoCircle className="text-amber-600 text-xs" /> Request Info
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Verification Notes {reviewAction === 'REJECT' ? '(Reason required for rejection)' : '(Optional)'}
                </label>
                <textarea
                  rows="3"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={
                    reviewAction === 'APPROVE'
                      ? 'e.g., Hospital estimate and identity documents verified.'
                      : reviewAction === 'REJECT'
                      ? 'e.g., Incomplete documentation or mismatched hospital details.'
                      : 'e.g., Please provide a recent admission discharge summary.'
                  }
                  required={reviewAction === 'REJECT'}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewingCamp(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className={`py-2.5 px-6 rounded-xl font-bold text-white transition-colors shadow-sm ${
                    reviewAction === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : reviewAction === 'REJECT'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {reviewSubmitting ? 'Saving Decision...' : `Confirm ${reviewAction}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;