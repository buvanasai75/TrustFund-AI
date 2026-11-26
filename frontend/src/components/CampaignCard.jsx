import React from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaHeart, FaCalendarAlt, FaCheckCircle } from 'react-icons/fa';
import VerificationBadge from './VerificationBadge';

const defaultCategoryImages = {
  Medical: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
  Education: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
  Emergency: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
  Startup: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=800&q=80',
  'Social Causes': 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=800&q=80',
  Other: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
};

export const CampaignCard = ({ campaign, onDonateClick }) => {
  const {
    _id,
    title,
    description,
    category,
    targetAmount = 0,
    collectedAmount = 0,
    deadline,
    beneficiaryName,
    images = [],
    status,
    donationCount = 0,
  } = campaign;

  const percent = targetAmount > 0 ? Math.min(Math.round((collectedAmount / targetAmount) * 100), 100) : 0;
  const isGoalReached = collectedAmount >= targetAmount || status === 'GOAL_REACHED';
  const imgUrl = images[0] || defaultCategoryImages[category] || defaultCategoryImages.Medical;

  const daysLeft = deadline
    ? Math.max(0, Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group">
      {/* Campaign Image */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img
          src={imgUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = defaultCategoryImages[category] || defaultCategoryImages.Medical;
          }}
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 backdrop-blur-md text-brand-900 shadow-sm">
            {category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <VerificationBadge status={status} />
        </div>
      </div>

      {/* Campaign Body */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          <FaUser className="text-[10px] text-slate-400" />
          <span>Beneficiary: <strong className="text-slate-700">{beneficiaryName}</strong></span>
        </div>

        <Link to={`/campaigns/${_id}`} className="block">
          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 hover:text-brand-700 transition-colors">
            {title}
          </h3>
        </Link>

        <p className="text-slate-600 text-xs mt-2 line-clamp-2 leading-relaxed flex-1">
          {description}
        </p>

        {/* Progress bar */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex justify-between items-baseline mb-1.5">
            <div>
              <span className="text-base font-extrabold text-slate-900">
                ₹{Number(collectedAmount).toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500 ml-1">
                raised of ₹{Number(targetAmount).toLocaleString('en-IN')}
              </span>
            </div>
            <span className="text-xs font-bold text-brand-700">{percent}%</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isGoalReached ? 'bg-indigo-600' : 'bg-brand-600'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>

          {/* Metadata Footer */}
          <div className="flex justify-between items-center text-xs text-slate-500 mt-3 pt-2">
            <span className="flex items-center gap-1">
              <FaHeart className="text-rose-500 text-[11px]" />
              <strong>{donationCount}</strong> donations
            </span>
            <span className="flex items-center gap-1">
              <FaCalendarAlt className="text-slate-400 text-[11px]" />
              {daysLeft > 0 ? `${daysLeft} days left` : 'Completed'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 flex gap-2">
          <Link
            to={`/campaigns/${_id}`}
            className="flex-1 text-center py-2 px-3 border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs rounded-xl transition-colors"
          >
            Details
          </Link>

          {!isGoalReached && status === 'ACTIVE' ? (
            <button
              onClick={() => onDonateClick && onDonateClick(campaign)}
              className="flex-1 py-2 px-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5"
            >
              <FaHeart className="text-xs text-rose-300" /> Donate Now
            </button>
          ) : (
            <span className="flex-1 py-2 px-3 bg-indigo-50 text-indigo-700 font-medium text-xs rounded-xl text-center flex items-center justify-center gap-1">
              <FaCheckCircle className="text-xs" /> Goal Reached
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignCard;
