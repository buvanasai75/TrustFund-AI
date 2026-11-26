import React from 'react';
import { FaShieldAlt, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';

export const RiskBadge = ({ score = 0, level = 'LOW', showScore = true }) => {
  const normLevel = (level || 'LOW').toUpperCase();

  let bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let Icon = FaShieldAlt;

  if (normLevel === 'HIGH' || score >= 70) {
    bgClass = 'bg-rose-50 text-rose-700 border-rose-200';
    Icon = FaTimesCircle;
  } else if (normLevel === 'MEDIUM' || score >= 35) {
    bgClass = 'bg-amber-50 text-amber-700 border-amber-200';
    Icon = FaExclamationTriangle;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${bgClass}`}>
      <Icon className="text-xs" />
      <span>{normLevel} RISK</span>
      {showScore && <span className="opacity-80">({score}/100)</span>}
    </span>
  );
};

export default RiskBadge;
