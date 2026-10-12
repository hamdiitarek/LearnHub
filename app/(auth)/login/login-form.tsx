"use client";

import { useEffect, useRef, useState } from "react";
import { signIn, signOut, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo/accounts";

export function LoginForm({ demo }: { demo: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getRedirectPath = (role: string) => {
    if (callbackUrl) return callbackUrl;
    switch (role) {
      case "INSTRUCTOR":
        return "/instructor";
      case "ADMIN":
        return "/admin";
      default:
        return "/dashboard";
    }
  };

  const login = async (emailValue: string, passwordValue: string) => {
    setError("");
    setIsLoading(true);
    try {
      const wanted = emailValue.trim().toLowerCase();
      // Switching accounts (e.g. demo student -> instructor): end the old session first.
      const current = await getSession();
      if (current?.user && current.user.email?.toLowerCase() !== wanted)
        await signOut({ redirect: false });

      const result = await signIn("credentials", {
        email: emailValue,
        password: passwordValue,
        redirect: false,
      });
      const session = await getSession();
      if (result?.error || session?.user?.email?.toLowerCase() !== wanted) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }
      router.push(getRedirectPath(session.user.role));
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void login(email, password);
  };

  const signInAs = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
    void login(account.email, DEMO_PASSWORD);
  };

  // Links like /login?demo=student sign in straight away.
  const autoTried = useRef(false);
  useEffect(() => {
    if (!demo || autoTried.current) return;
    autoTried.current = true;
    const match = DEMO_ACCOUNTS.find(
      (a) => a.role === searchParams.get("demo"),
    );
    if (match) signInAs(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full max-w-[400px]">
      <h1 className="font-display text-[44px] leading-none">Welcome back</h1>
      <p className="mt-3 text-[15px] text-muted-foreground">
        Sign in to pick up where you left off.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && (
          <div className="rounded-xl bg-clay/10 p-3 text-[14px] text-clay">
            {error}
          </div>
        )}
        {!error && searchParams.get("registered") && (
          <div className="rounded-xl bg-accent p-3 text-[14px]">
            Your account is ready. Sign in to start learning.
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full rounded-full"
          disabled={isLoading}
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {demo && (
        <div className="mt-8 rounded-2xl border border-dashed border-ink/25 p-4">
          <p className="text-[13px] font-semibold">
            This is a demo. Sign in as:
          </p>
          <div className="mt-3 space-y-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.role}
                type="button"
                disabled={isLoading}
                onClick={() => signInAs(a)}
                className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5 text-start transition hover:border-forest disabled:opacity-50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold">
                    {a.label}{" "}
                    <span className="font-normal text-muted-foreground">
                      · {a.name}
                    </span>
                  </span>
                  <span className="block truncate text-[12.5px] text-muted-foreground">
                    {a.blurb}
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-forest transition group-hover:translate-x-0.5 rtl:rotate-180" />
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-8 text-[14px] text-muted-foreground">
        New here?{" "}
        <Link
          href="/register"
          className="font-semibold text-forest hover:underline"
        >
          Create a free account
        </Link>
      </p>
    </div>
  );
}
