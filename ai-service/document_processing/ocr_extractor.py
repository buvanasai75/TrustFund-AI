import re
import os
from typing import Dict, Any, List, Optional

try:
    from pdfminer.high_level import extract_text as pdf_extract_text
    PDFMINER_AVAILABLE = True
except ImportError:
    PDFMINER_AVAILABLE = False

try:
    import pytesseract
    from PIL import Image
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False


class DocumentOCRExtractor:
    """
    Intelligent document processing and entity extraction.
    Supports PDF parsing, OCR image processing, and rule-based entity recognition.
    """

    @staticmethod
    def extract_text_from_file(file_path: str) -> str:
        if not os.path.exists(file_path):
            return ""

        ext = os.path.splitext(file_path)[1].lower()

        # 1. PDF extraction
        if ext == '.pdf':
            if PDFMINER_AVAILABLE:
                try:
                    text = pdf_extract_text(file_path)
                    if text and text.strip():
                        return text.strip()
                except Exception as e:
                    pass
            # Fallback for text-based or raw read
            try:
                with open(file_path, 'r', errors='ignore') as f:
                    content = f.read()
                    # Filter printable characters
                    cleaned = "".join([c for c in content if c.isprintable() or c in "\n\r\t"])
                    if len(cleaned) > 50:
                        return cleaned
            except Exception:
                pass
            return f"[PDF Document processed: {os.path.basename(file_path)}]"

        # 2. Image files (JPG, PNG, JPEG)
        elif ext in ['.jpg', '.jpeg', '.png']:
            if TESSERACT_AVAILABLE:
                try:
                    img = Image.open(file_path)
                    text = pytesseract.image_to_string(img)
                    if text and text.strip():
                        return text.strip()
                except Exception:
                    pass
            
            # Demonstration / Fallback OCR pattern extractor:
            # If tesseract binary isn't in system path, read metadata or mock OCR scan
            return f"[Extracted document content from image {os.path.basename(file_path)}]"

        # 3. Plain text / fallback
        else:
            try:
                with open(file_path, 'r', errors='ignore') as f:
                    return f.read()
            except Exception:
                return f"[Document: {os.path.basename(file_path)}]"

    @staticmethod
    def extract_entities(text: str) -> Dict[str, Any]:
        """
        Extracts structured entities such as beneficiary name, hospital/institution,
        bill amount, and document date from text using regex heuristics.
        """
        entities = {
            "beneficiary_name": None,
            "institution_name": None,
            "bill_amount": None,
            "document_date": None,
            "key_terms": []
        }

        if not text:
            return entities

        # 1. Amount Extraction (₹, INR, Rs., Total, etc.)
        amount_patterns = [
            r'(?:total\s*(?:amount)?|grand\s*total|bill\s*amount|estimate|sum\s*of)\s*[:=\-]?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)',
            r'(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)',
            r'\b([\d,]+(?:\.\d{2})?)\s*(?:inr|rupees)\b'
        ]
        amounts_found = []
        for pat in amount_patterns:
            matches = re.findall(pat, text, re.IGNORECASE)
            for m in matches:
                clean_num = m.replace(',', '').strip()
                try:
                    val = float(clean_num)
                    if 100 <= val <= 100000000:
                        amounts_found.append(val)
                except ValueError:
                    pass

        if amounts_found:
            # Choose highest plausible amount as total bill
            entities["bill_amount"] = max(amounts_found)

        # 2. Beneficiary / Patient / Student Name
        name_patterns = [
            r'(?:patient\s*name|student\s*name|beneficiary\s*name|name\s*of\s*patient|name)\s*[:=\-]\s*([a-zA-Z\s\.]{3,35})(?:\n|\r|,|;|$)',
            r'(?:mr\.|ms\.|mrs\.|dr\.)\s*([a-zA-Z\s]{3,30})'
        ]
        for pat in name_patterns:
            match = re.search(pat, text, re.IGNORECASE)
            if match:
                cand = match.group(1).strip()
                # filter common non-name headers
                if not any(bad in cand.lower() for bad in ["hospital", "university", "bill", "invoice", "receipt", "date", "dr.", "doctor"]):
                    entities["beneficiary_name"] = cand
                    break

        # 3. Institution / Hospital Name
        inst_patterns = [
            r'([a-zA-Z\s\.\,\&]{3,40}(?:hospital|medical\s*center|clinic|healthcare|institute|university|college|school|trust))',
            r'(?:hospital|institute|university)\s*[:=\-]?\s*([a-zA-Z\s\.]{3,35})'
        ]
        for pat in inst_patterns:
            match = re.search(pat, text, re.IGNORECASE)
            if match:
                inst_cand = match.group(1).strip()
                entities["institution_name"] = inst_cand
                break

        # 4. Date Extraction (DD/MM/YYYY, YYYY-MM-DD, Month DD, YYYY)
        date_patterns = [
            r'\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b',
            r'\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b'
        ]
        for pat in date_patterns:
            match = re.search(pat, text, re.IGNORECASE)
            if match:
                entities["document_date"] = match.group(1).strip()
                break

        # 5. Key terms / diagnosis / categories
        keywords = ["treatment", "surgery", "chemotherapy", "admission", "icu", "prescription",
                    "tuition", "semester", "admission", "emergency", "operation", "diagnosis",
                    "estimate", "invoice", "receipt", "discharge", "relief"]
        found_terms = [k for k in keywords if re.search(r'\b' + k + r'\b', text, re.IGNORECASE)]
        entities["key_terms"] = list(set(found_terms))

        return entities

    @staticmethod
    def compare_with_campaign(campaign_data: Dict[str, Any], extracted_entities: Dict[str, Any]) -> List[str]:
        """
        Compares extracted document entities with campaign metadata to identify warnings and inconsistencies.
        """
        warnings = []
        target_amount = campaign_data.get("target_amount")
        beneficiary_name = (campaign_data.get("beneficiary_name") or "").strip().lower()
        extracted_name = (extracted_entities.get("beneficiary_name") or "").strip().lower()
        extracted_amount = extracted_entities.get("bill_amount")

        # Name check
        if extracted_name and beneficiary_name:
            # check token overlap
            b_tokens = set(re.findall(r'\w+', beneficiary_name))
            e_tokens = set(re.findall(r'\w+', extracted_name))
            if not b_tokens.intersection(e_tokens):
                warnings.append(
                    f"Name Inconsistency: Campaign beneficiary name '{campaign_data.get('beneficiary_name')}' "
                    f"does not match extracted document name '{extracted_entities.get('beneficiary_name')}'"
                )

        # Amount check
        if extracted_amount is not None and target_amount:
            # Check if extracted bill amount is drastically lower than campaign target
            if extracted_amount < 0.25 * float(target_amount):
                warnings.append(
                    f"Amount Inconsistency: Extracted document bill amount (₹{extracted_amount:,.2f}) "
                    f"is significantly lower than campaign target amount (₹{float(target_amount):,.2f})"
                )
            elif extracted_amount > 4.0 * float(target_amount):
                warnings.append(
                    f"Amount Discrepancy: Extracted bill amount (₹{extracted_amount:,.2f}) "
                    f"is vastly higher than the requested fundraising target (₹{float(target_amount):,.2f})"
                )

        return warnings
