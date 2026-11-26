import React from 'react';
import { FaTimes, FaFileAlt, FaCheckCircle, FaExclamationTriangle, FaHospital, FaUser, FaMoneyBillWave, FaCalendarAlt } from 'react-icons/fa';

export const DocumentViewerModal = ({ document, isOpen, onClose }) => {
  if (!isOpen || !document) return null;

  const ocr = document.ocrData || {};
  const warnings = document.aiWarnings || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center text-lg">
              <FaFileAlt />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{document.fileName}</h3>
              <p className="text-xs text-slate-500">
                Uploaded: {new Date(document.createdAt).toLocaleDateString()} • {Math.round(document.fileSize / 1024)} KB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-xs">
          {/* AI Warnings if any */}
          {warnings.length > 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800">
              <h4 className="font-bold flex items-center gap-2 text-sm text-amber-900 mb-2">
                <FaExclamationTriangle className="text-amber-600" />
                AI Inconsistency Warnings Detected
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 flex items-center gap-2">
              <FaCheckCircle className="text-emerald-600" />
              <span>Document passes automated OCR consistency validation with campaign metadata.</span>
            </div>
          )}

          {/* Extracted Entities Grid */}
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-3">Extracted OCR Entities</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                <FaUser className="text-brand-600 mt-1" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Beneficiary Name</span>
                  <p className="font-semibold text-slate-800">{ocr.beneficiaryName || 'Not detected'}</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                <FaHospital className="text-brand-600 mt-1" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Institution / Hospital</span>
                  <p className="font-semibold text-slate-800">{ocr.institutionName || 'Not detected'}</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                <FaMoneyBillWave className="text-emerald-600 mt-1" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Extracted Bill Amount</span>
                  <p className="font-semibold text-slate-800">
                    {ocr.billAmount ? `₹${Number(ocr.billAmount).toLocaleString('en-IN')}` : 'Not detected'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                <FaCalendarAlt className="text-brand-600 mt-1" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Document Date</span>
                  <p className="font-semibold text-slate-800">{ocr.documentDate || 'Not detected'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Raw Extracted Text */}
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-2">Raw OCR Text Stream</h4>
            <div className="p-3.5 bg-slate-900 text-slate-200 rounded-2xl font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
              {document.extractedText || 'No text extracted.'}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-[11px] text-slate-400 italic">
            Note: OCR text extraction and heuristic parsing assist administrators in fraud screening. Final legal document verification is a human administrator responsibility.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;
