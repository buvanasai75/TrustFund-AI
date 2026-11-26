import React, { useState, useEffect } from 'react';
import { campaignAPI } from '../services/api';
import CampaignCard from '../components/CampaignCard';
import DonationModal from '../components/DonationModal';
import { FaSearch, FaFilter, FaHeart, FaSpinner } from 'react-icons/fa';

export const CampaignListing = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isDonationOpen, setIsDonationOpen] = useState(false);

  const categories = ['All', 'Medical', 'Education', 'Emergency', 'Startup', 'Social Causes', 'Other'];

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await campaignAPI.getPublic({
        category: category !== 'All' ? category : undefined,
        search: search.trim() || undefined,
        sort,
        page,
        limit: 9,
      });
      setCampaigns(res.data.campaigns || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [category, sort, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCampaigns();
  };

  const handleDonateClick = (campaign) => {
    setSelectedCampaign(campaign);
    setIsDonationOpen(true);
  };

  const handleDonationSuccess = (updatedDonation) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c._id === updatedDonation.campaign
          ? {
              ...c,
              collectedAmount: c.collectedAmount + updatedDonation.amount,
              donationCount: c.donationCount + 1,
            }
          : c
      )
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900">Explore Verified Campaigns</h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-1">
          Support verified causes with full transparency. Every campaign has passed intelligent document verification.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
            <FaSearch className="absolute left-3.5 top-3 text-slate-400 text-xs" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, beneficiary, or story..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 focus:bg-white"
            />
          </form>

          {/* Sort Selection */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Sort By:</span>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="py-1.5 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="createdAt">Newest First</option>
              <option value="targetAmountAsc">Target Amount (Low to High)</option>
              <option value="targetAmountDesc">Target Amount (High to Low)</option>
              <option value="collected">Most Funded</option>
              <option value="deadline">Expiring Soon</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              className={`py-1.5 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                category === cat
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto text-xl">
            <FaFilter />
          </div>
          <h3 className="font-bold text-slate-800 text-base">No campaigns found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords or switching category filters.
          </p>
          <button
            onClick={() => { setCategory('All'); setSearch(''); setPage(1); }}
            className="text-xs font-bold text-brand-600 hover:text-brand-800 underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((camp) => (
            <CampaignCard
              key={camp._id}
              campaign={camp}
              onDonateClick={handleDonateClick}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold disabled:opacity-40 hover:bg-slate-50"
          >
            Previous
          </button>
          <span className="text-xs text-slate-600 font-semibold px-2">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold disabled:opacity-40 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Donation Modal */}
      <DonationModal
        campaign={selectedCampaign}
        isOpen={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
        onSuccess={handleDonationSuccess}
      />
    </div>
  );
};

export default CampaignListing;
