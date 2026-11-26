import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { campaignAPI, notificationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import VerificationBadge from '../components/VerificationBadge';
import RiskBadge from '../components/RiskBadge';
import {
  FaPlusCircle,
  FaFolderOpen,
  FaHeart,
  FaMoneyBillWave,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaEdit,
  FaFileAlt,
  FaExchangeAlt,
  FaBell,
  FaEye,
  FaTimes,
  FaSync,
  FaTimesCircle,
} from 'react-icons/fa';

export const CreatorDashboard = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'ACTIVE', 'PENDING', 'APPROVED', 'REJECTED'

  // Manage / Edit Campaign Modal State
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    category: 'Medical',
    targetAmount: '',
    deadline: '',
    beneficiaryName: '',
    beneficiaryRelationship: 'Self',
    contactDetails: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [campsRes, notifsRes] = await Promise.allSettled([
        campaignAPI.getMyCampaigns(),
        notificationAPI.getAll(),
      ]);

      if (campsRes.status === 'fulfilled') {
        setCampaigns(campsRes.value.data.campaigns || []);
      } else {
        setError('Failed to fetch your campaigns. Please check backend connection.');
      }

      if (notifsRes.status === 'fulfilled') {
        setNotifications(notifsRes.value.data.notifications || []);
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred while loading dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE');
  const pendingCampaigns = campaigns.filter(c =>
    ['PENDING_VERIFICATION', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED'].includes(c.status)
  );
  const approvedCampaigns = campaigns.filter(c =>
    ['APPROVED', 'ACTIVE', 'GOAL_REACHED', 'COMPLETED'].includes(c.status)
  );
  const rejectedCampaigns = campaigns.filter(c => c.status === 'REJECTED');
  const goalReachedCampaigns = campaigns.filter(c =>
    ['GOAL_REACHED', 'COMPLETED'].includes(c.status)
  );

  const totalFundsRaised = campaigns.reduce((acc, c) => acc + (c.collectedAmount || 0), 0);

  // Filter campaigns by activeTab
  const displayedCampaigns =
    activeTab === 'ACTIVE'
      ? activeCampaigns
      : activeTab === 'PENDING'
      ? pendingCampaigns
      : activeTab === 'APPROVED'
      ? approvedCampaigns
      : activeTab === 'REJECTED'
      ? rejectedCampaigns
      : campaigns;

  // Open Edit Modal
  const openEditModal = (camp) => {
    setEditingCampaign(camp);
    setSaveMessage('');
    setEditFormData({
      title: camp.title || '',
      description: camp.description || '',
      category: camp.category || 'Medical',
      targetAmount: camp.targetAmount || '',
      deadline: camp.deadline ? new Date(camp.deadline).toISOString().split('T')[0] : '',
      beneficiaryName: camp.beneficiaryName || '',
      beneficiaryRelationship: camp.beneficiaryRelationship || 'Self',
      contactDetails: camp.contactDetails || '',
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCampaign) return;

    setSaveLoading(true);
    setSaveMessage('');
    try {
      const res = await campaignAPI.update(editingCampaign._id, editFormData);
      setSaveMessage('Campaign updated successfully!');

      // Update local state
      setCampaigns(prev =>
        prev.map(c => (c._id === editingCampaign._id ? res.data.campaign : c))
      );

      setTimeout(() => {
        setEditingCampaign(null);
      }, 1200);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update campaign.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Creator Dashboard</h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
            Manage your campaigns, track contributions, and keep supporters updated.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            title="Refresh dashboard"
          >
            <FaSync className={loading ? 'animate-spin text-teal-600' : 'text-slate-400'} /> Refresh
          </button>
          <Link
            to="/campaigns/create"
            className="py-2.5 px-5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-sm text-xs flex items-center gap-2 transition-all"
          >
            <FaPlusCircle /> Create New Campaign
          </Link>
        </div>
      </div>

      {/* Error state alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaExclamationCircle className="text-rose-600 text-base" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Primary KPI Grid: Total Campaigns, Active Campaigns, Funds Raised, Pending Verification */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Campaigns</span>
          <p className="text-2xl font-black text-slate-900">{totalCampaigns}</p>
          <span className="text-[11px] text-slate-500 font-medium">All fundraisers</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Active Campaigns</span>
          <p className="text-2xl font-black text-teal-700">{activeCampaigns.length}</p>
          <span className="text-[11px] text-slate-500 font-medium">Live receiving funds</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">Total Funds Raised</span>
          <p className="text-2xl font-black text-brand-900">₹{totalFundsRaised.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-slate-500 font-medium">Verified contributions</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Pending Verification</span>
          <p className="text-2xl font-black text-amber-600">{pendingCampaigns.length}</p>
          <span className="text-[11px] text-slate-500 font-medium">In review queue</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Rejected</span>
          <p className="text-2xl font-black text-rose-600">{rejectedCampaigns.length}</p>
          <span className="text-[11px] text-slate-500 font-medium">Requires attention</span>
        </div>
      </div>

      {/* Settlement Status Banner */}
      {goalReachedCampaigns.length > 0 && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-emerald-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg flex-shrink-0">
              <FaExchangeAlt />
            </div>
            <div>
              <strong className="block font-bold text-sm">Disbursement Status ({goalReachedCampaigns.length} Campaign Reached Goal)</strong>
              <span className="text-emerald-700 text-xs">
                Your fundraising goal has been reached. Verification and beneficiary disbursement review are in progress.
              </span>
            </div>
          </div>
          <span className="px-3.5 py-1.5 bg-white text-emerald-800 rounded-xl font-bold border border-emerald-300 text-xs shadow-sm">
            Disbursement Eligible
          </span>
        </div>
      )}

      {/* Main Section: My Campaigns */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">My Campaigns ({campaigns.length})</h2>
            <p className="text-xs text-slate-500">Monitor campaign progress, verification status, and donor contributions</p>
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
              All ({totalCampaigns})
            </button>
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'ACTIVE'
                  ? 'bg-white text-teal-800 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-teal-700'
              }`}
            >
              Active ({activeCampaigns.length})
            </button>
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'PENDING'
                  ? 'bg-white text-amber-800 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              Pending ({pendingCampaigns.length})
            </button>
            <button
              onClick={() => setActiveTab('APPROVED')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'APPROVED'
                  ? 'bg-white text-emerald-800 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Approved ({approvedCampaigns.length})
            </button>
            {rejectedCampaigns.length > 0 && (
              <button
                onClick={() => setActiveTab('REJECTED')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'REJECTED'
                    ? 'bg-white text-rose-800 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-rose-700'
                }`}
              >
                Rejected ({rejectedCampaigns.length})
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400 space-y-3">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading your fundraisers...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto text-2xl">
              <FaFolderOpen />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-base">No campaigns created yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Ready to raise funds for medical, educational, or emergency assistance? Create your first verified campaign.
              </p>
            </div>
            <Link
              to="/campaigns/create"
              className="inline-block py-2.5 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
            >
              Start Your First Fundraiser
            </Link>
          </div>
        ) : displayedCampaigns.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No campaigns found for the selected tab.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                  <th className="py-3 px-6">Campaign</th>
                  <th className="py-3 px-4">Beneficiary</th>
                  <th className="py-3 px-4">Fundraising Progress</th>
                  <th className="py-3 px-4">Verification Status</th>
                  <th className="py-3 px-4">Donations Received</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedCampaigns.map((camp) => {
                  const percent = camp.targetAmount > 0
                    ? Math.min(Math.round((camp.collectedAmount / camp.targetAmount) * 100), 100)
                    : 0;

                  return (
                    <tr key={camp._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 max-w-xs">
                        <Link to={`/campaigns/${camp._id}`} className="font-bold text-slate-900 hover:text-brand-700 block truncate">
                          {camp.title}
                        </Link>
                        <span className="text-[10px] text-slate-400">
                          {camp.category} • Created {new Date(camp.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-medium text-slate-700">
                        {camp.beneficiaryName}
                        <span className="block text-[10px] text-slate-400">{camp.beneficiaryRelationship}</span>
                      </td>

                      <td className="py-4 px-4 min-w-[170px]">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-800 mb-1">
                          <span>₹{Number(camp.collectedAmount || 0).toLocaleString('en-IN')}</span>
                          <span className="text-slate-400">₹{Number(camp.targetAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              camp.collectedAmount >= camp.targetAmount ? 'bg-emerald-600' : 'bg-teal-600'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {percent}% of goal achieved
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <VerificationBadge status={camp.status} />
                        {camp.status === 'ADDITIONAL_INFORMATION_REQUIRED' && (
                          <span className="block text-[10px] text-amber-700 mt-1 font-semibold max-w-xs truncate">
                            Admin note: {camp.requestedInfoNotes}
                          </span>
                        )}
                        {camp.status === 'REJECTED' && camp.verificationNotes && (
                          <span className="block text-[10px] text-rose-700 mt-1 font-semibold max-w-xs truncate">
                            Reason: {camp.verificationNotes}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 text-xs">{camp.donationCount || 0}</span>
                        <span className="text-[10px] text-slate-400 block">Contributions</span>
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap space-x-2">
                        <Link
                          to={`/campaigns/${camp._id}`}
                          className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <FaEye className="text-[10px]" /> View
                        </Link>
                        <button
                          onClick={() => openEditModal(camp)}
                          className="py-1.5 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <FaEdit className="text-[10px]" /> Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <FaBell className="text-brand-600" /> Recent Notifications & Updates
          </div>
          <div className="space-y-2 text-xs">
            {notifications.slice(0, 5).map((n) => (
              <div key={n._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-slate-800 font-medium">{n.message}</p>
                  <span className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manage Campaign Edit Modal */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Manage Campaign Details</h3>
                <p className="text-xs text-slate-500">Update story, target, or beneficiary info</p>
              </div>
              <button
                onClick={() => setEditingCampaign(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <FaTimes />
              </button>
            </div>

            {saveMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <FaCheckCircle className="text-emerald-600" />
                <span>{saveMessage}</span>
              </div>
            )}

            {editingCampaign.status === 'ADDITIONAL_INFORMATION_REQUIRED' && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs">
                <strong>Admin Request:</strong> {editingCampaign.requestedInfoNotes}
                <span className="block mt-1 text-[11px] text-amber-700">
                  Saving updates will automatically resubmit your campaign to the Verification Queue.
                </span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campaign Title</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campaign Description</label>
                <textarea
                  rows="4"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Amount (INR)</label>
                  <input
                    type="number"
                    min="100"
                    value={editFormData.targetAmount}
                    onChange={(e) => setEditFormData({ ...editFormData, targetAmount: e.target.value })}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={editFormData.deadline}
                    onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Beneficiary Name</label>
                  <input
                    type="text"
                    value={editFormData.beneficiaryName}
                    onChange={(e) => setEditFormData({ ...editFormData, beneficiaryName: e.target.value })}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Beneficiary Relationship</label>
                  <input
                    type="text"
                    value={editFormData.beneficiaryRelationship}
                    onChange={(e) => setEditFormData({ ...editFormData, beneficiaryRelationship: e.target.value })}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Details</label>
                <input
                  type="text"
                  value={editFormData.contactDetails}
                  onChange={(e) => setEditFormData({ ...editFormData, contactDetails: e.target.value })}
                  placeholder="Email or phone for verification inquiries"
                  className="w-full p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCampaign(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="py-2.5 px-6 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white rounded-xl font-bold transition-colors shadow-sm"
                >
                  {saveLoading ? 'Saving...' : 'Save & Update Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorDashboard;