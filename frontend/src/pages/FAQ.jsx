import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaQuestionCircle, FaShieldAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'How does TrustFund AI verify campaigns?',
      a: 'Every campaign requires official supporting documents (such as hospital bills, diagnosis summaries, or university fee notices). Our system extracts and cross-checks key details, and our compliance team inspects every document prior to public listing.',
    },
    {
      q: 'How does the Razorpay payment checkout work?',
      a: 'When you click Donate, the official Razorpay Checkout modal opens. You can select your preferred payment method—UPI, Credit/Debit card, or Netbanking. Every successful transaction is verified via cryptographic signatures on our secure server, and an instant receipt is generated.',
    },
    {
      q: 'Can I donate anonymously?',
      a: 'Yes. You can check the "Make contribution anonymous" box during checkout. Your name will be hidden from the public campaign donor list, while still receiving a private tax and payment receipt for your records.',
    },
    {
      q: 'Are there any platform fees or hidden deductions?',
      a: 'TrustFund AI is designed for maximum transparency. Funds raised are allocated directly toward verified campaign expenses and medical/educational bills without arbitrary deduction penalties.',
    },
    {
      q: 'How are funds disbursed to the beneficiary?',
      a: 'When a campaign reaches its milestone or deadline, the creator submits disbursement details. Our administration team validates the bank account of the hospital, institution, or verified beneficiary before releasing funds.',
    },
    {
      q: 'What should I do if I suspect a campaign is fraudulent?',
      a: 'Every campaign page includes a "Report Campaign" button. You can submit details or evidence regarding your concern. Our integrity team reviews all reports immediately and will suspend unverified campaigns if irregularities are detected.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200">
          <FaQuestionCircle className="text-teal-600" /> Frequently Asked Questions
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Questions & Answers
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          Find fast answers to common questions about donations, verification, and fundraising.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
              className="w-full p-5 text-left flex justify-between items-center gap-4 hover:bg-slate-50 transition-colors"
            >
              <span className="font-bold text-slate-900 text-sm">{faq.q}</span>
              <span className="text-slate-400 text-xs flex-shrink-0">
                {openIndex === idx ? <FaChevronUp /> : <FaChevronDown />}
              </span>
            </button>
            {openIndex === idx && (
              <div className="p-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Still Have Questions CTA */}
      <div className="p-8 bg-brand-50 border border-brand-200 rounded-3xl text-center space-y-3">
        <h3 className="font-bold text-slate-900 text-base">Still Have Questions?</h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Can’t find what you’re looking for? Our support team is always ready to assist you.
        </p>
        <Link
          to="/contact"
          className="inline-block py-2.5 px-5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
        >
          Contact Our Team
        </Link>
      </div>
    </div>
  );
};

export default FAQ;