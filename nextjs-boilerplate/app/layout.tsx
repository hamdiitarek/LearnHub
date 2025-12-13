import type { Metadata } from "next";
import "./globals.css";
import { PropsWithChildren } from "react";
import { Tajawal as TajawalFont } from "next/font/google";
import { cn } from "@/lib/utils";
import { getLangDir } from "rtl-detect";
import { cookies } from "next/headers";
import { Providers } from "@/providers";

const Tajawal = TajawalFont({
  weight: ["400", "700"],
  variable: "--font-tajawal",
  style: ["normal"],
  display: "swap",
  subsets: ["latin", "arabic"],
});

export const metadata: Metadata = {
  title: "LearnHub - E-Learning Platform",
  description:
    "Learn from the best instructors. Access thousands of courses on programming, design, business, and more.",
};

export default async function RootLayout({
  children,
}: Readonly<PropsWithChildren>) {
  const store = await cookies();
  const locale = store.get("locale")?.value || "en";

  return (
    <html dir={getLangDir(locale)} lang={locale}>
      <body className={cn("antialiased min-h-screen", Tajawal.className)}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
