import os
import re
import tempfile
from datetime import datetime
from collections import Counter
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Security, Depends
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
import fitz  # PyMuPDF
import cv2
import numpy as np
from PIL import Image

try:
    import pytesseract
except ImportError:
    pytesseract = None

app = FastAPI(
    title="ScrutiniX Forensic & OCR Engine",
    description="Dedicated serverless microservice for Computer Vision ELA & Native Tesseract OCR",
    version="1.0.0"
)

# Security: Enforce API Key header if ENGINE_API_KEY environment variable is configured
API_KEY_HEADER = APIKeyHeader(name="x-api-key", auto_error=False)

def verify_api_key(api_key: Optional[str] = Security(API_KEY_HEADER)):
    expected_key = os.getenv("ENGINE_API_KEY")
    if expected_key:
        if not api_key or api_key != expected_key:
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid or missing x-api-key header")
    return api_key

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB maximum upload limit for DoS protection

async def read_bounded_file(file: UploadFile) -> bytes:
    content = await file.read(MAX_FILE_SIZE + 1024)
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Payload Too Large: File exceeds 25MB limit")
    return content

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONTH_MAP = {
    "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
    "apr": 4, "april": 4, "may": 5, "june": 6, "jun": 6, "july": 7, "jul": 7,
    "aug": 8, "august": 8, "sep": 9, "september": 9, "oct": 10, "october": 10,
    "nov": 11, "november": 11, "dec": 12, "december": 12
}

def parse_pdf_date(date_str: Optional[str]) -> Optional[str]:
    if not date_str:
        return None
    cleaned = re.sub(r"^D:", "", str(date_str)).replace("'", "")
    m = re.match(r"^(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?([+\-Z])?(\d{2})?(\d{2})?", cleaned)
    if not m:
        return None
    yr, mo, da, hr, mn, sc, tz, tz_hr, tz_mn = m.groups()
    iso = f"{yr or '1970'}-{mo or '01'}-{da or '01'}T{hr or '00'}:{mn or '00'}:{sc or '00'}"
    if tz and tz != "Z" and tz_hr:
        iso += f"{tz}{tz_hr}:{tz_mn or '00'}"
    else:
        iso += "Z"
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.isoformat()
    except Exception:
        return iso

def extract_stated_date(text: str) -> Optional[str]:
    if not text:
        return None
    explicit_patterns = [
        r"(?:Date of Notarization|Notarized on|Executed on|Issued on|Date of Issue|Issued|Affirmed(?: at [^,\n]+)? this)\s*[:\s]*(\d{1,2})(?:st|nd|rd|th)?\s+(?:day\s+of\s+)?([A-Za-z]+)[,\s]+(\d{4})",
        r"(?:Date|Dated)\s*[:\s]*(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)[,\s]+(\d{4})",
        r"this\s+(\d{1,2})(?:st|nd|rd|th)?\s+day\s+of\s+([A-Za-z]+)[,\s]+(\d{4})",
        r"(?:Date|Issued|Executed)\s*[:\s]*(\d{4})-(\d{2})-(\d{2})"
    ]
    for pat in explicit_patterns:
        m = re.search(pat, text, re.I)
        if m:
            if len(m.groups()) == 3:
                d = int(m.group(1))
                mo = MONTH_MAP.get(m.group(2).lower(), 1)
                y = int(m.group(3))
                return f"{y:04d}-{mo:02d}-{d:02d}T00:00:00Z"
            elif len(m.groups()) == 1:
                return f"{m.group(1)}T00:00:00Z"
    return None

def run_ela_on_image(cv_img: np.ndarray) -> Dict[str, Any]:
    """Perform Error Level Analysis (ELA) using OpenCV."""
    h_img, w_img = cv_img.shape[:2]
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 90]
    _, encimg = cv2.imencode(".jpg", cv_img, encode_param)
    resaved = cv2.imdecode(encimg, cv2.IMREAD_COLOR)

    diff = cv2.absdiff(cv_img, resaved)
    gray_diff = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
    max_error = float(np.max(gray_diff))
    mean_error = float(np.mean(gray_diff))
    std_error = float(np.std(gray_diff))
    variance_score = float(round(float(std_error / (mean_error + 1e-5)), 3))

    thresh_val = max(16, int(mean_error + 3 * std_error))
    _, thresh = cv2.threshold(gray_diff, thresh_val, 255, cv2.THRESH_BINARY)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
    dilated = cv2.dilate(thresh, kernel, iterations=2)
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    ela_contours = []
    for cnt in contours:
        cx, cy, cw, ch = cv2.boundingRect(cnt)
        if cw > 8 and ch > 8:
            ela_contours.append({
                "x": round((cx / w_img) * 100, 2),
                "y": round((cy / h_img) * 100, 2),
                "w": round(((cw) / w_img) * 100, 2),
                "h": round(((ch) / h_img) * 100, 2),
                "area": int(cw * ch)
            })

    is_tampered = variance_score > 3.0 or len(ela_contours) > 10
    confidence = min(0.98, max(0.60, round(variance_score / 4.0, 2))) if is_tampered else 0.95

    return {
        "maxError": max_error,
        "meanError": mean_error,
        "stdError": std_error,
        "varianceScore": variance_score,
        "contourCount": len(ela_contours),
        "contours": ela_contours[:10],
        "isTampered": is_tampered,
        "confidence": confidence,
    }

def run_tesseract_ocr(pil_img: Image.Image) -> Dict[str, Any]:
    """Extract real OCR tokens and text via native Tesseract."""
    try:
        w_img, h_img = pil_img.size
        data = pytesseract.image_to_data(pil_img, output_type=pytesseract.Output.DICT)
        tokens = []
        n_boxes = len(data['text'])
        full_text_list = []

        for i in range(n_boxes):
            word = data['text'][i].strip()
            if not word:
                continue
            full_text_list.append(word)
            x, y, w, h = data['left'][i], data['top'][i], data['width'][i], data['height'][i]
            conf = float(data['conf'][i]) / 100.0 if data['conf'][i] != -1 else 0.85
            tokens.append({
                "text": word,
                "confidence": round(conf, 2),
                "bbox": {
                    "x": round((x / w_img) * 100, 2),
                    "y": round((y / h_img) * 100, 2),
                    "w": round((w / w_img) * 100, 2),
                    "h": round((h / h_img) * 100, 2)
                }
            })

        return {
            "text": " ".join(full_text_list),
            "tokens": tokens,
            "tokenCount": len(tokens)
        }
    except Exception as e:
        return {"text": "", "tokens": [], "tokenCount": 0, "error": str(e)}

@app.get("/health")
def health_check():
    tess_ver = "unknown"
    try:
        tess_ver = pytesseract.get_tesseract_version().splitlines()[0]
    except Exception:
        pass

    return {
        "status": "healthy",
        "service": "ScrutiniX Forensic & Native OCR Engine",
        "versions": {
            "tesseract": str(tess_ver),
            "opencv": str(cv2.__version__),
            "pymupdf": str(fitz.__version__)
        }
    }

@app.post("/analyze", dependencies=[Depends(verify_api_key)])
async def analyze_document(
    file: UploadFile = File(...),
    statedDate: Optional[str] = Form(None)
):
    """
    Main forensic entry point:
    Accepts PDF, image, or text file.
    Executes PyMuPDF inspection, OpenCV Error Level Analysis (ELA),
    and Native Tesseract OCR.
    """
    contents = await read_bounded_file(file)
    filename = file.filename or "uploaded_file"
    file_ext = os.path.splitext(filename)[1].lower()

    # Case 1: Plaintext file (.txt, .md, .csv)
    if file_ext in [".txt", ".md", ".csv"] or (not file_ext and len(contents) < 500000):
        try:
            raw_text = contents.decode("utf-8")
            words = raw_text.split()
            tokens = [
                {"text": w, "bbox": {"x": 0, "y": 0, "w": 0, "h": 0}}
                for w in words[:1500]
            ]
            return {
                "metadata": {"pageCount": 1, "hasDateDiscrepancy": False, "diffHours": 0},
                "tampering": {"isTampered": False, "confidence": 0.95, "reason": "Plaintext document format.", "boundingBox": None},
                "fontInconsistencies": [],
                "ocrTokens": tokens,
                "extractedText": raw_text
            }
        except Exception:
            pass

    # Save to temp file for fitz / cv2
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    doc = None
    try:
        # Case 2: PDF Document
        if file_ext == ".pdf" or contents[:4] == b"%PDF":
            doc = fitz.open(tmp_path)
            page_count = len(doc)
            page = doc[0]
            page_rect = page.rect
            pw, ph = float(page_rect.width), float(page_rect.height)

            # 1. Metadata
            raw_meta = doc.metadata or {}
            cdate_iso = parse_pdf_date(raw_meta.get("creationDate"))
            mdate_iso = parse_pdf_date(raw_meta.get("modDate"))
            doc_stated_date = statedDate or extract_stated_date(page.get_text())

            has_date_discrepancy = False
            diff_hours = 0.0
            discrepancy_reason = None

            if cdate_iso and doc_stated_date:
                try:
                    cdt = datetime.fromisoformat(cdate_iso.replace("Z", "+00:00"))
                    s_clean = doc_stated_date if "T" in doc_stated_date else f"{doc_stated_date}T00:00:00Z"
                    sdt = datetime.fromisoformat(s_clean.replace("Z", "+00:00"))
                    diff_hours = round((cdt - sdt).total_seconds() / 3600.0, 1)
                    if diff_hours > 48:
                        has_date_discrepancy = True
                        discrepancy_reason = f"PDF metadata creation date ({cdate_iso[:10]}) is {diff_hours}h later than stated date ({doc_stated_date[:10]})."
                except Exception:
                    pass

            # 2. Render Page Pixmap for OpenCV ELA
            pix = page.get_pixmap(dpi=150)
            img_data = pix.tobytes("png")
            cv_img = cv2.imdecode(np.frombuffer(img_data, np.uint8), cv2.IMREAD_COLOR)
            ela_result = run_ela_on_image(cv_img)

            # 3. Word Tokens & OCR
            words = page.get_text("words")
            ocr_tokens = []
            extracted_text = page.get_text()

            # If embedded text layer exists
            if words and len(words) >= 5:
                for w in words:
                    wx0, wy0, wx1, wy1, wtext = w[0], w[1], w[2], w[3], w[4]
                    ocr_tokens.append({
                        "text": wtext,
                        "bbox": {
                            "x": round((wx0 / pw) * 100, 2),
                            "y": round((wy0 / ph) * 100, 2),
                            "w": round(((wx1 - wx0) / pw) * 100, 2),
                            "h": round(((wy1 - wy0) / ph) * 100, 2)
                        }
                    })
            else:
                # SCANNED PHOTOCOPY: Run Native Tesseract OCR on rendered pixmap
                pil_img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                tess_res = run_tesseract_ocr(pil_img)
                ocr_tokens = tess_res["tokens"]
                extracted_text = tess_res["text"]

            # 4. Check Tampering
            is_tampered = ela_result["isTampered"]
            confidence = ela_result["confidence"]
            reason = (
                f"Localized digital alteration detected via ELA (variance {ela_result['varianceScore']})."
                if is_tampered
                else "Document stream structure and compression variance are within normal statutory parameters."
            )
            bounding_box = ela_result["contours"][0] if ela_result["contours"] else None

            return {
                "metadata": {
                    "title": raw_meta.get("title"),
                    "author": raw_meta.get("author"),
                    "creator": raw_meta.get("creator"),
                    "producer": raw_meta.get("producer"),
                    "creationDate": cdate_iso,
                    "modDate": mdate_iso,
                    "statedDate": doc_stated_date,
                    "hasDateDiscrepancy": has_date_discrepancy,
                    "diffHours": diff_hours,
                    "discrepancyReason": discrepancy_reason,
                    "pageCount": page_count
                },
                "tampering": {
                    "isTampered": is_tampered,
                    "confidence": confidence,
                    "reason": reason,
                    "boundingBox": bounding_box,
                    "elaMetrics": {
                        "maxError": ela_result["maxError"],
                        "meanError": ela_result["meanError"],
                        "stdError": ela_result["stdError"],
                        "varianceScore": ela_result["varianceScore"],
                        "contourCount": ela_result["contourCount"]
                    }
                },
                "fontInconsistencies": [],
                "ocrTokens": ocr_tokens,
                "extractedText": extracted_text
            }

        # Case 3: Raster Image (.png, .jpg, .jpeg)
        else:
            cv_img = cv2.imdecode(np.frombuffer(contents, np.uint8), cv2.IMREAD_COLOR)
            if cv_img is None:
                raise HTTPException(status_code=400, detail="Could not decode image file")

            ela_result = run_ela_on_image(cv_img)
            pil_img = Image.open(tmp_path)
            tess_res = run_tesseract_ocr(pil_img)

            return {
                "metadata": {"pageCount": 1, "hasDateDiscrepancy": False, "diffHours": 0},
                "tampering": {
                    "isTampered": ela_result["isTampered"],
                    "confidence": ela_result["confidence"],
                    "reason": "Image Error Level Analysis complete.",
                    "boundingBox": ela_result["contours"][0] if ela_result["contours"] else None,
                    "elaMetrics": ela_result
                },
                "fontInconsistencies": [],
                "ocrTokens": tess_res["tokens"],
                "extractedText": tess_res["text"]
            }

    finally:
        if doc is not None:
            try:
                doc.close()
            except Exception:
                pass
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass

@app.post("/ocr", dependencies=[Depends(verify_api_key)])
async def extract_ocr_only(file: UploadFile = File(...)):
    """Dedicated Tesseract OCR endpoint for any raw image or PDF page."""
    contents = await read_bounded_file(file)
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    doc = None
    try:
        pil_img = Image.open(tmp_path)
        return run_tesseract_ocr(pil_img)
    except Exception:
        # Fallback if PDF
        doc = fitz.open(tmp_path)
        pix = doc[0].get_pixmap(dpi=150)
        pil_img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        return run_tesseract_ocr(pil_img)
    finally:
        if doc is not None:
            try:
                doc.close()
            except Exception:
                pass
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass
