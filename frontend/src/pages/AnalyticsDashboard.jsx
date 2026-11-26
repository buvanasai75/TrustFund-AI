import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  FaChartLine,
  FaChartPie,
  FaShieldAlt,
  FaMoneyBillWave,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
} from 'react-icons/fa';

export const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await adminAPI.getAnalytics();
        setData(res.data);
      } catch (err) {
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Calculating real-time analytics from MongoDB collections...
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const riskDistribution = data?.riskDistribution || [];
  const categoryBreakdown = data?.categoryBreakdown || [];
  const timeline = data?.recentDonationsTimeline || [];

  const approvalStats = [
    { name: 'Active & Approved', count: metrics.approvedCampaigns || 0, fill: '#10B981' },
    { name: 'Pending Review', count: metrics.pendingCampaigns || 0, fill: '#F59E0B' },
    { name: 'Rejected', count: metrics.rejectedCampaigns || 0, fill: '#EF4444' },
    { name: 'Goal Reached', count: metrics.completedCampaigns || 0, fill: '#6366F1' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-brand-600 text-xs font-bold uppercase tracking-wider mb-1">
          <FaChartLine /> Verified Data Intelligence
        </div>
        <h1 className="text-3xl font-black text-slate-900">Platform Analytics & Risk Metrics</h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
          Real MongoDB aggregations covering donation trends, category distribution, and AI risk spread.
        </p>
      </div>

      {/* Top Level Numeric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Funds Collected</span>
          <p className="text-2xl font-black text-brand-900">
            ₹{Number(metrics.totalAmountRaised || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">From {metrics.totalDonations || 0} donations</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Registered Users</span>
          <p className="text-2xl font-black text-slate-900">{metrics.totalUsers || 0}</p>
          <span className="text-[11px] text-slate-500 font-medium">Donors, creators & admins</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active Live Causes</span>
          <p className="text-2xl font-black text-emerald-600">{metrics.activeCampaigns || 0}</p>
          <span className="text-[11px] text-slate-500 font-medium">Passed AI & OCR checks</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Flagged Risk Campaigns</span>
          <p className="text-2xl font-black text-rose-600">{metrics.flaggedCampaigns || 0}</p>
          <span className="text-[11px] text-slate-500 font-medium">Under integrity review</span>
        </div>
      </div>

      {/* Charts Grid 1: Area Timeline & Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Donations Over Time */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FaChartLine className="text-brand-600" /> Recent Donation Flow (₹ INR)
            </h3>
            <span className="text-[10px] font-semibold text-slate-400">Real-time ledger updates</span>
          </div>

          <div className="h-64 w-full">
            {timeline.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No recent donations recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Donation']} />
                  <Area type="monotone" dataKey="amount" stroke="#2563eb" fillOpacity={1} fill="url(#colorAmount)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Campaign Verification Statuses */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FaCheckCircle className="text-emerald-600" /> Campaign Verification Status
            </h3>
            <span className="text-[10px] font-semibold text-slate-400">Workflow distribution</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={approvalStats} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {approvalStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Grid 2: Risk Distribution Pie & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risk Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FaShieldAlt className="text-teal-600" /> AI Fraud Risk Distribution
            </h3>
            <span className="text-[10px] font-semibold text-slate-400">Classified by Python ML</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-risk-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FaChartPie className="text-indigo-600" /> Funds Raised by Category
            </h3>
            <span className="text-[10px] font-semibold text-slate-400">Aggregate sum</span>
          </div>

          <div className="h-64 w-full">
            {categoryBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No category data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBreakdown} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `₹${v}`} />
                  <YAxis type="category" dataKey="category" stroke="#94a3b8" fontSize={10} />
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Raised']} />
                  <Bar dataKey="raised" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
