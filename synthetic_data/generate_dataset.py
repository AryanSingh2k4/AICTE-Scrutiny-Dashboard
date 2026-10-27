import os
import json
import csv
import hashlib
import random
from datetime import datetime, timedelta
from faker import Faker
import qrcode
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors

fake = Faker('en_IN')
Faker.seed(42)
random.seed(42)

OUT_DIR = os.path.join(os.path.dirname(__file__), "output_docs")
os.makedirs(OUT_DIR, exist_ok=True)

# 40 institutions list
STATES_CITIES = [
    ("Maharashtra", "Pune"), ("Maharashtra", "Mumbai"), ("Maharashtra", "Nagpur"), ("Maharashtra", "Nashik"),
    ("Karnataka", "Bengaluru"), ("Karnataka", "Mysuru"), ("Karnataka", "Hubballi"),
    ("Tamil Nadu", "Chennai"), ("Tamil Nadu", "Coimbatore"), ("Tamil Nadu", "Madurai"),
    ("Telangana", "Hyderabad"), ("Telangana", "Warangal"),
    ("Uttar Pradesh", "Noida"), ("Uttar Pradesh", "Kanpur"), ("Uttar Pradesh", "Lucknow"),
    ("Gujarat", "Ahmedabad"), ("Gujarat", "Surat"), ("Gujarat", "Vadodara"),
    ("Delhi", "New Delhi"), ("West Bengal", "Kolkata"), ("Kerala", "Kochi"), ("Rajasthan", "Jaipur")
]

INSTITUTE_PREFIXES = [
    "Sardar Patel", "Dr. A.P.J. Abdul Kalam", "Vishwakarma", "Bharati Vidyapeeth",
    "Mahatma Gandhi", "Indira Gandhi", "Shivaji", "Swami Vivekananda", "Rajiv Gandhi",
    "Netaji Subhas", "Birla", "Thakur", "Rajarambapu", "Pimpri Chinchwad", "K.J. Somaiya",
    "Symbiosis", "Sinhgad", "D.Y. Patil", "MIT World", "Vellore"
]

INSTITUTE_TYPES = [
    "Institute of Technology & Science",
    "College of Engineering & Technology",
    "Institute of Technology",
    "Engineering College"
]

PROGRAMMES = [
    "Computer Engineering",
    "Mechanical Engineering",
    "Electronics & Telecommunication",
    "Information Technology",
    "Artificial Intelligence & Data Science",
    "Civil Engineering",
    "Electrical Engineering"
]

def generate_pdf(filepath, title, lines, qr_data=None):
    c = canvas.Canvas(filepath, pagesize=A4)
    width, height = A4

    # Border & Header
    c.setStrokeColor(colors.HexColor("#143d32"))
    c.setLineWidth(2)
    c.rect(30, 30, width - 60, height - 60)

    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(colors.HexColor("#143d32"))
    c.drawCentredString(width / 2.0, height - 70, "ALL INDIA COUNCIL FOR TECHNICAL EDUCATION")

    c.setFont("Helvetica", 10)
    c.setFillColor(colors.HexColor("#555555"))
    c.drawCentredString(width / 2.0, height - 88, "Approval Process Scrutiny Supporting Evidence · AY 2026–27")

    c.setStrokeColor(colors.HexColor("#dcd5c5"))
    c.setLineWidth(1)
    c.line(45, height - 100, width - 45, height - 100)

    # Document Title
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(colors.HexColor("#222222"))
    c.drawString(50, height - 130, title)

    # Document Content lines
    c.setFont("Helvetica", 9.5)
    c.setFillColor(colors.HexColor("#333333"))
    y = height - 160
    for line in lines:
        if line.startswith("HEADER:"):
            c.setFont("Helvetica-Bold", 11)
            c.setFillColor(colors.HexColor("#143d32"))
            y -= 8
            c.drawString(50, y, line.replace("HEADER:", "").strip())
            c.setFont("Helvetica", 9.5)
            c.setFillColor(colors.HexColor("#333333"))
        else:
            c.drawString(50, y, line)
        y -= 18

    # Optional QR Code
    if qr_data:
        qr = qrcode.QRCode(box_size=3, border=1)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        qr_temp_path = filepath + ".qr.png"
        img.save(qr_temp_path)
        c.drawImage(qr_temp_path, width - 150, 50, width=90, height=90)
        try:
            os.remove(qr_temp_path)
        except:
            pass
        c.setFont("Helvetica-Oblique", 7.5)
        c.setFillColor(colors.HexColor("#666666"))
        c.drawString(width - 155, 42, "Digital Verification QR")

    # Footer
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.HexColor("#888888"))
    c.drawString(50, 45, f"Doc Ref: {hashlib.sha256(filepath.encode()).hexdigest()[:16].upper()} · ScrutiniX Verified")

    c.save()

    with open(filepath, "rb") as f:
        file_bytes = f.read()
        sha256 = hashlib.sha256(file_bytes).hexdigest()
        size = len(file_bytes)
    return sha256, size

def build_dataset():
    institutions = []
    aicte_records = []
    applications = []
    documents = []
    extracted_fields = []
    ground_truth = []
    validation_results = []
    anomaly_flags = []
    verification_results = []
    alerts = []
    mock_issuers = []

    # Generate 40 institutions
    for i in range(1, 41):
        inst_id = f"1-{random.randint(3000000000, 3999999999)}"
        state, city = STATES_CITIES[(i - 1) % len(STATES_CITIES)]
        prefix = INSTITUTE_PREFIXES[(i - 1) % len(INSTITUTE_PREFIXES)]
        itype = INSTITUTE_TYPES[(i - 1) % len(INSTITUTE_TYPES)]
        inst_name = f"{prefix} {itype}"

        app_id = f"APP-2026-{8940 + i}"
        est_year = random.randint(1984, 2018)
        trust_name = f"{prefix} Education & Research Society"
        principal = fake.name()
        email = f"principal@{prefix.lower().replace(' ', '').replace('.', '')}.edu.in"
        phone = f"+91 {random.randint(9100000000, 9899999999)}"

        # AICTE master record
        intake = random.choice([240, 300, 360, 420, 480])
        faculty = int(intake / random.choice([15, 17, 19]))
        progs = random.sample(PROGRAMMES, k=random.randint(3, 5))

        # Ground truth defect injection schedule:
        defect_code = "CLEAN"
        defect_cat = "None"
        defect_doc = "None"
        defect_reason = "Fully compliant application with valid documents and verified QR"
        sys_status = "ready_for_review"
        ter_status = "paid"
        def_status = "Nil"

        if i == 2:
            defect_code = "EOA-EXP-02"
            defect_cat = "Validity"
            defect_doc = "accreditation_nba"
            defect_reason = "Accreditation expired on 30 June 2025 prior to commencement of AY 2026-27"
            sys_status = "findings_available"
        elif i == 3:
            defect_code = "EOA-XDOC-01"
            defect_cat = "Consistency"
            defect_doc = "fire_safety"
            defect_reason = "Institution name on Fire NOC lists polytechnic subsidiary rather than degree institute"
            sys_status = "findings_available"
        elif i == 4:
            defect_code = "EOA-AIC-01"
            defect_cat = "Records"
            defect_doc = "affidavit"
            defect_reason = "Affidavit lists older society name diverging from central AICTE portal master record"
            sys_status = "findings_available"
        elif i == 5:
            defect_code = "EOA-TER-01"
            defect_cat = "Compliance"
            defect_doc = "application"
            defect_reason = "TER scrutiny fee payment status pending in central treasury"
            ter_status = "pending"
            sys_status = "findings_available"
        elif i == 6:
            defect_code = "EOA-DEF-01"
            defect_cat = "Compliance"
            defect_doc = "application"
            defect_reason = "Previous committee inspection flagged unresolved library computing deficiency"
            def_status = "Pending"
            sys_status = "findings_available"
        elif i == 7:
            defect_code = "EOA-DUP-01"
            defect_cat = "Integrity"
            defect_doc = "land_ownership"
            defect_reason = "Exact duplicate land deed file hash submitted across distinct institutions"
            sys_status = "findings_available"
        elif i == 8:
            defect_code = "EOA-META-01"
            defect_cat = "Integrity"
            defect_doc = "affidavit"
            defect_reason = "PDF metadata creation date (October 2026) postdates stated legal stamp date (May 2024)"
            sys_status = "findings_available"
        elif i == 9:
            defect_code = "EOA-ALT-01"
            defect_cat = "Integrity"
            defect_doc = "accreditation_nba"
            defect_reason = "Possible digital alteration detected on accreditation tier score via ELA (confidence 0.84)"
            sys_status = "findings_available"
        elif i == 10:
            defect_code = "EOA-DOC-04"
            defect_cat = "Completeness"
            defect_doc = "fire_safety"
            defect_reason = "Mandatory municipal fire safety NOC omitted from application dossier"
            sys_status = "findings_available"
        elif i == 11:
            defect_code = "ISSUER-TIMEOUT"
            defect_cat = "Verification"
            defect_doc = "noc_university"
            defect_reason = "State Technical University verification portal timed out (503); routed to manual review"
            sys_status = "findings_available"

        institutions.append({
            "id": inst_id,
            "name": inst_name,
            "address": f"Campus Sector {random.randint(1, 24)}, Ring Road",
            "city": city,
            "state": state,
            "established_year": est_year,
            "trust_society": trust_name,
            "principal_name": principal,
            "email": email,
            "phone": phone
        })

        aicte_records.append({
            "institution_id": inst_id,
            "approved_programmes": progs,
            "total_approved_intake": intake,
            "faculty_count": faculty,
            "deficiency_status": def_status,
            "ter_payment_status": ter_status,
            "last_eoa_year": "2025-26",
            "last_scrutiny_status": "Approved"
        })

        applications.append({
            "id": app_id,
            "institution_id": inst_id,
            "academic_year": "2026-27",
            "application_category": "EoA Renewal",
            "system_status": sys_status,
            "overall_risk_score": 0.82 if defect_code != "CLEAN" else 0.08,
            "flags_count": 0 if defect_code == "CLEAN" else 1,
            "submitted_at": (datetime.now() - timedelta(days=random.randint(1, 14))).isoformat()
        })

        ground_truth.append({
            "application_id": app_id,
            "institution_id": inst_id,
            "institution_name": inst_name,
            "defect_code": defect_code,
            "defect_category": defect_cat,
            "affected_document": defect_doc,
            "expected_status": "FAIL" if "EXP" in defect_code or "DOC" in defect_code or "TER" in defect_code else ("REVIEW" if defect_code != "CLEAN" else "PASS"),
            "ground_truth_reason": defect_reason
        })

        # Documents generation
        doc_types = ["affidavit", "noc_university", "accreditation_nba", "fire_safety", "land_ownership"]
        if i == 10:
            # Omit fire safety certificate for App 10 to test missing doc rule
            doc_types.remove("fire_safety")

        for dtype in doc_types:
            doc_id = f"DOC-{app_id}-{dtype[:3].upper()}"
            filename = f"{app_id}_{dtype}.pdf"
            filepath = os.path.join(OUT_DIR, filename)

            # Document specific metadata and text
            meta = {
                "creation_date": "2026-04-12T10:00:00Z",
                "stated_issue_date": "2026-04-12T09:00:00Z",
                "producer": "ReportLab PDF Engine"
            }
            qr_payload = None

            if dtype == "affidavit":
                title = "AFFIDAVIT OF STATUTORY UNDERTAKING (FORMAT-1)"
                doc_inst_name = inst_name if i != 4 else f"{inst_name} Trust Old Wing"
                lines = [
                    f"HEADER: BEFORE THE NOTARY PUBLIC · {city.upper()}, {state.upper()}",
                    f"I, Dr. {principal}, Principal / Authorized Signatory of {doc_inst_name},",
                    f"acting on behalf of {trust_name}, do hereby solemnly affirm and state on oath:",
                    "1. That all physical, infrastructural, and academic facilities conform to AICTE norms.",
                    "2. That no ragging or unapproved commercial activity is conducted on campus premises.",
                    "3. That faculty remuneration is disbursed in accordance with 7th Central Pay Commission scales.",
                    f"Affirmed at {city} this 12th day of April 2026. Deponent: Dr. {principal}"
                ]
                if i == 8:
                    meta["creation_date"] = "2026-10-24T14:30:00Z"
                    meta["stated_issue_date"] = "2024-05-10T10:00:00Z"

            elif dtype == "noc_university":
                title = "NO OBJECTION CERTIFICATE / EXTENSION OF AFFILIATION"
                qr_payload = f"https://stateuniv.edu.in/verify?doc=NOC/{state[:3].upper()}/2026/{random.randint(1000, 9999)}&inst={inst_id}"
                lines = [
                    f"HEADER: REGISTRAR'S OFFICE · STATE TECHNICAL UNIVERSITY, {state.upper()}",
                    f"Ref No: STU/AFFIL/2026/{random.randint(1000, 9999)} · Date: 18 March 2026",
                    f"Subject: Grant of No Objection / Continuous Affiliation for Academic Year 2026-27",
                    f"This is to certify that {inst_name}, situated at {city}, {state},",
                    f"is granted formal continuous affiliation for the undergraduate engineering programmes.",
                    f"Approved Affiliation Intake: {intake} Seats · Validity: 2026-2027 Academic Year.",
                    f"Signed: Registrar, State Technical University"
                ]

            elif dtype == "accreditation_nba":
                title = "NATIONAL BOARD OF ACCREDITATION (NBA) CERTIFICATE"
                valid_year = 2025 if i == 2 else 2028
                lines = [
                    "HEADER: NATIONAL BOARD OF ACCREDITATION · NEW DELHI",
                    f"File Ref: NBA/EVAL/TIER-I/2022/{random.randint(400, 999)}",
                    f"This is to certify that {inst_name}, {city}, has been accredited:",
                    f"Tier-I Accreditation for UG Engineering Programmes (Cycle-II)",
                    f"Valid From: 01 July 2022 to 30 June {valid_year}",
                    f"Accreditation Status: ACCREDITED · Score: {'382 / 400' if i != 9 else '398 / 400 [ALTERED]'}",
                    "Member Secretary, National Board of Accreditation"
                ]

            elif dtype == "fire_safety":
                title = "COMPETENT AUTHORITY FIRE SAFETY CERTIFICATE"
                fire_name = inst_name if i != 3 else f"{prefix} Polytechnic Institute"
                lines = [
                    f"HEADER: FIRE PREVENTION & LIFE SAFETY SERVICES · {city.upper()} REGION",
                    f"NOC Ref: FIR/REV/2026/{random.randint(2000, 8999)} · Issued: 15 January 2026",
                    f"Certificate of Fire Safety compliance issued in favor of:",
                    f"Name of Occupancy: {fire_name}",
                    f"Premises Address: Sector {random.randint(1, 24)}, Ring Road, {city}",
                    "Category of Occupancy: Educational / Institutional Building (Height: 14.8m)",
                    "Valid Through: 31 December 2027 · Chief Fire Officer"
                ]

            elif dtype == "land_ownership":
                title = "REGISTERED LAND TITLE / SUB-REGISTRAR LEASE DEED"
                lines = [
                    f"HEADER: DEPARTMENT OF REVENUE & LAND REGISTRATION · TALUKA {city.upper()}",
                    f"Registered Land Deed No: LND/{city[:3].upper()}/{est_year}/{random.randint(100, 999)}",
                    f"Title Holder: {trust_name}",
                    f"Designated Campus Area: {inst_name}",
                    f"Survey Nos: {random.randint(10, 80)}/1, {random.randint(10, 80)}/2 · Total Area: 7.25 Contiguous Acres",
                    "Classification: Educational Land Title (Non-Agricultural Order Cleared)",
                    "Sub-Registrar of Assurances · Registration Confirmed"
                ]

            sha256, fsize = generate_pdf(filepath, title, lines, qr_data=qr_payload)

            # For duplicate test (App 7 duplicates App 1's land deed)
            if i == 7 and dtype == "land_ownership":
                # Reuse sha256 from App 1
                app1_land = next(d for d in documents if d["application_id"] == "APP-2026-8941" and d["document_type"] == "land_ownership")
                sha256 = app1_land["sha256_hash"]

            documents.append({
                "id": doc_id,
                "application_id": app_id,
                "document_type": dtype,
                "file_name": filename,
                "file_size": fsize,
                "storage_path": f"documents/{app_id}/{filename}",
                "sha256_hash": sha256,
                "phash": hashlib.md5(sha256.encode()).hexdigest(),
                "qr_payload": qr_payload,
                "is_scanned": dtype == "fire_safety",
                "page_count": 1,
                "metadata": meta
            })

            # Extracted fields
            extracted_fields.append({
                "document_id": doc_id,
                "field_name": "institution_name",
                "raw_value": doc_inst_name if dtype == "affidavit" else (fire_name if dtype == "fire_safety" else inst_name),
                "confidence": 0.98,
                "page_number": 1,
                "source": "unpdf_text_layer"
            })

            if dtype in ["accreditation_nba", "fire_safety"]:
                valid_to = f"202{5 if (i == 2 and dtype == 'accreditation_nba') else 8}-06-30"
                extracted_fields.append({
                    "document_id": doc_id,
                    "field_name": "valid_to",
                    "raw_value": valid_to,
                    "confidence": 0.96,
                    "page_number": 1,
                    "source": "regex_date_parser"
                })

            # Verification results
            if qr_payload:
                v_status = "source_unavailable" if i == 11 else "verified"
                verification_results.append({
                    "document_id": doc_id,
                    "issuer_name": f"State Technical University, {state}",
                    "method": "qr_payload",
                    "status": v_status,
                    "request_payload": {"qr_url": qr_payload},
                    "response_payload": {"match": v_status == "verified", "issued_to": inst_name, "intake": intake}
                })

            # Anomaly flag for App 9 ELA
            if i == 9 and dtype == "accreditation_nba":
                anomaly_flags.append({
                    "application_id": app_id,
                    "document_id": doc_id,
                    "anomaly_type": "image_tamper_ela",
                    "severity": "high",
                    "confidence": 0.84,
                    "reason": "Possible digital alteration detected on accreditation score via Error Level Analysis",
                    "evidence": {"variance_score": 0.84, "baseline": 0.35, "bbox": {"x": 380, "y": 240, "width": 80, "height": 30}},
                    "page_number": 1
                })

    # Write Ground Truth CSV
    csv_path = os.path.join(os.path.dirname(__file__), "ground_truth.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "application_id", "institution_id", "institution_name",
            "defect_code", "defect_category", "affected_document", "expected_status", "ground_truth_reason"
        ])
        writer.writeheader()
        writer.writerows(ground_truth)

    print(f"Generated {len(institutions)} institutions, {len(applications)} applications, {len(documents)} documents.")
    print(f"Ground truth written to {csv_path}")

    # Write JSON bundle for Supabase seed
    bundle_path = os.path.join(os.path.dirname(__file__), "seed_data.json")
    with open(bundle_path, "w", encoding="utf-8") as f:
        json.dump({
            "institutions": institutions,
            "aicte_records": aicte_records,
            "applications": applications,
            "documents": documents,
            "extracted_fields": extracted_fields,
            "verification_results": verification_results,
            "anomaly_flags": anomaly_flags
        }, f, indent=2)
    print(f"Seed data saved to {bundle_path}")

if __name__ == "__main__":
    build_dataset()
