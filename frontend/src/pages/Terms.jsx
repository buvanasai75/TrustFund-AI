import React from 'react';
import { FaShieldAlt } from 'react-icons/fa';

export const Terms = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200">
          <FaShieldAlt className="text-teal-600" /> Platform Agreement
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Terms and Conditions
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">Last updated: January 2026</p>
      </div>

      <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-8 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or using TrustFund AI, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you should discontinue using our services immediately.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Campaign Creator Responsibilities</h2>
          <p>
            Campaign creators must provide truthful, accurate, and complete information regarding beneficiaries, financial estimates, and reasons for fundraising. Falsification of hospital bills, university fee statements, or identities constitutes grounds for immediate campaign termination, forfeiture of funds, and legal referral.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Donations & Payment Verification</h2>
          <p>
            All donations are voluntary contributions. Donations are processed through official payment partners (Razorpay). A donation is confirmed only upon successful cryptographic signature verification from the payment gateway.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Verification & Administrative Rights</h2>
          <p>
            TrustFund AI reserves the right to review, withhold approval, request supplementary evidence, or suspend any campaign that fails verification criteria or raises plausible fraud concerns.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">5. Disbursements & Settlements</h2>
          <p>
            Disbursements to beneficiaries are executed following administrative review and verification of beneficiary bank details to ensure that collected funds reach their stated destination.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Terms;