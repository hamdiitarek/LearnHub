import Link from "next/link";
import { cn } from "@/lib/utils";

/** An open book with a highlighter stroke across the page. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="8" fill="var(--forest)" />
      <path
        d="M7 10.5c3-1 6-.8 9 .9 3-1.7 6-1.9 9-.9v12c-3-1-6-.8-9 .9-3-1.7-6-1.9-9-.9z"
        fill="#f6f4ec"
      />
      <path d="M16 11.4v12" stroke="var(--forest)" strokeWidth="1.2" />
      <rect
        x="9"
        y="15"
        width="5.5"
        height="2.6"
        rx="1"
        fill="var(--highlight)"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-[26px] leading-none">LearnHub</span>
    </Link>
  );
}
