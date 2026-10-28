"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import {
  Bell,
  Building2,
  Check,
  ChevronRight,
  Command,
  FileStack,
  HelpCircle,
  Inbox,
  LayoutGrid,
  LogOut,
  Menu,
  PanelLeftClose,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UploadCloud,
  X,
} from "lucide-react";
import { cn } from "@/lib/display";
import { BrandMark } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";
import { CURRENT_OFFICER } from "@/lib/officer/identity";
import type { Application } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  icon: any;
  count?: string;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const officerNavigation = (counts: { applications: number; reviewQueue: number }): NavSection[] => [
  {
    label: "Regulatory Scrutiny",
    items: [
      { href: "/overview", label: "Desk Overview", icon: LayoutGrid },
      { href: "/applications", label: "Applications", icon: FileStack, count: counts.applications > 0 ? String(counts.applications) : undefined },
      { href: "/review", label: "Review Queue", icon: Inbox, count: counts.reviewQueue > 0 ? String(counts.reviewQueue) : undefined },
    ],
  },
  {
    label: "Governance & Audit",
    items: [
      { href: "/rules", label: "Rules & Checklists", icon: SlidersHorizontal },
      { href: "/audit", label: "Cryptographic Audit", icon: ShieldCheck },
    ],
  },
];

const institutionNavigation: NavSection[] = [
  {
    label: "Compliance Workspace",
    items: [
      { href: "/institution?tab=submission", label: "1. Document Upload", icon: UploadCloud },
      { href: "/institution?tab=status", label: "2. Scrutiny Status", icon: Inbox },
      { href: "/institution?tab=records", label: "3. AICTE Master Record", icon: FileStack },
      { href: "/institution?tab=receipt", label: "4. Official Receipt", icon: ShieldCheck },
    ],
  },
];

const roleNames: Record<string, { label: string; name: string; initials: string; college?: string }> = {
  scrutiny_officer: { label: CURRENT_OFFICER.roleLabel, name: CURRENT_OFFICER.name, initials: CURRENT_OFFICER.initials },
  senior_officer: { label: "Senior Regional Officer", name: "Dr. Vikram Sethi", initials: "VS" },
  institution: { label: "Principal", name: "Dr. B. K. Murthy", initials: "SP", college: "Sardar Patel Inst. of Tech" },
  auditor: { label: "Independent Auditor", name: "Meera Rao", initials: "MR" },
};

const institutionContext: Record<string, { name: string; short: string; pid: string; principal: string }> = {
  dattameghe: { name: "Datta Meghe College of Engineering (DMCE)", short: "DM", pid: "1-4589211021", principal: "Dr. Sudhirkumar D. Sawarkar" },
  ltce: { name: "Lokmanya Tilak College of Engineering (LTCE)", short: "LT", pid: "1-10358461", principal: "Dr. Subhash K. Shinde" },
  sardarpatel: { name: "Sardar Patel Institute of Technology (SPIT)", short: "SP", pid: "1-3686579303", principal: "Dr. B. K. Murthy" },
};

const breadcrumbLabels: Record<string, string> = {
  overview: "Desk Overview",
  applications: "Applications",
  review: "Review Queue",
  rules: "Rules & Checklists",
  audit: "Cryptographic Audit",
  institution: "College Portal",
};

function Sidebar({
  pathname,
  mobileOpen,
  closeMobile,
  collapsed,
  toggleCollapsed,
  counts,
}: {
  pathname: string;
  mobileOpen: boolean;
  closeMobile: () => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
  counts: { applications: number; reviewQueue: number };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab") || "submission";

  const [role, setRole] = useState("scrutiny_officer");
  const [college, setCollege] = useState("sardarpatel");
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("scrutinix-role");
    if (stored && roleNames[stored]) {
      setRole(stored);
    } else if (pathname.startsWith("/institution")) {
      setRole("institution");
    }
    const storedCollege = window.localStorage.getItem("scrutinix-college");
    const paramCollege = searchParams?.get("college");
    if (paramCollege) {
      setCollege(paramCollege);
    } else if (storedCollege) {
      setCollege(storedCollege);
    }
  }, [pathname, searchParams]);

  const isInstitution = role === "institution" || pathname.startsWith("/institution");
  const navigation = isInstitution ? institutionNavigation : officerNavigation(counts);
  const user = useMemo(() => {
    if (isInstitution) {
      if (college === "dattameghe") {
        return {
          label: "Principal, DMCE",
          name: "Dr. Sudhirkumar D. Sawarkar",
          initials: "DM",
          college: "Datta Meghe College of Engg.",
        };
      }
      if (college === "ltce") {
        return {
          label: "Principal, LTCE",
          name: "Dr. Subhash K. Shinde",
          initials: "LT",
          college: "Lokmanya Tilak College of Engg.",
        };
      }
      return {
        label: "Principal, SPIT",
        name: "Dr. B. K. Murthy",
        initials: "SP",
        college: "Sardar Patel Inst. of Tech",
      };
    }
    return roleNames[role] || roleNames.scrutiny_officer;
  }, [isInstitution, college, role]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px] transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={closeMobile}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-surface pb-4 pt-5 transition-all duration-200 lg:z-20 lg:translate-x-0",
          mobileOpen ? "translate-x-0 w-[244px] px-4" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-[68px] lg:px-2.5" : "lg:w-[244px] lg:px-4",
        )}
      >
        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3 px-1.5")}>
          {collapsed ? (
            <button
              onClick={toggleCollapsed}
              className="flex items-center justify-center rounded-lg transition-transform hover:scale-105"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <BrandMark />
            </button>
          ) : (
            <>
              <BrandMark />
              <div className="min-w-0 flex-1">
                <div className="display text-[22px] leading-none tracking-[-0.03em]">ScrutiniX</div>
                <div className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted">
                  AICTE scrutiny suite
                </div>
              </div>
              <button
                onClick={toggleCollapsed}
                className="btn-ghost hidden h-7 w-7 items-center justify-center rounded-md text-muted hover:text-ink lg:flex"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            onClick={closeMobile}
            className="btn-ghost ml-auto flex h-8 w-8 items-center justify-center rounded-md lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex-1 overflow-y-auto no-scrollbar">
          {navigation.map((section, sIdx) => (
            <div key={section.label} className={cn("mb-5", collapsed && "mb-3")}>
              {!collapsed ? (
                <div className="eyebrow px-2.5 pb-2 text-[10.5px] text-[#999b92]">{section.label}</div>
              ) : sIdx > 0 ? (
                <div className="mx-2 my-2.5 border-t border-line/70" />
              ) : null}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  let active = false;
                  if (isInstitution) {
                    if (item.href.includes("tab=")) {
                      const tabName = item.href.split("tab=")[1];
                      active = currentTab === tabName;
                    } else {
                      active = currentTab === "submission";
                    }
                  } else {
                    active = pathname === item.href || (item.href !== "/overview" && pathname.startsWith(item.href));
                  }

                  return (
                    <Link
                      key={item.href}
                      href={isInstitution && college ? `${item.href}&college=${college}` : item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "nav-link text-[13.5px]",
                        collapsed && "justify-center px-0 h-10 w-10 mx-auto"
                      )}
                      data-active={active}
                      onClick={closeMobile}
                    >
                      <Icon className="h-4 w-4 stroke-[1.8]" />
                      {!collapsed ? (
                        <>
                          <span className="truncate">{item.label}</span>
                          {item.count ? (
                            <span
                              className={cn(
                                "mono ml-auto text-[11px]",
                                active ? "text-pine/80 font-semibold" : "text-[#9a9c93]"
                              )}
                            >
                              {item.count}
                            </span>
                          ) : null}
                        </>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex-1" />
        </div>

        {/* User Account / Signout */}
        <div className={cn("relative border-t border-line pt-3", collapsed && "px-0")}>
          {accountOpen ? (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setAccountOpen(false)} />
              <div
                className={cn(
                  "absolute bottom-[calc(100%+8px)] z-40 overflow-hidden rounded-xl border border-line-strong bg-surface shadow-lift animate-fade-up",
                  collapsed ? "left-0 w-[230px]" : "left-0 right-0",
                )}
              >
                <div className="border-b border-line p-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine-soft text-[11px] font-bold text-pine-deep">
                      {user.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-ink">{user.name}</div>
                      <div className="truncate text-[11.5px] text-muted">{user.label}</div>
                    </div>
                  </div>
                </div>
                <div className="p-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAccountOpen(false);
                      alert("ScrutiniX documentation & guidelines: AY 2026–27 active. All scrutiny outputs are advisory.");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[12.5px] font-medium text-ink transition-colors hover:bg-paper"
                  >
                    <HelpCircle className="h-4 w-4 text-muted" />
                    <span>Documentation & help</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setAccountOpen(false);
                      try {
                        const supabase = createClient();
                        await supabase.auth.signOut();
                      } catch (e) {
                        console.error("Sign out error:", e);
                      }
                      window.localStorage.removeItem("scrutinix-role");
                      router.push("/");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[12.5px] font-medium text-rust transition-colors hover:bg-rust-soft/50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </>
          ) : null}

          {!collapsed ? (
            <button
              type="button"
              onClick={() => setAccountOpen((curr) => !curr)}
              title="Account settings & user menu"
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-[#f1ede4]",
                accountOpen && "bg-[#f1ede4]",
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine-soft text-[11px] font-bold text-pine-deep">
                {user.initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-ink">{user.name}</span>
                <span className="block truncate text-[11.5px] text-muted">{user.label}</span>
              </span>
              <ChevronRight
                className={cn("h-4 w-4 text-muted transition-transform", accountOpen ? "-rotate-90" : "")}
              />
            </button>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setAccountOpen((curr) => !curr)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-pine-soft text-[11px] font-bold text-pine-deep ring-1 ring-pine/10 transition-transform hover:scale-105"
                title={`${user.name} · ${user.label}`}
              >
                {user.initials}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function CommandPalette({ open, onClose, apps }: { open: boolean; onClose: () => void; apps: Application[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  const filteredApps = useMemo(() => {
    if (!query.trim()) return apps.slice(0, 5);
    const q = query.toLowerCase();
    return apps.filter(
      (a) =>
        a.id.toLowerCase().includes(q) ||
        a.institution.toLowerCase().includes(q) ||
        a.programme.toLowerCase().includes(q) ||
        a.state.toLowerCase().includes(q),
    );
  }, [apps, query]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs animate-fade-in" onClick={onClose} />
      <div className="fixed left-1/2 top-[18%] z-50 w-full max-w-[560px] -translate-x-1/2 overflow-hidden rounded-xl border border-line-strong bg-surface shadow-lift animate-fade-up">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search className="h-4 w-4 text-muted" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search applications, institutions, rules, or PID…"
            className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-muted"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="mono rounded border border-line bg-paper px-1.5 py-0.5 text-[10px] text-muted">ESC</kbd>
        </div>
        <div className="max-h-[360px] overflow-y-auto p-2">
          <div className="eyebrow px-2 py-1 text-[10.5px]">Applications</div>
          {filteredApps.length === 0 ? (
            <div className="p-4 text-center text-[12.5px] text-muted">No applications found matching "{query}"</div>
          ) : (
            filteredApps.map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => {
                  onClose();
                  router.push(`/applications/${app.id}`);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-paper"
              >
                <div>
                  <div className="text-[13px] font-semibold text-ink">{app.institution}</div>
                  <div className="mono text-[11px] text-muted">
                    {app.id} · {app.programme} · {app.state}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted" />
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}

type ShellAlert = {
  id: string;
  applicationId: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  createdAt: string;
  institution: string;
};

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "just now";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function Notifications({
  open,
  onClose,
  alerts,
  reviewCount,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  alerts: ShellAlert[];
  reviewCount: number;
  loading: boolean;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-[340px] overflow-hidden rounded-xl border border-line-strong bg-surface shadow-lift animate-fade-up">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="text-[13px] font-semibold text-ink">Notifications & alerts</div>
          <span className="mono rounded bg-paper px-1.5 py-0.5 text-[10px] text-muted">AY 2026–27</span>
        </div>
        <div className="max-h-[360px] space-y-2 overflow-y-auto p-3 thin-scroll">
          {reviewCount > 0 ? (
            <Link
              href="/review"
              onClick={onClose}
              className="block rounded-lg border border-ochre/25 bg-ochre-soft/50 p-2.5 transition-colors hover:bg-ochre-soft"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-ink">Review queue needs a human</span>
                <span className="mono text-[10px] font-medium text-ochre">{reviewCount} OPEN</span>
              </div>
              <p className="mt-1 text-[11.5px] text-muted">
                {reviewCount} item{reviewCount === 1 ? "" : "s"} could not be resolved automatically.
              </p>
            </Link>
          ) : null}

          {alerts.map((alert) => {
            const tone =
              alert.severity === "critical" || alert.severity === "high"
                ? "border-rust/25 bg-rust-soft/50"
                : alert.severity === "warning"
                  ? "border-ochre/25 bg-ochre-soft/40"
                  : "border-line bg-paper";
            return (
              <Link
                key={alert.id}
                href={`/applications/${alert.applicationId}`}
                onClick={onClose}
                className={cn("block rounded-lg border p-2.5 transition-colors hover:brightness-[0.985]", tone)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[12px] font-semibold text-ink">{alert.title}</span>
                  <span className="mono shrink-0 text-[10px] font-medium uppercase text-muted">{alert.severity}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11.5px] text-muted">{alert.message}</p>
                <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-muted">
                  <span className="truncate">{alert.institution}</span>
                  <span>{relativeTime(alert.createdAt)}</span>
                </div>
              </Link>
            );
          })}

          {alerts.length === 0 && reviewCount === 0 ? (
            <div className="px-2 py-6 text-center text-[12px] text-muted">
              {loading ? "Loading alerts…" : "No open alerts. Nothing needs attention right now."}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [role, setRole] = useState("scrutiny_officer");
  const [college, setCollege] = useState("sardarpatel");
  const [shellData, setShellData] = useState<{ apps: Application[]; reviewCount: number; alerts: ShellAlert[] }>({
    apps: [],
    reviewCount: 0,
    alerts: [],
  });
  const [shellLoading, setShellLoading] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem("scrutinix-sidebar-collapsed");
    if (saved !== null) setCollapsed(saved === "true");
    const storedRole = window.localStorage.getItem("scrutinix-role");
    if (storedRole) setRole(storedRole);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const paramCollege = params.get("college");
      if (paramCollege) {
        setCollege(paramCollege);
        window.localStorage.setItem("scrutinix-college", paramCollege);
      } else {
        const storedCollege = window.localStorage.getItem("scrutinix-college");
        if (storedCollege) setCollege(storedCollege);
      }
    }
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    async function loadShellData() {
      try {
        const [appsRes, queueRes, alertsRes] = await Promise.all([
          fetch("/api/applications", { cache: "no-store" }),
          fetch("/api/review-queue", { cache: "no-store" }),
          fetch("/api/alerts", { cache: "no-store" }),
        ]);

        const appsPayload = await appsRes.json().catch(() => ({}));
        const queuePayload = await queueRes.json().catch(() => ({}));
        const alertsPayload = await alertsRes.json().catch(() => ({}));

        if (cancelled) return;
        setShellData({
          apps: Array.isArray(appsPayload.applications) ? appsPayload.applications : [],
          reviewCount: Array.isArray(queuePayload.items) ? queuePayload.items.length : 0,
          alerts: Array.isArray(alertsPayload.alerts) ? alertsPayload.alerts : [],
        });
      } catch (err) {
        console.error("Failed to load shell navigation data:", err);
      } finally {
        if (!cancelled) setShellLoading(false);
      }
    }

    loadShellData();
    const timer = window.setInterval(loadShellData, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [pathname]);

  const toggleCollapsed = () => {
    setCollapsed((curr) => {
      const next = !curr;
      window.localStorage.setItem("scrutinix-sidebar-collapsed", String(next));
      return next;
    });
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  const isInstitution = role === "institution" || pathname.startsWith("/institution");
  const collegeContext = institutionContext[college] ?? institutionContext.sardarpatel;
  const segments = pathname.split("/").filter(Boolean);
  const crumb = segments[0] ? breadcrumbLabels[segments[0]] ?? "Application detail" : "Desk Overview";

  return (
    <div className="min-h-screen">
      <Suspense fallback={null}>
        <Sidebar
          pathname={pathname}
          mobileOpen={mobileOpen}
          closeMobile={() => setMobileOpen(false)}
          collapsed={collapsed}
          toggleCollapsed={toggleCollapsed}
          counts={{ applications: shellData.apps.length, reviewQueue: shellData.reviewCount }}
        />
      </Suspense>

      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[68px]" : "lg:pl-[244px]")}>
        <header className="sticky top-0 z-20 border-b border-line bg-[#f8f5ee]/95 backdrop-blur-md">
          <div className="flex h-[58px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setMobileOpen(true)}
              className="btn-ghost flex h-8 w-8 items-center justify-center rounded-md lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Mobile Brand */}
            <div className="flex items-center gap-2 sm:hidden">
              <BrandMark size={28} />
              <span className="display text-[17px] leading-none text-ink">ScrutiniX</span>
            </div>

            {/* Desktop Topbar Context: Distinct per role & college */}
            {isInstitution ? (
              <div className="hidden items-center gap-2.5 text-[13px] sm:flex">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pine-soft text-pine">
                  <Building2 className="h-3.5 w-3.5" />
                </span>
                <span className="font-semibold text-ink">{collegeContext.name}</span>
                <span className="text-muted">·</span>
                <span className="mono text-[11px] text-muted">
                  PID: {collegeContext.pid}
                </span>
                <span className="text-muted">·</span>
                <span className="chip border-pine/20 bg-pine-soft text-pine text-[11px]">
                  AY 2026–27 EoA Renewal
                </span>
              </div>
            ) : (
              <div className="hidden items-center gap-2 text-[13px] sm:flex">
                <span className="text-muted">AICTE Desk</span>
                <ChevronRight className="h-3.5 w-3.5 text-line-strong" />
                <span className="font-semibold text-ink">{crumb}</span>
                {segments[0] === "applications" && segments[1] ? (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 text-line-strong" />
                    <span className="mono text-[11.5px] text-muted">{segments[1]}</span>
                  </>
                ) : null}
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setCommandOpen(true)}
                className="hidden h-8 items-center gap-2 rounded-md border border-line bg-surface px-3 text-[12px] text-muted transition-colors hover:border-line-strong hover:text-ink sm:flex"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search</span>
                <span className="ml-3 flex items-center gap-0.5 rounded border border-line bg-paper px-1 py-0.5 font-mono text-[9px]">
                  <Command className="h-2.5 w-2.5" />K
                </span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen((current) => !current)}
                  className="relative flex h-8 w-8 items-center justify-center rounded-md border border-line bg-surface text-muted transition-colors hover:text-ink"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                </button>
                <Notifications
                  open={notificationsOpen}
                  onClose={() => setNotificationsOpen(false)}
                  alerts={shellData.alerts}
                  reviewCount={shellData.reviewCount}
                  loading={shellLoading}
                />
              </div>

              {/* Avatar Pill reflecting active persona */}
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-pine-soft text-[11px] font-bold text-pine-deep ring-1 ring-pine/10"
                title={
                  isInstitution
                    ? `${collegeContext.principal} · Principal, ${collegeContext.short}`
                    : `${roleNames.scrutiny_officer.name} · ${roleNames.scrutiny_officer.label}`
                }
              >
                {isInstitution ? collegeContext.short : "AM"}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-7">{children}</main>
      </div>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} apps={shellData.apps} />
    </div>
  );
}
