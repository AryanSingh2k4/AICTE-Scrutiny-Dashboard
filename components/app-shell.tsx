"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  Check,
  ChevronRight,
  CircleAlert,
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
import { applications, reviewQueue } from "@/lib/mock-data";
import { cn } from "@/lib/display";
import { BrandMark, Logo } from "@/components/logo";

const navigation = [
  {
    label: "Workspace",
    items: [
      { href: "/overview", label: "Overview", icon: LayoutGrid },
      { href: "/applications", label: "Applications", icon: FileStack, count: applications.length > 0 ? String(applications.length) : undefined },
      { href: "/review", label: "Review queue", icon: Inbox, count: reviewQueue.length > 0 ? String(reviewQueue.length) : undefined },
    ],
  },
  {
    label: "Governance",
    items: [
      { href: "/rules", label: "Rules & checklists", icon: SlidersHorizontal },
      { href: "/audit", label: "Audit trail", icon: ShieldCheck },
    ],
  },
  {
    label: "Institution",
    items: [{ href: "/institution", label: "My submission", icon: UploadCloud }],
  },
];

const roleNames: Record<string, { label: string; name: string; initials: string }> = {
  scrutiny_officer: { label: "Scrutiny officer", name: "Ananya Menon", initials: "AM" },
  senior_officer: { label: "Senior officer", name: "Vikram Sethi", initials: "VS" },
  institution: { label: "Institution", name: "Sunrise Institute", initials: "SI" },
  auditor: { label: "Auditor", name: "Meera Rao", initials: "MR" },
};

const breadcrumbLabels: Record<string, string> = {
  overview: "Overview",
  applications: "Applications",
  review: "Review queue",
  rules: "Rules & checklists",
  audit: "Audit trail",
  institution: "My submission",
};

function Sidebar({
  pathname,
  mobileOpen,
  closeMobile,
  collapsed,
  toggleCollapsed,
}: {
  pathname: string;
  mobileOpen: boolean;
  closeMobile: () => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
}) {
  const [role, setRole] = useState("scrutiny_officer");
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("scrutinix-role");
    if (stored && roleNames[stored]) setRole(stored);
  }, []);

  const user = roleNames[role];

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
                <div className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted">AICTE scrutiny suite</div>
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
          <button onClick={closeMobile} className="btn-ghost ml-auto flex h-8 w-8 items-center justify-center rounded-md lg:hidden" aria-label="Close navigation">
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
                  const active = pathname === item.href || (item.href !== "/overview" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
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
                            <span className={cn("mono ml-auto text-[11px]", active ? "text-pine/80 font-semibold" : "text-[#9a9c93]")}>{item.count}</span>
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

        <div className={cn("relative mt-4 border-t border-line pt-3", collapsed && "px-0")}>
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
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine-soft text-[11px] font-bold text-pine-deep">{user.initials}</span>
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
                  <Link
                    href="/"
                    onClick={() => setAccountOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[12.5px] font-medium text-rust transition-colors hover:bg-rust-soft/50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </Link>
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
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine-soft text-[11px] font-bold text-pine-deep">{user.initials}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-ink">{user.name}</span>
                <span className="block truncate text-[11.5px] text-muted">{user.label}</span>
              </span>
              <ChevronRight className={cn("h-4 w-4 text-muted transition-transform", accountOpen ? "-rotate-90" : "")} />
            </button>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setAccountOpen((curr) => !curr)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-pine-soft text-[11px] font-bold text-pine-deep ring-1 ring-pine/10 transition-transform hover:scale-105"
                title={`${user.name} · ${user.label} (Click for settings)`}
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

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      const timeout = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(timeout);
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const matches = useMemo(() => {
    const q = query.toLowerCase().trim();
    const pages = [
      { label: "Scrutiny overview", href: "/overview", type: "Page" },
      { label: "Applications", href: "/applications", type: "Page" },
      { label: "Manual review queue", href: "/review", type: "Page" },
      { label: "Rules & checklists", href: "/rules", type: "Page" },
      { label: "Audit trail", href: "/audit", type: "Page" },
      { label: "Institution submission", href: "/institution", type: "Page" },
    ];
    const appResults = applications.map((app) => ({
      label: app.institution,
      href: `/applications/${app.id}`,
      type: app.id,
    }));
    return [...pages, ...appResults].filter((item) => !q || `${item.label} ${item.type}`.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-ink/30 px-4 pt-[12vh] backdrop-blur-[2px]" onMouseDown={onClose}>
      <div
        className="w-full max-w-[560px] overflow-hidden rounded-xl border border-line-strong bg-surface shadow-lift animate-fade-up"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-4 w-4 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search applications, institutions or pages…"
            className="h-[52px] flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#9b9c92]"
          />
          <kbd className="rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[9px] text-muted">ESC</kbd>
        </div>
        <div className="max-h-[360px] overflow-y-auto p-2">
          {matches.length === 0 ? (
            <div className="px-3 py-8 text-center text-[12px] text-muted">No matches. Try an application ID or institution name.</div>
          ) : (
            matches.map((item) => (
              <button
                key={`${item.href}-${item.label}`}
                onClick={() => {
                  onClose();
                  router.push(item.href);
                }}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-paper"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded border border-line bg-[#f5f2e9]">
                  {item.type.startsWith("APP") ? <FileStack className="h-3.5 w-3.5 text-pine" /> : <ArrowUpRight className="h-3.5 w-3.5 text-muted" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-medium">{item.label}</span>
                  <span className="mono block text-[9px] text-muted">{item.type}</span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-line-strong" />
              </button>
            ))
          )}
        </div>
        <div className="flex items-center gap-4 border-t border-line bg-[#f7f4ed] px-4 py-2 text-[11px] text-muted">
          <span className="flex items-center gap-1.5"><Command className="h-3.5 w-3.5" /> K to open</span>
          <span>↑ ↓ to navigate</span>
          <span className="ml-auto flex items-center gap-1.5"><BrandMark size={16} /> ScrutiniX | AY 2026–27</span>
        </div>
      </div>
    </div>
  );
}

function Notifications({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute right-0 top-[42px] z-40 w-[340px] overflow-hidden rounded-xl border border-line-strong bg-surface shadow-lift animate-fade-up">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <div className="text-[12px] font-semibold">Notifications</div>
            <div className="text-[9.5px] text-muted">0 unread alerts</div>
          </div>
          <span className="chip border-pine/15 bg-pine-soft text-pine">Realtime</span>
        </div>
        <div className="py-8 text-center">
          <p className="text-[11px] text-muted">No new notifications</p>
          <p className="mt-1 text-[9px] text-[#9a9c93]">Realtime pipeline alerts will appear here</p>
        </div>
        <Link href="/review" onClick={onClose} className="flex items-center justify-center gap-1 border-t border-line py-2.5 text-[10.5px] font-semibold text-pine hover:bg-paper">
          Open review queue <ArrowUpRight className="h-3 w-3" />
        </Link>
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

  useEffect(() => {
    const saved = window.localStorage.getItem("scrutinix-sidebar-collapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);

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

  const segments = pathname.split("/").filter(Boolean);
  const crumb = segments[0] ? breadcrumbLabels[segments[0]] ?? "Application detail" : "Overview";

  return (
    <div className="min-h-screen">
      <Sidebar
        pathname={pathname}
        mobileOpen={mobileOpen}
        closeMobile={() => setMobileOpen(false)}
        collapsed={collapsed}
        toggleCollapsed={toggleCollapsed}
      />

      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[68px]" : "lg:pl-[244px]")}>
        <header className="sticky top-0 z-20 border-b border-line bg-[#f8f5ee]/95 backdrop-blur-md">
          <div className="flex h-[58px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button onClick={() => setMobileOpen(true)} className="btn-ghost flex h-8 w-8 items-center justify-center rounded-md lg:hidden" aria-label="Open navigation">
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 sm:hidden">
              <BrandMark size={28} />
              <span className="display text-[19px] leading-none text-ink">ScrutiniX</span>
            </div>
            <div className="hidden items-center gap-2 text-[13px] sm:flex">
              <span className="text-muted">AICTE</span>
              <ChevronRight className="h-3.5 w-3.5 text-line-strong" />
              <span className="font-semibold text-ink">{crumb}</span>
              {segments[0] === "applications" && segments[1] ? (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-line-strong" />
                  <span className="mono text-[11.5px] text-muted">{segments[1]}</span>
                </>
              ) : null}
            </div>
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
                <Notifications open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pine-soft text-[11px] font-bold text-pine-deep ring-1 ring-pine/10">AM</span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-7">{children}</main>
      </div>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}
