"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  Building2,
  Check,
  CheckCheck,
  Copy,
  Eye,
  EyeOff,
  FileCheck2,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/display";
import { BrandMark } from "@/components/logo";

const loginModes = [
  {
    id: "aicte" as const,
    label: "AICTE Login",
    sublabel: "Scrutiny Authority",
    icon: ScanLine,
  },
  {
    id: "college" as const,
    label: "College Login",
    sublabel: "Technical Institution",
    icon: Building2,
  },
];

interface DemoAccount {
  id: string;
  category: "aicte" | "college";
  roleName: string;
  roleBadge: string;
  badgeTone: "pine" | "ochre" | "slate";
  email: string;
  password: string;
  institutionName?: string;
  appId?: string;
  description: string;
  targetRole: "scrutiny_officer" | "institution";
  targetCollege?: string;
  targetUrl: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "aicte-officer",
    category: "aicte",
    roleName: "AICTE Scrutiny Officer",
    roleBadge: "Scrutiny Desk",
    badgeTone: "pine",
    email: "officer@aicte.gov.in",
    password: "AICTE@Officer2026",
    description: "AICTE Scrutiny Desk authority. Inspect EoA applications, side-by-side OCR diffs, tamper heatmaps, and issue regulatory decisions.",
    targetRole: "scrutiny_officer",
    targetUrl: "/overview",
  },
  {
    id: "spit-mumbai",
    category: "college",
    roleName: "Sardar Patel Inst. of Technology",
    roleBadge: "SPIT · Mumbai",
    badgeTone: "pine",
    email: "principal@spit.ac.in",
    password: "SPIT@Mumbai2026",
    institutionName: "Sardar Patel Institute of Technology",
    appId: "APP-2026-8941",
    description: "Benchmark autonomous institution. Clean documents, verified credentials, zero discrepancy checklist.",
    targetRole: "institution",
    targetCollege: "sardarpatel",
    targetUrl: "/institution?college=sardarpatel",
  },
  {
    id: "dmce-airoli",
    category: "college",
    roleName: "Datta Meghe College of Engg.",
    roleBadge: "DMCE · Airoli",
    badgeTone: "pine",
    email: "principal@dmce.ac.in",
    password: "DMCE@Airoli2026",
    institutionName: "Datta Meghe College of Engineering",
    appId: "APP-2026-9045",
    description: "Self-financing technical institution in Airoli, Navi Mumbai. Multi-program engineering EoA submission.",
    targetRole: "institution",
    targetCollege: "dattameghe",
    targetUrl: "/institution?college=dattameghe",
  },
  {
    id: "ltce-navi-mumbai",
    category: "college",
    roleName: "Lokmanya Tilak College of Engg.",
    roleBadge: "LTCE · Discrepancy",
    badgeTone: "ochre",
    email: "principal@ltce.in",
    password: "LTCE@NaviMumbai2026",
    institutionName: "Lokmanya Tilak College of Engineering",
    appId: "APP-2026-9012",
    description: "Discrepancy test scenario. Flags cross-institution land title plagiarism and digital alterations.",
    targetRole: "institution",
    targetCollege: "ltce",
    targetUrl: "/institution?college=ltce",
  },
];

function EvidenceVisual() {
  return (
    <div className="relative h-[275px] w-[345px] select-none scale-[1.15] xl:scale-[1.20] 2xl:scale-[1.24] origin-left">
      {/* Background document */}
      <div className="absolute left-[4%] top-[6%] h-[215px] w-[265px] rotate-[-7deg] rounded-[3px] border border-[#d6cfbe] bg-[#f9f5e9] shadow-paper">
        <div className="space-y-2 p-5 opacity-55">
          <div className="h-1.5 w-20 rounded bg-[#9c9b8f]" />
          <div className="mt-4 h-1 w-4/5 rounded bg-[#c5c0b4]" />
          <div className="h-1 w-3/5 rounded bg-[#c5c0b4]" />
          <div className="h-1 w-11/12 rounded bg-[#c5c0b4]" />
          <div className="h-1 w-2/3 rounded bg-[#c5c0b4]" />
        </div>
      </div>

      {/* Foreground document (Affidavit) */}
      <div className="absolute left-[14%] top-[12%] h-[225px] w-[275px] rotate-[3.5deg] rounded-[3px] border border-[#d4ccba] bg-[#fcf8ed] shadow-paper">
        <div className="flex items-center justify-between border-b border-[#e5dece] px-5 pb-2.5 pt-3.5">
          <div>
            <div className="font-mono text-[7px] uppercase tracking-[0.18em] text-[#918d7f]">AICTE · EoA 2026–27</div>
            <div className="mt-0.5 font-serif text-[14px] text-[#33372f]">Affidavit of Undertaking</div>
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#c8bea8] text-[6.5px] font-semibold uppercase tracking-wider text-[#8b8069]">
            Seal
          </div>
        </div>
        <div className="space-y-2 px-5 py-3.5 opacity-75">
          <div className="h-1 w-4/5 rounded bg-[#b9b4a7]" />
          <div className="h-1 w-11/12 rounded bg-[#c7c2b5]" />
          <div className="h-1 w-3/4 rounded bg-[#c7c2b5]" />
          <div className="h-1 w-5/6 rounded bg-[#c7c2b5]" />
          <div className="mt-3 flex gap-2.5">
            <div className="h-7 w-20 rounded-sm border border-[#ddd5c3] bg-[#f2ecdd]" />
            <div className="space-y-1 pt-0.5">
              <div className="h-1 w-20 rounded bg-[#c7c2b5]" />
              <div className="h-1 w-14 rounded bg-[#c7c2b5]" />
            </div>
          </div>
          <div className="mt-2.5 h-1 w-2/3 rounded bg-[#c7c2b5]" />
        </div>
        <div className="absolute bottom-3.5 right-5 font-serif text-[13px] italic text-[#6f6c60]">R. K. Deshmukh</div>
      </div>

      {/* Advisory badge: Possible alteration */}
      <div className="absolute right-0 top-[24%] w-[176px] rotate-[-2deg] rounded-[6px] border border-[#c9c1af] bg-[#fbfaf5] p-2.5 shadow-paper animate-fade-up [animation-delay:280ms]">
        <div className="flex items-center gap-2 border-b border-[#e6dfcf] pb-2">
          <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-ochre-soft text-ochre">
            <Fingerprint className="h-3 w-3" />
          </span>
          <div>
            <div className="text-[8.5px] font-semibold text-[#2b302b]">Possible alteration</div>
            <div className="font-mono text-[6.5px] uppercase tracking-wider text-[#9a8e77]">Advisory indicator</div>
          </div>
          <span className="ml-auto font-mono text-[7px] text-ochre">0.81</span>
        </div>
        <div className="mt-2 space-y-1">
          <div className="h-1 w-full rounded bg-[#e5dfd1]" />
          <div className="h-1 w-4/5 rounded bg-[#e5dfd1]" />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono text-[6.5px] text-[#8d8a80]">ELA · page 1</span>
          <span className="rounded-full bg-ochre-soft px-1.5 py-0.5 text-[6.5px] font-semibold text-ochre">Human review</span>
        </div>
      </div>

      {/* Verified badge: QR source verified */}
      <div className="absolute left-[9%] bottom-[13%] flex w-[156px] items-center gap-2 rounded-md border border-[#cfc8b8] bg-[#fbfaf4] px-2.5 py-1.5 shadow-card animate-fade-up [animation-delay:440ms]">
        <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-pine-soft text-pine">
          <Check className="h-3 w-3" />
        </span>
        <div>
          <div className="text-[8px] font-semibold text-[#2b302b]">QR source verified</div>
          <div className="font-mono text-[6.5px] text-[#8d8a80]">SPPU/NOC/2026/0917</div>
        </div>
      </div>

      {/* Bottom pill: Human decision required */}
      <div className="absolute -bottom-1 left-[22%] flex items-center gap-1.5 rounded-full border border-[#d2c9b7] bg-[#f8f4e9]/95 px-2.5 py-1 text-[7.5px] font-medium text-[#716b5d] shadow-card backdrop-blur-sm">
        <LockKeyhole className="h-2.5 w-2.5" />
        Human decision required · audit logged
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"aicte" | "college">("aicte");
  // Default pre-fills:
  const [email, setEmail] = useState("officer@aicte.gov.in");
  const [password, setPassword] = useState("AICTE@Officer2026");
  const [showPassword, setShowPassword] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideFilter, setGuideFilter] = useState<"all" | "aicte" | "college">("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [quickFillSuccess, setQuickFillSuccess] = useState<string | null>(null);

  const handleModeChange = (newMode: "aicte" | "college") => {
    setMode(newMode);
    setAuthError(null);
    setQuickFillSuccess(null);
    if (newMode === "aicte") {
      setEmail("officer@aicte.gov.in");
      setPassword("AICTE@Officer2026");
    } else {
      setEmail("principal@spit.ac.in");
      setPassword("SPIT@Mumbai2026");
    }
  };

  const handleQuickFill = (acc: DemoAccount, autoSubmit = false) => {
    setMode(acc.category);
    setEmail(acc.email);
    setPassword(acc.password);
    setAuthError(null);
    setQuickFillSuccess(`Pre-filled: ${acc.roleName}`);
    setGuideOpen(false);

    if (autoSubmit) {
      window.localStorage.setItem("scrutinix-role", acc.targetRole);
      if (acc.targetCollege) {
        window.localStorage.setItem("scrutinix-college", acc.targetCollege);
      }
      router.push(acc.targetUrl);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setAuthError(null);

    const cleanEmail = email.trim().toLowerCase();

    // Check against canonical demo accounts
    const demoAccount = DEMO_ACCOUNTS.find(
      (acc) => acc.email.toLowerCase() === cleanEmail
    );

    if (demoAccount) {
      // Validate the password entered against the demo account
      if (password !== demoAccount.password) {
        setAuthError(
          `Invalid password for ${demoAccount.email}. Please use the pre-filled password or consult the Demo Login Guide.`
        );
        setSubmitting(false);
        return;
      }

      window.localStorage.setItem("scrutinix-role", demoAccount.targetRole);
      if (demoAccount.targetCollege) {
        window.localStorage.setItem("scrutinix-college", demoAccount.targetCollege);
      }
      router.push(demoAccount.targetUrl);
      return;
    }

    // Fallback: Supabase Auth for any non-demo seeded accounts
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error) {
        setAuthError(error.message || "Invalid credentials. Please check your email and password.");
        setSubmitting(false);
        return;
      }

      if (mode === "aicte" || cleanEmail.includes("aicte.gov.in")) {
        window.localStorage.setItem("scrutinix-role", "scrutiny_officer");
        router.push("/overview");
      } else {
        const meta = data?.user?.user_metadata || {};
        let college = "sardarpatel";
        if (
          cleanEmail.includes("dmce") ||
          meta.institution === "dattameghe" ||
          meta.institution_id === "1-4589211021"
        ) {
          college = "dattameghe";
        } else if (
          cleanEmail.includes("ltce") ||
          meta.institution_id === "1-10358461" ||
          meta.institution === "ltce"
        ) {
          college = "ltce";
        }
        window.localStorage.setItem("scrutinix-role", "institution");
        window.localStorage.setItem("scrutinix-college", college);
        router.push(`/institution?college=${college}`);
      }
    } catch (err: any) {
      console.error("Sign-in exception:", err);
      setAuthError(err?.message || "An unexpected error occurred during sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredAccounts = DEMO_ACCOUNTS.filter((acc) => {
    if (guideFilter === "all") return true;
    return acc.category === guideFilter;
  });

  return (
    <main className="h-screen max-h-screen w-screen overflow-hidden bg-paper lg:grid lg:grid-cols-[1.25fr_0.75fr] xl:grid-cols-[1.28fr_0.72fr]">
      {/* Left hero column */}
      <section className="relative hidden h-screen overflow-hidden border-r border-line bg-[#eee9dd] px-8 py-7 lg:flex lg:flex-col justify-between xl:px-12 2xl:px-16">
        <div className="pointer-events-none absolute inset-0 dot-grid opacity-[0.35]" />
        <div className="pointer-events-none absolute -right-32 top-1/4 h-[440px] w-[440px] rounded-full border border-[#d8d1c1] opacity-60" />
        <div className="pointer-events-none absolute -right-20 top-1/4 h-[280px] w-[280px] rounded-full border border-[#d8d1c1] opacity-60" />

        {/* Top header */}
        <div className="relative z-10 flex items-center gap-3">
          <BrandMark />
          <div>
            <div className="display text-[25px] leading-none">ScrutiniX</div>
            <div className="mt-1 text-[8.5px] font-semibold uppercase tracking-[0.19em] text-[#7d7b70]">AICTE scrutiny suite</div>
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-full border border-[#d4cdbd] bg-[#f7f3e9]/70 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-pine" />
            <span className="text-[9px] font-medium text-[#706c60]">Internal Scrutiny Portal</span>
          </div>
        </div>

        {/* Hero Section: Text beside Document Graphic */}
        <div className="relative z-10 my-auto flex items-center justify-between gap-6 pr-10 xl:gap-10 xl:pr-14">
          <div className="max-w-[390px] xl:max-w-[430px] shrink-0">
            <div className="eyebrow text-[#8d897d]">AICTE · EoA Renewal 2026–27</div>
            <h1 className="display mt-3 text-[58px] leading-[0.93] text-[#202720] xl:text-[72px] 2xl:text-[78px]">
              Evidence before
              <br />
              opinion.
            </h1>
            <p className="mt-4 text-[13px] leading-[1.75] text-[#6e7067]">
              ScrutiniX reads every document, surfaces what needs a human eye, and keeps a
              tamper-evident record of why. Built for scrutiny that holds up.
            </p>
          </div>

          <div className="relative flex shrink-0 items-center justify-center">
            <EvidenceVisual />
          </div>
        </div>

        {/* Bottom badges */}
        <div className="relative z-10 flex items-center gap-5 border-t border-[#d8d1c1] pt-4 text-[9px] text-[#7d7a6f]">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /> Advisory by design</span>
          <span className="flex items-center gap-1.5"><UserRoundCheck className="h-3 w-3" /> Human decisions only</span>
          <span className="flex items-center gap-1.5"><FileCheck2 className="h-3 w-3" /> Tamper-evident trail</span>
          <span className="mono ml-auto">v1.0 · active</span>
        </div>
      </section>

      {/* Right sign-in column */}
      <section className="relative flex h-screen max-h-screen overflow-hidden flex-col justify-between px-6 py-5 sm:px-10 lg:px-12 xl:px-16">
        <div className="flex items-center gap-3 lg:hidden">
          <BrandMark size={34} />
          <div>
            <div className="display text-[22px] leading-none">ScrutiniX</div>
            <div className="mt-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-muted">AICTE scrutiny suite</div>
          </div>
        </div>

        <div className="mx-auto my-auto w-full max-w-[400px] animate-fade-up">
          <div className="eyebrow">Sign in</div>
          <h2 className="display mt-1.5 text-[34px] leading-[1] xl:text-[36px]">Enter the scrutiny desk</h2>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
            Select your designated portal role to enter the workspace.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {loginModes.map((m) => {
              const Icon = m.icon;
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleModeChange(m.id)}
                  className={cn(
                    "group relative flex flex-col justify-between rounded-xl border p-3 text-left transition-all",
                    active
                      ? "border-pine bg-pine-soft/70 shadow-[inset_0_0_0_1px_rgba(28,84,68,.18)]"
                      : "border-line bg-surface hover:border-line-strong hover:bg-[#f8f5ed]",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg border",
                        active ? "border-pine/30 bg-pine text-white" : "border-line bg-paper text-muted",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {active ? (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-pine text-white">
                        <Check className="h-2.5 w-2.5 stroke-[2.5]" />
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2.5">
                    <div className={cn("text-[12.5px] font-semibold leading-tight", active ? "text-pine-deep" : "text-ink")}>
                      {m.label}
                    </div>
                    <div className="mt-0.5 text-[9.5px] font-mono text-muted">{m.sublabel}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="email" className="block text-[10px] font-semibold text-ink">
                  {mode === "aicte" ? "Official AICTE Email" : "Institutional Email Address"}
                </label>
                <span className="text-[9px] font-mono text-pine font-medium">Pre-filled</span>
              </div>
              <input
                id="email"
                type="email"
                required
                className="input text-[12.5px]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={mode === "aicte" ? "officer@aicte.gov.in" : "e.g. principal@college.edu.in"}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-[10px] font-semibold text-ink">
                  Password
                </label>
                <span className="text-[9px] font-mono text-pine font-medium">Pre-filled</span>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="input tracking-wider text-[12.5px] pr-10 font-mono"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink transition-colors rounded focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {quickFillSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-pine/30 bg-pine-soft/60 px-3 py-1.5 text-[11px] text-pine-deep font-medium animate-fade-in">
                <Sparkles className="h-3.5 w-3.5 text-pine shrink-0" />
                <span>{quickFillSuccess}</span>
              </div>
            )}

            {authError && (
              <div className="rounded-lg border border-rust/30 bg-rust-soft/50 px-3 py-2 text-[11px] text-rust font-medium">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary mt-1 h-[40px] w-full justify-between px-4 text-[12.5px] disabled:opacity-70"
            >
              <span>{submitting ? "Signing in…" : mode === "aicte" ? "Continue to Scrutiny Desk" : "Continue to College Portal"}</span>
              <ArrowRight className={cn("h-4 w-4 transition-transform", submitting ? "translate-x-1" : "group-hover:translate-x-0.5")} />
            </button>

            {/* Demo Login Guide Button directly below the login button */}
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="group relative flex w-full items-center justify-between rounded-lg border border-line-strong/80 bg-[#fbf9f4] hover:bg-pine-soft/40 hover:border-pine/50 px-3.5 py-2 text-left transition-all shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-paper border border-line text-pine group-hover:bg-pine group-hover:text-white transition-colors">
                  <KeyRound className="h-3.5 w-3.5" />
                </span>
                <div>
                  <div className="text-[11.5px] font-semibold text-ink group-hover:text-pine-deep">
                    Demo Login Guide
                  </div>
                  <div className="text-[9.5px] text-muted">
                    View &amp; 1-click fill all AICTE &amp; College test credentials
                  </div>
                </div>
              </div>
              <span className="rounded-full bg-paper px-2 py-0.5 text-[9px] font-mono font-medium text-pine border border-line">
                4 Logins
              </span>
            </button>
          </form>

          <div className="mt-3.5 flex items-start gap-2.5 rounded-lg border border-line bg-[#f7f4ec] p-2.5">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pine" />
            <p className="text-[9.5px] leading-relaxed text-muted">
              <span className="font-semibold text-ink">Decision-support only.</span> ScrutiniX never rejects or approves an
              application. Outcomes are recorded by authorised AICTE officers and sealed in the audit chain.
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between text-[9px] text-muted">
            <span>AICTE National Portal · Scrutiny Authentication</span>
            <span className="mono">SECURE ENVIRONMENT</span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[400px] border-t border-line pt-2.5 text-center text-[8.5px] text-[#999b92]">
          AICTE · All India Council for Technical Education · Internal prototype
        </div>
      </section>

      {/* Demo Login Guide Modal Popup */}
      {guideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-in">
          <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-line bg-paper shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line bg-surface px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pine-soft text-pine border border-pine/20">
                  <KeyRound className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-[16px] font-bold text-ink">Demo Login Guide</h3>
                  <p className="text-[11px] text-muted">
                    Pre-configured credentials with 1-click Quick Fill for testing all ScrutiniX workflows
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="rounded-lg p-1.5 text-muted hover:text-ink hover:bg-paper transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between border-b border-line bg-[#faf8f2] px-6 py-2.5">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setGuideFilter("all")}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all",
                    guideFilter === "all"
                      ? "bg-pine text-white"
                      : "text-muted hover:text-ink hover:bg-surface"
                  )}
                >
                  All Credentials (4)
                </button>
                <button
                  type="button"
                  onClick={() => setGuideFilter("aicte")}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all",
                    guideFilter === "aicte"
                      ? "bg-pine text-white"
                      : "text-muted hover:text-ink hover:bg-surface"
                  )}
                >
                  AICTE Officer (1)
                </button>
                <button
                  type="button"
                  onClick={() => setGuideFilter("college")}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all",
                    guideFilter === "college"
                      ? "bg-pine text-white"
                      : "text-muted hover:text-ink hover:bg-surface"
                  )}
                >
                  Institutions (3)
                </button>
              </div>
              <div className="text-[10px] text-muted font-mono hidden sm:block">
                Click Quick Fill to auto-populate
              </div>
            </div>

            {/* Accounts List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3.5 bg-paper">
              {filteredAccounts.map((acc) => {
                const isAicte = acc.category === "aicte";
                return (
                  <div
                    key={acc.id}
                    className="rounded-xl border border-line bg-surface p-4 hover:border-line-strong transition-all shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold",
                            isAicte ? "bg-pine-soft text-pine" : "bg-[#f4efe2] text-[#827254]"
                          )}
                        >
                          {isAicte ? <ScanLine className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
                        </span>
                        <div>
                          <span className="text-[13px] font-bold text-ink">{acc.roleName}</span>
                          {acc.appId && (
                            <span className="ml-2 font-mono text-[10px] text-muted">
                              ({acc.appId})
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[9.5px] font-mono font-semibold uppercase tracking-wider",
                          acc.badgeTone === "pine"
                            ? "bg-pine-soft text-pine border border-pine/20"
                            : acc.badgeTone === "ochre"
                            ? "bg-ochre-soft text-ochre border border-ochre/20"
                            : "bg-[#ece8df] text-muted border border-line"
                        )}
                      >
                        {acc.roleBadge}
                      </span>
                    </div>

                    <p className="mt-2 text-[11px] text-muted leading-relaxed">
                      {acc.description}
                    </p>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {/* Email pill */}
                      <div className="flex items-center justify-between rounded-lg border border-line bg-paper px-2.5 py-1.5 font-mono">
                        <div className="truncate mr-2">
                          <span className="text-[9px] uppercase tracking-wider text-muted block font-sans">Email ID</span>
                          <span className="text-ink select-all">{acc.email}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(acc.email, `${acc.id}-email`)}
                          title="Copy Email"
                          className="shrink-0 p-1 text-muted hover:text-ink rounded transition-colors"
                        >
                          {copiedKey === `${acc.id}-email` ? (
                            <CheckCheck className="h-3.5 w-3.5 text-pine" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Password pill */}
                      <div className="flex items-center justify-between rounded-lg border border-line bg-paper px-2.5 py-1.5 font-mono">
                        <div className="truncate mr-2">
                          <span className="text-[9px] uppercase tracking-wider text-muted block font-sans">Password</span>
                          <span className="text-pine-deep font-semibold select-all">{acc.password}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(acc.password, `${acc.id}-pwd`)}
                          title="Copy Password"
                          className="shrink-0 p-1 text-muted hover:text-ink rounded transition-colors"
                        >
                          {copiedKey === `${acc.id}-pwd` ? (
                            <CheckCheck className="h-3.5 w-3.5 text-pine" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-line/60">
                      <button
                        type="button"
                        onClick={() => handleQuickFill(acc, false)}
                        className="btn btn-secondary h-8 px-3 text-[11px] flex items-center gap-1.5"
                      >
                        <KeyRound className="h-3 w-3" />
                        <span>Pre-fill in Login Form</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickFill(acc, true)}
                        className="btn btn-primary h-8 px-3 text-[11px] flex items-center gap-1.5"
                      >
                        <span>1-Click Sign In</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-line bg-surface px-6 py-3 text-[11px] text-muted">
              <span>All 4 demo accounts are pre-configured in local test mode</span>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="btn btn-secondary h-7 px-3 text-[11px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}