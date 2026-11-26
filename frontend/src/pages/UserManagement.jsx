import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import UserAvatar from '../components/UserAvatar';
import { FaUsers, FaUserShield, FaUserCheck, FaHeart, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await adminAPI.getUsers();
        setUsers(res.data.users || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-brand-600 text-xs font-bold uppercase tracking-wider mb-1">
          <FaUsers /> User Governance
        </div>
        <h1 className="text-3xl font-black text-slate-900">User Management ({users.length})</h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
          View all registered platform accounts and role assignments.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading user accounts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold text-[10px] border-b border-slate-100">
                  <th className="py-3.5 px-6">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  <th className="py-3.5 px-4">Verification</th>
                  <th className="py-3.5 px-6 text-right">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 flex items-center gap-3">
                      <UserAvatar user={u} size="sm" />
                      <div>
                        <strong className="block text-slate-900">{u.name}</strong>
                        <span className="text-[11px] text-slate-500">{u.email}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        u.role === 'creator' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {u.role === 'admin' && <FaUserShield className="text-[9px]" />}
                        {u.role === 'creator' && <FaUserCheck className="text-[9px]" />}
                        {u.role === 'donor' && <FaHeart className="text-[9px]" />}
                        {u.role}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {u.phone || '—'}
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                        <FaCheckCircle className="text-[10px]" /> Verified Member
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right text-slate-500 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
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

export default UserManagement;
