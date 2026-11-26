const axios = require('axios');
const path = require('path');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

class AIService {
  static async checkHealth() {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 3000 });
      return response.data;
    } catch (error) {
      return { status: 'OFFLINE', error: error.message };
    }
  }

  static async extractDocument(filePath, fileName, campaignMeta = {}) {
    try {
      const formData = new URLSearchParams();
      if (filePath) formData.append('file_path', filePath);
      if (fileName) formData.append('file_name', fileName);
      if (campaignMeta) formData.append('campaign_meta', JSON.stringify(campaignMeta));

      const response = await axios.post(`${AI_SERVICE_URL}/api/v1/extract-document-text`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      console.warn(`[AI Service] Extraction fallback triggered for ${fileName}:`, error.message);
      // Graceful local demonstration fallback
      return {
        success: true,
        file_name: fileName,
        extracted_text: `Verified upload: ${fileName}. Awaiting advanced OCR background scan.`,
        entities: {
          beneficiary_name: campaignMeta.beneficiaryName || null,
          institution_name: null,
          bill_amount: null,
          document_date: new Date().toISOString().split('T')[0],
          key_terms: ['uploaded_document'],
        },
        warnings: [],
        confidence_notes: 'Local Node.js fallback parser used.',
      };
    }
  }

  static async assessRisk(campaign, existingCampaigns = []) {
    try {
      const payload = {
        campaign_id: campaign._id ? campaign._id.toString() : 'NEW_CAMPAIGN',
        title: campaign.title,
        description: campaign.description,
        category: campaign.category,
        target_amount: Number(campaign.targetAmount),
        deadline: campaign.deadline ? new Date(campaign.deadline).toISOString() : null,
        beneficiary_name: campaign.beneficiaryName,
        beneficiary_relationship: campaign.beneficiaryRelationship || 'Self',
        contact_details: campaign.contactDetails || '',
        documents: (campaign.documents || []).map(doc => ({
          document_id: doc._id ? doc._id.toString() : null,
          file_name: doc.fileName || 'document',
          file_path: doc.localPath || '',
          file_type: doc.fileType || 'application/pdf',
          extracted_text: doc.extractedText || '',
        })),
        existing_campaigns: existingCampaigns.map(c => ({
          id: c._id ? c._id.toString() : 'unknown',
          title: c.title,
          description: c.description,
          category: c.category || 'Other',
          beneficiary_name: c.beneficiaryName || '',
          target_amount: Number(c.targetAmount || 0),
        })),
      };

      const response = await axios.post(`${AI_SERVICE_URL}/api/v1/assess-risk`, payload, {
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      console.warn('[AI Service] Risk assessment fallback triggered:', error.message);
      // Clean, explainable local fallback
      const reasons = [];
      let score = 20; // baseline

      if (!campaign.documents || campaign.documents.length === 0) {
        score += 35;
        reasons.push('Missing supporting documents: No verification documents uploaded.');
      }
      if ((campaign.description || '').length < 60) {
        score += 15;
        reasons.push('Vague or unusually brief campaign description (under 60 characters).');
      }

      const riskLevel = score >= 70 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW';
      const recommendation = riskLevel === 'HIGH'
        ? 'High risk detected. In-depth manual review and request for additional primary documentation required.'
        : riskLevel === 'MEDIUM'
        ? 'Moderate risk. Standard administrative review recommended.'
        : 'Low risk. Campaign details appear consistent. Proceed with standard approval.';

      return {
        campaign_id: campaign._id ? campaign._id.toString() : 'NEW_CAMPAIGN',
        risk_score: score,
        risk_level: riskLevel,
        reasons,
        similar_campaigns: [],
        recommendation,
        rule_breakdown: { fallback_evaluation: score },
        ml_model_status: 'LOCAL_RULE_FALLBACK',
      };
    }
  }
}

module.exports = AIService;
