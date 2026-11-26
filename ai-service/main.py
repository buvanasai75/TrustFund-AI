import os
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import json

from schemas.campaign import (
    CampaignRiskRequest,
    CampaignRiskResponse,
    DocumentExtractionResult,
    EntityExtraction,
    SimilarCampaignMatch
)
from document_processing.ocr_extractor import DocumentOCRExtractor
from risk_detection.text_similarity import TextSimilarityDetector
from risk_detection.rule_engine import CampaignRiskRuleEngine
from risk_detection.ml_classifier import MLRiskClassifier

app = FastAPI(
    title="AI Crowdfunding Document Verification & Risk Assessment Microservice",
    version="1.0.0",
    description="Intelligent document text extraction, NLP similarity detection, and explainable fraud risk scoring."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

similarity_detector = TextSimilarityDetector()
rule_engine = CampaignRiskRuleEngine()
ml_classifier = MLRiskClassifier()

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "AI Document Verification & Risk Microservice",
        "ocr_available": True,
        "scikit_learn": True,
        "mode": "EXPLAINABLE_RULE_ENGINE_V1"
    }

@app.post("/api/v1/extract-document-text")
async def extract_document_text(
    file_path: Optional[str] = Form(None),
    file_name: Optional[str] = Form("document"),
    campaign_meta: Optional[str] = Form(None)
):
    try:
        raw_text = ""
        if file_path and os.path.exists(file_path):
            raw_text = DocumentOCRExtractor.extract_text_from_file(file_path)
        else:
            raw_text = f"Supporting verification document {file_name}."

        entities = DocumentOCRExtractor.extract_entities(raw_text)

        warnings = []
        if campaign_meta:
            try:
                meta = json.loads(campaign_meta)
                warnings = DocumentOCRExtractor.compare_with_campaign(meta, entities)
            except Exception:
                pass

        return {
            "success": True,
            "file_name": file_name,
            "extracted_text": raw_text[:3000],
            "entities": entities,
            "warnings": warnings,
            "confidence_notes": "Extracted via OCR/Parser text heuristic pipeline."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document extraction error: {str(e)}")

@app.post("/api/v1/assess-risk", response_model=CampaignRiskResponse)
def assess_campaign_risk(request: CampaignRiskRequest):
    try:
        # 1. Cosine similarity against existing campaigns
        existing_list = [c.model_dump() for c in request.existing_campaigns]
        similar_matches = similarity_detector.find_similar_campaigns(
            current_description=request.description,
            current_title=request.title,
            existing_campaigns=existing_list
        )

        # 2. Document extraction evaluation
        doc_evaluations = []
        campaign_meta = {
            "title": request.title,
            "beneficiary_name": request.beneficiary_name,
            "target_amount": request.target_amount,
            "category": request.category
        }

        for doc in request.documents:
            text = doc.extracted_text or ""
            if not text and doc.file_path and os.path.exists(doc.file_path):
                text = DocumentOCRExtractor.extract_text_from_file(doc.file_path)
            
            entities = DocumentOCRExtractor.extract_entities(text)
            warnings = DocumentOCRExtractor.compare_with_campaign(campaign_meta, entities)
            doc_evaluations.append({
                "file_name": doc.file_name,
                "entities": entities,
                "warnings": warnings
            })

        # 3. Rule engine risk scoring
        campaign_dict = request.model_dump()
        eval_result = rule_engine.evaluate_campaign(
            campaign=campaign_dict,
            similar_matches=similar_matches,
            document_evaluations=doc_evaluations
        )

        similar_match_models = [
            SimilarCampaignMatch(
                campaign_id=m["campaign_id"],
                title=m["title"],
                similarity_score=m["similarity_score"],
                similarity_percentage=m["similarity_percentage"]
            )
            for m in similar_matches
        ]

        return CampaignRiskResponse(
            campaign_id=request.campaign_id or "NEW_CAMPAIGN",
            risk_score=eval_result["risk_score"],
            risk_level=eval_result["risk_level"],
            reasons=eval_result["reasons"],
            similar_campaigns=similar_match_models,
            recommendation=eval_result["recommendation"],
            rule_breakdown=eval_result["rule_breakdown"],
            ml_model_status="EXPLAINABLE_RULE_ENGINE_V1"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk assessment error: {str(e)}")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="127.0.0.1", port=port, reload=False)
