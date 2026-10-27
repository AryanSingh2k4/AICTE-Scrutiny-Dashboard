import { chromium } from "playwright-core";
import fs from "node:fs";

const executablePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const outPdfPath = "C:\\Users\\aryan\\Desktop\\ScrutiniX_Tech_Stack.pdf";

const tableRows = [
  [
    "Frontend Framework",
    "Next.js 14+ (App Router, TypeScript)",
    "Server Components, dynamic routes, streaming UI, and route handlers."
  ],
  [
    "Styling & UI System",
    "Tailwind CSS",
    "Utility-first CSS styling, responsive layout system, and custom typography variables."
  ],
  [
    "Data Visualization",
    "Recharts + SVG Overlays",
    "Daily throughput charts, status distributions, and SVG bounding-box document anomaly overlays."
  ],
  [
    "Backend & Pipeline",
    "Next.js Route Handlers",
    "Serverless Node.js runtime executing step-by-step document validation and scrutiny passes."
  ],
  [
    "Database",
    "Supabase PostgreSQL 15+",
    "Relational application store, JSONB rulebooks, pg_trgm fuzzy matching, and pgcrypto cryptographic functions."
  ],
  [
    "Realtime Subscriptions",
    "Supabase Realtime (WebSocket)",
    "Live updates for document processing stages (processing_events) and scrutiny alert broadcasts."
  ],
  [
    "Authentication & RBAC",
    "Supabase Auth + SSR",
    "Role-Based Access Control enforcing institution, scrutiny_officer, senior_officer, and auditor roles via RLS."
  ],
  [
    "Document Storage",
    "Supabase Private Storage",
    "Private encrypted object buckets with time-limited signed URLs for tamper-evident document inspection."
  ],
  [
    "Audit Trail & Integrity",
    "PostgreSQL Security Definer + pgcrypto",
    "Append-only SHA-256 hash-chained log (append_audit, verify_audit_chain) with advisory locks."
  ],
  [
    "PDF Text Layer Extraction",
    "unpdf / pdf-lib",
    "Deterministic extraction of embedded text layers, document metadata, font consistency, and page counts."
  ],
  [
    "Image Forensics & Manipulation",
    "sharp",
    "Error Level Analysis (ELA JPEG variance detection), raw pixel extraction, and image normalization."
  ],
  [
    "QR Code Verification",
    "jsQR + pdf.js",
    "Client-side canvas and server-side pixel QR decoding for state board/university and notary payload verification."
  ],
  [
    "Cryptographic Hashing & pHash",
    "Node.js crypto + DCT pHash",
    "Recomputed SHA-256 document fingerprints and 64-bit perceptual hashing for near-duplicate detection."
  ],
  [
    "Fuzzy Matching & Normalization",
    "fastest-levenshtein / pg_trgm",
    "Cross-document entity matching (institution names, trustee names, addresses) with Indian legal normalizers."
  ],
  [
    "Date Parsing & Boundary Validation",
    "date-fns + Custom Regex",
    "Indian date format parsing (DD/MM/YYYY, \"12 March 2024\") for validity and expiry verification."
  ],
  [
    "Regulatory Rules Engine",
    "Custom TypeScript Evaluator (~150 LOC)",
    "Evaluates versioned YAML checklists (rules/2026-27/*.yaml) seeded as JSONB without hardcoded regulatory logic."
  ],
  [
    "OCR Fallback",
    "tesseract.js",
    "Browser-side optical character recognition fallback for scanned image documents with zero server overhead."
  ],
  [
    "Mock Authority Issuers",
    "Next.js API Routes (/api/mock-issuers/*)",
    "Simulates external issuing authorities (State University QR, NBA registry lookup, and intermittent timeout adapter)."
  ],
  [
    "Synthetic Data Generation",
    "Python (Faker en_IN, ReportLab, Pillow)",
    "Generates synthetic test institutions, PDFs, forged anomalies, and seeds database via service-role key."
  ],
  [
    "Optional Heavy Worker",
    "FastAPI + Docker (Optional VPS)",
    "Feature-flagged YOLOv8n / CLIP zero-shot campus infrastructure photo verification and OpenCV copy-move analysis."
  ]
];

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ScrutiniX Tech Stack</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: #ffffff;
      color: #000000;
      font-family: Arial, Helvetica, sans-serif;
      padding: 0;
      font-size: 11px;
      line-height: 1.4;
    }
    h1 {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 12px;
      color: #000000;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    thead {
      display: table-header-group;
    }
    th, td {
      border: 1px solid #222222;
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
      font-size: 11px;
    }
    td.domain {
      font-weight: 600;
      width: 25%;
    }
    td.tech {
      width: 30%;
    }
    td.desc {
      width: 45%;
    }
  </style>
</head>
<body>
  <h1>ScrutiniX &mdash; Technical Architecture &amp; Implementation Stack</h1>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Layer / Domain</th>
        <th style="width: 30%;">Technology / Library</th>
        <th style="width: 45%;">Role &amp; Function</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows.map(row => `
        <tr>
          <td class="domain">${row[0]}</td>
          <td class="tech">${row[1]}</td>
          <td class="desc">${row[2]}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
</body>
</html>`;

const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage();
await page.setContent(htmlContent, { waitUntil: "networkidle" });
await page.pdf({
  path: outPdfPath,
  format: "A4",
  margin: {
    top: "15mm",
    bottom: "15mm",
    left: "15mm",
    right: "15mm",
  },
  printBackground: true,
});

await browser.close();
console.log("Successfully generated PDF at:", outPdfPath);
