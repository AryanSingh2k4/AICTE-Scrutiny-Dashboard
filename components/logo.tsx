import Link from "next/link";
import { cn } from "@/lib/display";

export function BrandMark({
  size = 34,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-pine-deep shadow-[inset_0_1px_0_rgba(255,255,255,.18)]",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 34 34" className="h-full w-full" aria-hidden="true">
        <path
          d="M22.5 13.2c0-2.4-1.9-4.2-5.5-4.2-3.8 0-6.2 1.8-6.2 4.6 0 2.9 2.1 4 5.6 4.7 3.3.7 4.5 1.4 4.5 3.2 0 2.1-1.9 3.5-4.8 3.5-3.6 0-5.4-1.6-5.8-3.8h-3.6c.4 4.2 3.8 6.8 9.4 6.8 5 0 8.5-2.6 8.5-6.5 0-3.2-2.3-4.5-6-5.2-3.1-.6-4.1-1.4-4.1-2.8 0-1.7 1.5-2.6 3.6-2.6 2.5 0 4.1 1.1 4.4 2.3h3.6Z"
          fill="#F7F4EA"
        />
        <circle cx="24.5" cy="24.2" r="2.6" fill="#D9B56A" />
      </svg>
    </span>
  );
}

export function Logo({
  size = 34,
  showSubtitle = true,
  href,
  className,
}: {
  size?: number;
  showSubtitle?: boolean;
  href?: string;
  className?: string;
}) {
  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      <BrandMark size={size} />
      <div className="min-w-0">
        <div className="display text-[22px] leading-none tracking-[-0.03em] text-ink">ScrutiniX</div>
        {showSubtitle ? (
          <div className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted">
            AICTE scrutiny suite
          </div>
        ) : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
