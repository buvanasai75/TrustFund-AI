import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import UserAvatar from './UserAvatar';
import {
  FaShieldAlt,
  FaPlusCircle,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaTachometerAlt,
  FaHeart,
  FaFileContract,
  FaUsers,
  FaExchangeAlt,
  FaChartBar,
} from 'react-icons/fa';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const role = user?.role;
  const isAdmin = role === 'admin';
  const isCreator = role === 'creator';
  const isDonor = role === 'donor';

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-brand-900 text-white flex items-center justify-center shadow-md group-hover:bg-brand-800 transition-colors">
            <FaShieldAlt className="text-xl text-teal-400" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-1">
              TrustFund<span className="text-brand-600">AI</span>
            </span>
            <span className="block text-[9px] font-semibold text-slate-500 uppercase tracking-widest -mt-1">
              Verified Crowdfunding
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <Link to="/" className="hover:text-brand-700 transition-colors">
            Home
          </Link>
          <Link to="/campaigns" className="hover:text-brand-700 transition-colors">
            Explore Campaigns
          </Link>
          <Link to="/how-it-works" className="hover:text-brand-700 transition-colors">
            How It Works
          </Link>
          <Link to="/about" className="hover:text-brand-700 transition-colors">
            About Us
          </Link>
          <Link to="/contact" className="hover:text-brand-700 transition-colors">
            Contact Us
          </Link>

          {/* Role-Specific Quick Links in Desktop Nav */}
          {isAuthenticated && isDonor && (
            <Link
              to="/donor/dashboard"
              className="text-brand-700 font-bold hover:text-brand-900 flex items-center gap-1.5 px-3 py-1 bg-brand-50 rounded-lg border border-brand-200"
            >
              <FaHeart className="text-rose-500" /> Donor Dashboard
            </Link>
          )}

          {isAuthenticated && isCreator && (
            <Link
              to="/creator/dashboard"
              className="text-teal-800 font-bold hover:text-teal-950 flex items-center gap-1.5 px-3 py-1 bg-teal-50 rounded-lg border border-teal-200"
            >
              <FaTachometerAlt className="text-teal-600" /> Creator Dashboard
            </Link>
          )}

          {isAuthenticated && isAdmin && (
            <Link
              to="/admin/dashboard"
              className="text-purple-800 font-bold hover:text-purple-950 flex items-center gap-1.5 px-3 py-1 bg-purple-50 rounded-lg border border-purple-200"
            >
              <FaShieldAlt className="text-purple-600" /> Admin Dashboard
            </Link>
          )}
        </nav>

        {/* Right side controls */}
        <div className="hidden md:flex items-center gap-3">
          {/* Action button: Show Start a Campaign for public or creator */}
          {(!isAuthenticated || isCreator) && (
            <Link
              to="/campaigns/create"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-50 text-teal-800 hover:bg-teal-100 transition-colors border border-teal-200"
            >
              <FaPlusCircle className="text-teal-600" /> Start a Campaign
            </Link>
          )}

          {isAuthenticated ? (
            <>
              <NotificationBell />

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <UserAvatar user={user} size="sm" />
                  <div className="text-left leading-tight hidden xl:block">
                    <span className="block text-xs font-bold text-slate-800">{user?.name}</span>
                    <span className={`block text-[10px] uppercase font-bold tracking-wider ${
                      isAdmin ? 'text-purple-600' : isCreator ? 'text-teal-600' : 'text-brand-600'
                    }`}>
                      {user?.role}
                    </span>
                  </div>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-fadeIn">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="font-bold text-slate-800 truncate">{user?.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isAdmin ? 'bg-purple-100 text-purple-800' : isCreator ? 'bg-teal-100 text-teal-800' : 'bg-brand-100 text-brand-800'
                      }`}>
                        {user?.role} Account
                      </span>
                    </div>

                    {/* Donor-Only Navigation */}
                    {isDonor && (
                      <div className="py-1">
                        <Link
                          to="/donor/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700 font-semibold"
                        >
                          <FaHeart className="text-rose-500" /> Donor Dashboard
                        </Link>
                        <Link
                          to="/campaigns"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-600"
                        >
                          <FaPlusCircle className="text-slate-400" /> Explore Causes
                        </Link>
                      </div>
                    )}

                    {/* Creator-Only Navigation */}
                    {isCreator && (
                      <div className="py-1">
                        <Link
                          to="/creator/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700 font-semibold"
                        >
                          <FaTachometerAlt className="text-teal-600" /> Creator Dashboard
                        </Link>
                        <Link
                          to="/campaigns/create"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-600"
                        >
                          <FaPlusCircle className="text-slate-400" /> Create Campaign
                        </Link>
                      </div>
                    )}

                    {/* Admin-Only Navigation */}
                    {isAdmin && (
                      <div className="py-1">
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-purple-700 font-semibold"
                        >
                          <FaShieldAlt className="text-purple-600" /> Admin Dashboard
                        </Link>
                        <Link
                          to="/admin/campaigns"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700"
                        >
                          <FaFileContract className="text-slate-400" /> Verification Queue
                        </Link>
                        <Link
                          to="/admin/ai-risk"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700"
                        >
                          <FaShieldAlt className="text-slate-400" /> AI Risk Analysis
                        </Link>
                        <Link
                          to="/admin/settlements"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700"
                        >
                          <FaExchangeAlt className="text-slate-400" /> Settlements
                        </Link>
                        <Link
                          to="/admin/analytics"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700"
                        >
                          <FaChartBar className="text-slate-400" /> Analytics
                        </Link>
                        <Link
                          to="/admin/users"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700"
                        >
                          <FaUsers className="text-slate-400" /> User Management
                        </Link>
                      </div>
                    )}

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-rose-50 text-rose-600 font-medium"
                    >
                      <FaSignOutAlt /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-bold text-slate-700 hover:text-brand-700 px-3 py-2 rounded-lg transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl shadow-sm transition-all"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="lg:hidden flex items-center gap-2">
          {isAuthenticated && <NotificationBell />}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-2 text-xs font-medium">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-700 hover:text-brand-700 py-1.5"
          >
            Home
          </Link>
          <Link
            to="/campaigns"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-700 hover:text-brand-700 py-1.5"
          >
            Explore Campaigns
          </Link>
          <Link
            to="/how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-700 hover:text-brand-700 py-1.5"
          >
            How It Works
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-700 hover:text-brand-700 py-1.5"
          >
            About Us
          </Link>
          <Link
            to="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-700 hover:text-brand-700 py-1.5"
          >
            Contact Us
          </Link>

          {(!isAuthenticated || isCreator) && (
            <Link
              to="/campaigns/create"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-teal-800 font-bold py-2 bg-teal-50 px-3 rounded-xl border border-teal-200 mt-2"
            >
              + Start a Campaign
            </Link>
          )}

          {isAuthenticated ? (
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center gap-2 py-1">
                <UserAvatar user={user} size="sm" />
                <div>
                  <p className="font-bold text-slate-800">{user?.name}</p>
                  <p className={`text-[10px] uppercase font-bold ${
                    isAdmin ? 'text-purple-600' : isCreator ? 'text-teal-600' : 'text-brand-600'
                  }`}>
                    {user?.role} Account
                  </p>
                </div>
              </div>

              {/* Role-Specific Mobile Links */}
              {isDonor && (
                <Link
                  to="/donor/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-brand-700 font-bold py-2"
                >
                  <FaHeart className="inline mr-1.5 text-rose-500" /> Donor Dashboard
                </Link>
              )}

              {isCreator && (
                <Link
                  to="/creator/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-teal-700 font-bold py-2"
                >
                  <FaTachometerAlt className="inline mr-1.5 text-teal-600" /> Creator Dashboard
                </Link>
              )}

              {isAdmin && (
                <>
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-purple-700 font-bold py-2"
                  >
                    <FaShieldAlt className="inline mr-1.5 text-purple-600" /> Admin Dashboard
                  </Link>
                  <Link
                    to="/admin/campaigns"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-slate-600 py-1.5 pl-3"
                  >
                    Verification Queue
                  </Link>
                </>
              )}

              <button
                onClick={handleLogout}
                className="w-full text-left text-rose-600 font-semibold py-2 border-t border-slate-100 mt-2 flex items-center gap-1.5"
              >
                <FaSignOutAlt /> Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 border border-slate-200 rounded-xl font-bold text-slate-700"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 bg-brand-600 text-white rounded-xl font-bold"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;