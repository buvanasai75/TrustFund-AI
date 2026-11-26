import React from 'react';
import { FaUser } from 'react-icons/fa';

export const UserAvatar = ({ user, size = 'sm', className = '' }) => {
  const getInitials = (name) => {
    if (!name) return 'U';
    const clean = name.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim();
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const sz = sizeClasses[size] || sizeClasses.sm;
  const initials = getInitials(user?.name);

  // If user has a custom uploaded avatar that is not a placeholder stock face
  const hasCustomAvatar = Boolean(
    user?.avatar &&
    typeof user.avatar === 'string' &&
    user.avatar.trim() !== '' &&
    !user.avatar.includes('unsplash.com')
  );

  if (hasCustomAvatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name || 'User'}
        className={`${sz} rounded-full object-cover border border-slate-200 ${className}`}
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    );
  }

  // Consistent, professional neutral initials badge
  const roleColors = {
    admin: 'bg-purple-900 text-purple-200 border-purple-700',
    creator: 'bg-teal-800 text-teal-100 border-teal-600',
    donor: 'bg-brand-900 text-brand-100 border-brand-700',
  };

  const colorClass = roleColors[user?.role] || 'bg-slate-800 text-slate-100 border-slate-700';

  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-bold tracking-wider select-none border shadow-sm ${colorClass} ${className}`}
      title={user?.name || 'User'}
    >
      {initials || <FaUser className="text-[10px]" />}
    </div>
  );
};

export default UserAvatar;
