import React from 'react';
import { FaCheckCircle, FaClock, FaExclamationCircle, FaTimesCircle, FaTrophy } from 'react-icons/fa';

export const VerificationBadge = ({ status }) => {
  switch (status) {
    case 'APPROVED':
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <FaCheckCircle className="text-emerald-500" /> Verified & Active
        </span>
      );
    case 'GOAL_REACHED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <FaTrophy className="text-indigo-500" /> Target Achieved
        </span>
      );
    case 'PENDING_VERIFICATION':
    case 'UNDER_REVIEW':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <FaClock className="text-blue-500" /> Verification Pending
        </span>
      );
    case 'ADDITIONAL_INFORMATION_REQUIRED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <FaExclamationCircle className="text-amber-500" /> Info Requested
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <FaTimesCircle className="text-rose-500" /> Verification Rejected
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <FaCheckCircle className="text-slate-500" /> Completed & Settled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {status}
        </span>
      );
  }
};

export default VerificationBadge;
