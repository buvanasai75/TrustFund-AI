import React from 'react';
import { FaShieldAlt } from 'react-icons/fa';

export const Privacy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200">
          <FaShieldAlt className="text-teal-600" /> Legal & Compliance
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">Last updated: January 2026</p>
      </div>

      <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-8 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Information We Collect</h2>
          <p>
            When you register on TrustFund AI, create a campaign, or contribute to a fundraiser, we collect information including your name, email address, contact number, and verification documents (hospital bills, fee slips, or identification records).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Document Confidentiality & Safety</h2>
          <p>
            Supporting documents uploaded for campaign verification are stored securely with restricted access controls. Sensitive personal identifiers that are not required for verification are safeguarded and never sold or shared with commercial third parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Payment Information Security</h2>
          <p>
            TrustFund AI never stores full credit card numbers, CVVs, or online banking passwords on our servers. All financial transactions are securely processed through Razorpay's PCI-DSS compliant infrastructure using encrypted tokens and HMAC SHA256 verified signatures.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Donor Privacy & Anonymity</h2>
          <p>
            Donors who choose the anonymous contribution option are never listed publicly on campaign pages. Transaction receipts and records are shared only with the authenticated contributor.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">5. Contact Information</h2>
          <p>
            If you have questions or concerns regarding our privacy practices or your personal data, please contact our Data Protection Team at{' '}
            <a href="mailto:privacy@trustfund.ai" className="font-bold text-brand-600 hover:underline">
              privacy@trustfund.ai
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;