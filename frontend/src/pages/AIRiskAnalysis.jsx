import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import VerificationBadge from '../components/VerificationBadge';
import {
  FaBrain,
  FaShieldAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCopy,
  FaFileContract,
  FaSync,
  FaSearch,
} from 'react-icons/fa';

export const AIRiskAnalysis = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [reassessing, setReassessing] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getCampaigns({ limit: 50 });
      // Sort by riskScore descending
      const sorted = (res.data.campaigns || []).sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
      setCampaigns(sorted);
      if (sorted.length > 0 && !selectedCampaign) {
        setSelectedCampaign(sorted[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleReassess = async (campId) => {
    setReassessing(true);
    try {
      const res = await adminAPI.reassessRisk(campId);
      const updated = res.data.campaign;
      setCampaigns(prev => prev.map(c => c._id === campId ? updated : c));
      setSelectedCampaign(updated);
    } catch (err) {
      alert(err.response?.data?.message || 'Reassessment failed.');
    } finally {
      setReassessing(false);
    }
  };

  const highRiskCount = campaigns.filter(c => (c.riskScore || 0) >= 70).length;
  const mediumRiskCount = campaigns.filter(c => (c.riskScore || 0) >= 35 && (c.riskScore || 0) < 70).length;
  const lowRiskCount = campaigns.filter(c => (c.riskScore || 0) < 35).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-brand-600 text-xs font-bold uppercase tracking-wider mb-1">
          <FaBrain /> AI Fraud Risk & Text Similarity Console
        </div>
        <h1 className="text-3xl font-black text-slate-900">AI Risk Intelligence & Heuristics</h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
          Real-time oversight of TF-IDF text similarity, document OCR entity checks, and explainable risk scores.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">High Risk Campaigns</span>
            <p className="text-3xl font-black text-rose-900 mt-1">{highRiskCount}</p>
            <span className="text-[11px] text-rose-600 font-medium">Risk Score {'>='} 70 / 100</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl">
            <FaExclamationTriangle />
          </div>
        </div>

        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Medium Risk Campaigns</span>
            <p className="text-3xl font-black text-amber-900 mt-1">{mediumRiskCount}</p>
            <span className="text-[11px] text-amber-600 font-medium">Risk Score 35 - 69 / 100</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl">
            <FaShieldAlt />
          </div>
        </div>

        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Low Risk Campaigns</span>
            <p className="text-3xl font-black text-emerald-900 mt-1">{lowRiskCount}</p>
            <span className="text-[11px] text-emerald-600 font-medium">Risk Score &lt; 35 / 100</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl">
            <FaCheckCircle />
          </div>
        </div>
      </div>

      {/* Split View: Left List, Right Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[750px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="font-bold text-slate-800 text-sm">Campaigns Ranked by Risk Score</h2>
            <span className="text-[10px] text-slate-400">Select any campaign to inspect signals</span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto custom-scrollbar flex-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading risk scores...</div>
            ) : campaigns.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No campaigns found.</div>
            ) : (
              campaigns.map((camp) => (
                <button
                  type="button"
                  key={camp._id}
                  onClick={() => setSelectedCampaign(camp)}
                  className={`w-full p-4 text-left transition-colors flex items-center justify-between gap-3 ${
                    selectedCampaign?._id === camp._id ? 'bg-brand-50/80 border-l-4 border-brand-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <strong className="block text-slate-900 text-xs truncate">{camp.title}</strong>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                      <span>{camp.category}</span>
                      <span>•</span>
                      <span>₹{camp.targetAmount.toLocaleString('en-IN')}</span>
                      <span>•</span>
                      <span>{camp.documents?.length || 0} Docs</span>
                    </div>
                  </div>
                  <RiskBadge score={camp.riskScore} level={camp.riskLevel} />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Details Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedCampaign ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6 text-xs">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Selected Campaign Risk Inspection
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedCampaign.title}</h3>
                </div>

                <button
                  type="button"
                  disabled={reassessing}
                  onClick={() => handleReassess(selectedCampaign._id)}
                  className="py-1.5 px-3 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-xl flex items-center gap-1.5 border border-brand-200 transition-colors"
                >
                  <FaSync className={reassessing ? 'animate-spin' : ''} />
                  <span>Re-run Assessment</span>
                </button>
              </div>

              {/* AI Scorecard Card */}
              <div className="p-5 bg-gradient-to-r from-slate-900 to-brand-950 text-white rounded-2xl space-y-3 shadow-md">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm flex items-center gap-2">
                    <FaBrain className="text-teal-400" /> Explainable Risk Score
                  </span>
                  <span className="text-2xl font-black text-teal-300">
                    {selectedCampaign.riskScore} / 100
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${
                      selectedCampaign.riskScore >= 70 ? 'bg-rose-500' :
                      selectedCampaign.riskScore >= 35 ? 'bg-amber-400' :
                      'bg-emerald-400'
                    }`}
                    style={{ width: `${selectedCampaign.riskScore}%` }}
                  />
                </div>
                <p className="text-slate-300 text-xs">
                  <strong>Recommended Action:</strong> {selectedCampaign.aiRecommendation}
                </p>
              </div>

              {/* Findings & Risk Drivers */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Detected Risk Indicators</h4>
                {selectedCampaign.fraudReasons?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCampaign.fraudReasons.map((r, idx) => (
                      <div key={idx} className="p-3 bg-rose-50 border border-rose-100 text-rose-900 rounded-xl flex items-start gap-2.5">
                        <FaExclamationTriangle className="text-rose-500 mt-0.5 flex-shrink-0" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-center gap-2">
                    <FaCheckCircle className="text-emerald-600" />
                    <span>No negative risk flags detected. Campaign meets standard criteria.</span>
                  </div>
                )}
              </div>

              {/* NLP Text Similarity Matches */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FaCopy className="text-brand-600" /> TF-IDF Cosine Similarity Matches
                </h4>
                {(!selectedCampaign.similarCampaigns || selectedCampaign.similarCampaigns.length === 0) ? (
                  <p className="text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                    No duplicate or high text similarity detected with existing campaigns. Story narrative appears unique.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedCampaign.similarCampaigns.map((sim, i) => (
                      <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-amber-900">
                        <div>
                          <strong className="block text-xs">{sim.title}</strong>
                          <span className="text-[10px] text-amber-700">Campaign ID: {sim.campaignId}</span>
                        </div>
                        <span className="font-bold bg-amber-200 px-2 py-1 rounded-lg text-xs">
                          {sim.similarityPercentage} Match
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Methodology Explainer */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                <p className="font-bold text-slate-800 mb-1">Explainable Evaluation Heuristics:</p>
                <p>
                  Risk scores are derived through deterministic rules and NLP cosine similarity: missing documentation (+35), short or vague descriptions (+15), high target amounts without supporting bills (+20), and {'>'}50% text similarity with existing campaigns (+25 to +40). Final verification is a human administrator decision.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              Select a campaign on the left to inspect AI risk scores and similarity vectors.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIRiskAnalysis;
