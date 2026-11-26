import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaShieldAlt,
  FaHeart,
  FaUsers,
  FaCheckCircle,
  FaHandHoldingHeart,
  FaBalanceScale,
  FaArrowRight,
  FaLightbulb,
} from 'react-icons/fa';

export const About = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200">
          <FaShieldAlt className="text-teal-600" /> About TrustFund AI
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Every Contribution Builds Hope. Every Campaign Deserves Trust.
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          TrustFund AI was founded on a simple conviction: technology should make giving more compassionate, accessible, and completely trustworthy.
        </p>
      </div>

      {/* Mission & Vision Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center text-xl">
            <FaHeart />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Our Mission</h2>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            To provide a safe, accessible, and transparent crowdfunding ecosystem where individuals and families facing medical emergencies, educational hurdles, and disaster crises can find timely financial relief without barriers.
          </p>
        </div>

        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-xl">
            <FaLightbulb />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Our Vision</h2>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            A world where donor goodwill is never abused and every genuine plea for help is met with verified dignity, rapid support, and absolute financial accountability.
          </p>
        </div>
      </div>

      {/* Our Commitment to Transparency */}
      <div className="bg-gradient-to-br from-slate-900 via-brand-900 to-indigo-950 text-white p-8 sm:p-12 rounded-3xl shadow-xl space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Our Core Promise</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold">Commitment to Transparency</h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Trust is the cornerstone of every donation. We take active measures to guarantee that every campaign is backed by genuine documentation and authentic human stories.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
          <div className="space-y-2 bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <h4 className="font-bold text-teal-300 text-sm flex items-center gap-2">
              <FaCheckCircle /> Document Verification
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              Medical estimates, hospital admission sheets, and tuition fee notices are rigorously checked to protect donors against fraud.
            </p>
          </div>

          <div className="space-y-2 bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <h4 className="font-bold text-teal-300 text-sm flex items-center gap-2">
              <FaCheckCircle /> Safe Payment Rails
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              Donations are processed through standard secure Razorpay gateways with instant verifiable digital receipts.
            </p>
          </div>

          <div className="space-y-2 bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <h4 className="font-bold text-teal-300 text-sm flex items-center gap-2">
              <FaCheckCircle /> Verified Disbursement
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              Funds are disbursed to beneficiaries with transparent progress tracking, settlement logs, and campaign updates.
            </p>
          </div>
        </div>
      </div>

      {/* Who We Support */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Causes We Support</h2>
          <p className="text-xs sm:text-sm text-slate-600">
            From urgent healthcare interventions to educational empowerment and crisis relief.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-2">
            <span className="text-2xl block">🏥</span>
            <h3 className="font-bold text-slate-900 text-sm">Medical Emergencies</h3>
            <p className="text-slate-600 text-xs">
              Surgeries, cancer care, ICU treatments, and vital medicines for families in financial distress.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-2">
            <span className="text-2xl block">🎓</span>
            <h3 className="font-bold text-slate-900 text-sm">Higher Education</h3>
            <p className="text-slate-600 text-xs">
              Tuition fees, study materials, and living support for bright and deserving students.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-2">
            <span className="text-2xl block">🤝</span>
            <h3 className="font-bold text-slate-900 text-sm">Disaster & Relief</h3>
            <p className="text-slate-600 text-xs">
              Immediate community relief, shelter restoration, and emergency aid during critical crises.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-8 border-t border-slate-200 space-y-4">
        <h3 className="text-xl font-bold text-slate-900">Be Part of the Solution</h3>
        <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
          Start your campaign today or browse verified causes to make a direct positive difference in someone’s life.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Link
            to="/campaigns"
            className="py-2.5 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
          >
            Explore Campaigns
          </Link>
          <Link
            to="/contact"
            className="py-2.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;