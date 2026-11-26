from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class DocumentInput(BaseModel):
    document_id: Optional[str] = None
    file_name: str
    file_path: Optional[str] = None
    file_type: Optional[str] = None
    extracted_text: Optional[str] = ""

class ExistingCampaignInput(BaseModel):
    id: str
    title: str
    description: str
    category: Optional[str] = "Other"
    beneficiary_name: Optional[str] = ""
    target_amount: Optional[float] = 0

class CampaignRiskRequest(BaseModel):
    campaign_id: Optional[str] = "NEW_CAMPAIGN"
    title: str
    description: str
    category: str
    target_amount: float
    deadline: Optional[str] = None
    beneficiary_name: str
    beneficiary_relationship: Optional[str] = "Self"
    contact_details: Optional[str] = ""
    documents: List[DocumentInput] = []
    existing_campaigns: List[ExistingCampaignInput] = []

class SimilarCampaignMatch(BaseModel):
    campaign_id: str
    title: str
    similarity_score: float = Field(..., description="Cosine similarity score from 0.0 to 1.0")
    similarity_percentage: str

class EntityExtraction(BaseModel):
    beneficiary_name: Optional[str] = None
    institution_name: Optional[str] = None
    bill_amount: Optional[float] = None
    document_date: Optional[str] = None
    key_terms: List[str] = []

class DocumentExtractionResult(BaseModel):
    file_name: str
    extracted_text: str
    entities: EntityExtraction
    confidence_notes: str
    warnings: List[str] = []

class CampaignRiskResponse(BaseModel):
    campaign_id: str
    risk_score: int = Field(..., ge=0, le=100, description="Risk score from 0 to 100")
    risk_level: str = Field(..., description="LOW, MEDIUM, or HIGH")
    reasons: List[str] = []
    similar_campaigns: List[SimilarCampaignMatch] = []
    recommendation: str
    rule_breakdown: Dict[str, Any] = {}
    ml_model_status: str = "EXPLAINABLE_RULE_ENGINE_V1"
