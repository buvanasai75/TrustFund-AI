import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import {
  FaExchangeAlt,
  FaCheckCircle,
  FaClock,
  FaMoneyBillWave,
  FaSpinner,
  FaBuilding,
  FaUserCheck,
  FaInfoCircle,
} from 'react-icons/fa';

export const SettlementManagement = () => {
  const [settlements, setSettlements] = useState([]);
  const [eligibleCampaigns, setEligibleCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stlRes, campsRes] = await Promise.all([
        adminAPI.getSettlements(),
        adminAPI.getCampaigns({ status: 'GOAL_REACHED' }),
      ]);
      setSettlements(stlRes.data.settlements || []);
      setEligibleCampaigns(campsRes.data.campaigns || []);
      if (campsRes.data.campaigns?.length > 0) {
        setSelectedCampaignId(campsRes.data.campaigns[0]._id);
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

  const handleSimulateSettlement = async (e) => {
    e.preventDefault();
    if (!selectedCampaignId) return;

    setSimulating(true);
    setSuccessMessage('');

    try {
      const res = await adminAPI.simulateSettlement({
        campaignId: selectedCampaignId,
        notes: settlementNotes || 'Verified settlement recorded in disbursement ledger.',
      });

      setSuccessMessage(`Settlement simulated successfully! Reference: ${res.data.settlement.settlementReference}`);
      setSettlementNotes('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Settlement simulation failed.');
    } finally {
      setSimulating(false);
    }
  };

  const totalSettled = settlements.reduce((acc, s) => acc + (s.amountApproved || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
          <FaExchangeAlt /> Beneficiary Disbursement Ledger
        </div>
        <h1 className="text-3xl font-black text-slate-900">Settlement Management</h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
          Track collected vs transferred funds separately. Simulated Settlement Mode records disbursements in the ledger.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Settled (Simulated)</span>
          <p className="text-2xl font-black text-indigo-900">₹{totalSettled.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-slate-500 font-medium">Recorded in disbursement ledger</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed Settlements</span>
          <p className="text-2xl font-black text-emerald-600">{settlements.length}</p>
          <span className="text-[11px] text-slate-500 font-medium">Disbursement records</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Eligible For Settlement</span>
          <p className="text-2xl font-black text-amber-600">{eligibleCampaigns.length}</p>
          <span className="text-[11px] text-slate-500 font-medium">Goal-reached campaigns</span>
        </div>
      </div>

      {/* Settlement Action Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FaMoneyBillWave className="text-brand-600" /> Execute Beneficiary Settlement (Simulated Mode)
        </h2>

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <FaCheckCircle className="text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {eligibleCampaigns.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-500">
            No campaigns currently in <strong>GOAL_REACHED</strong> status. Once an active campaign hits 100% of its fundraising goal, it appears here for simulated beneficiary disbursement.
          </div>
        ) : (
          <form onSubmit={handleSimulateSettlement} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Goal-Reached Campaign</label>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-medium"
                  required
                >
                  {eligibleCampaigns.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title} (₹{c.collectedAmount.toLocaleString('en-IN')} Raised - Beneficiary: {c.beneficiaryName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Simulated Bank Destination</label>
                <input
                  type="text"
                  disabled
                  value="HDFC Bank - A/C: XXXX-XXXX-9842 (IFSC: HDFC0001234)"
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Administrative Settlement Audit Notes</label>
              <input
                type="text"
                value={settlementNotes}
                onChange={(e) => setSettlementNotes(e.target.value)}
                placeholder="e.g., Hospital estimate and admission confirmed. Approved for full release."
                className="w-full p-2.5 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400 italic">
                Mode: SIMULATED SETTLEMENT MODE (Demonstration disbursement ledger)
              </span>
              <button
                type="submit"
                disabled={simulating}
                className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                {simulating ? <FaSpinner className="animate-spin" /> : <FaExchangeAlt />}
                Execute Simulated Settlement
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Settlements History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Beneficiary Settlement Records ({settlements.length})</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading settlements...</div>
        ) : settlements.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No settlement records found in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                  <th className="py-3.5 px-6">Settlement Reference</th>
                  <th className="py-3.5 px-4">Campaign & Beneficiary</th>
                  <th className="py-3.5 px-4">Amount Raised</th>
                  <th className="py-3.5 px-4">Amount Approved</th>
                  <th className="py-3.5 px-4">Settlement Date</th>
                  <th className="py-3.5 px-4">Mode</th>
                  <th className="py-3.5 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settlements.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-indigo-700">
                      {s.settlementReference}
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <strong className="block text-slate-900 truncate">{s.campaign?.title || 'Campaign'}</strong>
                      <span className="text-[10px] text-slate-400">Beneficiary: {s.beneficiaryName}</span>
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-700">
                      ₹{s.amountRaised?.toLocaleString('en-IN')}
                    </td>

                    <td className="py-4 px-4 font-black text-emerald-700">
                      ₹{s.amountApproved?.toLocaleString('en-IN')}
                    </td>

                    <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(s.settlementDate).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {s.mode}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <FaCheckCircle className="text-[10px]" /> {s.status}
                      </span>
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

export default SettlementManagement;
