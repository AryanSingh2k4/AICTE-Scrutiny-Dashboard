# ScrutiniX · AICTE Scrutiny & Regulatory Verification Suite

> **AI-Powered Multi-Modal Document Authentication, Forensic Fraud Detection, and Regulatory Compliance Verification**  
> *Ministry of Education, All India Council for Technical Education (AICTE)* · Approval Process Handbook (APH) 2026–27  
> **Production Deployment:** [https://scrutinix.vercel.app](https://scrutinix.vercel.app)

---

## 📌 Table of Contents
1. [What is ScrutiniX?](#-what-is-scrutinix)
2. [Core Objectives](#-core-objectives)
3. [System Architecture & Deployment Topology](#-system-architecture--deployment-topology)
4. [How It Works: Forensic Verification Pipelines](#-how-it-works-forensic-verification-pipelines)
   - [1. Cryptographic SHA-256 Sealing](#1-cryptographic-sha-256-sealing)
   - [2. OpenCV Error Level Analysis (ELA) Tampering Detection](#2-opencv-error-level-analysis-ela-tampering-detection)
   - [3. Font & Style Stream Inconsistency Detection](#3-font--style-stream-inconsistency-detection)
   - [4. Chronological Metadata Inversion Analysis](#4-chronological-metadata-inversion-analysis)
   - [5. Cross-Institutional Document Plagiarism & Splicing Engine](#5-cross-institutional-document-plagiarism--splicing-engine)
   - [6. APH 2026–27 Regulatory Rule Engine](#6-aph-202627-regulatory-rule-engine)
   - [7. Google Gemma / Gemini Decision Support](#7-google-gemma--gemini-decision-support)
   - [8. Immutable Cryptographic Audit Ledger](#8-immutable-cryptographic-audit-ledger)
5. [Tech Stack](#-tech-stack)
6. [Role-Based Portals & Demo Credentials](#-role-based-portals--demo-credentials)
7. [How to Run Locally](#-how-to-run-locally)
8. [End-to-End Testing Guide (Using the 6 Provided Test Documents)](#-end-to-end-testing-guide)

---

## 🎯 What is ScrutiniX?

Every academic year, thousands of technical institutes across India apply to the **All India Council for Technical Education (AICTE)** for Extension of Approval (EoA), intake adjustments, and new program approvals under the **Approval Process Handbook (APH)**. 

Historically, verifying mandatory statutory documents—such as Registered Land Title Deeds, Municipal Building Plans, Fire Safety NOCs, and Affidavits—required manual visual checks by regional scrutiny committees. This made the process vulnerable to:
* **Fabricated certificates and localized PDF tampering** (whiteout masks, altered intake numbers, modified dates).
* **Cross-institutional document plagiarism** (one college copying another college's land title deed, changing the header/trust name while retaining legal survey blocks and municipal coordinates).
* **Byte-for-byte duplicate reuse** across affiliated colleges.
* **Chronological discrepancies** where PDF metadata postdates stated legal execution dates by months or years.

**ScrutiniX** automates this entire document verification pipeline. Operating strictly under the **Advisory Principle** (the machine surfaces evidence, while human AICTE officers retain sole decision-making authority), ScrutiniX evaluates documents in seconds, cross-checks inter-college submissions, and seals every action into an append-only audit trail.

---

## 🏆 Core Objectives

1. **Instantaneous Ingestion & Hashing:** Compute real SHA-256 cryptographic digests upon upload to prevent multi-institution file reuse and establish proof of receipt.
2. **Sub-Pixel Digital Tamper Detection:** Surface digital alterations, whiteout patches, and compression discrepancies using OpenCV Error Level Analysis (ELA).
3. **Cross-Institutional Document Plagiarism Detection:** Identify when an institution copies another college's land title deed or certificate and performs superficial alterations (plot numbers, dates, college name) while retaining legal survey schedules and municipal approvals.
4. **Font & Typographic Consistency Analysis:** Detect unauthorized metric inflation by analyzing vector font family, size divergence, and baseline shifts in critical figures (intake capacity, NAAC/NBA scores, land acreage).
5. **Metadata Chronological Inversion Verification:** Cross-reference internal PDF creation/modification timestamps against stated stamp paper execution dates to flag retroactive document creation (>48h tolerance).
6. **Regulatory Compliance Automation:** Evaluate submissions against 15+ statutory AICTE Approval Process Handbook (APH) 2026–27 rules (land thresholds, student-to-faculty ratios, built-up areas).
7. **Multi-Modal Decision Support:** Synthesize deterministic findings into structured regulatory advisories (Accept, Request Clarification, Refer for Physical Inspection, Reject).
8. **Tamper-Evident Audit Trail:** Maintain an immutable, append-only cryptographic ledger of every document uploaded, SHA-256 seal, and officer decision.

---

## 🌐 System Architecture & Deployment Topology

ScrutiniX uses a modern, distributed microservices architecture deployed across specialized cloud infrastructure:

```
                                 ┌────────────────────────────────────────────────────────┐
                                 │                   Client Web Browser                   │
                                 │       (AICTE Scrutiny Officers & Technical Colleges)   │
                                 └───────────────────────────┬────────────────────────────┘
                                                             │ HTTPS
                                                             ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  1. PRODUCTION WEB APPLICATION & API ROUTER (Vercel Serverless Edge)                                                    │
│  Domain: https://scrutinix.vercel.app                                                                                   │
│                                                                                                                         │
│  • Next.js 15 (App Router) + React 19 + Tailwind CSS + TypeScript                                                        │
│  • RBAC Authentication & Session Management                                                                             │
│  • Dynamic Institution Dashboard (/institution) & Central Scrutiny Desk (/overview, /applications/[id])               │
│  • Shingled 3-Gram Cross-Document Semantic Similarity & Jaccard Plagiarism Detector                                     │
│  • API Route Handlers (/api/documents/upload, /api/applications, /api/decisions, /api/audit)                           │
└────────────────────────────────────────────┬────────────────────────────────────────────┬───────────────────────────────┘
                                             │                                            │
                                             │ REST / S3 Protocol                         │ HTTP Multipart / 8000
                                             ▼                                            ▼
┌──────────────────────────────────────────────────────────┐  ┌──────────────────────────────────────────────────────────┐
│  2. DATABASE, STORAGE & LEDGER (Supabase Cloud)          │  │  3. DEDICATED FORENSIC & OCR ENGINE (Oracle Cloud VPS)   │
│  Endpoint: https://jowtilmwhyasyxuflwli.supabase.co      │  │  Host: http://130.210.60.120:8000                        │
│                                                          │  │                                                          │
│  • PostgreSQL 15 + pgcrypto & pg_trgm extensions         │  │  • Docker Container (Isolated Python 3.11 Runtime)        │
│  • Tables: institutions, applications, documents,        │  │  • OpenCV 4: Error Level Analysis (ELA) Heatmaps         │
│    anomaly_flags, rules, audit_log                       │  │  • PyMuPDF (fitz): Text Extraction & Font Typography     │
│  • Secure S3-Compatible Storage Bucket: documents/       │  │  • PyTesseract: Optical Character Recognition (OCR)      │
│  • PostgreSQL append_audit() RPC Ledger Engine           │  │  • Resource Capped: 2 vCPUs, 3 GB RAM, non-root user     │
└──────────────────────────────────────────────────────────┘  └──────────────────────────────────────────────────────────┘
                                             │
                                             │ Google GenAI Protocol
                                             ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  4. STATUTORY AI REASONING & DECISION SUPPORT (Google Gemini API)                                                       │
│  • Model: Google Gemma / Gemini Multi-Modal Engine                                                                      │
│  • Synthesizes visual ELA contours, text contradictions, and APH 2026–27 clauses into formal officer recommendations     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

| Component | Platform / Host | Technology Stack | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend & API Gateway** | **Vercel** (`scrutinix.vercel.app`) | Next.js 15, React 19, TypeScript, Tailwind | User interfaces for Colleges and Scrutiny Officers, serverless routing, and fast edge delivery. |
| **Database & File Vault** | **Supabase** (AWS Mumbai `ap-south-1`) | PostgreSQL 15, `pgcrypto`, S3 Storage Buckets | Relational records, foreign key integrity, encrypted document storage, and append-only audit trail. |
| **Forensic Analysis Engine** | **Oracle Cloud VPS** (`130.210.60.120:8000`) | Docker, FastAPI, Python 3.11, OpenCV 4, PyMuPDF | CPU-intensive Error Level Analysis (ELA), font variance scanning, and OCR token extraction. |
| **AI Decision Support** | **Google Cloud** | Google Gemini / Gemma API | Structured statutory rationale generation and APH 2026–27 clause mapping. |

---

## ⚙️ How It Works: Forensic Verification Pipelines

### 1. Cryptographic SHA-256 Sealing
Upon upload, the exact byte stream is digested via SHA-256:
$$\text{Digest} = \text{SHA256}(\text{Document Bytes})$$
The engine queries `public.documents` across all institutions. If an identical hash is submitted by another institution, ScrutiniX immediately flags an **Exact Cryptographic Duplicate Collision** (`RULE EOA-DUP-01`).

### 2. OpenCV Error Level Analysis (ELA) Tampering Detection
When an image or PDF page is digitally manipulated (e.g. erasing a number and writing a new one, or pasting an unauthorized seal), the newly edited region has a different JPEG compression error rate than the original canvas:
1. The page is rendered to high-resolution RGB ($300\text{ DPI}$).
2. The image is resaved at a standardized compression factor ($95\%$).
3. The absolute pixel difference is calculated:
   $$\Delta(x, y) = |\text{Original}(x, y) - \text{Resaved}(x, y)| \times \text{Scale}$$
4. Morphological thresholding detects localized anomaly contours and extracts bounding box coordinates `[x, y, w, h]` for officer inspection.

### 3. Font & Style Stream Inconsistency Detection
Using PyMuPDF vector dictionary parsing (`page.get_text("dict")`), every character's font family, weight, and point size are extracted. If critical figures (intake capacity, NAAC/NBA grade, land acreage) diverge from the document's dominant font hierarchy, ScrutiniX flags unauthorized numerical metric inflation.

### 4. Chronological Metadata Inversion Analysis
Legal documents signed on stamp paper must be executed contemporaneously. ScrutiniX parses the PDF's internal binary trailer and XMP creation timestamp:
$$\Delta_{\text{hours}} = \text{Timestamp}_{\text{PDF Creation}} - \text{Date}_{\text{Legal Execution}}$$
If $\Delta_{\text{hours}} > 48\text{ hours}$, the document is flagged for **Metadata Chronological Inversion** (`RULE EOA-META-01`), revealing retroactive digital authoring rather than contemporaneous physical scanning.

### 5. Cross-Institutional Document Plagiarism & Splicing Engine
To catch instances where an applicant institution copies another college's document, modifies the name and date, but keeps the underlying legal substance:
1. **Tokenization & Normalization:** Extracts clean, alphanumeric word stems ($\text{length} \ge 3$).
2. **Vocabulary Jaccard Similarity:**
   $$J(A, B) = \frac{|A \cap B|}{|A \cup B|}$$
3. **Shingled 3-Gram Phrase Containment:** Computes consecutive three-word sequence overlap:
   $$\text{Overlap}(A, B) = \frac{|\text{Ngrams}(A) \cap \text{Ngrams}(B)|}{\min(|\text{Ngrams}(A)|, |\text{Ngrams}(B)|)}$$
4. **Trigger Condition:** If $J(A, B) > 50\%$ and $\text{Overlap}(A, B) > 35\%$, ScrutiniX flags **Cross-Institutional Document Splicing / Plagiarism** (`RULE EOA-PLAG-01`), identifying the original owning institution and extracting matching clauses.

### 6. APH 2026–27 Regulatory Rule Engine
Deterministic rule validation checks every extraction against statutory AICTE guidelines:
* **Land Area:** Minimum $2.5\text{ Acres}$ (Rural) / $1.5\text{ Acres}$ (Urban/Metro).
* **Fire NOC Validity:** Must not expire within $180\text{ days}$ of the start of the academic year.
* **Student-to-Faculty Ratio (SFR):** Mandatory $1:15$ or $1:20$ depending on accreditation level.
* **Affidavit Formats:** Non-judicial stamp paper ($\ge ₹100$) with authorized notary endorsement.

### 7. Google Gemma / Gemini Decision Support
Combines visual ELA tamper bounding boxes, OCR text contradictions, and regulatory rule violations into a structured JSON advisory:
* Executive Summary
* Overall Risk Score ($0.0\text{ to }1.0$)
* Primary Regulatory Contradictions mapped to specific APH 2026–27 chapters
* Recommended Statutory Action (*Accept*, *Request Clarification*, *Recommend Physical Inspection*, *Reject*)

### 8. Immutable Cryptographic Audit Ledger
Every single event—document upload, SHA-256 digest calculation, automated advisory generation, and human officer decision—is committed via PostgreSQL stored procedure `public.append_audit(...)`. The ledger records the actor's identity, role, timestamp, action type, and payload hash, ensuring tamper-evident accountability.

---

## 💻 Tech Stack

### Frontend & Application Layer
* **Next.js 15 (App Router)**: Modern React framework featuring server components, API route handlers, and streaming.
* **React 19**: Interactive state management for scrutiny dossiers, side-by-side OCR diff viewers, and explainability drawers.
* **Tailwind CSS v3**: Clean UI styled to official Government of India administrative design specifications.
* **Lucide React**: Crisp iconography for regulatory states, risk badges, and audit seals.
* **TypeScript 5.7**: Strict type definitions covering compliance schemas, forensic packages, and officer decisions.

### Backend, Database & Cloud
* **Supabase / PostgreSQL 15**: Hosted relational database with `pgcrypto` cryptographic extensions and Row-Level Security (RLS).
* **Supabase Storage**: S3-compatible cloud storage for submitted PDF dossiers.
* **Vercel Edge Platform**: Zero-maintenance serverless deployment with automated CI/CD from GitHub.

### Computer Vision & Forensic Engine
* **OpenCV 4 (`cv2`)**: Error Level Analysis (ELA), grayscale contour tracking, and mask reconstruction.
* **PyMuPDF (`fitz`)**: Vector PDF dictionary extraction, XMP parsing, and font style stream analysis.
* **PyTesseract**: Optical character recognition fallback for scanned raster documents.
* **Docker**: Containerized runtime running on Oracle Cloud VPS with resource limits (2 CPUs, 3 GB RAM).

### AI & Reasoning
* **Google Gemini API**: Decision support synthesizing visual forensics and legal clauses into structured recommendations.
* **ReportLab**: High-fidelity regulatory document generation and testing harness.

---

## 🔐 Role-Based Portals & Demo Credentials

ScrutiniX supports role-based access control (RBAC). You can sign in using direct email/password or use the **Demo Login Guide** on the landing page for **1-Click Quick Fill**:

| Portal / Role | Institution / Persona | Email | Password | Target Destination |
| :--- | :--- | :--- | :--- | :--- |
| **AICTE Login** | AICTE Scrutiny Officer (Dr. Ananya Menon) | `officer@aicte.gov.in` | `AICTE@Officer2026` | Central Scrutiny Desk (`/overview`) |
| **College Login** | Sardar Patel Inst. of Technology (SPIT) | `principal@spit.ac.in` | `SPIT@Mumbai2026` | College Portal (`/institution?college=sardarpatel`) |
| **College Login** | Datta Meghe College of Engg. (DMCE) | `principal@dmce.ac.in` | `DMCE@Airoli2026` | College Portal (`/institution?college=dattameghe`) |
| **College Login** | Lokmanya Tilak College of Engg. (LTCE) | `principal@ltce.in` | `LTCE@NaviMumbai2026` | College Portal (`/institution?college=ltce`) |

---

## 🚀 How to Run Locally

### 1. Prerequisites
* **Node.js** v20.x or v22.x+
* **npm** v10.x+
* **Python** 3.10+ (optional, for running local forensic scripts)

### 2. Clone the Repository
```bash
git clone https://github.com/AryanSingh2k4/AICTE-Scrutiny-Dashboard.git
cd AICTE-Scrutiny-Dashboard
```

### 3. Install Node.js Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env.local` file in the project root:
```env
# Supabase Database & Auth
NEXT_PUBLIC_SUPABASE_URL=https://jowtilmwhyasyxuflwli.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key

# Google Gemini API (Decision Support)
GEMINI_API_KEY=your_gemini_api_key

# Dedicated Forensic & OCR Engine (VPS Docker or localhost)
FORENSIC_ENGINE_URL=http://130.210.60.120:8000
```

### 5. Run the Local Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 End-to-End Testing Guide

Six realistic PDF test documents are prepared in:
📁 **`C:\Users\aryan\Desktop\Six_Documents_Testing\`**  
*(also mirrored at `C:\Users\aryan\Desktop\Testing Documents\Six_Documents_Set\`)*

### 📄 The 6 Test Documents

1. `SPIT_Land_Title_Deed.pdf`: SPIT Genuine Land Title Deed (Munshi Nagar, Andheri West).
2. `SPIT_Building_Plan_NOC.pdf`: SPIT Genuine Building Safety Plan (MCGM Approval).
3. `DMCE_Land_Title_Deed.pdf`: DMCE Genuine Land Title Deed (Original CIDCO Perpetual Lease, Sector 3, Airoli).
4. `DMCE_Building_Plan_NOC.pdf`: DMCE Genuine Building Safety Plan (NMMC Completion Certificate).
5. `LTCE_Land_Title_Deed.pdf`: **LTCE Edited Land Title Deed** *(Spliced/edited copy of DMCE's deed; retains CIDCO allotment `CIDCO/ESTATE/AIROLI/SEC3/98-ALLOT-45892`, Survey Block `48/3`, and boundary coordinates)*.
6. `LTCE_Building_Plan_NOC.pdf`: LTCE Genuine Building Safety Plan (Independent NMMC Koparkhairane NOC).

---

### 🚶‍♂️ Step-by-Step Testing Walkthrough

#### Step 1: Submit SPIT Documents (Clean Benchmark)
1. Go to **[https://scrutinix.vercel.app](https://scrutinix.vercel.app)**.
2. Select **College Login** (`principal@spit.ac.in` pre-filled) &rarr; Click **Continue to College Portal**.
3. Under **Target Category**, select **`Land Ownership & Title Deed`** &rarr; Upload `SPIT_Land_Title_Deed.pdf`.
4. Under **Target Category**, select **`Building Safety & Completion Plan`** &rarr; Upload `SPIT_Building_Plan_NOC.pdf`.
5. Click **"Submit EoA Application"**. (Shows standard upload receipt; 0 false alarms).

#### Step 2: Submit Datta Meghe Documents (Genuine Source)
1. Log out or return to the landing page &rarr; Click **Demo Login Guide** &rarr; Click **1-Click Sign In** on **Datta Meghe College of Engg**.
2. Select **`Land Ownership & Title Deed`** &rarr; Upload `DMCE_Land_Title_Deed.pdf`.
3. Select **`Building Safety & Completion Plan`** &rarr; Upload `DMCE_Building_Plan_NOC.pdf`.
4. Click **"Submit EoA Application"**. (DMCE's CIDCO deed is now registered in the compliance database).

#### Step 3: Submit Lokmanya Tilak Documents (The Integrity Test)
1. Return to the landing page &rarr; Click **Demo Login Guide** &rarr; Click **1-Click Sign In** on **Lokmanya Tilak College of Engg**.
2. Select **`Land Ownership & Title Deed`** &rarr; Upload `LTCE_Land_Title_Deed.pdf`.
3. Select **`Building Safety & Completion Plan`** &rarr; Upload `LTCE_Building_Plan_NOC.pdf`.
4. Click **"Submit EoA Application"**.  
   *(Notice: The college sees only a clean upload confirmation. All forensic detection is securely routed to the Scrutiny Officer).*

#### Step 4: AICTE Scrutiny Officer Review & Decision
1. Return to **[https://scrutinix.vercel.app](https://scrutinix.vercel.app)**.
2. Select **AICTE Login** (`officer@aicte.gov.in`) &rarr; Click **Continue to Scrutiny Desk**.
3. On the **Scrutiny Overview** page (`/overview`):
   * Notice that **Lokmanya Tilak College of Engineering (`APP-2026-9012`)** is flagged with **`HIGH RISK`** and **Critical Findings**.
   * SPIT and DMCE show clean with low risk.
4. Click **Review** on **Lokmanya Tilak College of Engineering**:
   * Inspect the **Cross-Institution Plagiarism** finding showing the **91% text match** with Datta Meghe College of Engineering, along with the shared CIDCO survey blocks and legal clauses.
5. Click **Record decision** &rarr; Select **Refer for inspection** (or *Request clarification*) &rarr; Enter remarks &rarr; Check the confirmation box &rarr; Click **Record decision**.
6. The decision is formally committed to the immutable cryptographic audit chain. Navigate to **`/audit`** to inspect the append-only ledger entry!

---

## 📜 Regulatory Standards & Governance

ScrutiniX is designed for technical education regulatory authorities, adhering strictly to:
* **AICTE Approval Process Handbook (APH) 2026–27**
* **Information Technology Act, 2000 (§43A & §65B - Admissibility of Electronic Records)**
* **National Building Code of India (NBC 2016 - Group B Educational Occupancy Standards)**
* **Digital Personal Data Protection (DPDP) Act, 2023**

---

## 👥 Contributors & Acknowledgements
Developed for the **All India Council for Technical Education (AICTE)**, Ministry of Education, Government of India.
