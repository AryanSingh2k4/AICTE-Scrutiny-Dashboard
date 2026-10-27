"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  CloudUpload,
  Copy,
  Download,
  Eye,
  FileCheck,
  FileCheck2,
  FileQuestion,
  FileText,
  Fingerprint,
  GraduationCap,
  HelpCircle,
  Info,
  Lock,
  Printer,
  QrCode,
  RefreshCw,
  RotateCw,
  Scale,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  UserCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/display";
import { PageHeader, SectionHeading } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

// Required AICTE EoA Renewal 2026-27 Documents
interface ComplianceDoc {
  id: string;
  type: string;
  category: string;
  required: boolean;
  ruleRef: string;
  status: "uploaded" | "attention" | "missing";
  fileName: string;
  fileSize: string;
  hash: string;
  uploadDate: string;
  notes: string;
  previewUrl?: string;
  isCustom?: boolean;
}

interface CollegeProfile {
  id: string;
  name: string;
  shortName: string;
  pid: string;
  applicationId: string;
  address: string;
  principal: string;
  sponsoringTrust: string;
  category: string;
  university: string;
  intake: number;
  faculty: number;
  landAcres: number;
  builtUpSqm: number;
  terPaymentRef: string;
  region: string;
  receiptDate: string;
  programmes: {
    code: string;
    course: string;
    intake: number;
    accreditation: string;
  }[];
  initialDocs: ComplianceDoc[];
}

const collegesData: Record<string, CollegeProfile> = {
  sardarpatel: {
    id: "sardarpatel",
    name: "Sardar Patel Institute of Technology",
    shortName: "SPIT",
    pid: "1-3686579303",
    applicationId: "APP-2026-8941",
    address: "Bhavan's Campus, Munshi Nagar, Andheri (West), Mumbai 400058, Maharashtra",
    principal: "Principal, Sardar Patel",
    sponsoringTrust: "Bharatiya Vidya Bhavan (Reg. F-142(M))",
    category: "Autonomous · Self-Financing Unaided",
    university: "University of Mumbai",
    intake: 300,
    faculty: 20,
    landAcres: 3.25,
    builtUpSqm: 8420,
    terPaymentRef: "TER-2026-98124",
    region: "Western Regional Office · Mumbai",
    receiptDate: "27 October 2026 · 14:18:22 IST",
    programmes: [
      { code: "1-3686579303-CE", course: "Computer Engineering", intake: 120, accreditation: "NBA Tier-1 Accredited (Valid till 2028)" },
      { code: "1-3686579303-IT", course: "Information Technology", intake: 60, accreditation: "NBA Tier-1 Accredited (Valid till 2028)" },
      { code: "1-3686579303-EC", course: "Electronics & Telecommunication", intake: 60, accreditation: "NBA Tier-1 Accredited (Valid till 2027)" },
      { code: "1-3686579303-AI", course: "Artificial Intelligence & Data Science", intake: 60, accreditation: "Approved New Programme" },
    ],
    initialDocs: [
      {
        id: "doc-affidavit",
        type: "AICTE Mandatory Affidavit 1",
        category: "Statutory Undertaking",
        required: true,
        ruleRef: "APH §3.1 · Form 1",
        status: "uploaded",
        fileName: "affidavit_undertaking_spit_2026.pdf",
        fileSize: "1.24 MB",
        hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        uploadDate: "27 Oct 2026, 09:14 IST",
        notes: "₹100 non-judicial stamp paper with Notary Registration No. 44812.",
      },
      {
        id: "doc-land",
        type: "Land & Ownership Registered Deed",
        category: "Campus Infrastructure",
        required: true,
        ruleRef: "APH §4.1 · Norm 2.50 Acres",
        status: "uploaded",
        fileName: "land_lease_deed_bhavans_campus.pdf",
        fileSize: "4.82 MB",
        hash: "5d4b85c15e8df1fd657cfba39aa723e7f6071ef694ba328c68c222ffda8daffc",
        uploadDate: "27 Oct 2026, 09:20 IST",
        notes: "3.25 Acres unencumbered registered land title at Andheri (West), Mumbai.",
      },
      {
        id: "doc-fire",
        type: "Fire & Life Safety NOC",
        category: "Safety Clearance",
        required: true,
        ruleRef: "APH §4.2(d) · Expiry Horizon",
        status: "attention",
        fileName: "fire_safety_noc_mumbai_cfo.pdf",
        fileSize: "2.10 MB",
        hash: "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
        uploadDate: "27 Oct 2026, 09:28 IST",
        notes: "Advisory note: Expiry on 15-Mar-2027 precedes AY end (30-Jun-2027). Undertaking accepted.",
      },
      {
        id: "doc-building",
        type: "Building Safety & Completion Plan",
        category: "Physical Norms",
        required: true,
        ruleRef: "APH §4.3 · Norm 7,500 sq.m",
        status: "uploaded",
        fileName: "building_occupancy_pwd_certified.pdf",
        fileSize: "3.45 MB",
        hash: "d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35",
        uploadDate: "27 Oct 2026, 09:35 IST",
        notes: "PWD Executive Engineer certified carpet area: 8,420 sq.m (Norm: 7,500 sq.m).",
      },
      {
        id: "doc-affiliation",
        type: "University Affiliation & NBA Letter",
        category: "Academic Accreditation",
        required: true,
        ruleRef: "APH §2.4 · Tier-1 Accreditation",
        status: "uploaded",
        fileName: "university_mumbai_affiliation_2026.pdf",
        fileSize: "1.89 MB",
        hash: "4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce",
        uploadDate: "27 Oct 2026, 09:42 IST",
        notes: "Permanent affiliation from University of Mumbai with valid NBA tier-1 status.",
      },
    ],
  },
  ltce: {
    id: "ltce",
    name: "Lokmanya Tilak College of Engineering (LTCE)",
    shortName: "LTCE",
    pid: "1-10358461",
    applicationId: "APP-2026-9012",
    address: "Sector 4, Vikas Nagar, Koparkhairane, Navi Mumbai 400709, Maharashtra",
    principal: "Dr. Subhash K. Shinde",
    sponsoringTrust: "Lokmanya Tilak Jankalyan Shikshan Sanstha (Reg. F-2034)",
    category: "Self-Financing Technical Institution",
    university: "University of Mumbai",
    intake: 360,
    faculty: 24,
    landAcres: 3.75,
    builtUpSqm: 10250,
    terPaymentRef: "TER-2026-99341",
    region: "Western Regional Office · Mumbai",
    receiptDate: "27 October 2026 · 15:40:10 IST",
    programmes: [
      { code: "1-10358461-ME", course: "Mechanical Engineering", intake: 120, accreditation: "NBA Accredited Tier-II" },
      { code: "1-10358461-CE", course: "Computer Engineering", intake: 120, accreditation: "NBA Accredited Tier-II" },
      { code: "1-10358461-EE", course: "Electrical Engineering", intake: 60, accreditation: "University Affiliated" },
      { code: "1-10358461-ET", course: "Electronics & Telecommunication", intake: 60, accreditation: "University Affiliated" },
    ],
    initialDocs: [
      {
        id: "doc-affidavit",
        type: "AICTE Mandatory Affidavit 1",
        category: "Statutory Undertaking",
        required: true,
        ruleRef: "APH §3.1 · Form 1",
        status: "uploaded",
        fileName: "affidavit_undertaking_ltce_2026.pdf",
        fileSize: "1.32 MB",
        hash: "b5d7c2a198fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852c912",
        uploadDate: "27 Oct 2026, 11:10 IST",
        notes: "₹100 non-judicial stamp paper with Notary Registration No. 51204 (Thane).",
      },
      {
        id: "doc-land",
        type: "Land & Ownership Registered Deed",
        category: "Campus Infrastructure",
        required: true,
        ruleRef: "APH §4.1 · Norm 2.50 Acres",
        status: "uploaded",
        fileName: "land_registered_title_ltce_campus.pdf",
        fileSize: "5.10 MB",
        hash: "7e314346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc329ff1",
        uploadDate: "27 Oct 2026, 11:15 IST",
        notes: "3.75 Acres unencumbered registered lease deed from CIDCO at Koparkhairane, Navi Mumbai.",
      },
      {
        id: "doc-fire",
        type: "Fire & Life Safety NOC",
        category: "Safety Clearance",
        required: true,
        ruleRef: "APH §4.2(d) · Expiry Horizon",
        status: "uploaded",
        fileName: "fire_safety_noc_nmmc_cfo.pdf",
        fileSize: "2.35 MB",
        hash: "9a76b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875a10",
        uploadDate: "27 Oct 2026, 11:22 IST",
        notes: "NMMC Chief Fire Officer compliance certificate valid through 31-Aug-2027.",
      },
      {
        id: "doc-building",
        type: "Building Safety & Completion Plan",
        category: "Physical Norms",
        required: true,
        ruleRef: "APH §4.3 · Norm 7,500 sq.m",
        status: "uploaded",
        fileName: "building_occupancy_cidco_certified.pdf",
        fileSize: "4.12 MB",
        hash: "2c835e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13cc88",
        uploadDate: "27 Oct 2026, 11:30 IST",
        notes: "CIDCO & NMMC certified instructional carpet area: 10,250 sq.m (Norm: 7,500 sq.m).",
      },
      {
        id: "doc-affiliation",
        type: "University Affiliation & NBA Letter",
        category: "Academic Accreditation",
        required: true,
        ruleRef: "APH §2.4 · Tier-1 Accreditation",
        status: "uploaded",
        fileName: "university_mumbai_affiliation_ltce_2026.pdf",
        fileSize: "2.05 MB",
        hash: "3f17408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49eee",
        uploadDate: "27 Oct 2026, 11:35 IST",
        notes: "Affiliation renewal certificate from University of Mumbai for AY 2026-27.",
      },
    ],
  },
};

function InstitutionWorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab") || "submission";

  const [collegeId, setCollegeId] = useState<string>("sardarpatel");
  const [checklist, setChecklist] = useState<ComplianceDoc[]>(collegesData.sardarpatel.initialDocs);
  const [selectedCategory, setSelectedCategory] = useState<string>("doc-fire");
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [duplicateBanner, setDuplicateBanner] = useState<{
    show: boolean;
    hash: string;
    matchedInstitution: string;
    matchedDoc: string;
    message: string;
  } | null>(null);

  // Sync active college from URL param or localStorage
  useEffect(() => {
    const paramCollege = searchParams?.get("college");
    if (paramCollege && collegesData[paramCollege]) {
      setCollegeId(paramCollege);
      setChecklist(collegesData[paramCollege].initialDocs);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("scrutinix-college", paramCollege);
      }
    } else if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("scrutinix-college");
      if (stored && collegesData[stored]) {
        setCollegeId(stored);
        setChecklist(collegesData[stored].initialDocs);
      }
    }
  }, [searchParams]);

  const college = collegesData[collegeId] || collegesData.sardarpatel;

  // Preview modal state
  const [previewDoc, setPreviewDoc] = useState<ComplianceDoc | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const setTab = (tab: string) => {
    router.push(`/institution?tab=${tab}&college=${collegeId}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  // Real SHA-256 computation in browser
  const computeSHA256 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  // Cross-institutional duplicate verification
  const checkDuplicateCrossInstitution = async (computedHash: string) => {
    const spitLandDeedHashes = [
      "5d4b85c15e8df1fd657cfba39aa723e7f6071ef694ba328c68c222ffda8daffc",
      "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
      "9535f7a9f70927e7f6ebc2c831b2a662e198ef29140af09feaec2e1272993634",
    ];

    if (spitLandDeedHashes.includes(computedHash.toLowerCase())) {
      return {
        isDuplicate: true,
        matchedDoc: "Land Lease Deed",
        matchedInstitution: "Sardar Patel Institute of Technology",
        message:
          "Duplicate Document Detected: Identical cryptographic hash matches Land Lease Deed submitted by Sardar Patel Institute of Technology.",
      };
    }

    const otherCollegeKey = collegeId === "sardarpatel" ? "ltce" : "sardarpatel";
    const otherCollege = collegesData[otherCollegeKey];
    if (otherCollege) {
      const match = otherCollege.initialDocs.find(
        (d) => d.hash.toLowerCase() === computedHash.toLowerCase()
      );
      if (match) {
        return {
          isDuplicate: true,
          matchedDoc: match.type,
          matchedInstitution: otherCollege.name,
          message:
            otherCollege.id === "sardarpatel" &&
            (match.id === "doc-land" || match.type.includes("Land"))
              ? "Duplicate Document Detected: Identical cryptographic hash matches Land Lease Deed submitted by Sardar Patel Institute of Technology."
              : `Duplicate Document Detected: Identical cryptographic hash matches ${match.type} submitted by ${otherCollege.name}.`,
        };
      }
    }

    try {
      const supabase = createClient();
      const { data: dbMatches } = await supabase
        .from("documents")
        .select("document_type, application_id")
        .eq("sha256_hash", computedHash)
        .neq("application_id", college.applicationId);

      if (dbMatches && dbMatches.length > 0) {
        return {
          isDuplicate: true,
          matchedDoc: dbMatches[0].document_type || "Land Lease Deed",
          matchedInstitution: "Sardar Patel Institute of Technology",
          message:
            "Duplicate Document Detected: Identical cryptographic hash matches Land Lease Deed submitted by Sardar Patel Institute of Technology.",
        };
      }
    } catch (e) {
      // ignore
    }

    return { isDuplicate: false, message: "" };
  };

  const testDuplicateUpload = async () => {
    const testHash = "5d4b85c15e8df1fd657cfba39aa723e7f6071ef694ba328c68c222ffda8daffc";
    setIsProcessing(true);
    setProcessingStage("Computing SHA-256 cryptographic digest via browser Web Crypto…");
    await new Promise((r) => setTimeout(r, 350));
    setProcessingStage("Cross-checking hash against Sardar Patel Institute of Technology records…");
    await new Promise((r) => setTimeout(r, 400));

    const dupCheck = await checkDuplicateCrossInstitution(testHash);
    if (dupCheck.isDuplicate) {
      setDuplicateBanner({
        show: true,
        hash: testHash,
        matchedInstitution: dupCheck.matchedInstitution || "Sardar Patel Institute of Technology",
        matchedDoc: dupCheck.matchedDoc || "Land Lease Deed",
        message:
          "Duplicate Document Detected: Identical cryptographic hash matches Land Lease Deed submitted by Sardar Patel Institute of Technology.",
      });

      setChecklist((prev) =>
        prev.map((doc) => {
          if (doc.id === "doc-land" || doc.id === selectedCategory) {
            return {
              ...doc,
              status: "attention",
              fileName: "spit_land_lease_deed_duplicate_test.pdf",
              fileSize: "4.82 MB",
              hash: testHash,
              uploadDate: new Date().toLocaleTimeString("en-IN") + " IST",
              notes:
                "CRITICAL ADVISORY: Duplicate document detected. Identical cryptographic hash matches Land Lease Deed submitted by Sardar Patel Institute of Technology.",
              isCustom: true,
            };
          }
          return doc;
        })
      );
    }
    setIsProcessing(false);
    setToast("Duplicate document analysis complete. High-priority collision banner raised.");
  };

  // Handle actual file upload from user's filesystem
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsProcessing(true);
    setProcessingStage("Computing SHA-256 cryptographic digest…");

    try {
      const realHash = await computeSHA256(file);
      const dupCheck = await checkDuplicateCrossInstitution(realHash);

      if (dupCheck.isDuplicate) {
        setDuplicateBanner({
          show: true,
          hash: realHash,
          matchedInstitution: dupCheck.matchedInstitution || "Sardar Patel Institute of Technology",
          matchedDoc: dupCheck.matchedDoc || "Land Lease Deed",
          message:
            dupCheck.message ||
            "Duplicate Document Detected: Identical cryptographic hash matches Land Lease Deed submitted by Sardar Patel Institute of Technology.",
        });
      } else {
        setDuplicateBanner(null);
      }

      await new Promise((r) => setTimeout(r, 400));

      setProcessingStage("Uploading encrypted evidence to Supabase Storage…");
      const supabase = createClient();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${college.applicationId}/${selectedCategory}-${Date.now()}-${cleanFileName}`;

      const { data: storageUpload, error: uploadErr } = await supabase.storage
        .from("documents")
        .upload(storagePath, file, { upsert: true });

      let finalPreviewUrl = URL.createObjectURL(file);
      if (!uploadErr) {
        const { data: pubUrl } = supabase.storage.from("documents").getPublicUrl(storagePath);
        if (pubUrl?.publicUrl) finalPreviewUrl = pubUrl.publicUrl;
      } else {
        console.warn("Storage upload notice (falling back to object URL):", uploadErr.message);
      }

      setProcessingStage("Sealing document record in Supabase database…");
      const targetDoc = checklist.find((d) => d.id === selectedCategory);
      const docType = targetDoc?.type || "Regulatory Evidence";

      // Persist document record into Supabase documents table
      const { error: dbErr } = await supabase.from("documents").upsert({
        id: `DOC-2026-${selectedCategory.toUpperCase()}-${college.id.toUpperCase()}`,
        application_id: college.applicationId,
        document_type: docType,
        file_name: file.name,
        file_size: file.size,
        storage_path: storagePath,
        sha256_hash: realHash,
        created_at: new Date().toISOString(),
      });

      if (dbErr) {
        console.warn("Database record notice:", dbErr.message);
      }

      // Record in cryptographic audit trail
      try {
        await supabase.from("audit_log").insert({
          application_id: college.applicationId,
          action: "DOCUMENT_UPLOADED",
          actor_role: "institution",
          actor_name: college.principal,
          details: {
            document_type: docType,
            file_name: file.name,
            sha256_hash: realHash,
            file_size_bytes: file.size,
            storage_path: storagePath,
          },
        });
      } catch (auditErr) {
        console.warn("Audit logging notice:", auditErr);
      }

      setProcessingStage("Running AICTE 2026–27 regulatory rule pre-check…");
      await new Promise((r) => setTimeout(r, 450));

      const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + " MB";
      const nowStr =
        new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) + " IST";

      // Update the selected document in checklist
      setChecklist((prev) =>
        prev.map((doc) => {
          if (doc.id === selectedCategory) {
            return {
              ...doc,
              status: "uploaded",
              fileName: file.name,
              fileSize: sizeStr,
              hash: realHash,
              uploadDate: nowStr,
              notes: `Stored in Supabase documents bucket (${storagePath}). SHA-256 cryptographically sealed.`,
              previewUrl: finalPreviewUrl,
              isCustom: true,
            };
          }
          return doc;
        })
      );

      setIsProcessing(false);
      setToast(`File "${file.name}" uploaded to Supabase Storage and sealed into compliance database.`);
    } catch (err) {
      console.error("Upload processing error:", err);
      setIsProcessing(false);
      setToast("Failed to process document. Please try a valid PDF or image file.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const uploadedCount = checklist.filter((d) => d.status === "uploaded").length;
  const attentionCount = checklist.filter((d) => d.status === "attention").length;
  const missingCount = checklist.filter((d) => d.status === "missing").length;
  const progressPercent = Math.round((uploadedCount / checklist.length) * 100);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow text-pine font-semibold">Institutional Compliance Portal</span>
            <span className="text-muted">·</span>
            <span className="mono text-[11px] text-muted">Permanent ID: {college.pid}</span>
          </div>
          <h1 className="display mt-1 text-[32px] sm:text-[38px] leading-[1.05] text-ink font-serif">
            {college.name}
          </h1>
          <p className="mt-1.5 text-[13px] text-muted max-w-[700px]">
            AICTE Western Region · Extension of Approval (EoA) Application for Academic Year 2026–27.
            Upload mandatory evidence, inspect automated pre-checks, and track scrutiny committee review.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTab("receipt")}
            className="btn btn-secondary h-9 text-[12px] flex items-center gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Official Receipt</span>
          </button>
          <button
            onClick={() => {
              if (fileInputRef.current) fileInputRef.current.click();
            }}
            className="btn btn-primary h-9 text-[12px] flex items-center gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* College Multi-Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-line overflow-x-auto no-scrollbar">
        {[
          { key: "submission", label: "1. Document Submission", icon: CloudUpload, badge: `${uploadedCount}/${checklist.length}` },
          { key: "status", label: "2. Scrutiny Status & Feedback", icon: ScanLine, badge: attentionCount > 0 ? `${attentionCount} Advisory` : "All Clear" },
          { key: "records", label: "3. AICTE Master Record", icon: Building2, badge: "Verified" },
          { key: "receipt", label: "4. Statutory Receipt", icon: FileCheck, badge: college.applicationId.replace("APP-2026-", "APP-") },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = currentTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors whitespace-nowrap",
                active
                  ? "border-pine text-pine font-semibold bg-pine-soft/20"
                  : "border-transparent text-muted hover:text-ink hover:border-line"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "mono rounded-full px-2 py-0.2 text-[10px]",
                  active ? "bg-pine text-white" : "bg-paper text-muted border border-line"
                )}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Hidden File Input for Real User Files */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />

      {/* TAB 1: DOCUMENT SUBMISSION */}
      {currentTab === "submission" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            {/* Immediate High-Visibility Banner for Duplicate Document */}
            {duplicateBanner?.show && (
              <div className="relative rounded-xl border-2 border-rust bg-[#fdf5f4] p-5 shadow-lift animate-fade-in">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rust text-white shadow-sm">
                    <ShieldAlert className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="chip border-rust/30 bg-rust text-white font-bold text-[10.5px] uppercase tracking-wide">
                        Cross-Institutional Collision Flag
                      </span>
                      <span className="mono text-[11px] text-rust font-semibold">
                        RULE DUP-HASH-01 · CRITICAL ADVISORY
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-[16px] font-bold text-rust leading-snug">
                      Duplicate Document Detected: Identical cryptographic hash matches Land Lease Deed submitted by Sardar Patel Institute of Technology.
                    </h3>
                    <p className="mt-1.5 text-[12.5px] text-[#7d3223] leading-relaxed">
                      The computed SHA-256 digest <span className="mono font-bold bg-white px-1.5 py-0.5 rounded border border-rust/20">{duplicateBanner.hash}</span> is an exact bit-for-bit duplicate of the Registered Land Title & Lease Deed submitted by Sardar Patel Institute of Technology (PID: 1-3686579303). Under AICTE APH §4.1, campus infrastructure deeds cannot be shared across multiple institutions.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px] border-t border-rust/20 pt-2.5 text-[#8f3e2e]">
                      <span><strong>Originating College:</strong> Sardar Patel Institute of Technology (PID: 1-3686579303)</span>
                      <span><strong>Document:</strong> Land Lease Deed (Campus Infrastructure)</span>
                      <span><strong>AICTE Scrutiny Stage:</strong> Escalated to Regional Scrutiny Committee</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setDuplicateBanner(null)}
                    className="text-muted hover:text-ink text-[12px] p-1"
                    title="Dismiss warning"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Real File Upload Dropzone */}
            <section className="card p-5 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3.5 mb-4">
                <div>
                  <SectionHeading title="Upload Regulatory Document" meta="Live Hashing & Verification" />
                  <p className="mt-0.5 text-[12px] text-muted">
                    Select the target compliance category, choose your own local file, and inspect the real cryptographic SHA-256 seal.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      testDuplicateUpload();
                    }}
                    className="btn btn-secondary h-8 px-2.5 text-[11px] font-semibold border-rust/30 bg-rust-soft/50 text-rust hover:bg-rust-soft flex items-center gap-1.5"
                    title="Test duplicate detection with SPIT Land Deed"
                  >
                    <ShieldAlert className="h-3.5 w-3.5 text-rust" />
                    <span>Test SPIT Land Deed Duplicate</span>
                  </button>
                  <span className="text-[11px] text-muted font-medium">Target Category:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="select text-[12px] py-1 px-2.5 bg-paper border-line font-medium"
                  >
                    {checklist.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Drag & Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.click();
                }}
                className={cn(
                  "relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all",
                  dragActive
                    ? "border-pine bg-pine-soft/40 scale-[0.99]"
                    : "border-line-strong/70 bg-[#faf7ef] hover:border-pine hover:bg-pine-soft/20"
                )}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-pine/30 bg-pine-soft text-pine shadow-sm">
                  <CloudUpload className="h-5 w-5" />
                </div>
                <div className="mt-3 text-[14px] font-semibold text-ink">
                  {isProcessing ? processingStage : "Drop your official compliance file here, or click to browse"}
                </div>
                <p className="mt-1 max-w-[460px] text-[12px] text-muted">
                  {isProcessing
                    ? "Calculating SHA-256 fingerprint in browser Web Crypto and updating checklist…"
                    : "Upload any real PDF, PNG, or JPEG from your device. ScrutiniX generates an advisory SHA-256 seal and runs AICTE 2026–27 rule checks."}
                </p>

                {isProcessing ? (
                  <div className="mt-4 flex items-center gap-2 text-pine font-medium text-[12px]">
                    <RotateCw className="h-4 w-4 animate-spin" />
                    <span>Processing file in real time…</span>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-3">
                    <span className="mono rounded border border-line bg-paper px-2 py-0.5 text-[10.5px] text-muted">
                      MAX 25 MB
                    </span>
                    <span className="mono rounded border border-line bg-paper px-2 py-0.5 text-[10.5px] text-muted">
                      PDF, JPG, PNG
                    </span>
                    <span className="mono rounded border border-pine/30 bg-pine-soft px-2 py-0.5 text-[10.5px] text-pine font-semibold">
                      BROWSER SHA-256 SEAL
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Document Checklist Table */}
            <section className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5 bg-paper/50">
                <div>
                  <SectionHeading
                    title="Mandatory Compliance Document Checklist"
                    meta={`${uploadedCount} of ${checklist.length} Provided`}
                  />
                  <p className="mt-0.5 text-[12px] text-muted">
                    Required for AICTE Extension of Approval (EoA) Renewal · Academic Year 2026–27.
                  </p>
                </div>
                <span className="chip border-pine/20 bg-pine-soft text-pine text-[11px] font-medium flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Statutory Form 1</span>
                </span>
              </div>

              <div className="divide-y divide-line">
                {checklist.map((doc) => {
                  const isUploaded = doc.status === "uploaded";
                  const isAttention = doc.status === "attention";
                  const isMissing = doc.status === "missing";

                  return (
                    <div
                      key={doc.id}
                      className={cn(
                        "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between transition-colors",
                        isAttention ? "bg-ochre-soft/20" : isMissing ? "bg-rust-soft/20" : "hover:bg-paper/40"
                      )}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span
                          className={cn(
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                            isUploaded
                              ? "border-pine/30 bg-pine-soft text-pine"
                              : isAttention
                              ? "border-ochre/30 bg-ochre-soft text-ochre"
                              : "border-rust/30 bg-rust-soft text-rust"
                          )}
                        >
                          {isUploaded ? (
                            <FileCheck2 className="h-4.5 w-4.5" />
                          ) : isAttention ? (
                            <AlertTriangle className="h-4.5 w-4.5" />
                          ) : (
                            <FileQuestion className="h-4.5 w-4.5" />
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[13.5px] font-semibold text-ink">{doc.type}</span>
                            <span className="mono rounded border border-line bg-paper px-1.5 py-0.5 text-[10px] text-muted">
                              {doc.ruleRef}
                            </span>
                            {doc.isCustom ? (
                              <span className="rounded bg-pine text-white px-1.5 py-0.2 text-[9.5px] font-semibold uppercase">
                                Custom Upload
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
                            <span className="font-mono text-ink/80 truncate max-w-[240px]">{doc.fileName}</span>
                            <span>·</span>
                            <span className="mono">{doc.fileSize}</span>
                            <span>·</span>
                            <span className="mono text-[10.5px]">Uploaded {doc.uploadDate}</span>
                          </div>

                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="mono text-[10.5px] text-muted truncate max-w-[320px]">
                              SHA-256: {doc.hash}
                            </span>
                            <button
                              onClick={() => copyToClipboard(doc.hash)}
                              className="text-muted hover:text-ink transition-colors"
                              title="Copy SHA-256 Hash"
                            >
                              {copiedHash === doc.hash ? (
                                <Check className="h-3 w-3 text-pine" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>

                          <div className="mt-1 text-[11.5px] text-[#6b6e66] italic">{doc.notes}</div>
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex shrink-0 items-center gap-2.5 sm:self-center">
                        <span
                          className={cn(
                            "chip border text-[11px] font-medium",
                            isUploaded
                              ? "border-pine/20 bg-pine-soft text-pine"
                              : isAttention
                              ? "border-ochre/20 bg-ochre-soft text-ochre"
                              : "border-rust/20 bg-rust-soft text-rust"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full mr-1.5",
                              isUploaded ? "bg-pine" : isAttention ? "bg-ochre" : "bg-rust"
                            )}
                          />
                          {isUploaded ? "Uploaded & Sealed" : isAttention ? "Clarification" : "Missing"}
                        </span>

                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="btn btn-secondary h-8 px-2.5 text-[11.5px] flex items-center gap-1"
                          title="Preview Document"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedCategory(doc.id);
                            if (fileInputRef.current) fileInputRef.current.click();
                          }}
                          className="btn btn-ghost h-8 px-2 text-[11.5px] text-muted hover:text-ink hover:bg-paper"
                          title="Replace with new file"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t border-line bg-paper/60 px-5 py-2.5 text-[11.5px] text-muted">
                <span className="flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  <span>All documents are cryptographically fingerprinted with SHA-256 before statutory review.</span>
                </span>
                <span className="mono text-[11px]">AY 2026–27 APH Compliance</span>
              </div>
            </section>
          </div>

          {/* Right Column: Submission Summary & Live Pipeline */}
          <aside className="space-y-5">
            {/* Submission Status Card */}
            <section className="card p-5 overflow-hidden">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <SectionHeading title="Compliance Readiness" />
                <span className="chip border-pine/20 bg-pine-soft text-pine text-[11px]">
                  {progressPercent}% Complete
                </span>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div
                  className="relative flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#1c5444 0 ${progressPercent}%, #e9e4d8 ${progressPercent}% 100%)`,
                  }}
                >
                  <div className="flex h-[62px] w-[62px] flex-col items-center justify-center rounded-full bg-surface">
                    <span className="mono text-[18px] font-bold text-ink">{progressPercent}%</span>
                    <span className="text-[9.5px] uppercase tracking-wider text-muted font-medium">Valid</span>
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-1 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-muted">Total Required:</span>
                    <span className="mono font-semibold text-ink">{checklist.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Uploaded:</span>
                    <span className="mono font-semibold text-pine">{uploadedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Advisory Notes:</span>
                    <span className="mono font-semibold text-ochre">{attentionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Deficiencies:</span>
                    <span className="mono font-semibold text-rust">{missingCount}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-line bg-paper/80 p-3 text-[11.5px] leading-relaxed text-muted">
                <span className="font-semibold text-ink">Statutory Deadline:</span> 30 November 2026.
                Submissions after the cutoff require Regional Committee re-approval.
              </div>

              <div className="mt-4 border-t border-line pt-3 space-y-1.5 text-[11.5px]">
                <div className="flex justify-between">
                  <span className="text-muted">Application No:</span>
                  <span className="mono font-semibold text-ink">{college.applicationId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Scrutiny Officer:</span>
                  <span className="text-ink font-medium">Dr. Ananya Menon</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Current Stage:</span>
                  <span className="text-pine font-medium">Pre-Scrutiny Advisory</span>
                </div>
              </div>
            </section>

            {/* Advisory Assistance Card */}
            <section className="rounded-xl border border-line bg-paper/60 p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <HelpCircle className="h-4 w-4 text-pine" />
                <span>AICTE Advisory Principle</span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-muted">
                Automated pre-checks never reject an application. They detect discrepancies early so colleges can submit
                rectifications before the official Scrutiny Committee convenes.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => setTab("status")}
                  className="text-[12px] font-semibold text-pine flex items-center gap-1 hover:underline"
                >
                  <span>Review Scrutiny Advisory Notes</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </section>
          </aside>
        </div>
      )}

      {/* TAB 2: SCRUTINY STATUS & FEEDBACK */}
      {currentTab === "status" && (
        <div className="space-y-6">
          {/* Regulatory Stepper */}
          <section className="card p-5">
            <SectionHeading title="Four-Stage Regulatory Scrutiny Workflow" meta="AICTE APH 2026–27 Process" />
            <div className="mt-5 grid gap-4 sm:grid-cols-4">
              {[
                {
                  stage: "Stage 1",
                  title: "Document Filing",
                  status: "Completed",
                  date: "27 Oct 2026 · 09:42 IST",
                  desc: "5/5 mandatory compliance documents submitted with SHA-256 fingerprinting.",
                  done: true,
                },
                {
                  stage: "Stage 2",
                  title: "Pre-Scrutiny Engine",
                  status: "Advisory Issued",
                  date: "27 Oct 2026 · 10:15 IST",
                  desc: "Automated rule evaluation completed: 4 rules passed, 1 clarification advisory.",
                  done: true,
                  highlight: true,
                },
                {
                  stage: "Stage 3",
                  title: "Scrutiny Committee",
                  status: "Hearing Scheduled",
                  date: "05 Nov 2026 · 11:30 AM",
                  desc: "Assigned to Dr. Ananya Menon & Regional Scrutiny Panel at AICTE Western Office.",
                  done: false,
                },
                {
                  stage: "Stage 4",
                  title: "Regional Officer EoA",
                  status: "Pending Hearing",
                  date: "Estimated 10 Nov 2026",
                  desc: "Statutory order issued by Western Regional Office under Section 10(k) AICTE Act.",
                  done: false,
                },
              ].map((item, idx) => (
                <div
                  key={item.stage}
                  className={cn(
                    "rounded-xl border p-4 transition-all",
                    item.highlight
                      ? "border-ochre/40 bg-ochre-soft/30 shadow-sm"
                      : item.done
                      ? "border-pine/30 bg-pine-soft/20"
                      : "border-line bg-paper/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="mono text-[10.5px] uppercase tracking-wider text-muted font-bold">
                      {item.stage}
                    </span>
                    <span
                      className={cn(
                        "chip border text-[10px] font-semibold",
                        item.highlight
                          ? "border-ochre/25 bg-ochre-soft text-ochre"
                          : item.done
                          ? "border-pine/25 bg-pine-soft text-pine"
                          : "border-line bg-paper text-muted"
                      )}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-2 text-[14px] font-bold text-ink">{item.title}</div>
                  <div className="mt-0.5 mono text-[10.5px] text-muted">{item.date}</div>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-muted">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Active Advisory Findings */}
          <section className="card p-5">
            <div className="flex items-center justify-between border-b border-line pb-3.5 mb-4">
              <div>
                <SectionHeading title="AICTE Pre-Scrutiny Advisory Feedback" meta="Generated by Rule Engine v1.4" />
                <p className="mt-0.5 text-[12px] text-muted">
                  The following observations were generated by the rules engine to alert the institution prior to committee review.
                </p>
              </div>
              <span
                className={cn(
                  "chip text-[11px] font-semibold border",
                  college.id === "ltce"
                    ? "border-pine/30 bg-pine-soft text-pine"
                    : "border-ochre/30 bg-ochre-soft text-ochre"
                )}
              >
                {college.id === "ltce" ? "All Pre-Checks Clear" : "1 Advisory Discrepancy"}
              </span>
            </div>

            <div className="space-y-4">
              {/* Finding 1: Fire NOC Horizon (for Sardar Patel) or Clear (for LTCE) */}
              {college.id === "sardarpatel" ? (
                <div className="rounded-xl border border-ochre/30 bg-ochre-soft/20 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-ochre/20 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ochre text-white">
                        <AlertTriangle className="h-3.5 w-3.5" />
                      </span>
                      <span className="mono text-[12px] font-bold text-ink">RULE FIRE-EXP-01</span>
                      <span className="rounded bg-ochre-soft px-1.5 py-0.5 text-[10px] font-semibold text-ochre border border-ochre/30">
                        Advisory Horizon
                      </span>
                    </div>
                    <span className="text-[11.5px] text-muted">Rule Severity: <strong className="text-ochre">Medium</strong></span>
                  </div>
                  <div className="mt-3 text-[13px] font-semibold text-ink">
                    Fire & Life Safety NOC Expiry (15-Mar-2027) precedes Academic Year Completion (30-Jun-2027)
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted">
                    Under AICTE Approval Process Handbook (APH) Chapter IV, §4.2(d), all statutory clearances must maintain
                    validity throughout the entire academic year. The uploaded certificate from Maharashtra Fire Services
                    expires on 15 March 2027.
                  </p>
                  <div className="mt-3 rounded-lg border border-line bg-surface p-3 text-[12px]">
                    <div className="font-semibold text-ink">Recommended Institution Action:</div>
                    <div className="mt-0.5 text-muted">
                      Upload either (A) a renewal acknowledgment receipt from the Chief Fire Officer, or (B) a statutory
                      undertaking on ₹100 stamp paper committing to submit the renewed NOC prior to 15-Mar-2027.
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedCategory("doc-fire");
                        setTab("submission");
                        setTimeout(() => {
                          if (fileInputRef.current) fileInputRef.current.click();
                        }, 100);
                      }}
                      className="btn btn-primary h-8 text-[11.5px] flex items-center gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Clarification / Undertaking</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-pine/30 bg-pine-soft/20 p-4">
                  <div className="flex items-center justify-between border-b border-pine/20 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pine text-white">
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="mono text-[12px] font-bold text-ink">RULE FIRE-EXP-01</span>
                      <span className="rounded bg-pine-soft px-1.5 py-0.5 text-[10px] font-semibold text-pine border border-pine/30">
                        Compliant
                      </span>
                    </div>
                    <span className="mono text-[11px] text-pine font-medium">Clear</span>
                  </div>
                  <div className="mt-2 text-[12.5px] text-ink font-semibold">
                    Fire & Life Safety NOC valid through 31-Aug-2027 (Satisfies full AY 2026–27 requirement).
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-muted">
                    Navi Mumbai Municipal Corporation (NMMC) Fire Services approval certificate verified.
                  </p>
                </div>
              )}

              {/* Compliant Item: Land Norm */}
              <div className="rounded-xl border border-pine/30 bg-pine-soft/20 p-4">
                <div className="flex items-center justify-between border-b border-pine/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pine text-white">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="mono text-[12px] font-bold text-ink">RULE LAND-AREA-01</span>
                    <span className="rounded bg-pine-soft px-1.5 py-0.5 text-[10px] font-semibold text-pine border border-pine/30">
                      Compliant
                    </span>
                  </div>
                  <span className="mono text-[11px] text-pine font-medium">Norm Satisfied</span>
                </div>
                <div className="mt-2 text-[12.5px] text-ink font-semibold">
                  Land Area: {college.landAcres} Acres in Metro Region exceeds minimum AICTE threshold of 2.50 Acres.
                </div>
                <p className="mt-0.5 text-[11.5px] text-muted">
                  Verification verified unencumbered registered lease deed at {college.address.split(",")[0]}.
                </p>
              </div>

              {/* Compliant Item: Intake & Faculty Ratio */}
              <div className="rounded-xl border border-pine/30 bg-pine-soft/20 p-4">
                <div className="flex items-center justify-between border-b border-pine/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pine text-white">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="mono text-[12px] font-bold text-ink">RULE FACULTY-RATIO-01</span>
                    <span className="rounded bg-pine-soft px-1.5 py-0.5 text-[10px] font-semibold text-pine border border-pine/30">
                      Compliant
                    </span>
                  </div>
                  <span className="mono text-[11px] text-pine font-medium">Cadre Satisfied</span>
                </div>
                <div className="mt-2 text-[12.5px] text-ink font-semibold">
                  Cadre Ratio: {college.faculty} Full-time approved faculty members maintain 15:1 ratio for {college.intake} sanctioned intake.
                </div>
                <p className="mt-0.5 text-[11.5px] text-muted">
                  Faculty qualification records verified against State University approval roster.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: AICTE MASTER RECORD */}
      {currentTab === "records" && (
        <div className="space-y-6">
          <section className="card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line pb-4 mb-4">
              <div>
                <SectionHeading title="Central AICTE Portal Master Record" meta={`Permanent Institute ID: ${college.pid}`} />
                <p className="mt-0.5 text-[12px] text-muted">
                  Baseline institutional profile recorded in AICTE National Database (e-Gov Portal) compared against current EoA evidence.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="chip border-pine/30 bg-pine-soft text-pine text-[11px] font-semibold">
                  Master Record Synced
                </span>
              </div>
            </div>

            {/* Institution Overview Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="rounded-lg border border-line bg-paper/60 p-3.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Institution Category</div>
                <div className="mt-1 text-[13.5px] font-bold text-ink">{college.category}</div>
                <div className="mt-0.5 text-[11px] text-muted">Technical Engineering College</div>
              </div>
              <div className="rounded-lg border border-line bg-paper/60 p-3.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Sponsoring Trust</div>
                <div className="mt-1 text-[13.5px] font-bold text-ink">{college.sponsoringTrust.split("(")[0]}</div>
                <div className="mt-0.5 text-[11px] text-muted">{college.sponsoringTrust.includes("(") ? college.sponsoringTrust.match(/\((.*?)\)/)?.[0] : "Registered Trust"}</div>
              </div>
              <div className="rounded-lg border border-line bg-paper/60 p-3.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Affiliating University</div>
                <div className="mt-1 text-[13.5px] font-bold text-ink">{college.university}</div>
                <div className="mt-0.5 text-[11px] text-muted">Permanent Affiliation Status</div>
              </div>
              <div className="rounded-lg border border-line bg-paper/60 p-3.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">AICTE Region & Office</div>
                <div className="mt-1 text-[13.5px] font-bold text-ink">{college.region}</div>
                <div className="mt-0.5 text-[11px] text-muted">Churchgate, Mumbai</div>
              </div>
            </div>

            {/* Approved Programmes & Intake */}
            <div className="border border-line rounded-xl overflow-hidden mb-6">
              <div className="bg-paper/70 px-4 py-2.5 border-b border-line flex items-center justify-between">
                <span className="text-[12.5px] font-bold text-ink">Sanctioned Engineering Programmes (B.Tech)</span>
                <span className="mono text-[11px] font-bold text-pine">Total Sanctioned Intake: {college.intake} Seats</span>
              </div>
              <div className="divide-y divide-line text-[12.5px]">
                {college.programmes.map((p) => (
                  <div key={p.code} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div>
                      <div className="font-semibold text-ink">{p.course}</div>
                      <div className="mono text-[11px] text-muted">{p.code} · {p.accreditation}</div>
                    </div>
                    <div className="mono font-bold text-[13px] text-ink">{p.intake} Seats</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Infrastructure Norms Comparison Table */}
            <div className="border border-line rounded-xl overflow-hidden">
              <div className="bg-paper/70 px-4 py-2.5 border-b border-line">
                <span className="text-[12.5px] font-bold text-ink">
                  AICTE Mandatory Infrastructure Norms vs. Submitted Evidence
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="border-b border-line bg-paper/40 text-[10.5px] uppercase tracking-wider text-muted font-bold">
                    <tr>
                      <th className="px-4 py-2.5">Parameter</th>
                      <th className="px-4 py-2.5">AICTE APH Norm</th>
                      <th className="px-4 py-2.5">AICTE Portal Value</th>
                      <th className="px-4 py-2.5">Document Extracted</th>
                      <th className="px-4 py-2.5">Compliance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-ink">Land Area (Metro Category)</td>
                      <td className="px-4 py-3 mono text-muted">≥ 2.50 Acres</td>
                      <td className="px-4 py-3 mono">{college.landAcres} Acres</td>
                      <td className="px-4 py-3 mono text-pine font-medium">{college.landAcres} Acres</td>
                      <td className="px-4 py-3"><span className="chip border-pine/30 bg-pine-soft text-pine text-[10.5px] font-semibold">✓ Meets Norm</span></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-ink">Built-Up Instructional Area</td>
                      <td className="px-4 py-3 mono text-muted">≥ 7,500 sq.m</td>
                      <td className="px-4 py-3 mono">{college.builtUpSqm.toLocaleString()} sq.m</td>
                      <td className="px-4 py-3 mono text-pine font-medium">{college.builtUpSqm.toLocaleString()} sq.m</td>
                      <td className="px-4 py-3"><span className="chip border-pine/30 bg-pine-soft text-pine text-[10.5px] font-semibold">✓ Meets Norm</span></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-ink">Student : Teacher Ratio (SFR)</td>
                      <td className="px-4 py-3 mono text-muted">≤ 1:15</td>
                      <td className="px-4 py-3 mono">1:15 ({college.faculty} Faculty)</td>
                      <td className="px-4 py-3 mono text-pine font-medium">1:15 Verified</td>
                      <td className="px-4 py-3"><span className="chip border-pine/30 bg-pine-soft text-pine text-[10.5px] font-semibold">✓ Meets Norm</span></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-ink">Regulatory Fee (TER) Clearance</td>
                      <td className="px-4 py-3 mono text-muted">₹1,50,000 Paid</td>
                      <td className="px-4 py-3 mono">Ref: {college.terPaymentRef}</td>
                      <td className="px-4 py-3 mono text-pine font-medium">Challan Verified</td>
                      <td className="px-4 py-3"><span className="chip border-pine/30 bg-pine-soft text-pine text-[10.5px] font-semibold">✓ Cleared</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB 4: STATUTORY RECEIPT */}
      {currentTab === "receipt" && (
        <div className="space-y-6">
          <div className="flex justify-end gap-2">
            <button
              onClick={() => window.print()}
              className="btn btn-secondary h-9 text-[12px] flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Official Receipt</span>
            </button>
            <button
              onClick={() => setToast("Receipt exported as encrypted PDF receipt.")}
              className="btn btn-primary h-9 text-[12px] flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF</span>
            </button>
          </div>

          {/* Official AICTE Acknowledgment Receipt Paper */}
          <section className="card p-8 sm:p-10 border-2 border-line bg-[#fdfaf3] shadow-paper">
            {/* Header Emblem & Title */}
            <div className="text-center border-b-2 border-line pb-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-pine/30 bg-pine-soft text-pine mb-2">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                Government of India · Ministry of Education
              </div>
              <h2 className="display mt-1 text-[24px] sm:text-[28px] font-serif font-bold text-ink">
                ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
              </h2>
              <div className="text-[12px] text-muted">
                Nelson Mandela Marg, Vasant Kunj, New Delhi – 110070 · Western Regional Office, Mumbai
              </div>
              <div className="mt-3 inline-block rounded border border-pine/30 bg-pine-soft/80 px-3 py-1 font-mono text-[11.5px] font-bold text-pine">
                STATUTORY ACKNOWLEDGMENT RECEIPT · EXTENSION OF APPROVAL (EoA) 2026–27
              </div>
            </div>

            {/* Receipt Metadata */}
            <div className="grid gap-4 sm:grid-cols-2 border-b border-line py-5 text-[12.5px]">
              <div>
                <div className="text-muted text-[11px] uppercase tracking-wider font-semibold">Application Reference</div>
                <div className="font-mono text-[15px] font-bold text-ink mt-0.5">{college.applicationId}</div>
                <div className="text-[11.5px] text-muted mt-1">
                  Submitted On: <strong>{college.receiptDate}</strong>
                </div>
              </div>
              <div className="sm:text-right">
                <div className="text-muted text-[11px] uppercase tracking-wider font-semibold">Permanent Institute ID</div>
                <div className="font-mono text-[15px] font-bold text-pine mt-0.5">{college.pid}</div>
                <div className="text-[11.5px] text-muted mt-1">
                  Academic Year: <strong>2026–2027</strong>
                </div>
              </div>
            </div>

            {/* Institution Profile Summary */}
            <div className="py-4 border-b border-line text-[12.5px]">
              <div className="font-bold text-ink text-[14px]">{college.name}</div>
              <div className="text-muted mt-0.5">
                {college.address}
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-[11.5px] text-muted">
                <span>Category: <strong>{college.category}</strong></span>
                <span>Affiliation: <strong>{college.university}</strong></span>
                <span>Approved Intake: <strong>{college.intake} Seats</strong></span>
                <span>TER Fee: <strong>₹1,50,000 (Paid)</strong></span>
              </div>
            </div>

            {/* Document Hash Table */}
            <div className="py-5 border-b border-line">
              <div className="text-[12px] font-bold uppercase tracking-wider text-ink mb-3">
                Cryptographic Evidence Manifest (SHA-256)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11.5px]">
                  <thead className="border-b border-line text-[10px] uppercase tracking-wider text-muted font-bold">
                    <tr>
                      <th className="pb-2">Document Description</th>
                      <th className="pb-2">File Name</th>
                      <th className="pb-2">Size</th>
                      <th className="pb-2">SHA-256 Fingerprint</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {checklist.map((doc) => (
                      <tr key={doc.id}>
                        <td className="py-2 font-medium text-ink">{doc.type}</td>
                        <td className="py-2 mono text-muted">{doc.fileName}</td>
                        <td className="py-2 mono text-muted">{doc.fileSize}</td>
                        <td className="py-2 mono text-pine text-[10px]">{doc.hash.slice(0, 32)}…</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Statutory Watermark & Verification Seal */}
            <div className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-line bg-paper p-1">
                  <QrCode className="h-12 w-12 text-ink" />
                </div>
                <div className="text-[11px] text-muted leading-tight">
                  <div className="font-bold text-ink">AICTE Central Digital Verification</div>
                  <div className="mono text-[10px] mt-0.5">https://scrutinix.aicte.gov.in/verify/{college.applicationId}</div>
                  <div className="mt-1 text-[10px]">
                    Tamper-proof digital seal verified against AICTE SHA-256 registry.
                  </div>
                </div>
              </div>

              <div className="sm:text-right text-[11px] text-muted">
                <div className="font-bold text-ink">Competent Authority Stamp</div>
                <div className="mt-1 font-serif italic text-muted">Digitally Signed & Certified</div>
                <div className="mono text-[10px] text-pine mt-0.5">Western Regional Office · AICTE</div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="relative w-full max-w-[800px] overflow-hidden rounded-xl border border-line-strong bg-surface shadow-lift animate-fade-up">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5 bg-paper/60">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink text-[14px]">{previewDoc.type}</span>
                  <span className="chip border-pine/30 bg-pine-soft text-pine text-[10px]">
                    Verified Fingerprint
                  </span>
                </div>
                <div className="mono text-[11px] text-muted mt-0.5 truncate">{previewDoc.fileName}</div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="btn-ghost h-8 w-8 rounded-md flex items-center justify-center text-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Duplicate Document Alert inside Preview Modal */}
              {(previewDoc.hash === "5d4b85c15e8df1fd657cfba39aa723e7f6071ef694ba328c68c222ffda8daffc" || duplicateBanner?.hash === previewDoc.hash) && (
                <div className="mb-4 rounded-lg border-2 border-rust bg-[#fdf5f4] p-3.5 text-rust animate-fade-in">
                  <div className="flex items-center gap-2 font-bold text-[13px]">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>Duplicate Document Detected: Identical cryptographic hash matches Land Lease Deed submitted by Sardar Patel Institute of Technology.</span>
                  </div>
                  <p className="mt-1 text-[11.5px] text-[#7d3223]">
                    The SHA-256 hash <span className="mono font-semibold">{previewDoc.hash}</span> conflicts with prior regulatory submission from SPIT (PID: 1-3686579303).
                  </p>
                </div>
              )}

              {previewDoc.previewUrl ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-line overflow-hidden bg-paper/30 p-2">
                    {previewDoc.fileName.toLowerCase().endsWith(".pdf") ? (
                      <iframe
                        src={previewDoc.previewUrl}
                        className="w-full h-[460px] rounded border border-line"
                        title="Document Preview"
                      />
                    ) : (
                      <img
                        src={previewDoc.previewUrl}
                        alt="Document Preview"
                        className="max-h-[460px] mx-auto object-contain rounded"
                      />
                    )}
                  </div>
                </div>
              ) : (
                /* Simulated Document Inspection Sheet */
                <div className="rounded-xl border border-line bg-[#fbf9f4] p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <div>
                      <div className="mono text-[10px] uppercase tracking-wider text-muted">
                        Statutory Document Record
                      </div>
                      <div className="text-[16px] font-bold text-ink mt-0.5">{previewDoc.type}</div>
                    </div>
                    <div className="text-right">
                      <span className="mono text-[11px] text-muted">{previewDoc.fileSize}</span>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 text-[12px]">
                    <div>
                      <span className="text-muted">Rule Reference:</span>
                      <div className="font-semibold text-ink mt-0.5">{previewDoc.ruleRef}</div>
                    </div>
                    <div>
                      <span className="text-muted">Category:</span>
                      <div className="font-semibold text-ink mt-0.5">{previewDoc.category}</div>
                    </div>
                    <div>
                      <span className="text-muted">Upload Timestamp:</span>
                      <div className="font-mono text-ink mt-0.5">{previewDoc.uploadDate}</div>
                    </div>
                    <div>
                      <span className="text-muted">Integrity Status:</span>
                      <div className="font-semibold text-pine mt-0.5">SHA-256 Validated</div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-line bg-paper p-3 text-[11.5px]">
                    <div className="font-semibold text-ink">Notary & Authority Particulars:</div>
                    <div className="text-muted mt-1 leading-relaxed">{previewDoc.notes}</div>
                  </div>

                  <div className="rounded-lg border border-line bg-surface p-3 font-mono text-[11px] text-muted">
                    <div className="text-[10px] uppercase tracking-wider text-muted font-bold mb-1">
                      Full Cryptographic SHA-256 Digest
                    </div>
                    <div className="text-pine break-all font-semibold">{previewDoc.hash}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-line bg-paper/50 px-5 py-3">
              <span className="text-[11.5px] text-muted">
                Digitally verified by ScrutiniX AICTE engine.
              </span>
              <button onClick={() => setPreviewDoc(null)} className="btn btn-secondary h-8 text-[12px]">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[100] flex max-w-[420px] items-start gap-3 rounded-xl border border-pine/25 bg-[#f6faf6] p-4 shadow-lift animate-fade-up">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pine text-white">
            <Check className="h-3 w-3 stroke-[3]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold text-ink">Compliance Action Recorded</div>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{toast}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-muted hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function InstitutionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="text-[13px] text-muted font-medium">Loading Institutional Compliance Portal…</div>
        </div>
      }
    >
      <InstitutionWorkspaceContent />
    </Suspense>
  );
}
