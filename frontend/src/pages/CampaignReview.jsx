import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import VerificationBadge from '../components/VerificationBadge';
import RiskBadge from '../components/RiskBadge';
import DocumentViewerModal from '../components/DocumentViewerModal';
import {
  FaShieldAlt,
  FaFileAlt,
  FaCheck,
  FaTimes,
  FaQuestionCircle,
  FaEye,
  FaSearch,
  FaSync,
  FaSpinner,
  FaExclamationTriangle,
  FaHospital,
  FaUser,
} from 'react-icons/fa';

export const CampaignReview = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState('APPROVE'); // 'APPROVE', 'REJECT', 'REQUEST_INFO'
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [reassessing, setReassessing] = useState(false);

  // For document inspection inside review
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docModalOpen, setDocModalOpen] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getCampaigns({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        riskLevel: riskFilter !== 'ALL' ? riskFilter : undefined,
      });
      setCampaigns(res.data.campaigns || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [statusFilter, riskFilter]);

  const openReviewModal = (camp) => {
    setSelectedCampaign(camp);
    setReviewAction('APPROVE');
    setAdminNotes('');
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    setActionLoading(true);
    try {
      const res = await adminAPI.reviewCampaign(selectedCampaign._id, {
        action: reviewAction,
        notes: adminNotes,
      });

      // Update state
      setCampaigns(prev => prev.map(c => c._id === selectedCampaign._id ? res.data.campaign : c));
      setReviewModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Review action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassessRisk = async (campId) => {
    setReassessing(true);
    try {
      const res = await adminAPI.reassessRisk(campId);
      const updated = res.data.campaign;
      setCampaigns(prev => prev.map(c => c._id === campId ? updated : c));
      if (selectedCampaign?._id === campId) {
        setSelectedCampaign(updated);
      }
      alert('AI Risk reassessment completed via Python microservice.');
    } catch (err) {
      alert(err.response?.data?.message || 'Reassessment failed.');
    } finally {
      setReassessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Campaign Verification Queue</h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
            Review submitted images, inspect extracted OCR text, and approve or reject fundraisers.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-700">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-3 border border-slate-200 rounded-xl bg-slate-50 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ADDITIONAL_INFORMATION_REQUIRED">Info Requested</option>
            <option value="ACTIVE">Active & Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="GOAL_REACHED">Goal Reached</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-700">AI Risk Level:</span>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="py-1.5 px-3 border border-slate-200 rounded-xl bg-slate-50 font-medium"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk ({'>='} 70)</option>
          </select>
        </div>
      </div>

      {/* Campaign Review Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading campaigns queue...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No campaigns found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                  <th className="py-3.5 px-6">Campaign</th>
                  <th className="py-3.5 px-4">Beneficiary & Category</th>
                  <th className="py-3.5 px-4">Target Amount</th>
                  <th className="py-3.5 px-4">Supporting Documents</th>
                  <th className="py-3.5 px-4">AI Risk Assessment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((camp) => (
                  <tr key={camp._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 max-w-xs">
                      <strong className="block text-slate-900 text-sm truncate">{camp.title}</strong>
                      <span className="text-[10px] text-slate-400">
                        Submitted by: {camp.creator?.name || 'Creator'} • {new Date(camp.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <strong className="block text-slate-800">{camp.beneficiaryName}</strong>
                      <span className="text-[10px] text-slate-400">{camp.category} ({camp.beneficiaryRelationship})</span>
                    </td>

                    <td className="py-4 px-4 font-black text-slate-900">
                      ₹{camp.targetAmount.toLocaleString('en-IN')}
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2 py-1 rounded-md bg-slate-100 font-bold text-slate-700">
                        {camp.documents?.length || 0} Docs
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <RiskBadge score={camp.riskScore} level={camp.riskLevel} />
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <VerificationBadge status={camp.status} />
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        onClick={() => openReviewModal(camp)}
                        className="py-1.5 px-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <FaEye /> Inspect & Decide
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Complete Review & Document Inspection Modal */}
      {reviewModalOpen && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 bg-slate-50 border-b border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-600 tracking-wider">
                  Admin Verification Review
                </span>
                <h3 className="font-bold text-slate-900 text-base">{selectedCampaign.title}</h3>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-200 text-slate-500"
              >
                <FaTimes />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-xs">
              {/* AI Risk Scorecard */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm flex items-center gap-2">
                    <FaShieldAlt className="text-teal-400" /> Automated AI Risk Assessment
                  </span>
                  <div className="flex items-center gap-2">
                    <RiskBadge score={selectedCampaign.riskScore} level={selectedCampaign.riskLevel} />
                    <button
                      type="button"
                      disabled={reassessing}
                      onClick={() => handleReassessRisk(selectedCampaign._id)}
                      className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-teal-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
                    >
                      <FaSync className={reassessing ? 'animate-spin' : ''} /> Re-run AI
                    </button>
                  </div>
                </div>

                <p className="text-slate-300 text-xs">
                  <strong>Recommendation:</strong> {selectedCampaign.aiRecommendation}
                </p>

                {selectedCampaign.fraudReasons?.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-slate-400 font-semibold block text-[11px]">Detected Warning Reasons:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                      {selectedCampaign.fraudReasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Campaign Basic Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Category</span>
                  <p className="font-bold text-slate-800">{selectedCampaign.category}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Target</span>
                  <p className="font-bold text-slate-800">₹{selectedCampaign.targetAmount.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Beneficiary</span>
                  <p className="font-bold text-slate-800">{selectedCampaign.beneficiaryName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Relationship</span>
                  <p className="font-bold text-slate-800">{selectedCampaign.beneficiaryRelationship}</p>
                </div>
              </div>

              {/* Story Description */}
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Story Narrative</h4>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-700 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {selectedCampaign.description}
                </div>
              </div>

              {/* Supporting Documents & OCR Entities */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <FaFileAlt className="text-brand-600" /> Supporting Documents ({selectedCampaign.documents?.length || 0})
                </h4>
                {(!selectedCampaign.documents || selectedCampaign.documents.length === 0) ? (
                  <p className="text-rose-600 italic p-3 bg-rose-50 rounded-xl border border-rose-100">
                    Warning: Creator uploaded zero supporting verification documents!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedCampaign.documents.map((doc) => (
                      <button
                        type="button"
                        key={doc._id}
                        onClick={() => { setSelectedDoc(doc); setDocModalOpen(true); }}
                        className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left flex items-start justify-between group transition-colors"
                      >
                        <div>
                          <strong className="block text-slate-800 truncate">{doc.fileName}</strong>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Status: <strong className="text-teal-700">{doc.status}</strong>
                          </span>
                          {doc.ocrData?.billAmount && (
                            <span className="text-[10px] text-slate-600 font-semibold block">
                              OCR Amount: ₹{Number(doc.ocrData.billAmount).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        <span className="text-brand-600 group-hover:scale-110 transition-transform">
                          <FaEye />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Form */}
              <form onSubmit={handleReviewSubmit} className="pt-4 border-t border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900">Administrator Decision</h4>

                <div className="grid grid-cols-3 gap-3">
                  <label className={`p-3 rounded-xl border cursor-pointer font-bold flex items-center justify-center gap-2 transition-all ${
                    reviewAction === 'APPROVE'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="decision"
                      value="APPROVE"
                      checked={reviewAction === 'APPROVE'}
                      onChange={() => setReviewAction('APPROVE')}
                      className="hidden"
                    />
                    <FaCheck className="text-emerald-600" /> Approve Campaign
                  </label>

                  <label className={`p-3 rounded-xl border cursor-pointer font-bold flex items-center justify-center gap-2 transition-all ${
                    reviewAction === 'REQUEST_INFO'
                      ? 'border-amber-600 bg-amber-50 text-amber-800'
                      : 'border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="decision"
                      value="REQUEST_INFO"
                      checked={reviewAction === 'REQUEST_INFO'}
                      onChange={() => setReviewAction('REQUEST_INFO')}
                      className="hidden"
                    />
                    <FaQuestionCircle className="text-amber-600" /> Request Info
                  </label>

                  <label className={`p-3 rounded-xl border cursor-pointer font-bold flex items-center justify-center gap-2 transition-all ${
                    reviewAction === 'REJECT'
                      ? 'border-rose-600 bg-rose-50 text-rose-800'
                      : 'border-slate-200 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="decision"
                      value="REJECT"
                      checked={reviewAction === 'REJECT'}
                      onChange={() => setReviewAction('REJECT')}
                      className="hidden"
                    />
                    <FaTimes className="text-rose-600" /> Reject Campaign
                  </label>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Verification Notes & Decision Justification
                  </label>
                  <textarea
                    rows="2"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Enter audit notes or specific information requested from the campaign creator..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="py-2 px-5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    {actionLoading ? <FaSpinner className="animate-spin" /> : 'Confirm & Log Audit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* OCR Document Inspection Modal */}
      <DocumentViewerModal
        document={selectedDoc}
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
      />
    </div>
  );
};

export default CampaignReview;
