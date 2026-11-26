import React, { useState, useEffect } from 'react';
import {
  FaTimes,
  FaShieldAlt,
  FaCheckCircle,
  FaSpinner,
  FaCreditCard,
  FaExclamationTriangle,
  FaFlask,
  FaPrint,
  FaRedo,
  FaTimesCircle,
} from 'react-icons/fa';
import { donationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const DonationModal = ({ campaign, isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState(1000);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donorName, setDonorName] = useState(user?.name || '');
  const [donorEmail, setDonorEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dual-mode gateway configuration
  const [gatewayConfig, setGatewayConfig] = useState({
    isRazorpayConfigured: false,
    keyId: null,
    defaultMode: 'DEMO_MODE',
  });
  const [activeMode, setActiveMode] = useState('DEMO_MODE'); // 'RAZORPAY_TEST' or 'DEMO_MODE'
  const [demoScenario, setDemoScenario] = useState('SUCCESS'); // 'SUCCESS' or 'FAILURE'

  // Completion states
  const [successInfo, setSuccessInfo] = useState(null);
  const [failureInfo, setFailureInfo] = useState(null);

  useEffect(() => {
    if (user) {
      if (!donorName) setDonorName(user.name || '');
      if (!donorEmail) setDonorEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessInfo(null);
      setFailureInfo(null);
      // Fetch gateway configuration from backend
      donationAPI
        .getConfig()
        .then((res) => {
          if (res.data) {
            setGatewayConfig(res.data);
            setActiveMode(res.data.isRazorpayConfigured ? 'RAZORPAY_TEST' : 'DEMO_MODE');
          }
        })
        .catch(() => {
          // Default to Demo Payment mode
          setActiveMode('DEMO_MODE');
        });
    }
  }, [isOpen]);

  if (!isOpen || !campaign) return null;

  const presetAmounts = [500, 1000, 2500, 5000];

  const handlePrintReceipt = (receiptData) => {
    const printWindow = window.open('', '_blank', 'width=650,height=750');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Official Contribution Receipt - TrustFund AI</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #0d9488; padding-bottom: 15px; margin-bottom: 25px; }
            .title { font-size: 20px; font-weight: bold; color: #0f172a; }
            .tagline { font-size: 11px; color: #0d9488; font-weight: 600; margin-top: 3px; }
            .meta { font-size: 12px; color: #64748b; margin-top: 8px; }
            .details { margin: 20px 0; font-size: 14px; line-height: 1.8; }
            .amount { font-size: 26px; font-weight: 800; color: #0d9488; margin: 15px 0; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
            .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">TrustFund AI – Official Contribution Receipt</div>
            <div class="tagline">Every Contribution Builds Hope. Every Campaign Deserves Trust.</div>
            <div class="meta">Receipt Reference: ${receiptData.transactionReference} • Date: ${new Date().toLocaleString()}</div>
          </div>
          <div class="details">
            <p><strong>Contributor:</strong> ${isAnonymous ? 'Generous Supporter (Anonymous)' : (donorName || user?.name || 'Supporter')}</p>
            <p><strong>Campaign:</strong> ${campaign.title}</p>
            <p><strong>Beneficiary:</strong> ${campaign.beneficiaryName}</p>
            <p><strong>Payment Mode:</strong> ${receiptData.mode === 'RAZORPAY_TEST' ? 'Razorpay Test Mode' : 'Demo Payment Mode (Simulated Ledger)'}</p>
            <div class="amount">₹${Number(receiptData.amount).toLocaleString('en-IN')} INR</div>
            <p><span class="badge">STATUS: SUCCESS (Confirmed & Credited)</span></p>
          </div>
          <div class="footer">
            <p>TrustFund AI Platform Integrity Verified. Thank you for your support.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDonate = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid donation amount in INR.');
      return;
    }

    setLoading(true);

    try {
      const isDemo = activeMode === 'DEMO_MODE';

      // 1. Create order on backend
      const orderRes = await donationAPI.createOrder({
        campaignId: campaign._id,
        amount: numAmount,
        isAnonymous,
        donorName: isAnonymous ? 'Generous Supporter' : (donorName || user?.name || 'Supporter'),
        donorEmail: donorEmail || user?.email || '',
        message,
        allowDemoFallback: isDemo,
      });

      const { mode, orderId, donationId, keyId, transactionReference } = orderRes.data;

      // 2. Handle Razorpay Test Mode
      if (mode === 'RAZORPAY_TEST' && keyId) {
        if (!window.Razorpay) {
          setError('Razorpay Checkout SDK failed to load. Please check your internet connection or switch to Demo Payment Mode.');
          setLoading(false);
          return;
        }

        const options = {
          key: keyId,
          amount: Math.round(numAmount * 100),
          currency: 'INR',
          name: 'TrustFund AI',
          description: `Contribution: ${campaign.title.substring(0, 35)}`,
          order_id: orderId,
          prefill: {
            name: isAnonymous ? 'Anonymous' : (donorName || user?.name || ''),
            email: donorEmail || user?.email || '',
          },
          theme: {
            color: '#1e40af',
          },
          handler: async function (response) {
            try {
              const verifyRes = await donationAPI.verifyPayment({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                donationId,
                isSimulated: false,
              });

              setSuccessInfo({
                amount: numAmount,
                paymentId: response.razorpay_payment_id,
                transactionReference: verifyRes.data.transactionReference || transactionReference || response.razorpay_payment_id,
                mode: 'RAZORPAY_TEST',
              });

              if (onSuccess) onSuccess(verifyRes.data.donation);
            } catch (err) {
              setError(err.response?.data?.message || 'Payment signature verification failed.');
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: async function () {
              setLoading(false);
              const cancelReason = 'Payment process was cancelled by user during checkout.';
              try {
                if (donationId) {
                  await donationAPI.cancelOrder({ donationId, reason: cancelReason });
                }
              } catch (cancelErr) {
                console.warn('Failed to record cancellation:', cancelErr);
              }
              setFailureInfo({
                amount: numAmount,
                reason: cancelReason,
                transactionReference: `CANCEL_${Date.now().toString().slice(-6)}`,
                mode: 'RAZORPAY_TEST',
              });
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', async function (response) {
          const failMsg = response.error?.description || 'Transaction declined by bank or test card.';
          setLoading(false);
          try {
            if (donationId) {
              await donationAPI.failPayment({ donationId, reason: failMsg, isSimulated: false });
            }
          } catch (cancelErr) {
            console.warn('Failed to record failure:', cancelErr);
          }
          setFailureInfo({
            amount: numAmount,
            reason: failMsg,
            transactionReference: `FAIL_RZP_${Date.now().toString().slice(-6)}`,
            mode: 'RAZORPAY_TEST',
          });
        });

        rzp.open();
        return;
      }

      // 3. Handle Simulated Test Payment Mode
      if (mode === 'DEMO_MODE') {
        // Scenario A: Simulate Success
        if (demoScenario === 'SUCCESS') {
          const simulatedPaymentId = `demo_pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          const verifyRes = await donationAPI.verifyPayment({
            orderId,
            paymentId: simulatedPaymentId,
            signature: 'demo_signature_valid',
            donationId,
            isSimulated: true,
          });

          setSuccessInfo({
            amount: numAmount,
            paymentId: simulatedPaymentId,
            transactionReference: verifyRes.data.transactionReference || transactionReference || simulatedPaymentId,
            mode: 'DEMO_MODE',
          });

          if (onSuccess) onSuccess(verifyRes.data.donation);
          setLoading(false);
          return;
        }

        // Scenario B: Simulate Failure
        if (demoScenario === 'FAILURE') {
          const failReason = 'Simulated test transaction failure: Card declined / Insufficient funds.';
          const failRes = await donationAPI.failPayment({
            donationId,
            orderId,
            reason: failReason,
            isSimulated: true,
          });

          setFailureInfo({
            amount: numAmount,
            reason: failReason,
            transactionReference: failRes.data.transactionReference || `FAIL_DEMO_${Date.now().toString().slice(-6)}`,
            mode: 'DEMO_MODE',
          });
          setLoading(false);
          return;
        }
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to initiate donation. Please try again.');
      setLoading(false);
    }
  };

  const resetForm = () => {
    setError('');
    setSuccessInfo(null);
    setFailureInfo(null);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <FaTimes />
          </button>
          <span className="text-xs uppercase tracking-wider text-teal-300 font-bold flex items-center gap-1.5">
            <FaShieldAlt className="text-xs" /> Contribution Portal
          </span>
          <h3 className="text-lg font-bold mt-1 line-clamp-1">{campaign.title}</h3>
          <p className="text-xs text-slate-300 mt-0.5">Beneficiary: {campaign.beneficiaryName}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* 1. SUCCESS VIEW */}
          {successInfo ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl shadow-sm">
                <FaCheckCircle />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900">Thank You For Your Support!</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Your contribution of <strong className="text-slate-900 font-extrabold">₹{Number(successInfo.amount).toLocaleString('en-IN')}</strong> has been confirmed and credited.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-700 border border-slate-200 text-left space-y-2">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-500">Transaction Reference:</span>
                  <span className="font-mono font-bold text-slate-900">{successInfo.transactionReference}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-500">Payment Mode:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    successInfo.mode === 'RAZORPAY_TEST'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {successInfo.mode === 'RAZORPAY_TEST' ? 'RAZORPAY TEST MODE' : 'DEMO PAYMENT (Simulated)'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-500">Verification Status:</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <FaCheckCircle className="text-[10px]" /> SUCCESS (Confirmed)
                  </span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="font-semibold text-slate-500">Beneficiary:</span>
                  <span className="font-semibold text-slate-800">{campaign.beneficiaryName}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handlePrintReceipt(successInfo)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <FaPrint className="text-xs" /> Print Receipt
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          ) : failureInfo ? (
            /* 2. FAILURE VIEW */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-2xl shadow-sm">
                <FaTimesCircle />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900">Payment Unsuccessful</h4>
                <p className="text-xs text-rose-700 mt-1 font-medium">
                  {failureInfo.reason}
                </p>
              </div>

              <div className="p-4 bg-rose-50/50 rounded-2xl text-xs text-slate-700 border border-rose-200 text-left space-y-2">
                <div className="flex justify-between items-center border-b border-rose-100 pb-2">
                  <span className="font-semibold text-slate-500">Transaction Reference:</span>
                  <span className="font-mono font-bold text-slate-800">{failureInfo.transactionReference}</span>
                </div>
                <div className="flex justify-between items-center border-b border-rose-100 pb-2">
                  <span className="font-semibold text-slate-500">Attempted Amount:</span>
                  <span className="font-bold text-slate-900">₹{Number(failureInfo.amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center border-b border-rose-100 pb-2">
                  <span className="font-semibold text-slate-500">Payment Status:</span>
                  <span className="text-rose-700 font-bold">FAILED (No funds deducted)</span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
                  Campaign fundraising totals have <strong>not</strong> been altered. This attempt is registered in your personal transaction history as unverified/failed.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="w-full py-2.5 px-4 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <FaRedo className="text-xs" /> Try Again or Select Different Amount
              </button>
            </div>
          ) : (
            /* 3. DONATION INPUT & SCENARIO SELECTION FORM */
            <form onSubmit={handleDonate} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                  {error}
                </div>
              )}

              {/* DUAL-MODE INDICATOR & SELECTION */}
              {gatewayConfig.isRazorpayConfigured ? (
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 flex items-center gap-1.5">
                      <FaCreditCard className="text-blue-700" /> Razorpay Test Mode Active
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveMode(activeMode === 'RAZORPAY_TEST' ? 'DEMO_MODE' : 'RAZORPAY_TEST')}
                      className="text-[11px] font-semibold text-blue-700 underline hover:text-blue-900"
                    >
                      {activeMode === 'RAZORPAY_TEST' ? 'Switch to Demo Mode' : 'Switch to Razorpay'}
                    </button>
                  </div>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    {activeMode === 'RAZORPAY_TEST'
                      ? 'Secure test orders will open official Razorpay Checkout with test UPI, Netbanking, & Cards.'
                      : 'Testing in Demo Simulation Mode.'}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <FaFlask className="text-amber-700" /> DEMO PAYMENT MODE
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Razorpay keys are not configured in <code className="bg-amber-100 px-1 rounded">.env</code>. Platform simulation is active with zero real-money charges.
                  </p>
                </div>
              )}

              {/* SIMULATION SCENARIO SELECTOR (Active in Demo Mode) */}
              {activeMode === 'DEMO_MODE' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Test Simulation Scenario
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setDemoScenario('SUCCESS')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        demoScenario === 'SUCCESS'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <FaCheckCircle className="text-emerald-600 text-xs" /> Simulate Success
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        Credits campaign & logs confirmed receipt
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDemoScenario('FAILURE')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        demoScenario === 'FAILURE'
                          ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <FaTimesCircle className="text-rose-600 text-xs" /> Simulate Failure
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        Declined payment, does not alter funds
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Amount Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Select Donation Amount (₹ INR)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {presetAmounts.map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setAmount(p)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        amount === p
                          ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      ₹{p}
                    </button>
                  ))}
                </div>
                <div className="relative mt-2">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Enter custom amount"
                    required
                  />
                </div>
              </div>

              {/* Donor Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    disabled={isAnonymous}
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Encouragement Message */}
              <div className="text-xs">
                <label className="block font-semibold text-slate-700 mb-1">Encouragement Message (Optional)</label>
                <textarea
                  rows="2"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share a message of support..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Anonymous Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span>Donate anonymously (hide my name on public donor list)</span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                  activeMode === 'DEMO_MODE' && demoScenario === 'FAILURE'
                    ? 'bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400'
                    : 'bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400'
                }`}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin text-sm" /> Processing Payment...
                  </>
                ) : activeMode === 'DEMO_MODE' ? (
                  demoScenario === 'SUCCESS' ? (
                    <>
                      <FaFlask className="text-sm" /> Simulate Successful Payment ₹{Number(amount || 0).toLocaleString('en-IN')}
                    </>
                  ) : (
                    <>
                      <FaTimesCircle className="text-sm" /> Simulate Failed Payment ₹{Number(amount || 0).toLocaleString('en-IN')}
                    </>
                  )
                ) : (
                  <>
                    <FaCreditCard className="text-sm" /> Proceed with Razorpay Test Mode ₹{Number(amount || 0).toLocaleString('en-IN')}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonationModal;
