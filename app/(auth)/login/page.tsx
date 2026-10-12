import { Suspense } from "react";
import type { Metadata } from "next";
import { isDemo } from "@/lib/demo/mode";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  // Demo accounts and one-click sign-in only exist in demo mode (DEMO_MODE).
  return (
    <Suspense>
      <LoginForm demo={isDemo} />
    </Suspense>
  );
}
