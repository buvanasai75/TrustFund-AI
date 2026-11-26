import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { donationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FaHeart,
  FaReceipt,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExternalLinkAlt,
  FaExclamationCircle,
  FaSync,
} from 'react-icons/fa';

export const DonorDashboard = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'SUCCESS', 'FAILED'

  const fetchDonations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await donationAPI.getMyDonations();
      setDonations(res.data.donations || []);
    } catch (err) {
      console.error('Error fetching donor contributions:', err);
      setError(err.response?.data?.message || 'Failed to load donation records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const successfulDonations = donations.filter(d => d.paymentStatus === 'SUCCESS');
  const failedDonations = donations.filter(d => ['FAILED', 'CANCELLED'].includes(d.paymentStatus));
  const pendingDonations = donations.filter(d => d.paymentStatus === 'PENDING');
  const unverifiedDonations = donations.filter(d => d.paymentStatus !== 'SUCCESS');

  const totalAmount = successfulDonations.reduce((acc, d) => acc + (d.amount || 0), 0);
  const uniqueCampaigns = new Set(
    successfulDonations
      .map(d => (d.campaign?._id ? d.campaign._id.toString() : d.campaign?.toString()))
      .filter(Boolean)
  ).size;

  const displayedDonations =
    activeTab === 'SUCCESS'
      ? successfulDonations
      : activeTab === 'FAILED'
      ? unverifiedDonations
      : donations;

  const handlePrintReceipt = (donation) => {
    const printWindow = window.open('', '_blank', 'width=600,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Donation Receipt - TrustFund AI</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #0d9488; padding-bottom: 15px; margin-bottom: 25px; }
            .title { font-size: 20px; font-weight: bold; color: #0f172a; }
            .tagline { font-size: 11px; color: #0d9488; font-weight: 600; margin-top: 3px; }
            .meta { font-size: 12px; color: #64748b; margin-top: 8px; }
            .details { margin: 20px 0; font-size: 14px; line-height: 1.8; }
            .amount { font-size: 24px; font-weight: bold; color: #0d9488; margin: 15px 0; }
            .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">TrustFund AI - Official Contribution Receipt</div>
            <div class="tagline">Every Contribution Builds Hope. Every Campaign Deserves Trust.</div>
            <div class="meta">Receipt Reference: ${donation.transactionReference || donation.paymentId || donation.orderId} • Date: ${new Date(donation.createdAt).toLocaleString()}</div>
          </div>
          <div class="details">
            <p><strong>Contributor:</strong> ${donation.isAnonymous ? 'Generous Supporter (Anonymous)' : (donation.donorName || user?.name)}</p>
            <p><strong>Campaign:</strong> ${donation.campaign?.title || 'Verified Campaign'}</p>
            <p><strong>Payment Mode:</strong> ${donation.paymentMode === 'DEMO_MODE' ? 'Demo Payment Mode (Simulated Ledger)' : 'Razorpay Test Mode'}</p>
            <div class="amount">₹${Number(donation.amount).toLocaleString('en-IN')} INR</div>
            <p><strong>Payment Status:</strong> SUCCESSFUL VERIFIED CONTRIBUTION</p>
          </div>
          <div class="footer">
            <p>Thank you for supporting verified causes through TrustFund AI. For inquiries, email support@trustfund.ai.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Donor Dashboard</h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
            Track your contributions and see the difference you make.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDonations}
            disabled={loading}
            className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            title="Refresh donations"
          >
            <FaSync className={loading ? 'animate-spin text-brand-600' : 'text-slate-400'} /> Refresh
          </button>
          <Link
            to="/campaigns"
            className="py-2.5 px-5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-sm text-xs flex items-center gap-2 transition-all"
          >
            <FaHeart className="text-rose-300" /> Explore Campaigns
          </Link>
        </div>
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FaExclamationCircle className="text-rose-600 text-base flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDonations}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Real Statistics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Successfully Donated</span>
          <p className="text-2xl font-black text-brand-900">₹{totalAmount.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-slate-500 font-medium">Verified contributions</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Successful Contributions</span>
          <p className="text-2xl font-black text-teal-700">{successfulDonations.length}</p>
          <span className="text-[11px] text-slate-500 font-medium">Completed transactions</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Campaigns Supported</span>
          <p className="text-2xl font-black text-indigo-700">{uniqueCampaigns}</p>
          <span className="text-[11px] text-slate-500 font-medium">Distinct verified causes</span>
        </div>
      </div>

      {/* Failed / Pending Notice Banner (if any exist) */}
      {unverifiedDonations.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaClock className="text-amber-600 text-base" />
            <span>
              You have <strong>{failedDonations.length} failed</strong> and <strong>{pendingDonations.length} pending</strong> transaction(s). Only confirmed successful payments increase campaign totals.
            </span>
          </div>
          <button
            onClick={() => setActiveTab('FAILED')}
            className="text-amber-800 font-bold underline hover:text-amber-950 text-xs"
          >
            View Unsuccessful Payments
          </button>
        </div>
      )}

      {/* Donations History Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header with Filter Tabs */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Personal Contribution History</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time ledger of your verified contributions and payment references</p>
          </div>

          {/* Filter Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({donations.length})
            </button>
            <button
              onClick={() => setActiveTab('SUCCESS')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'SUCCESS'
                  ? 'bg-white text-emerald-800 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Successful ({successfulDonations.length})
            </button>
            <button
              onClick={() => setActiveTab('FAILED')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'FAILED'
                  ? 'bg-white text-rose-800 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Failed / Pending ({unverifiedDonations.length})
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400 space-y-3">
            <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading your personal contribution records...</p>
          </div>
        ) : donations.length === 0 ? (
          /* Empty State */
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto text-2xl">
              <FaReceipt />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-base">No contributions yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No contributions yet. Explore verified campaigns and support causes that matter.
              </p>
            </div>
            <Link
              to="/campaigns"
              className="inline-block py-2.5 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
            >
              Explore Campaigns
            </Link>
          </div>
        ) : displayedDonations.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No transactions found for the selected tab.
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                  <th className="py-3 px-6">Campaign</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Transaction Date</th>
                  <th className="py-3 px-4">Transaction / Ref ID</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedDonations.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 max-w-xs">
                      {d.campaign ? (
                        <Link
                          to={`/campaigns/${d.campaign._id}`}
                          className="font-bold text-slate-900 hover:text-brand-700 block truncate"
                        >
                          {d.campaign.title}
                        </Link>
                      ) : (
                        <span className="font-bold text-slate-500">Verified Campaign</span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {d.isAnonymous ? 'Anonymous Contribution' : 'Public Attribution'}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-black text-brand-900">
                      ₹{Number(d.amount).toLocaleString('en-IN')}
                    </td>

                    <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(d.createdAt).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="py-4 px-4 font-mono text-[10px] text-slate-600 max-w-[160px] truncate" title={d.transactionReference || d.paymentId || d.orderId}>
                      {d.transactionReference || d.paymentId || d.orderId || 'PENDING'}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            d.paymentStatus === 'SUCCESS'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : d.paymentStatus === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {d.paymentStatus === 'SUCCESS' && <FaCheckCircle className="text-[9px]" />}
                          {d.paymentStatus === 'PENDING' && <FaClock className="text-[9px]" />}
                          {['FAILED', 'CANCELLED'].includes(d.paymentStatus) && (
                            <FaTimesCircle className="text-[9px]" />
                          )}
                          {d.paymentStatus}
                        </span>

                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            d.paymentMode === 'RAZORPAY_TEST'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {d.paymentMode === 'RAZORPAY_TEST' ? 'RAZORPAY TEST' : 'DEMO PAYMENT'}
                        </span>
                      </div>

                      {d.failureReason && (
                        <span
                          className="block text-[10px] text-rose-600 font-medium max-w-[180px] truncate mt-0.5"
                          title={d.failureReason}
                        >
                          {d.failureReason}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap space-x-2">
                      {d.campaign && (
                        <Link
                          to={`/campaigns/${d.campaign._id}`}
                          className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <FaExternalLinkAlt className="text-[9px]" /> View
                        </Link>
                      )}
                      {d.paymentStatus === 'SUCCESS' && (
                        <button
                          onClick={() => handlePrintReceipt(d)}
                          className="py-1 px-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <FaReceipt className="text-[10px]" /> Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorDashboard;