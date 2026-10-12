import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  // Without DATABASE_URL the app runs on its seeded demo database.
  const demo = !process.env.DATABASE_URL;
  return (
    <Suspense>
      <LoginForm demo={demo} />
    </Suspense>
  );
}
