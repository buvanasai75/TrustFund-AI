# Academic Engineering Report

## AI-Enhanced Crowdfunding Platform with Intelligent Document Verification and Fraud Risk Assessment

---

### Abstract

Online crowdfunding has emerged as a transformative financial mechanism for funding medical treatments, educational expenses, and humanitarian emergencies. However, the open nature of digital fundraising exposes platforms to fraudulent appeals, forged medical estimates, plagiarized campaign narratives, and duplicate claims. This project designs, implements, and evaluates a multi-tier, full-stack crowdfunding system that integrates the MERN stack with a Python FastAPI AI/ML microservice. The system combines Optical Character Recognition (OCR) heuristics, Natural Language Processing (TF-IDF vectorization and Cosine Similarity), explainable multi-factor risk assessment, cryptographic payment verification via Razorpay Test Mode, and an academic Simulated Settlement ledger. Experimental verification across a 10-point automated integration test suite confirms that the platform reliably detects textual duplicates, identifies document anomalies, prevents unauthorized state transitions, and enforces human-in-the-loop administrative oversight.

---

### 1. Introduction & Problem Statement

#### 1.1 Context
Digital crowdfunding platforms collect billions of rupees annually from generous donors worldwide. However, unlike traditional non-profit organizations subject to institutional auditing, individual fundraisers often present unverified claims.

#### 1.2 Core Challenges
1. **Document Falsification:** Malicious actors upload doctored hospital estimates, altered laboratory reports, or fabricated tuition fee schedules.
2. **Text Plagiarism & Sybil Attacks:** Attackers scrape poignant stories from legitimate campaigns on existing platforms, submit identical or slightly modified descriptions under new beneficiary accounts, and solicit unmonitored donations.
3. **Information Asymmetry:** Donors lack verification transparency, reducing trust and hurting legitimate beneficiaries who urgently need support.
4. **Disbursement Oversight:** Collecting funds without tracking beneficiary disbursement separately creates accountability risks.

#### 1.3 Project Objectives
- Develop an end-to-end multi-tier web application using modern software engineering patterns.
- Implement an automated document intake pipeline extracting structured entities (beneficiary, hospital, bill amounts, dates) from uploaded PDFs and images.
- Construct a dedicated Python AI microservice that executes TF-IDF cosine similarity checks against existing campaigns and scores fraud risk from 0 to 100.
- Establish role-based access control (Admin, Campaign Creator, Donor) ensuring only verified and approved campaigns are publicly discoverable.
- Integrate Razorpay Checkout in Test Mode with fallback Demo Payment Mode and cryptographic signature verification.
- Implement atomic fundraising calculations, automatic goal-reached transitions, and a Simulated Settlement module.

---

### 2. Software Architecture & Design

The application follows a Service-Oriented Architecture (SOA) with a clean separation of concerns:

1. **Client Tier (Presentation Layer):**
   - React.js 18 with Vite for high-performance single-page rendering.
   - Tailwind CSS design system providing a professional financial-technology visual hierarchy.
   - Recharts for data-driven administrative analytics.
   - Axios HTTP client configured with request interceptors for automatic JWT transmission.

2. **Application Server Tier (Business Logic Layer):**
   - Node.js and Express.js REST API server handling request validation, routing, file ingestion, business logic, and payment order creation.
   - Multer middleware for file storage, size verification, and MIME-type validation.
   - JSON Web Token (JWT) stateless authentication paired with bcryptjs password hashing.
   - Inter-service REST client communicating asynchronously with the AI microservice.

3. **AI / Machine Learning Tier (Inference Layer):**
   - Python 3.13 and FastAPI providing high-throughput asynchronous endpoints.
   - Scikit-Learn TF-IDF Vectorizer and Cosine Similarity matrix calculations.
   - PDFMiner and Pillow text-extraction pipelines for document parsing.
   - Multi-factor deterministic rule engine delivering an explainable 0–100 risk score.

4. **Data Tier (Persistence Layer):**
   - MongoDB NoSQL database with Mongoose ODM schemas, compound indexes, and atomic updates.

---

### 3. Database Schema Design

Nine distinct Mongoose schemas were implemented to support platform operations:

1. **User Schema:** Stores personal identities, email addresses (unique lowercase index), hashed passwords (`select: false`), roles (`admin`, `creator`, `donor`), and verification flags.
2. **Campaign Schema:** Contains campaign metadata (title, category, target amount, deadline, beneficiary details), verification statuses (`PENDING_VERIFICATION`, `UNDER_REVIEW`, `ACTIVE`, `GOAL_REACHED`, `REJECTED`, `COMPLETED`), collected funds, donation count, AI risk score (0–100), risk level (`LOW`, `MEDIUM`, `HIGH`), and similarity match references.
3. **Document Schema:** Holds file paths, MIME types, file sizes, OCR raw text, extracted entity dictionary (`beneficiaryName`, `institutionName`, `billAmount`, `documentDate`), and verification warnings.
4. **Donation Schema:** Records contributions, donor references, amounts, payment modes (`RAZORPAY_TEST`, `DEMO_MODE`), transaction references, anonymous flags, and donor encouragement messages.
5. **Payment Schema:** Comprehensive audit log storing raw gateway responses, transaction IDs, cryptographic signatures, and idempotency keys to prevent duplicate transaction crediting.
6. **Settlement Schema:** Tracks amount raised vs amount approved, beneficiary bank details, settlement reference (`SIM_STL_...`), and status (`SIMULATED_SUCCESS`).
7. **Notification Schema:** Facilitates in-app user notifications for campaign submissions, approvals, rejections, donations, and settlements.
8. **Report Schema:** Enables donors to flag suspicious campaigns with categorization and narrative details.
9. **AuditLog Schema:** Immutable log of administrative decisions, risk reassessments, and settlement executions.

---

### 4. AI & Fraud Detection Methodology

#### 4.1 Document Information Extraction (OCR Heuristics)
Supporting documents (medical estimates, hospital bills, university fee structures) are uploaded in PDF or image format:
- For PDF files, `pdfminer.six` extracts layout-aware text streams.
- Regex heuristics identify financial totals (`Total: ₹...`, `INR ...`, `Grand Total`), beneficiary names, medical institutions, and issuance dates.
- Extracted entities are cross-referenced with campaign form fields:
  - **Name Mismatch:** If the beneficiary name differs from the document name, an inconsistency warning is registered.
  - **Amount Discrepancy:** If the extracted bill amount is significantly less than the requested target ({'<'} 25%), a warning is triggered.

#### 4.2 NLP Plagiarism & Similarity Detection
To prevent bad actors from copy-pasting existing fundraising appeals:
- Text from the submitted campaign title and description is combined.
- Scikit-Learn's `TfidfVectorizer` (with English stop-word removal and 1–2 n-grams) computes feature vectors against all stored campaigns.
- `cosine_similarity` evaluates semantic similarity:
  $$\text{Cosine Similarity}(A, B) = \frac{A \cdot B}{\|A\| \|B\|}$$
- Scores exceeding 0.70 trigger a high-risk plagiarism penalty (+40 points).

#### 4.3 Explainable Multi-Factor Risk Engine
The risk engine synthesizes multiple signals into a transparent 0–100 score:
- Missing supporting documents: **+35 points**
- High textual similarity with existing campaign: **+25 to +40 points**
- Vague or brief description ({'<'} 60 characters): **+10 to +15 points**
- Medical category lacking clinical keywords: **+20 points**
- Document entity discrepancies: **+15 to +30 points**

Risk Classification:
- **LOW RISK (0–34):** Standard criteria satisfied. Fast-tracked for approval.
- **MEDIUM RISK (35–69):** Moderate risk. Manual document inspection recommended.
- **HIGH RISK (70–100):** Substantial irregularities. Requires primary document re-submission.

*Ethical Safeguard:* The system operates as a decision-support tool. It never declares a person fraudulent; final verification remains a human administrator responsibility.

---

### 5. Payment & Settlement Integrity

#### 5.1 Razorpay Test Mode & HMAC Signature Verification
- Backend creates orders through Razorpay SDK or initiates Simulated Demo Payment Mode.
- Upon payment completion, the backend verifies cryptographic integrity using HMAC SHA-256:
  $$\text{HMAC}(\text{order\_id} + "|" + \text{payment\_id}, \text{secret})$$
- Only verified signatures transition donation records to `SUCCESS`.

#### 5.2 Atomic Fundraising Calculations & Goal Reached Handling
- Total collected amounts and donor counts update atomically upon verified payment.
- When collected amount $\ge$ target amount, status automatically transitions to `GOAL_REACHED`, disabling subsequent public donations.

#### 5.3 Simulated Beneficiary Settlement
- Tracks amount collected and amount actually transferred separately.
- Admin triggers Simulated Settlement: creates MongoDB disbursement record, generates reference (`SIM_STL_...`), updates campaign to `COMPLETED`, and alerts the creator.

---

### 6. Verification & Automated Test Results

An automated integration test suite (`backend/test/api.test.js`) executed across the integrated system:

| Test Case | Functional Scope | Result | Execution Time |
|---|---|---|---|
| **Test 1** | API Health & Readiness Endpoint | **PASSED** | 32.2 ms |
| **Test 2** | JWT Auth (Admin, Creator, Donor) | **PASSED** | 245.8 ms |
| **Test 3** | Role-Based Access Control Restrictions | **PASSED** | 5.9 ms |
| **Test 4** | Public Visibility Filters (Unapproved Hidden) | **PASSED** | 15.1 ms |
| **Test 5** | Campaign Intake & Python AI Risk Screening | **PASSED** | 81.2 ms |
| **Test 6** | Administrative Approval Workflow & Audit Log | **PASSED** | 12.5 ms |
| **Test 7** | Donation Order & Signature Verification | **PASSED** | 39.7 ms |
| **Test 8** | Atomic Fundraising & Goal Reached Transition | **PASSED** | 33.9 ms |
| **Test 9** | Simulated Beneficiary Settlement Ledger | **PASSED** | 19.3 ms |
| **Test 10** | Admin Analytics Aggregations (Recharts Data) | **PASSED** | 23.7 ms |

---

### 7. Conclusion

TrustFund AI successfully demonstrates a secure, full-stack crowdfunding architecture enhanced by artificial intelligence. By unifying OCR document parsing, NLP similarity detection, explainable risk scoring, and cryptographic payment verification, the platform establishes a credible model for combating fraud in digital philanthropy.
