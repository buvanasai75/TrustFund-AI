import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaShieldAlt, FaLock, FaEnvelope, FaSignInAlt, FaUserShield, FaUserCheck, FaHeart } from 'react-icons/fa';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'creator') {
        navigate('/creator/dashboard');
      } else {
        const target = redirectPath && redirectPath !== '/' ? redirectPath : '/donor/dashboard';
        navigate(target);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-brand-900 text-teal-400 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-md">
            <FaShieldAlt />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign In to TrustFund AI</h2>
          <p className="text-xs text-slate-500">Access verified campaigns, creator tools, or admin portal</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3.5 top-3 text-slate-400 text-xs" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <FaLock className="absolute left-3.5 top-3 text-slate-400 text-xs" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : <><FaSignInAlt /> Sign In</>}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Quick Fill Demo Accounts
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('admin@crowdfund.ai', 'Admin@Secure2026!')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-brand-50 border border-slate-200 text-left transition-colors text-[10px]"
            >
              <FaUserShield className="text-brand-600 mb-0.5 text-xs" />
              <strong className="block text-slate-800">Admin</strong>
              <span className="text-slate-500 block truncate">admin@</span>
            </button>

            <button
              type="button"
              onClick={() => fillDemo('creator@crowdfund.ai', 'Creator@Pass2026!')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 text-left transition-colors text-[10px]"
            >
              <FaUserCheck className="text-teal-600 mb-0.5 text-xs" />
              <strong className="block text-slate-800">Creator</strong>
              <span className="text-slate-500 block truncate">creator@</span>
            </button>

            <button
              type="button"
              onClick={() => fillDemo('donor@crowdfund.ai', 'Donor@Pass2026!')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 text-left transition-colors text-[10px]"
            >
              <FaHeart className="text-rose-500 mb-0.5 text-xs" />
              <strong className="block text-slate-800">Donor</strong>
              <span className="text-slate-500 block truncate">donor@</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-brand-600 hover:text-brand-800">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
