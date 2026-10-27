import { FileQuestion, QrCode } from "lucide-react";
import type { DocumentRecord, Finding } from "@/lib/types";
import { cn } from "@/lib/display";

function FakeQr({ size = 52 }: { size?: number }) {
  const cells = Array.from({ length: 21 * 21 }, (_, index) => {
    const x = index % 21;
    const y = Math.floor(index / 21);
    const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
    const finderInner = finder && ((x > 1 && x < 5 && y > 1 && y < 5) || (x > 15 && x < 19 && y > 1 && y < 5) || (x > 1 && x < 5 && y > 15 && y < 19));
    const noise = (x * 7 + y * 13 + x * y) % 5 === 0;
    return finder ? (finderInner || ((x + y) % 2 === 0 && !finderInner) ? "bg-[#2c302b]" : "bg-transparent") : noise ? "bg-[#2c302b]" : "bg-transparent";
  });
  return (
    <div className="rounded-[2px] border border-[#d8d1c1] bg-[#fcfaf4] p-1" style={{ width: size + 8, height: size + 8 }}>
      <div className="grid h-full w-full gap-0" style={{ gridTemplateColumns: "repeat(21, 1fr)" }}>
        {cells.map((cell, index) => <span key={index} className={cn("aspect-square", cell)} />)}
      </div>
    </div>
  );
}

function BoundingBoxOverlay({
  highlight,
  showOverlay,
}: {
  highlight?: Finding;
  showOverlay: boolean;
}) {
  if (!showOverlay || !highlight?.bbox) return null;

  const rawBbox = highlight.bbox;
  const x = rawBbox.x ?? 0;
  const y = rawBbox.y ?? 0;
  const w = rawBbox.w ?? rawBbox.width ?? 30;
  const h = rawBbox.h ?? rawBbox.height ?? 15;
  const label =
    rawBbox.label ||
    (highlight.ruleType === "image_forensics"
      ? "Possible alteration"
      : highlight.title) ||
    "Flagged region";
  const conf =
    typeof highlight.confidence === "number"
      ? highlight.confidence.toFixed(2)
      : "0.85";

  return (
    <>
      <div
        className="absolute z-30 rounded-[2px] border-2 border-rust bg-rust/15 shadow-[0_0_0_1px_rgba(255,255,255,.5),0_0_24px_rgba(162,72,53,.25)] transition-all"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width: `${w}%`,
          height: `${h}%`,
        }}
      >
        <div className="absolute -top-[20px] left-[-2px] flex items-center gap-1.5 whitespace-nowrap rounded-t-[3px] bg-rust px-2 py-0.5 text-[7px] font-bold text-white shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <span>{label}</span>
          <span className="opacity-80">· {conf}</span>
        </div>
        {/* SVG vector boundary & corner crosshairs */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="none"
            stroke="#a24835"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          {/* Corner crosshairs */}
          <line x1="-3" y1="0" x2="5" y2="0" stroke="#a24835" strokeWidth="2" />
          <line x1="0" y1="-3" x2="0" y2="5" stroke="#a24835" strokeWidth="2" />
          <line x1="100%" y1="0" x2="calc(100% - 5px)" y2="0" stroke="#a24835" strokeWidth="2" />
          <line x1="100%" y1="-3" x2="100%" y2="5" stroke="#a24835" strokeWidth="2" />
        </svg>
        <span className="pointer-events-none absolute inset-0 animate-pulse-soft border border-white/40" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px animate-scan bg-gradient-to-r from-transparent via-pine/60 to-transparent" />
    </>
  );
}

function PaperShell({
  children,
  className,
  highlight,
  showOverlay,
}: {
  children: React.ReactNode;
  className?: string;
  highlight?: Finding;
  showOverlay?: boolean;
}) {
  return (
    <div className={cn("doc-paper relative mx-auto w-full max-w-[560px] overflow-hidden rounded-[2px]", className)}>
      {children}
      {highlight && showOverlay ? (
        <BoundingBoxOverlay highlight={highlight} showOverlay={showOverlay} />
      ) : null}
    </div>
  );
}

function AffidavitPreview({ highlight, showOverlay }: { highlight?: Finding; showOverlay: boolean }) {
  return (
    <PaperShell highlight={highlight} showOverlay={showOverlay}>
      <div className="relative px-9 pb-8 pt-7 sm:px-12">
        <div className="flex items-start justify-between border-b border-[#d9d2c1] pb-4">
          <div>
            <div className="doc-serif text-[9px] uppercase tracking-[0.22em] text-[#8a8474]">Before the Sub-Divisional Magistrate</div>
            <div className="doc-serif mt-1 text-[15px] text-[#2d312c]">Pune District · Maharashtra</div>
          </div>
          <div className="text-right">
            <div className="mono text-[6.5px] uppercase tracking-[0.14em] text-[#9a9384]">Stamp paper</div>
            <div className="mono mt-0.5 text-[8px] text-[#5e5d55]">MH-2026-1842</div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="doc-serif text-[22px] uppercase tracking-[0.08em] text-[#292d28]">Affidavit of Undertaking</div>
          <div className="doc-serif mt-1 text-[10px] italic text-[#777264]">For Extension of Approval · Academic Year 2026–27</div>
        </div>

        <div className="doc-serif mt-6 space-y-3.5 text-[9.5px] leading-[1.85] text-[#46483f]">
          <p>
            I, <span className="font-semibold">Rohan K. Deshmukh</span>, aged 48 years, residing at Baner, Pune, do hereby solemnly affirm
            and state on oath as follows:
          </p>
          <p>
            That I am the authorised signatory of <span className="font-semibold">Sunrise Institute of Technology</span>, Pune, and am
            competent to depose to the facts stated herein.
          </p>
          <p>
            That the institution has submitted an application for Extension of Approval for the academic year 2026–27 along with all
            supporting documents, and that the particulars furnished are true and correct to the best of my knowledge.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-y border-[#ded7c7] py-3">
          <div>
            <div className="mono text-[6.5px] uppercase tracking-[0.14em] text-[#9a9384]">Certificate no.</div>
            <div className="mono mt-1 text-[10px] font-medium text-[#343730]">AFF-2026-1842</div>
          </div>
          <div>
            <div className="mono text-[6.5px] uppercase tracking-[0.14em] text-[#9a9384]">Date of execution</div>
            <div className="mono mt-1 text-[10px] text-[#343730]">12 / 04 / 2026</div>
          </div>
        </div>

        <div className="doc-serif mt-5 text-[9.5px] leading-[1.85] text-[#46483f]">
          <p>That this affidavit is executed for the purposes of the AICTE application and no part of it is false or misleading.</p>
          <p className="mt-4">Deponent</p>
        </div>

        <div className="mt-9 flex items-end justify-between">
          <div className="flex items-end gap-3">
            <FakeQr size={44} />
            <div>
              <div className="mono text-[6px] uppercase tracking-[0.12em] text-[#9a9384]">Verify at</div>
              <div className="mono mt-0.5 text-[6.5px] text-[#5e5d55]">/verify/notary/AFF-2026-1842</div>
            </div>
          </div>
          <div className="text-right">
            <div className="doc-serif text-[15px] italic text-[#4a4b42]">R. K. Deshmukh</div>
            <div className="mt-1 border-t border-[#8f8a7b] pt-1 text-[6.5px] uppercase tracking-[0.12em] text-[#8a8474]">Notary · Pune</div>
          </div>
        </div>

        <div className="absolute right-10 top-[56%] flex h-[54px] w-[54px] rotate-[-8deg] items-center justify-center rounded-full border-2 border-[#9d8f75]/50 text-center text-[5.5px] uppercase leading-tight tracking-wider text-[#8e8068]/70">
          Notary<br />Seal<br />Pune
        </div>
      </div>
    </PaperShell>
  );
}

function NocPreview({ highlight, showOverlay }: { highlight?: Finding; showOverlay: boolean }) {
  return (
    <PaperShell highlight={highlight} showOverlay={showOverlay}>
      <div className="relative px-10 pb-8 pt-7 sm:px-12">
        <div className="flex items-center gap-4 border-b-2 border-[#8a2d26] pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#8a2d26] text-[7px] font-semibold uppercase leading-tight tracking-wider text-[#8a2d26]">
            SPPU<br />Pune
          </div>
          <div>
            <div className="doc-serif text-[13px] font-semibold uppercase tracking-[0.06em] text-[#512722]">Savitribai Phule Pune University</div>
            <div className="doc-serif mt-0.5 text-[8px] text-[#7d665f]">Ganeshkhind, Pune 411007 · Maharashtra, India</div>
          </div>
        </div>
        <div className="mt-6 text-center">
          <div className="doc-serif text-[21px] uppercase tracking-[0.09em] text-[#3b302d]">No Objection Certificate</div>
          <div className="mono mt-2 text-[7px] uppercase tracking-[0.16em] text-[#948a80]">Ref. SPPU/NOC/2026/0917</div>
        </div>
        <div className="doc-serif mt-6 space-y-3 text-[9.5px] leading-[1.85] text-[#4b453f]">
          <p>This is to certify that the university has no objection to the institution named below continuing its approved technical programmes for the academic year 2026–27, subject to compliance with applicable norms.</p>
          <div className="rounded-sm border border-[#ded7c8] bg-[#f6f2e7] px-4 py-3">
            <div className="grid grid-cols-[92px_1fr] gap-y-2 text-[8.5px]">
              <span className="text-[#8c8375]">Institution</span><span className="font-semibold">Sunrise Institute of Technical Education</span>
              <span className="text-[#8c8375]">Programmes</span><span>B.Tech · Civil, Mechanical, Computer, Electronics</span>
              <span className="text-[#8c8375]">Validity</span><span className="mono">01/06/2026 – 31/05/2027</span>
            </div>
          </div>
          <p>This certificate is issued on the basis of documents submitted and is valid for the period stated above.</p>
        </div>
        <div className="mt-8 flex items-end justify-between">
          <FakeQr size={54} />
          <div className="text-right">
            <div className="mb-2 inline-flex rotate-[-3deg] items-center gap-1 rounded border-2 border-pine/50 px-2 py-1 text-[7px] font-bold uppercase tracking-[0.12em] text-pine/70">
              Source verified
            </div>
            <div className="doc-serif text-[14px] italic text-[#4b453f]">Dr. S. A. Kulkarni</div>
            <div className="mt-0.5 text-[6.5px] uppercase tracking-[0.12em] text-[#8a8474]">Registrar · SPPU</div>
          </div>
        </div>
      </div>
    </PaperShell>
  );
}

function NbaPreview({ highlight, showOverlay }: { highlight?: Finding; showOverlay: boolean }) {
  return (
    <PaperShell highlight={highlight} showOverlay={showOverlay}>
      <div className="relative px-9 pb-8 pt-7 sm:px-12">
        <div className="flex items-start justify-between border-b border-[#cbbf9f] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#7e642d] bg-[#f4ead2] text-[7px] font-bold uppercase tracking-wider text-[#7e642d]">NBA</div>
            <div>
              <div className="doc-serif text-[13px] font-semibold uppercase tracking-[0.04em] text-[#493b21]">National Board of Accreditation</div>
              <div className="doc-serif mt-0.5 text-[7.5px] text-[#8a7a5c]">An autonomous body under AICTE · New Delhi</div>
            </div>
          </div>
          <div className="mono text-[6.5px] text-[#8a7a5c]">NBA/ENGG/2024/118</div>
        </div>
        <div className="mt-8 text-center">
          <div className="doc-serif text-[24px] uppercase tracking-[0.08em] text-[#3b3425]">Certificate of Accreditation</div>
          <div className="doc-serif mt-1 text-[9px] italic text-[#8a7a5c]">Tier I · Undergraduate Engineering Programme</div>
        </div>
        <div className="doc-serif mt-8 text-center text-[9.5px] leading-[1.9] text-[#4f493a]">
          This is to certify that the programme<br />
          <span className="mt-2 block text-[13px] font-semibold text-[#3b3425]">B.Tech Civil Engineering</span>
          <span className="mt-2 block">offered by</span>
          <span className="mt-2 block text-[11px] font-semibold text-[#3b3425]">Sunrise Institute of Technology, Pune</span>
          <span className="mt-2 block">has been accredited for a period of three years.</span>
        </div>
        <div className="mt-7 grid grid-cols-3 gap-2 border-y border-[#ded3ba] py-4 text-center">
          <div><div className="mono text-[6px] uppercase tracking-wider text-[#9a8c70]">Issued</div><div className="mono mt-1 text-[8.5px]">01/06/2023</div></div>
          <div><div className="mono text-[6px] uppercase tracking-wider text-[#9a8c70]">Valid to</div><div className="mono mt-1 text-[8.5px] font-semibold text-[#8a2d26]">31/05/2026</div></div>
          <div><div className="mono text-[6px] uppercase tracking-wider text-[#9a8c70]">Status</div><div className="mt-1 text-[8px] font-semibold">Accredited</div></div>
        </div>
        <div className="mt-7 flex items-end justify-between">
          <FakeQr size={46} />
          <div className="text-right">
            <div className="doc-serif text-[14px] italic text-[#4f493a]">Prof. A. K. Sharma</div>
            <div className="mt-0.5 text-[6.5px] uppercase tracking-[0.12em] text-[#8a7a5c]">Member Secretary · NBA</div>
          </div>
        </div>
        <div className="absolute left-1/2 top-[45%] -translate-x-1/2 rotate-[-9deg] rounded border-[3px] border-rust/60 px-4 py-1.5 text-[17px] font-bold uppercase tracking-[0.14em] text-rust/60">
          Expired
        </div>
      </div>
    </PaperShell>
  );
}

function FirePreview({ highlight, showOverlay }: { highlight?: Finding; showOverlay: boolean }) {
  return (
    <PaperShell highlight={highlight} showOverlay={showOverlay} className="rotate-[0.7deg]">
      <div className="relative px-9 pb-8 pt-7 sm:px-12">
        <div className="absolute inset-0 opacity-[0.08] [background-image:repeating-linear-gradient(0deg,transparent,transparent_3px,#4a4030_3px,#4a4030_4px)] pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between border-b-2 border-[#7b3d2e] pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#7b3d2e] text-[6.5px] font-bold uppercase leading-tight tracking-wider text-[#7b3d2e]">Pune<br />Fire</div>
              <div>
                <div className="doc-serif text-[13px] font-semibold uppercase tracking-[0.05em] text-[#4d2d24]">Pune Fire Brigade</div>
                <div className="doc-serif mt-0.5 text-[7.5px] text-[#7c655a]">Fire Safety Certificate · Maharashtra Fire Prevention Act, 2006</div>
              </div>
            </div>
            <div className="mono text-[6.5px] text-[#7c655a]">PFB/2026/4471</div>
          </div>
          <div className="mt-6 text-center">
            <div className="doc-serif text-[21px] uppercase tracking-[0.08em] text-[#3b302b]">Fire Safety Certificate</div>
            <div className="mono mt-1 text-[7px] uppercase tracking-[0.15em] text-[#948a80]">Form B · Renewal</div>
          </div>
          <div className="doc-serif mt-6 space-y-3 text-[9.5px] leading-[1.85] text-[#4b453f]">
            <p>This certificate is issued to the premises described below after inspection of the fire safety installations and means of escape.</p>
            <div className="rounded-sm border border-[#ded7c8] bg-[#f6f2e7]/80 px-4 py-3 text-[8.5px]">
              <div className="grid grid-cols-[90px_1fr] gap-y-2">
                <span className="text-[#8c8375]">Premises</span><span>S. No. 44, Baner, Pune 411045</span>
                <span className="text-[#8c8375]">Occupancy</span><span>Educational · Institutional</span>
                <span className="text-[#8c8375]">Valid to</span><span className="mono font-semibold">17/09/2027</span>
              </div>
            </div>
            <p>The certificate is subject to periodic inspection and maintenance of the installed fire safety systems.</p>
          </div>
          <div className="mt-9 flex items-end justify-between">
            <div className="mono text-[7px] text-[#8a8474]">Scanned copy · OCR confidence 0.83</div>
            <div className="text-right">
              <div className="doc-serif text-[14px] italic text-[#4b453f]">S. G. Patil</div>
              <div className="mt-0.5 text-[6.5px] uppercase tracking-[0.12em] text-[#8a8474]">Chief Fire Officer</div>
            </div>
          </div>
          <div className="absolute left-1/2 top-[48%] -translate-x-1/2 rotate-[-7deg] rounded border-2 border-slate/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate/60">
            Source unavailable
          </div>
        </div>
      </div>
    </PaperShell>
  );
}

function LandPreview({ highlight, showOverlay }: { highlight?: Finding; showOverlay: boolean }) {
  return (
    <PaperShell highlight={highlight} showOverlay={showOverlay}>
      <div className="relative px-9 pb-8 pt-7 sm:px-12">
        <div className="flex items-start justify-between border-b-2 border-[#5c4a30] pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#5c4a30] text-[6.5px] font-bold uppercase leading-tight tracking-wider text-[#5c4a30]">Revenue<br />Dept</div>
            <div>
              <div className="doc-serif text-[13px] font-semibold uppercase tracking-[0.05em] text-[#42331f]">Sub-Registrar of Assurances</div>
              <div className="doc-serif mt-0.5 text-[7.5px] text-[#78664f]">Government of Maharashtra · Registered Title & Lease Deed</div>
            </div>
          </div>
          <div className="mono text-[6.5px] text-[#78664f]">REG-LAND-2026</div>
        </div>
        <div className="mt-6 text-center">
          <div className="doc-serif text-[21px] uppercase tracking-[0.08em] text-[#332b21]">Registered Land Title Deed</div>
          <div className="mono mt-1 text-[7px] uppercase tracking-[0.15em] text-[#857b70]">Permanent Campus Site · Unencumbered Contiguous Possession</div>
        </div>
        <div className="doc-serif mt-6 space-y-3 text-[9.5px] leading-[1.85] text-[#45413a]">
          <p>This is to certify that the registered deed and revenue records for the institutional campus premises have been scrutinized and verified under APH norms.</p>
          <div className="rounded-sm border border-[#ded7c8] bg-[#f6f2e7]/80 px-4 py-3 text-[8.5px]">
            <div className="grid grid-cols-[100px_1fr] gap-y-2">
              <span className="text-[#8c8375]">Campus Location</span><span>Metropolitan Region · Western Division</span>
              <span className="text-[#8c8375]">Land Area</span><span className="mono font-semibold">Over 2.50 Contiguous Acres</span>
              <span className="text-[#8c8375]">Encumbrances</span><span className="font-semibold text-pine">Nil · Clear Registered Title</span>
            </div>
          </div>
          <p>Registered in Volume Index II of the competent sub-registry under the Indian Registration Act, 1908.</p>
        </div>
        <div className="mt-8 flex items-end justify-between">
          <FakeQr size={48} />
          <div className="text-right">
            <div className="doc-serif text-[14px] italic text-[#45413a]">V. R. Kulkarni</div>
            <div className="mt-0.5 text-[6.5px] uppercase tracking-[0.12em] text-[#857b70]">Sub-Registrar of Assurances</div>
          </div>
        </div>
      </div>
    </PaperShell>
  );
}

function TrustPreview({ highlight, showOverlay }: { highlight?: Finding; showOverlay: boolean }) {
  return (
    <PaperShell highlight={highlight} showOverlay={showOverlay}>
      <div className="px-10 pb-8 pt-7 sm:px-12">
        <div className="border-b-2 border-[#6f5b38] pb-3">
          <div className="doc-serif text-[11px] font-semibold uppercase tracking-[0.08em] text-[#433a28]">Office of the Charity Commissioner</div>
          <div className="doc-serif mt-0.5 text-[7.5px] text-[#827358]">Government of Maharashtra · Pune Division</div>
        </div>
        <div className="mt-7 text-center">
          <div className="doc-serif text-[21px] uppercase tracking-[0.09em] text-[#3b3425]">Certificate of Registration</div>
          <div className="doc-serif mt-1 text-[8px] italic text-[#8a7a5c]">Maharashtra Public Trusts Act, 1950</div>
        </div>
        <div className="doc-serif mt-7 space-y-3 text-[9.5px] leading-[1.9] text-[#4f493a]">
          <p>It is hereby certified that the public trust named below has been registered under the provisions of the Maharashtra Public Trusts Act, 1950.</p>
          <div className="grid grid-cols-[110px_1fr] gap-y-2 rounded-sm border border-[#ded3ba] bg-[#f6f2e7] px-4 py-3 text-[8.5px]">
            <span className="text-[#8a7a5c]">Trust name</span><span className="font-semibold">Sunrise Education Trust</span>
            <span className="text-[#8a7a5c]">Registration no.</span><span className="mono">F-18422/Pune</span>
            <span className="text-[#8a7a5c]">Registered on</span><span className="mono">18/07/2009</span>
            <span className="text-[#8a7a5c]">Status</span><span className="font-semibold text-pine">Active</span>
          </div>
          <p>The registration is valid and the trust continues to be governed by its registered trustees and rules.</p>
        </div>
        <div className="mt-9 flex items-end justify-between">
          <FakeQr size={48} />
          <div className="text-right">
            <div className="doc-serif text-[14px] italic text-[#4f493a]">P. M. Joshi</div>
            <div className="mt-0.5 text-[6.5px] uppercase tracking-[0.12em] text-[#8a7a5c]">Assistant Charity Commissioner</div>
          </div>
        </div>
      </div>
    </PaperShell>
  );
}

export function DocumentPreview({
  document,
  highlight,
  showOverlay,
  zoom,
}: {
  document: DocumentRecord;
  highlight?: Finding;
  showOverlay: boolean;
  zoom: number;
}) {
  return (
    <div className="relative flex min-h-[620px] items-start justify-center overflow-auto rounded-md border border-[#d7d0c0] bg-[#e9e4d8] p-5 sm:p-8">
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-25" />
      <div className="relative z-10 w-full origin-top transition-transform duration-200" style={{ transform: `scale(${zoom})` }}>
        {document.status === "missing" ? (
          <div className="mx-auto flex min-h-[430px] w-full max-w-[560px] flex-col items-center justify-center rounded-[2px] border border-dashed border-[#bdb4a2] bg-[#f5f1e7]/70 px-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line-strong bg-surface text-muted">
              <FileQuestion className="h-5 w-5" />
            </div>
            <div className="display mt-4 text-[25px] text-ink">Document not provided</div>
            <p className="mt-2 max-w-[320px] text-[12.5px] leading-relaxed text-muted">
              The land & ownership document is required by the 2026–27 checklist. A missing item is not a rejection.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[11.5px] text-muted">
              <QrCode className="h-3.5 w-3.5" /> Waiting for institution upload
            </div>
          </div>
        ) : document.type === "affidavit" ? (
          <AffidavitPreview highlight={highlight} showOverlay={showOverlay} />
        ) : document.type.includes("noc") ? (
          <NocPreview highlight={highlight} showOverlay={showOverlay} />
        ) : document.type.includes("accreditation") || document.type.includes("nba") ? (
          <NbaPreview highlight={highlight} showOverlay={showOverlay} />
        ) : document.type.includes("fire") ? (
          <FirePreview highlight={highlight} showOverlay={showOverlay} />
        ) : document.type.includes("land") ? (
          <LandPreview highlight={highlight} showOverlay={showOverlay} />
        ) : (
          <TrustPreview highlight={highlight} showOverlay={showOverlay} />
        )}
      </div>
    </div>
  );
}
