// ==============================================================================
// ScrutiniX AICTE Scrutiny Engine — Serverless Document Forensics Engine
// Academic Year 2026–27 | Decision Support Only
// ==============================================================================

import crypto from "node:crypto";
import zlib from "node:zlib";
import { getServerSupabase } from "@/lib/supabase/server";

interface MatchedDuplicateDoc {
  id: string;
  application_id: string;
  institution_id: string;
  institution_name?: string;
  file_name: string;
  submitted_at?: string;
}

export interface CrossInstitutionDuplicateResult {
  isDuplicate: boolean;
  matchedDoc?: MatchedDuplicateDoc;
}

export interface PdfMetadataAndDatesResult {
  producer?: string;
  title?: string;
  author?: string;
  creator?: string;
  creationDate?: string; // ISO string
  modDate?: string;      // ISO string
  rawCreationDate?: string;
  rawModDate?: string;
  statedIssueDate?: string;
  hasInconsistency: boolean;
  diffHours?: number;
  inconsistencyReason?: string;
  metadata: Record<string, any>;
}

interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DocumentTamperResult {
  isTampered: boolean;
  confidence: number;
  reason?: string;
  boundingBox?: BoundingBox;
  details?: Record<string, any>;
}

export interface ExtractedFieldItem {
  raw: string;
  normalized?: string;
  confidence: number;
}

/**
 * 1. Compute Hexadecimal SHA-256 Hash of a Buffer
 */
export function computeSha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * 2. Compute 64-bit Perceptual Hash (DCT / Block-Average based)
 * Returns a 16-character hexadecimal string representing the 64-bit fingerprint.
 */
export async function computePHash(buffer: Buffer): Promise<string> {
  // Ensure buffer has at least 64 bytes
  let input = buffer;
  if (input.length < 64) {
    const padded = Buffer.alloc(64);
    input.copy(padded);
    input = padded;
  }

  // 1. Partition buffer into 64 spatial/frequency sample blocks (8x8 matrix)
  const matrix: number[][] = Array.from({ length: 8 }, () => new Array(8).fill(0));
  const blockSize = Math.floor(input.length / 64);

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const blockIdx = row * 8 + col;
      const start = blockIdx * blockSize;
      const end = blockIdx === 63 ? input.length : start + blockSize;
      let sum = 0;
      for (let i = start; i < end; i++) {
        sum += input[i];
      }
      matrix[row][col] = sum / (end - start);
    }
  }

  // 2. Compute 8x8 2D Discrete Cosine Transform (DCT)
  const dct: number[][] = Array.from({ length: 8 }, () => new Array(8).fill(0));
  const N = 8;
  for (let u = 0; u < N; u++) {
    for (let v = 0; v < N; v++) {
      const alphaU = u === 0 ? 1 / Math.SQRT2 : 1;
      const alphaV = v === 0 ? 1 / Math.SQRT2 : 1;
      let sum = 0;
      for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
          sum +=
            matrix[x][y] *
            Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N)) *
            Math.cos(((2 * y + 1) * v * Math.PI) / (2 * N));
        }
      }
      dct[u][v] = 0.25 * alphaU * alphaV * sum;
    }
  }

  // 3. Compute mean of low-frequency AC components (excluding DC at [0,0])
  let sumAc = 0;
  for (let u = 0; u < 8; u++) {
    for (let v = 0; v < 8; v++) {
      if (u === 0 && v === 0) continue;
      sumAc += dct[u][v];
    }
  }
  const meanAc = sumAc / 63;

  // 4. Construct 64-bit hash (16 hexadecimal characters)
  let hashHex = "";
  for (let byteIdx = 0; byteIdx < 8; byteIdx++) {
    let byteVal = 0;
    for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
      const bitPos = byteIdx * 8 + bitIdx;
      const u = Math.floor(bitPos / 8);
      const v = bitPos % 8;
      if (dct[u][v] > meanAc) {
        byteVal |= 1 << (7 - bitIdx);
      }
    }
    hashHex += byteVal.toString(16).padStart(2, "0");
  }

  return hashHex;
}

/**
 * 3. Cross-Institution Duplicate Detection
 * Queries Supabase documents joined with applications to identify cross-institution submissions.
 */
export async function checkCrossInstitutionDuplicate(
  docSha256: string,
  currentApplicationId: string,
  currentInstitutionId: string
): Promise<CrossInstitutionDuplicateResult> {
  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from("documents")
    .select(`
      id,
      application_id,
      file_name,
      sha256_hash,
      applications (
        id,
        institution_id,
        submitted_at,
        institutions (
          id,
          name
        )
      )
    `)
    .eq("sha256_hash", docSha256);

  if (error || !data) {
    return { isDuplicate: false };
  }

  for (const doc of data) {
    const app = (Array.isArray(doc.applications) ? doc.applications[0] : doc.applications) as any;
    if (!app) continue;

    const isDifferentApp = doc.application_id !== currentApplicationId;
    const isDifferentInst = app.institution_id !== currentInstitutionId;

    if (isDifferentApp || isDifferentInst) {
      const inst = Array.isArray(app.institutions) ? app.institutions[0] : app.institutions;
      return {
        isDuplicate: true,
        matchedDoc: {
          id: doc.id,
          application_id: doc.application_id,
          institution_id: app.institution_id,
          institution_name: inst?.name || undefined,
          file_name: doc.file_name,
          submitted_at: app.submitted_at || undefined,
        },
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Helper: Parse PDF Date format D:YYYYMMDDHHmmSS[+|-]HH'mm' into ISO 8601 string
 */
function parsePdfDateString(pdfDateStr?: string): string | null {
  if (!pdfDateStr) return null;
  const cleaned = pdfDateStr.replace(/^D:/, "").replace(/'/g, "");
  const m = cleaned.match(/^(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?([+\-Z])?(\d{2})?(\d{2})?/);
  if (!m) return null;

  const [_, yr, mo, da, hr, min, sec, tz, tzHr, tzMin] = m;
  const isoDate = `${yr || "1970"}-${mo || "01"}-${da || "01"}`;
  const isoTime = `${hr || "00"}:${min || "00"}:${sec || "00"}`;
  let offset = "Z";
  if (tz && tz !== "Z" && tzHr) {
    offset = `${tz}${tzHr}:${tzMin || "00"}`;
  }

  const dateObj = new Date(`${isoDate}T${isoTime}${offset}`);
  return isNaN(dateObj.getTime()) ? null : dateObj.toISOString();
}

/**
 * Helper: Normalize month and date expressions into YYYY-MM-DD
 */
const MONTH_MAP: Record<string, string> = {
  jan: "01", january: "01", feb: "02", february: "02", mar: "03", march: "03",
  apr: "04", april: "04", may: "05", june: "06", jun: "06", july: "07", jul: "07",
  aug: "08", august: "08", sep: "09", september: "09", oct: "10", october: "10",
  nov: "11", november: "11", dec: "12", december: "12",
};

function normalizeDateString(raw?: string): string | undefined {
  if (!raw) return undefined;

  // Format: "12th day of April 2026"
  const dayOf = raw.match(/(\d{1,2})(?:st|nd|rd|th)?\s+day\s+of\s+([A-Za-z]+)\s+(\d{4})/i);
  if (dayOf) {
    const d = dayOf[1].padStart(2, "0");
    const m = MONTH_MAP[dayOf[2].toLowerCase()] || "01";
    return `${dayOf[3]}-${m}-${d}`;
  }

  // Format: "15 January 2026" or "01 July 2022"
  const dmy = raw.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (dmy) {
    const d = dmy[1].padStart(2, "0");
    const m = MONTH_MAP[dmy[2].toLowerCase()] || "01";
    return `${dmy[3]}-${m}-${d}`;
  }

  // Format: "2026-04-12"
  const iso = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];

  // Format: "2026-2027 Academic Year" -> "2027-06-30"
  const yearRange = raw.match(/(\d{4})\s*-\s*(\d{4})/);
  if (yearRange) return `${yearRange[2]}-06-30`;

  // Format: "Dec 2028" -> "2028-12-31"
  const monYear = raw.match(/([A-Za-z]+)\s+(\d{4})/);
  if (monYear && MONTH_MAP[monYear[1].toLowerCase()]) {
    const m = MONTH_MAP[monYear[1].toLowerCase()];
    return `${monYear[2]}-${m}-28`;
  }

  return raw;
}

/**
 * 4. Extract PDF Metadata and Compare Against Stated Issue Date
 */
export function extractPdfMetadataAndDates(
  buffer: Buffer,
  statedDateOverride?: string
): PdfMetadataAndDatesResult {
  const str = buffer.toString("latin1");
  const meta: Record<string, any> = {};

  // Extract raw PDF dictionary items
  const cDateMatch = str.match(/\/CreationDate\s*\(((?:\\\(|\\\)|[^\)])+)\)/);
  if (cDateMatch) meta.rawCreationDate = cDateMatch[1].replace(/\\([()])/g, "$1");

  const mDateMatch = str.match(/\/ModDate\s*\(((?:\\\(|\\\)|[^\)])+)\)/);
  if (mDateMatch) meta.rawModDate = mDateMatch[1].replace(/\\([()])/g, "$1");

  const prodMatch = str.match(/\/Producer\s*\(((?:\\\(|\\\)|[^\)])+)\)/);
  if (prodMatch) meta.producer = prodMatch[1].replace(/\\([()])/g, "$1");

  const titleMatch = str.match(/\/Title\s*\(((?:\\\(|\\\)|[^\)])+)\)/);
  if (titleMatch) meta.title = titleMatch[1].replace(/\\([()])/g, "$1");

  const authorMatch = str.match(/\/Author\s*\(((?:\\\(|\\\)|[^\)])+)\)/);
  if (authorMatch) meta.author = authorMatch[1].replace(/\\([()])/g, "$1");

  const creatorMatch = str.match(/\/Creator\s*\(((?:\\\(|\\\)|[^\)])+)\)/);
  if (creatorMatch) meta.creator = creatorMatch[1].replace(/\\([()])/g, "$1");

  const creationDateIso = parsePdfDateString(meta.rawCreationDate) || undefined;
  const modDateIso = parsePdfDateString(meta.rawModDate) || undefined;

  // Stated issue date determination: override or extract from document text
  let statedIssueDate = statedDateOverride;
  if (!statedIssueDate) {
    const { text } = extractPdfTextAndStreams(buffer);
    const fields = extractDocumentFields(text);
    if (fields.issue_date?.normalized) {
      statedIssueDate = fields.issue_date.normalized;
    } else if (fields.issue_date?.raw) {
      statedIssueDate = normalizeDateString(fields.issue_date.raw);
    }
  }

  let hasInconsistency = false;
  let diffHours: number | undefined;
  let inconsistencyReason: string | undefined;

  if (creationDateIso && statedIssueDate) {
    const cTime = new Date(creationDateIso).getTime();
    const sDateOnly = statedIssueDate.includes("T") ? statedIssueDate : `${statedIssueDate}T00:00:00Z`;
    const sTime = new Date(sDateOnly).getTime();

    if (!isNaN(cTime) && !isNaN(sTime)) {
      diffHours = (cTime - sTime) / (1000 * 60 * 60);

      // Flag if creation date is > 48 hours later than stated issue date
      if (diffHours > 48) {
        hasInconsistency = true;
        diffHours = Math.round(diffHours * 10) / 10;
        inconsistencyReason = `PDF metadata creation date (${creationDateIso.slice(0, 10)}) is ${Math.round(
          diffHours
        )} hours later than stated document issue date (${statedIssueDate}), exceeding the 48-hour regulatory threshold.`;
      } else if (diffHours < -24) {
        hasInconsistency = true;
        diffHours = Math.round(diffHours * 10) / 10;
        inconsistencyReason = `PDF metadata creation date (${creationDateIso.slice(0, 10)}) predates stated issue date (${statedIssueDate}) by ${Math.abs(
          Math.round(diffHours)
        )} hours.`;
      }
    }
  }

  meta.creation_date = creationDateIso;
  meta.mod_date = modDateIso;
  meta.stated_issue_date = statedIssueDate;
  if (diffHours !== undefined) meta.diff_hours = diffHours;

  return {
    producer: meta.producer,
    title: meta.title,
    author: meta.author,
    creator: meta.creator,
    creationDate: creationDateIso,
    modDate: modDateIso,
    rawCreationDate: meta.rawCreationDate,
    rawModDate: meta.rawModDate,
    statedIssueDate,
    hasInconsistency,
    diffHours,
    inconsistencyReason,
    metadata: meta,
  };
}

/**
 * 5. Document Tampering & Alteration Detection
 * Analyzes document structure and streams for splicing, overlaid annotations, and multiple xrefs.
 */
export function detectDocumentTampering(
  buffer: Buffer,
  _mimeType?: string
): DocumentTamperResult {
  const str = buffer.toString("latin1");

  // 1. Check for multiple %%EOF markers (indicates incremental post-generation updates)
  const eofMatches = str.match(/%%EOF/g);
  const eofCount = eofMatches ? eofMatches.length : 0;
  if (eofCount > 1) {
    return {
      isTampered: true,
      confidence: 0.85,
      reason: `Document contains ${eofCount} incremental update sections (multiple %%EOF markers), indicating post-issuance file alteration.`,
      details: { eofCount, type: "incremental_update" },
    };
  }

  // 2. Whiteout mask patching (drawing opaque white rectangles to mask original text)
  const whiteoutRegex =
    /(?:1(?:\.0*)?\s+1(?:\.0*)?\s+1(?:\.0*)?\s+r[gG][\s\S]*?)?([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+re\s+f/g;
  let wMatch: RegExpExecArray | null;
  while ((wMatch = whiteoutRegex.exec(str)) !== null) {
    const x = parseFloat(wMatch[1]);
    const y = parseFloat(wMatch[2]);
    const w = parseFloat(wMatch[3]);
    const h = parseFloat(wMatch[4]);
    // Ignore outer document borders / margins
    if (w < 500 && h < 700 && (w > 10 || h > 10)) {
      return {
        isTampered: true,
        confidence: 0.92,
        reason: `Digital text splicing detected: white fill mask rectangle at coordinates [x: ${x}, y: ${y}, w: ${w}, h: ${h}]`,
        boundingBox: { x, y, w, h },
        details: { type: "whiteout_mask_patch", bbox: { x, y, w, h } },
      };
    }
  }

  // 3. Overlaid annotations masking content
  const annotRegex =
    /\/Subtype\s*\/(FreeText|Square|Stamp|Redact)[\s\S]*?\/Rect\s*\[\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\]/;
  const aMatch = str.match(annotRegex);
  if (aMatch) {
    const x1 = parseFloat(aMatch[2]);
    const y1 = parseFloat(aMatch[3]);
    const x2 = parseFloat(aMatch[4]);
    const y2 = parseFloat(aMatch[5]);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    return {
      isTampered: true,
      confidence: 0.88,
      reason: `Overlaid annotation (${aMatch[1]}) detected masking original document layer at coordinates [x: ${x1}, y: ${y1}, w: ${width}, h: ${height}].`,
      boundingBox: { x: x1, y: y1, w: width, h: height },
      details: { type: "annotation_overlay", subtype: aMatch[1] },
    };
  }

  // 4. Duplicate object definitions in byte stream
  const objMatches = str.matchAll(/(\d+)\s+0\s+obj/g);
  const seenObjs = new Set<string>();
  for (const m of objMatches) {
    const objNum = m[1];
    if (seenObjs.has(objNum)) {
      return {
        isTampered: true,
        confidence: 0.9,
        reason: `Duplicate object identifier (Object ${objNum} 0 obj) detected in PDF structure, indicating byte stream injection.`,
        details: { duplicateObj: objNum, type: "duplicate_obj" },
      };
    }
    seenObjs.add(objNum);
  }

  return {
    isTampered: false,
    confidence: 0.95,
  };
}

/**
 * Decode Adobe ASCII85 encoded byte string
 */
function decodeAscii85(ascii85Str: string): Buffer {
  const clean = ascii85Str.replace(/\s/g, "");
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 5) {
    const chunk = clean.slice(i, i + 5);
    if (chunk === "z") {
      bytes.push(0, 0, 0, 0);
      i -= 4;
      continue;
    }
    const pad = 5 - chunk.length;
    let val = 0;
    for (let c of chunk) {
      val = val * 85 + (c.charCodeAt(0) - 33);
    }
    for (let p = 0; p < pad; p++) {
      val = val * 85 + 84;
    }
    bytes.push((val >> 24) & 255, (val >> 16) & 255, (val >> 8) & 255, val & 255);
    if (pad > 0) {
      bytes.splice(bytes.length - pad, pad);
    }
  }
  return Buffer.from(bytes);
}

/**
 * Robust extraction of text streams from PDF buffer
 */
export function extractPdfTextAndStreams(buffer: Buffer): { text: string; streams: string[] } {
  const str = buffer.toString("latin1");
  const streamRegex = /<<([\s\S]*?)>>\s*stream\r?\n([\s\S]*?)endstream/g;
  let match: RegExpExecArray | null;
  const streams: string[] = [];
  let fullText = "";

  while ((match = streamRegex.exec(str)) !== null) {
    const dict = match[1];
    let streamRaw = match[2];
    const isAscii85 = dict.includes("ASCII85Decode") || streamRaw.includes("~>");
    const isFlate = dict.includes("FlateDecode");

    let streamBytes: Buffer;
    if (isAscii85) {
      const tildeIdx = streamRaw.indexOf("~>");
      const asciiContent = tildeIdx !== -1 ? streamRaw.slice(0, tildeIdx) : streamRaw;
      streamBytes = decodeAscii85(asciiContent);
    } else {
      streamBytes = Buffer.from(streamRaw, "latin1");
    }

    if (isFlate) {
      try {
        streamBytes = zlib.inflateSync(streamBytes);
      } catch (e) {
        try {
          streamBytes = zlib.inflateRawSync(streamBytes);
        } catch (e2) {
          // Keep uncompressed bytes
        }
      }
    }

    const decodedStr = streamBytes.toString("utf8");
    streams.push(decodedStr);

    // Tj operators
    const tjMatches = decodedStr.matchAll(/\(((?:\\\(|\\\)|[^\)])*)\)\s*Tj/g);
    for (const m of tjMatches) {
      const clean = m[1]
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\267/g, "·")
        .replace(/\\226/g, "-")
        .replace(/\\227/g, "—")
        .replace(/\\r/g, " ")
        .replace(/\\n/g, " ");
      fullText += clean + "\n";
    }

    // TJ arrays
    const arrayMatches = decodedStr.matchAll(/\[([\s\S]*?)\]\s*TJ/g);
    for (const m of arrayMatches) {
      const innerTj = m[1].matchAll(/\(((?:\\\(|\\\)|[^\)])*)\)/g);
      let line = "";
      for (const item of innerTj) {
        line += item[1].replace(/\\\(/g, "(").replace(/\\\)/g, ")");
      }
      if (line) fullText += line + "\n";
    }
  }

  // Fallback: If no compressed streams matched, scan raw buffer for strings
  if (!fullText.trim()) {
    const rawMatches = str.matchAll(/\(((?:\\\(|\\\)|[^\)])*)\)\s*Tj/g);
    for (const m of rawMatches) {
      fullText += m[1].replace(/\\\(/g, "(").replace(/\\\)/g, ")") + "\n";
    }
  }

  return { text: fullText.trim(), streams };
}

/**
 * Deterministic Regex Field Extractor for Scrutiny Documents
 */
export function extractDocumentFields(
  text: string,
  _documentType?: string
): Record<string, ExtractedFieldItem> {
  const fields: Record<string, ExtractedFieldItem> = {};

  // 1. Certificate Number / Reference
  const certPatterns = [
    /(?:Certificate\s*No|Certificate\s*Reference|Ref\s*No|File\s*Ref|NOC\s*Ref|Registered\s*Land\s*Deed\s*No|Accreditation\s*File\s*No|Registration\s*No)[:\s]+([A-Z0-9/\-_]+)/i,
    /Serial\s*No:\s*([A-Z0-9/\-_]+)/i,
    /Application\s*Reference:\s*([A-Z0-9/\-_]+)/i,
    /Notary\s*Registration\s*No:\s*([A-Z0-9/\-_]+)/i,
    /Doc\s*Ref:\s*([A-Z0-9]+)/i,
  ];
  for (const p of certPatterns) {
    const m = text.match(p);
    if (m && m[1]) {
      fields.certificate_number = { raw: m[1].trim(), confidence: 0.96 };
      break;
    }
  }

  // 2. Issue Date
  const issueDatePatterns = [
    /Issued:\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i,
    /Date\s*of\s*Issue:\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i,
    /Date\s*of\s*Notarization:\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i,
    /Date\s*of\s*Registration:\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i,
    /Date\s*of\s*Inspection:\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i,
    /Date:\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i,
    /Affirmed\s+at[^\n]+this\s+([0-9]{1,2}(?:st|nd|rd|th)?\s+day\s+of\s+[A-Za-z]+\s+[0-9]{4})/i,
    /Valid\s*From:\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i,
    /Effective\s*From:\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i,
    /Meeting\s*Date:\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i,
    /Deed\s*No:[^·\n]+Taluka[^\n·]*(\d{4})/i,
  ];
  for (const p of issueDatePatterns) {
    const m = text.match(p);
    if (m && m[1]) {
      const raw = m[1].trim();
      const normalized = normalizeDateString(raw);
      fields.issue_date = { raw, normalized, confidence: 0.95 };
      break;
    }
  }

  // 3. Valid Until / Expiry Date
  const validUntilPatterns = [
    /Valid\s*Till:\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i,
    /Valid\s*Through:\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i,
    /to\s+([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i,
    /Valid\s*through\s+([A-Za-z]+\s+[0-9]{4})/i,
    /Validity:\s*([0-9]{4}-[0-9]{4}\s*Academic\s*Year|[0-9]{4}-[0-9]{4})/i,
    /Lease\s*Period:\s*(\d+\s*Years)/i,
  ];
  for (const p of validUntilPatterns) {
    const m = text.match(p);
    if (m && m[1]) {
      const raw = m[1].trim();
      const normalized = normalizeDateString(raw);
      fields.valid_until = { raw, normalized, confidence: 0.95 };
      // Also register valid_to for rules evaluator compatibility
      fields.valid_to = { raw, normalized, confidence: 0.95 };
      break;
    }
  }

  // 4. Institution Name
  const instPatterns = [
    /(?:Accredited\s*Institution|Lessee\s*\/\s*Institution|Institution|Beneficiary|Name\s*of\s*Occupancy|Designated\s*Campus\s*Area):\s*([^\n,·]+)/i,
    /This\s*is\s*to\s*certify\s*that\s*([^\n,·]+)/i,
    /Authorized\s*Signatory\s*of\s*([^\n,·]+)/i,
  ];
  for (const p of instPatterns) {
    const m = text.match(p);
    if (m && m[1]) {
      fields.institution_name = { raw: m[1].trim(), confidence: 0.98 };
      break;
    }
  }

  // 5. Issuing Authority
  const authPatterns = [
    /(?:Issuing\s*Authority|Signatory|Lessor):\s*([^\n·]+)/i,
    /(NATIONAL\s*BOARD\s*OF\s*ACCREDITATION[^\n·]*)/i,
    /(BEFORE\s*THE\s*NOTARY\s*PUBLIC[^\n·]*)/i,
    /(FIRE\s*PREVENTION\s*&\s*LIFE\s*SAFETY\s*SERVICES[^\n·]*)/i,
    /(DEPARTMENT\s*OF\s*REVENUE\s*&\s*LAND\s*REGISTRATION[^\n·]*)/i,
    /(REGISTRAR'S\s*OFFICE[^\n·]*)/i,
    /(Navi\s*Mumbai\s*Municipal\s*Corporation[^\n·]*)/i,
    /(University\s*of\s*Mumbai[^\n·]*)/i,
    /(Sub-Registrar\s*of\s*Assurances[^\n·]*)/i,
    /(Chief\s*Fire\s*Officer[^\n·]*)/i,
    /(Member\s*Secretary[^\n·]*)/i,
  ];
  for (const p of authPatterns) {
    const m = text.match(p);
    if (m && m[1]) {
      fields.issuing_authority = { raw: m[1].trim(), confidence: 0.95 };
      break;
    }
  }

  return fields;
}
