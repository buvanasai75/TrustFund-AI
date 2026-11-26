import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignAPI } from '../services/api';
import {
  FaPlusCircle,
  FaFileAlt,
  FaImage,
  FaShieldAlt,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
} from 'react-icons/fa';

export const CreateCampaign = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Medical');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryRelationship, setBeneficiaryRelationship] = useState('Self');
  const [contactDetails, setContactDetails] = useState('');
  const [images, setImages] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [aiResult, setAiResult] = useState(null);

  const categories = ['Medical', 'Education', 'Emergency', 'Startup', 'Social Causes', 'Other'];
  const relationships = ['Self', 'Father', 'Mother', 'Son', 'Daughter', 'Spouse', 'Sibling', 'Friend', 'Student Mentee', 'Community Member'];

  const handleImageChange = (e) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleDocumentChange = (e) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !description || !targetAmount || !deadline || !beneficiaryName) {
      setError('Please fill out all mandatory fields.');
      return;
    }

    if (Number(targetAmount) < 100) {
      setError('Target amount must be at least ₹100.');
      return;
    }

    setLoading(true);
    setLoadingStep('Uploading campaign images and supporting verification documents...');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('targetAmount', targetAmount);
    formData.append('deadline', deadline);
    formData.append('beneficiaryName', beneficiaryName);
    formData.append('beneficiaryRelationship', beneficiaryRelationship);
    formData.append('contactDetails', contactDetails);

    images.forEach((img) => formData.append('images', img));
    documents.forEach((doc) => formData.append('documents', doc));

    try {
      setLoadingStep('Verifying documentation and performing authenticity screening...');
      const res = await campaignAPI.create(formData);
      const campaign = res.data.campaign;

      setAiResult({
        riskScore: campaign.riskScore,
        riskLevel: campaign.riskLevel,
        recommendation: campaign.aiRecommendation,
        reasons: campaign.fraudReasons || [],
        campaignId: campaign._id,
      });

      setTimeout(() => {
        navigate(`/campaigns/${campaign._id}`);
      }, 3500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit campaign. Please check inputs.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-brand-900 to-slate-900 text-white p-6 sm:p-8">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
            <FaShieldAlt /> Campaign Verification Intake
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">Create a Fundraising Campaign</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            All submitted campaigns undergo document verification and compliance screening to protect supporters and maintain platform trust.
          </p>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8">
          {aiResult ? (
            <div className="text-center py-8 space-y-4 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                <FaCheckCircle />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Campaign Submitted Successfully!</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Your campaign and documentation have been received and analyzed by our AI verification pipeline.
              </p>

              {/* AI Screening Summary Card */}
              <div className="max-w-md mx-auto p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-800">Initial AI Risk Score:</span>
                  <span className={`font-black px-2 py-0.5 rounded-full ${
                    aiResult.riskLevel === 'HIGH' ? 'bg-rose-100 text-rose-800' :
                    aiResult.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {aiResult.riskScore}/100 ({aiResult.riskLevel} RISK)
                  </span>
                </div>
                <p className="text-slate-600"><strong>Recommendation:</strong> {aiResult.recommendation}</p>
                {aiResult.reasons.length > 0 && (
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Evaluation Findings:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-500 text-[11px]">
                      {aiResult.reasons.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400">
                Redirecting to campaign view in a few seconds...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                  {error}
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  1. Campaign Details
                </h3>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Campaign Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Medical Treatment Support for Father's Heart Surgery"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Target Amount (₹ INR) *</label>
                    <input
                      type="number"
                      min="100"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="e.g., 60000"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Campaign Deadline *</label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Contact Email / Phone</label>
                    <input
                      type="text"
                      value={contactDetails}
                      onChange={(e) => setContactDetails(e.target.value)}
                      placeholder="e.g., contact@example.com / +91 9876543210"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Campaign Story & Details *</label>
                  <textarea
                    rows="4"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the medical situation, educational need, or emergency in detail. Explain how the funds will be utilized..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none leading-relaxed"
                    required
                  />
                  <span className="text-[10px] text-slate-400">
                    Pro tip: Clear, detailed descriptions receive lower AI risk scores and quicker admin verification.
                  </span>
                </div>
              </div>

              {/* Beneficiary Information */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  2. Beneficiary Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Beneficiary Full Name *</label>
                    <input
                      type="text"
                      value={beneficiaryName}
                      onChange={(e) => setBeneficiaryName(e.target.value)}
                      placeholder="e.g., Ramesh Kumar"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Relationship to Beneficiary</label>
                    <select
                      value={beneficiaryRelationship}
                      onChange={(e) => setBeneficiaryRelationship(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    >
                      {relationships.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Document and Image Uploads */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  3. Images & Supporting Verification Documents
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Campaign Images */}
                  <div className="p-4 border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-2xl bg-slate-50/50 text-center space-y-2">
                    <FaImage className="text-2xl text-slate-400 mx-auto" />
                    <div>
                      <span className="font-bold text-slate-800 block">Campaign Images</span>
                      <span className="text-[10px] text-slate-400">JPG, PNG (up to 5 images)</span>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleImageChange}
                      className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
                    />
                    {images.length > 0 && (
                      <p className="text-[10px] text-brand-600 font-semibold">{images.length} image(s) selected</p>
                    )}
                  </div>

                  {/* Supporting Documents (OCR Processed) */}
                  <div className="p-4 border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-2xl bg-slate-50/50 text-center space-y-2">
                    <FaFileAlt className="text-2xl text-teal-600 mx-auto" />
                    <div>
                      <span className="font-bold text-slate-800 block">Supporting Documents (OCR)</span>
                      <span className="text-[10px] text-slate-400">PDF, JPG, PNG (Hospital bills, estimates)</span>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="application/pdf, image/png, image/jpeg, image/jpg"
                      onChange={handleDocumentChange}
                      className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
                    />
                    {documents.length > 0 && (
                      <p className="text-[10px] text-teal-600 font-semibold">{documents.length} document(s) selected for OCR extraction</p>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                  <FaInfoCircle className="text-blue-600 mt-0.5 text-xs flex-shrink-0" />
                  <span>
                    <strong>OCR Document Requirement:</strong> Uploading hospital estimates, admission records, or university fee bills allows the automated Python OCR pipeline to cross-reference beneficiary names and requested sums, leading to faster admin approval.
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin text-sm" />
                      <span>{loadingStep || 'Processing campaign & running AI verification...'}</span>
                    </>
                  ) : (
                    <>
                      <FaPlusCircle /> Submit Campaign For Verification
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateCampaign;
