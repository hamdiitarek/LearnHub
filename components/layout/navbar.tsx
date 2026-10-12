"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/brand/logo";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isLoading = status === "loading";
  const role = session?.user?.role;

  const links = [
    { href: "/courses", label: "Courses" },
    ...(session?.user ? [{ href: "/dashboard", label: "My learning" }] : []),
    ...(role === "INSTRUCTOR" ? [{ href: "/instructor", label: "Teach" }] : []),
    ...(role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
  ];
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/70 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "relative rounded-full px-3.5 py-1.5 text-[14px] font-medium transition-colors",
                isActive(l.href)
                  ? "text-paper"
                  : "text-ink/70 hover:bg-secondary hover:text-ink",
              )}
            >
              {isActive(l.href) && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-ink"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">{l.label}</span>
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {isLoading ? (
            <div className="h-9 w-28 animate-pulse rounded-full bg-muted" />
          ) : session?.user ? (
            <>
              <Link
                href="/settings"
                className="flex items-center gap-2 rounded-full py-1 ps-1 pe-3 hover:bg-secondary"
              >
                <Avatar
                  src={session.user.avatar}
                  fallback={session.user.name || "U"}
                  size="sm"
                />
                <span className="text-[14px] font-medium">
                  {session.user.name}
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Log out"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut />
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3.5 py-1.5 text-[14px] font-medium text-ink/75 hover:text-ink"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-forest px-4 py-2 text-[14px] font-semibold text-paper transition hover:bg-forest-deep"
              >
                Start learning
              </Link>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-border/70 md:hidden"
          >
            <div className="mx-auto max-w-6xl space-y-1 px-5 py-4">
              {[
                ...links,
                ...(session?.user
                  ? [{ href: "/settings", label: "Settings" }]
                  : []),
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "block rounded-xl px-3 py-2.5 text-[15px] font-medium",
                    isActive(l.href)
                      ? "bg-ink text-paper"
                      : "hover:bg-secondary",
                  )}
                >
                  {l.label}
                </Link>
              ))}
              <div className="pt-3">
                {session?.user ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    <LogOut />
                    Log out
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Log in
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full">Start learning</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
