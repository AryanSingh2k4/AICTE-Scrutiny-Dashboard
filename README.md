# ScrutiniX · AICTE Scrutiny & Regulatory Compliance Suite

> **AI-Powered Application Validation, Document Authentication, and Regulatory Compliance Verification**  
> *Ministry of Education, All India Council for Technical Education (AICTE)* · Approval Process Handbook (APH) 2026–27

---

## 🔐 How to Log In & Access Portals

ScrutiniX features role-based access control (RBAC) powered by Supabase Authentication. The sign-in page features two distinct portal tiles: **AICTE Login** and **College Login**.

### 📋 Access Credentials Summary

| Portal / Role | Organization / Persona | User Email | Password | Target Desk |
| :--- | :--- | :--- | :--- | :--- |
| **AICTE Login** | AICTE Scrutiny Officer (Dr. Ananya Menon) | `officer@aicte.gov.in` | `AICTE` | Central Scrutiny Desk (`/overview`) |
| **College Login** | Sardar Patel Institute of Technology (SPIT) | `principal@sardarpatel.edu.in` | `sardarpatel` | College Portal (`/institution?college=sardarpatel`) |
| **College Login** | Lokmanya Tilak College of Engineering (LTCE) | `principal@ltce.in` | `ltce` | College Portal (`/institution?college=ltce`) |

---

### 📋 Quick-Copy Credentials (Use GitHub's Copy Button)

Click the copy icon on the top right of each code block below:

#### 1. AICTE Scrutiny Officer (Central Scrutiny Desk)
- **Email:**
```text
officer@aicte.gov.in
```
- **Password:**
```text
AICTE
```
- **Login Steps:** Click **AICTE Login** tile &rarr; Enter credentials &rarr; Click **Continue to Scrutiny Desk**.

---

#### 2. Technical Institution: Sardar Patel Institute of Technology (PID: 1-3686579303)
- **Email:**
```text
principal@sardarpatel.edu.in
```
- **Password:**
```text
sardarpatel
```
- **Login Steps:** Click **College Login** tile &rarr; Enter credentials &rarr; Click **Continue to College Portal**.

---

#### 3. Technical Institution: Lokmanya Tilak College of Engineering (PID: 1-10358461)
- **Email:**
```text
principal@ltce.in
```
- **Password:**
```text
ltce
```
- **Login Steps:** Click **College Login** tile &rarr; Enter credentials &rarr; Click **Continue to College Portal**.

---

## ⚡ Quick Start / Local Development

### 1. Prerequisites
- **Node.js** v20+ or v24+
- **npm** v10+

### 2. Installation
```bash
git clone https://github.com/AryanSingh2k4/AICTE-Scrutiny-Dashboard.git
cd AICTE-Scrutiny-Dashboard
npm install
```

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or [http://localhost:3001](http://localhost:3001) if port 3000 is occupied) in your browser.

---

## 🏛️ Platform Architecture & Key Features

### 1. Multi-Tenant Role-Based Access Control (RBAC)
- **AICTE Official Portal (`/overview`, `/applications`, `/review`, `/rules`, `/audit`)**: Allows scrutiny committees and regional officers to evaluate technical applications, inspect document extractions, review automated advisories, cross-check issuing authorities, and seal regulatory decisions.
- **College Applicant Portal (`/institution`)**: Dedicated workspace for technical institutions to upload statutory compliance evidence, inspect real-time SHA-256 digital seals, view advisory pre-checks, and print statutory AICTE receipts.

### 2. Cryptographic Integrity & Document Tamper Sealing
- **Client-Side SHA-256 Digest**: Computes cryptographic hash in browser using `crypto.subtle.digest("SHA-256")` before transmitting evidence.
- **Direct Supabase Cloud Storage**: Encrypted document vault organized by application identifiers (`APP-2026-XXXX`).
- **Immutable Audit Trail**: Logs all upload events, timestamps, and principal names into PostgreSQL `public.audit_log`.

### 3. Regulatory Rule & Deficiency Engine
- Pre-checks 15+ statutory AICTE rules derived from the Approval Process Handbook (APH) AY 2026–27.
- Identifies land area thresholds, student-faculty ratios (SFR), fire safety NOC expiry horizon discrepancies, and mandatory affidavits.
- Strictly adheres to the **Advisory Principle**: Automated tools highlight findings and flag discrepancies, retaining ultimate authority with human AICTE scrutiny officers.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS v3](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Backend & Auth**: [Supabase Auth](https://supabase.com/docs/guides/auth), PostgreSQL, Row Level Security (RLS)
- **Storage**: Supabase Storage Buckets (`documents`)
- **Type Safety**: TypeScript 5.7+ strict mode

---

## 📄 License
Internal prototype developed for AICTE (Ministry of Education, Government of India).
