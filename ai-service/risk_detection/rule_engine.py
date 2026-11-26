from typing import Dict, Any, List

class CampaignRiskRuleEngine:
    """
    Transparent, explainable rule-based risk evaluation engine.
    Calculates a risk score from 0 to 100 and assigns LOW, MEDIUM, or HIGH risk level.
    Provides detected warning reasons and clear recommendations for administrators.
    Never declares a person fraudulent; provides structured risk assessment.
    """

    def evaluate_campaign(
        self,
        campaign: Dict[str, Any],
        similar_matches: List[Dict[str, Any]],
        document_evaluations: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        score = 0
        reasons = []
        rule_breakdown = {}

        # 1. Document presence & validity check
        documents = campaign.get("documents", [])
        if not documents:
            penalty = 35
            score += penalty
            reasons.append("Missing supporting documents: No verification documents uploaded.")
            rule_breakdown["missing_documents"] = penalty
        else:
            rule_breakdown["missing_documents"] = 0

        # Check document-level warnings (from OCR / entity verification)
        doc_inconsistencies = 0
        for doc_eval in document_evaluations:
            warnings = doc_eval.get("warnings", [])
            for w in warnings:
                reasons.append(f"Document Verification Warning: {w}")
                doc_inconsistencies += 1

        if doc_inconsistencies > 0:
            penalty = min(doc_inconsistencies * 15, 30)
            score += penalty
            rule_breakdown["document_inconsistencies"] = penalty
        else:
            rule_breakdown["document_inconsistencies"] = 0

        # 2. Text similarity / plagiarism check
        if similar_matches:
            top_match = similar_matches[0]
            top_score = top_match.get("similarity_score", 0)
            if top_score >= 0.80:
                penalty = 40
                score += penalty
                reasons.append(
                    f"High text similarity ({top_match.get('similarity_percentage')}) detected with existing campaign: '{top_match.get('title')}'."
                )
                rule_breakdown["text_plagiarism"] = penalty
            elif top_score >= 0.55:
                penalty = 25
                score += penalty
                reasons.append(
                    f"Moderate text overlap ({top_match.get('similarity_percentage')}) with campaign: '{top_match.get('title')}'."
                )
                rule_breakdown["text_plagiarism"] = penalty
            else:
                rule_breakdown["text_plagiarism"] = 0
        else:
            rule_breakdown["text_plagiarism"] = 0

        # 3. Campaign Description Length & Quality
        desc = (campaign.get("description") or "").strip()
        if len(desc) < 60:
            penalty = 15
            score += penalty
            reasons.append("Vague or unusually brief campaign description (under 60 characters).")
            rule_breakdown["short_description"] = penalty
        elif len(desc.split()) < 20:
            penalty = 10
            score += penalty
            reasons.append("Campaign story lacks sufficient detail regarding fund utilization.")
            rule_breakdown["short_description"] = penalty
        else:
            rule_breakdown["short_description"] = 0

        # 4. Target Amount Risk Factors
        target_amount = float(campaign.get("target_amount") or 0)
        category = (campaign.get("category") or "Other").lower()

        if target_amount <= 0:
            score += 25
            reasons.append("Invalid fundraising target amount.")
            rule_breakdown["invalid_amount"] = 25
        elif target_amount > 2000000 and len(documents) < 2:
            # Large fundraiser > 20 Lakhs with fewer than 2 documents
            penalty = 20
            score += penalty
            reasons.append(f"High funding target (₹{target_amount:,.2f}) with insufficient supporting documentation.")
            rule_breakdown["large_amount_unsupported"] = penalty
        elif target_amount % 50000 == 0 and target_amount >= 500000 and not documents:
            penalty = 15
            score += penalty
            reasons.append("Unusual round target amount without an itemized estimate or hospital breakdown.")
            rule_breakdown["unitemized_large_target"] = penalty

        # 5. Category-Specific Validation
        if category == "medical":
            has_medical_doc = False
            for d in documents:
                fn = (d.get("file_name") or "").lower()
                txt = (d.get("extracted_text") or "").lower()
                if any(m in fn or m in txt for m in ["medical", "hospital", "prescription", "doctor", "report", "estimate", "bill"]):
                    has_medical_doc = True
                    break
            if not has_medical_doc:
                penalty = 20
                score += penalty
                reasons.append("Medical campaign without identifiable medical report, hospital estimate, or doctor prescription.")
                rule_breakdown["missing_category_evidence"] = penalty

        # 6. Beneficiary & Contact Checks
        beneficiary = (campaign.get("beneficiary_name") or "").strip()
        if not beneficiary or len(beneficiary) < 3:
            penalty = 15
            score += penalty
            reasons.append("Missing or incomplete beneficiary name.")
            rule_breakdown["missing_beneficiary"] = penalty

        # Normalize total score between 0 and 100
        total_risk_score = min(max(int(score), 0), 100)

        # Classify risk level
        if total_risk_score >= 70:
            risk_level = "HIGH"
            recommendation = "High risk detected. In-depth manual review and request for additional primary documentation required before approval."
        elif total_risk_score >= 35:
            risk_level = "MEDIUM"
            recommendation = "Moderate risk. Standard administrative review recommended; verify documents and beneficiary details."
        else:
            risk_level = "LOW"
            recommendation = "Low risk. Campaign details and documentation appear consistent. Proceed with standard approval."

        if not reasons:
            reasons.append("No immediate risk flags detected. Campaign meets standard integrity heuristics.")

        return {
            "risk_score": total_risk_score,
            "risk_level": risk_level,
            "reasons": reasons,
            "recommendation": recommendation,
            "rule_breakdown": rule_breakdown
        }
