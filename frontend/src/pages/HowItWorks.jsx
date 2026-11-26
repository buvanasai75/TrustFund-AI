import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCheckCircle,
  FaShieldAlt,
  FaHeart,
  FaHandHoldingHeart,
  FaFileAlt,
  FaUserCheck,
  FaShareAlt,
  FaMoneyBillWave,
  FaSearch,
  FaReceipt,
  FaChartLine,
  FaLock,
} from 'react-icons/fa';

export const HowItWorks = () => {
  const [activeTab, setActiveTab] = useState('creator');

  const creatorSteps = [
    {
      step: '1',
      title: 'Register & Verify Your Profile',
      desc: 'Sign up in seconds and provide basic contact details to build an authenticated creator identity.',
      icon: <FaUserCheck />,
    },
    {
      step: '2',
      title: 'Create Your Fundraiser',
      desc: 'Describe your cause honestly, set a realistic target amount, and establish a deadline for the goal.',
      icon: <FaHandHoldingHeart />,
    },
    {
      step: '3',
      title: 'Upload Official Documents',
      desc: 'Submit genuine hospital estimates, medical admission letters, or educational tuition notices for verification.',
      icon: <FaFileAlt />,
    },
    {
      step: '4',
      title: 'Intelligent Verification',
      desc: 'Our platform and review team verify the authenticity of your documents to protect supporters and maintain trust.',
      icon: <FaShieldAlt />,
    },
    {
      step: '5',
      title: 'Go Live & Share Your Story',
      desc: 'Once approved, your campaign receives a dedicated page ready to be shared with family, friends, and supporters.',
      icon: <FaShareAlt />,
    },
    {
      step: '6',
      title: 'Receive Real-Time Donations',
      desc: 'Supporters donate securely via Razorpay. Track your incoming contributions live on your Creator Dashboard.',
      icon: <FaMoneyBillWave />,
    },
    {
      step: '7',
      title: 'Direct Disbursement & Updates',
      desc: 'Upon campaign completion, funds are safely disbursed to the beneficiary, keeping donors informed along the way.',
      icon: <FaCheckCircle />,
    },
  ];

  const donorSteps = [
    {
      step: '1',
      title: 'Explore Verified Causes',
      desc: 'Browse medical, education, and disaster relief campaigns that have met our strict verification standards.',
      icon: <FaSearch />,
    },
    {
      step: '2',
      title: 'Review Authentic Stories',
      desc: 'Read authentic stories backed by genuine documentation, clear goals, and verified beneficiary information.',
      icon: <FaFileAlt />,
    },
    {
      step: '3',
      title: 'Choose Your Contribution',
      desc: 'Enter any amount you wish to donate. You can choose to contribute publicly or donate anonymously.',
      icon: <FaHeart />,
    },
    {
      step: '4',
      title: 'Fast & Secure Checkout',
      desc: 'Complete payment through Razorpay test/live gateways using UPI, Netbanking, Credit Card, or Debit Card.',
      icon: <FaLock />,
    },
    {
      step: '5',
      title: 'Instant Verifiable Receipt',
      desc: 'Download or print an official contribution receipt featuring a unique reference ID for your records.',
      icon: <FaReceipt />,
    },
    {
      step: '6',
      title: 'Follow the Real Impact',
      desc: 'Stay connected with the campaign’s progress and witness the real difference your contribution makes.',
      icon: <FaChartLine />,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200">
          <FaShieldAlt className="text-teal-600" /> Simple & Transparent
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          How TrustFund AI Works
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Learn how our platform brings integrity, clarity, and security to every stage of the fundraising journey.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('creator')}
            className={`py-2.5 px-6 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'creator'
                ? 'bg-brand-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FaHandHoldingHeart /> For Campaign Creators
          </button>
          <button
            onClick={() => setActiveTab('donor')}
            className={`py-2.5 px-6 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'donor'
                ? 'bg-brand-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FaHeart /> For Generous Donors
          </button>
        </div>
      </div>

      {/* Steps Container */}
      <div className="space-y-6">
        {activeTab === 'creator' ? (
          <div className="space-y-4">
            <div className="text-center pb-4">
              <h2 className="text-xl font-bold text-slate-900">7 Simple Steps to Raise Funds</h2>
              <p className="text-xs text-slate-500 mt-1">From initial submission to final disbursement</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creatorSteps.map((s) => (
                <div key={s.step} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-lg flex-shrink-0 font-black">
                    {s.step}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm">{s.title}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center pb-4">
              <h2 className="text-xl font-bold text-slate-900">6 Easy Steps to Support a Cause</h2>
              <p className="text-xs text-slate-500 mt-1">Clear, safe, and verifiable donations in minutes</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {donorSteps.map((s) => (
                <div key={s.step} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center text-lg flex-shrink-0 font-black">
                    {s.step}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm">{s.title}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Trust Pillars */}
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">How We Ensure Trust</h2>
          <p className="text-xs text-slate-600">
            Our multi-tier verification process protects contributors and creators alike.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          <div className="text-center space-y-2 p-4">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto text-xl">
              <FaShieldAlt />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Identity & Document Review</h4>
            <p className="text-xs text-slate-600">
              Cross-checking names, institutions, and financial amounts on official invoices.
            </p>
          </div>

          <div className="text-center space-y-2 p-4">
            <div className="w-12 h-12 bg-blue-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto text-xl">
              <FaLock />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Official Razorpay Checkout</h4>
            <p className="text-xs text-slate-600">
              End-to-end encrypted transactions with backend signature verification and zero key leakage.
            </p>
          </div>

          <div className="text-center space-y-2 p-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-xl">
              <FaCheckCircle />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Transparent Milestones</h4>
            <p className="text-xs text-slate-600">
              Donation totals update only upon verified success, ensuring 100% financial accuracy.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-4 space-y-4">
        <h3 className="text-xl font-bold text-slate-900">Ready to Get Started?</h3>
        <div className="flex justify-center gap-4">
          <Link
            to="/campaigns/create"
            className="py-2.5 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
          >
            Start a Campaign
          </Link>
          <Link
            to="/campaigns"
            className="py-2.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors"
          >
            Explore Campaigns
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;