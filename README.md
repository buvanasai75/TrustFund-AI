# TrustFund AI: AI-Enhanced Crowdfunding Platform

[![Node.js](https://img.shields.io/badge/Node.js-v24-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.121-teal.svg)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v8.2-emerald.svg)](https://www.mongodb.com/)
[![Scikit--Learn](https://img.shields.io/badge/Scikit--Learn-1.7-orange.svg)](https://scikit-learn.org/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)]()

> **Academic Capstone Software Engineering Project:** A fully functional, multi-tier web application integrating the MERN stack with a Python AI/ML microservice for intelligent supporting document verification, natural language plagiarism screening, explainable fraud risk scoring, and Razorpay Test Mode / Simulated Payment flows.

---

## 1. Executive Summary & Problem Statement

Crowdfunding platforms have democratized fundraising for medical procedures, education, and disaster relief. However, open crowdfunding platforms suffer from:
1. **Document Manipulation:** Fabricated hospital bills, altered estimate certificates, and forged admission fee structures.
2. **Textual Plagiarism:** Bad actors copying emotional narratives from existing verified campaigns to solicit donations fraudulently.
3. **Information Asymmetry:** Donors lacking reliable signals regarding the authenticity of campaigns.

**TrustFund AI** solves these challenges by combining:
- **Optical Character Recognition (OCR) & PDF Entity Parsing** to extract beneficiary names, institution names, bill amounts, and dates from supporting documentation.
- **Natural Language Processing (TF-IDF & Cosine Similarity)** to cross-reference campaign descriptions against the database for copycat detection.
- **Explainable Rule-Based Risk Scoring (0–100)** to provide human administrators with transparent decision-support indicators.
- **Payment & Settlement Integrity** with Razorpay Test Mode, cryptographic HMAC signature validation, atomic progress calculations, and Simulated Beneficiary Settlement.

---

## 2. System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React 18 + Vite Frontend                        │
│                 (Tailwind CSS, React Router, Recharts)                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST / JWT
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Node.js + Express.js API                        │
│  - JWT & Role-Based Access Control (Admin, Creator, Donor)             │
│  - Campaign & Document Management (Multer uploads)                     │
│  - Razorpay Test Mode & Simulated Payment Ledger                       │
│  - Atomic Fundraising Progress & Settlement Engine                     │
└──────────────┬──────────────────────────────────────────┬──────────────┘
               │ Mongoose                                 │ REST HTTP (JSON)
               ▼                                          ▼
┌───────────────────────────────┐        ┌───────────────────────────────┐
│       MongoDB Database        │        │   Python FastAPI Microservice │
│ - Users & Roles               │        │ - PDFMiner & OCR Heuristics   │
│ - Campaigns & Documents       │        │ - Scikit-Learn TF-IDF Vector  │
│ - Donations & Audit Payments  │        │ - Cosine Similarity Detector  │
│ - Settlements & Audit Logs    │        │ - Explainable Rule Engine     │
└───────────────────────────────┘        └───────────────────────────────┘
```

---

## 3. Technology Stack

### Frontend
- **Framework:** React.js 18 with Vite
- **Styling:** Tailwind CSS, PostCSS, Autoprefixer
- **Navigation:** React Router DOM v6
- **Charts & Data Visualization:** Recharts
- **Icons:** React Icons (`react-icons/fa`)
- **HTTP Client:** Axios with JWT request interceptors

### Backend API
- **Runtime:** Node.js v24
- **Web Framework:** Express.js 4
- **Database:** MongoDB 8.2 with Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs password hashing
- **File Ingestion:** Multer (PDF, JPG, PNG validation)
- **Payment Gateway:** Razorpay SDK (Test Mode) + Cryptographic HMAC verification

### AI / Machine Learning Microservice
- **Framework:** Python 3.13 + FastAPI + Uvicorn
- **NLP & Similarity:** Scikit-Learn (`TfidfVectorizer`, `cosine_similarity`), NumPy, Pandas
- **Document Text Extraction:** PDFMiner (`pdfminer.six`), Pillow (`PIL`), regex heuristics
- **Risk Assessment:** Explainable multi-factor rule engine (0–100 score, LOW/MEDIUM/HIGH risk levels)

---

## 4. Application Roles & Capabilities

### A. Campaign Creator
- Create campaigns with 10 structured fields (Title, Description, Category, Target Amount, Deadline, Beneficiary Name, Relationship, Contact, Images, Supporting Documents).
- Receive instant feedback on automated document OCR extraction and initial AI screening.
- Track donations and funding progress bars in real-time.
- Respond to administrative additional information requests.
- Track simulated beneficiary settlement status when targets are reached.

### B. Donor
- Explore approved, active campaigns with search, category filtering, and sorting.
- View verified supporting documents, extracted OCR entities, and verification badges.
- Donate securely using **Razorpay Test Mode** or **Simulated Demo Payment Mode**.
- Toggle anonymous donation to protect identity.
- View donation history and generate printable contribution receipts.
- Report suspicious campaigns for administrative investigation.

### C. Administrator
- Full oversight dashboard with real-time MongoDB analytics (Recharts).
- **Campaign Verification Queue:** Inspect submitted images, original PDFs, OCR extracted entities, AI risk scores, and warning reasons.
- Action decisions: **Approve**, **Reject**, or **Request Additional Information** (all recorded in `AuditLogs`).
- **AI Risk Monitoring Console:** Filter campaigns by risk tier (Low, Medium, High) and review cosine similarity matches.
- **Settlement Management:** Approve and execute Simulated Beneficiary Disbursements with unique reference identifiers (`SIM_STL_...`).
- User account governance and reported campaign investigations.

---

## 5. Seed Demonstration Accounts

For academic evaluation, the platform comes pre-seeded with verified test accounts:

| Role | Email | Password | Primary Capabilities |
|---|---|---|---|
| **Administrator** | `admin@crowdfund.ai` | `Admin@Secure2026!` | Verification queue, approve/reject, risk audit, settlement execution, analytics |
| **Campaign Creator** | `creator@crowdfund.ai` | `Creator@Pass2026!` | Start fundraiser, upload documents, track funds, view settlement status |
| **Donor** | `donor@crowdfund.ai` | `Donor@Pass2026!` | Browse campaigns, make test donations, download receipts, report causes |

*Note: The login page includes 1-click quick-fill buttons for each demo role.*

---

## 6. Installation & Local Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (Local instance or MongoDB Atlas URI)
- **Python** (v3.10 to v3.13)

### Step 1: Clone or Navigate to Project
```bash
cd crowdfunding-ai
```

### Step 2: Backend Setup
```bash
cd backend
npm install
# Seed the database with demonstration data:
npm run seed
```

### Step 3: Frontend Setup
```bash
cd ../frontend
npm install
npm run build # or npm run dev
```

### Step 4: Python AI Service Setup
```bash
cd ../ai-service
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

---

## 7. Starting the Application

### Option A: One-Click Unified Launcher (Windows)
Run the automated launcher script from the project root:
```powershell
.\start-all.ps1
# Or double-click: start-all.bat
```
This starts MongoDB, Python AI Microservice (port 8000), Express Backend (port 5000), and Vite React Frontend (port 5173).

### Option B: Manual Multi-Terminal Startup

**Terminal 1 (AI Microservice):**
```bash
cd ai-service
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

**Terminal 2 (Express Backend):**
```bash
cd backend
npm start
```

**Terminal 3 (React Frontend):**
```bash
cd frontend
npm run dev
```

Open your browser to: **`http://localhost:5173`**

---

## 8. REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create user account (creator or donor)
- `POST /api/auth/login` - Authenticate and obtain JWT
- `GET /api/auth/me` - Get current authenticated user profile

### Campaigns (`/api/campaigns`)
- `GET /api/campaigns` - Public listing of approved campaigns (filters: category, search, sort, page)
- `GET /api/campaigns/:id` - Campaign details and verified document metadata
- `POST /api/campaigns` - Creator submits campaign with images & supporting documents
- `PUT /api/campaigns/:id` - Update campaign or respond to info request
- `POST /api/campaigns/:id/report` - Report suspicious campaign

### Donations & Payments (`/api/donations`)
- `POST /api/donations/order` - Create Razorpay / Simulated Demo order
- `POST /api/donations/verify` - Verify payment signature and atomically update totals
- `GET /api/donations/my` - Donor contribution history
- `GET /api/donations/campaign/:campaignId` - Public donor list for a campaign

### Administrative Console (`/api/admin`)
- `GET /api/admin/campaigns` - View all campaigns with verification filters
- `PUT /api/admin/campaigns/:id/review` - Approve, Reject, or Request Info
- `POST /api/admin/campaigns/:id/reassess-risk` - Trigger AI risk re-analysis
- `PUT /api/admin/documents/:id/verify` - Verify or reject individual supporting document
- `GET /api/admin/settlements` - View settlement records
- `POST /api/admin/settlements/simulate` - Execute simulated beneficiary settlement
- `GET /api/admin/analytics` - MongoDB aggregations for dashboard charts
- `GET /api/admin/users` - User list and role governance

### AI Microservice (`http://127.0.0.1:8000`)
- `GET /health` - Microservice health check
- `POST /api/v1/extract-document-text` - OCR text extraction and entity parsing
- `POST /api/v1/assess-risk` - NLP similarity check and explainable risk evaluation

---

## 9. Automated Testing

The project includes an automated test suite verifying core functional workflows:
```bash
cd backend
npm test
```

Test coverage includes:
1. System health check
2. JWT authentication & bcrypt hashing
3. Role-Based Access Control
4. Public campaign filtering (unapproved campaigns hidden)
5. Campaign creation & AI risk scoring
6. Admin approval workflow
7. Donation order & cryptographic payment verification
8. Automatic fundraising totals & `GOAL_REACHED` status trigger
9. Simulated beneficiary settlement execution
10. Admin analytics aggregation calculation

---

## 10. Academic Compliance & Ethical AI Disclaimers

1. **Human-in-the-Loop Verification:** The AI risk assessment model and OCR entity extraction operate strictly as decision-support tools for human administrators. The system never declares any individual legally fraudulent.
2. **Transparent Risk Scoring:** Risk scoring is completely explainable via rule penalty breakdowns (missing documents, name discrepancies, text similarity thresholds) rather than black-box synthetic numbers.
3. **Simulated Settlements:** Beneficiary disbursements operate under an academic Simulated Settlement Mode, tracking collected vs. transferred amounts without claiming live banking transfers.
4. **Test Payment Gateway:** Payments are processed in Razorpay Test Mode or clearly labeled Demo Mode. No real financial debit occurs.
