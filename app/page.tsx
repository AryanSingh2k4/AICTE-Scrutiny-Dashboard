"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  Building2,
  Check,
  FileCheck2,
  Fingerprint,
  GraduationCap,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { cn } from "@/lib/display";
import type { Role } from "@/lib/types";
import { BrandMark, Logo } from "@/components/logo";

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
  const [email, setEmail] = useState("officer@aicte.gov.in");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleModeChange = (newMode: "aicte" | "college") => {
    setMode(newMode);
    setAuthError(null);
    setPassword("");
    if (newMode === "aicte") {
      setEmail("officer@aicte.gov.in");
    } else {
      setEmail("");
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setAuthError(null);

    const cleanEmail = email.trim().toLowerCase();

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
      <section className="relative flex h-screen max-h-screen overflow-hidden flex-col justify-between px-6 py-6 sm:px-10 lg:px-12 xl:px-16">
        <div className="flex items-center gap-3 lg:hidden">
          <BrandMark size={34} />
          <div>
            <div className="display text-[22px] leading-none">ScrutiniX</div>
            <div className="mt-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-muted">AICTE scrutiny suite</div>
          </div>
        </div>

        <div className="mx-auto my-auto w-full max-w-[398px] animate-fade-up">
          <div className="eyebrow">Sign in</div>
          <h2 className="display mt-1.5 text-[36px] leading-[1] xl:text-[38px]">Enter the scrutiny desk</h2>
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
            Select your designated portal role to enter the workspace.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
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

          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            <div>
              <label htmlFor="email" className="mb-1 block text-[10px] font-semibold text-ink">
                {mode === "aicte" ? "Official AICTE Email" : "Institutional Email Address"}
              </label>
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
              <label htmlFor="password" className="mb-1 block text-[10px] font-semibold text-ink">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="input tracking-wider text-[12.5px]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {authError && (
              <div className="rounded-lg border border-rust/30 bg-rust-soft/50 px-3 py-2 text-[11px] text-rust font-medium">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary mt-2 h-[42px] w-full justify-between px-4 text-[12.5px] disabled:opacity-70"
            >
              <span>{submitting ? "Signing in…" : mode === "aicte" ? "Continue to Scrutiny Desk" : "Continue to College Portal"}</span>
              <ArrowRight className={cn("h-4 w-4 transition-transform", submitting ? "translate-x-1" : "group-hover:translate-x-0.5")} />
            </button>
          </form>

          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-line bg-[#f7f4ec] p-3">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pine" />
            <p className="text-[9.5px] leading-relaxed text-muted">
              <span className="font-semibold text-ink">Decision-support only.</span> ScrutiniX never rejects or approves an
              application. Outcomes are recorded by authorised AICTE officers and sealed in the audit chain.
            </p>
          </div>

          <div className="mt-3.5 flex items-center justify-between text-[9px] text-muted">
            <span>AICTE National Portal · Scrutiny Authentication</span>
            <span className="mono">SECURE ENVIRONMENT</span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[398px] border-t border-line pt-3 text-center text-[8.5px] text-[#999b92]">
          AICTE · All India Council for Technical Education · Internal prototype
        </div>
      </section>
    </main>
  );
}
