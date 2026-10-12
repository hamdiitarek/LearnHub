import type { Metadata } from "next";
import "./globals.css";
import { PropsWithChildren } from "react";
import {
  Schibsted_Grotesk,
  Instrument_Serif,
  IBM_Plex_Sans_Arabic,
} from "next/font/google";
import { cn } from "@/lib/utils";
import { getLangDir } from "rtl-detect";
import { cookies } from "next/headers";
import { Providers } from "@/providers";

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  display: "swap",
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  weight: ["400", "500", "700"],
  subsets: ["arabic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LearnHub · Free lectures, organised into real courses",
    template: "%s · LearnHub",
  },
  description:
    "LearnHub turns great free lectures into structured courses with quizzes, progress tracking and certificates.",
};

// Lets CSS hide GSAP intro elements until they animate in; without JS they never hide.
const MOTION_FLAG = "document.documentElement.classList.add('motion')";

export default async function RootLayout({
  children,
}: Readonly<PropsWithChildren>) {
  const store = await cookies();
  const locale = store.get("locale")?.value || "en";

  return (
    <html dir={getLangDir(locale)} lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_FLAG }} />
      </head>
      <body
        className={cn(
          "min-h-screen font-sans antialiased",
          schibsted.variable,
          instrument.variable,
          plexArabic.variable,
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
