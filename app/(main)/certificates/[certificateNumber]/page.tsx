"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { BadgeCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo";
import { PageMotion } from "@/components/motion/page-motion";

interface Certificate {
  id: string;
  certificateNumber: string;
  issuedAt: string;
  user: { id: string; name: string };
  course: {
    id: string;
    title: string;
    instructor: { id: string; name: string };
  };
}

export default function CertificatePage({
  params,
}: {
  params: Promise<{ certificateNumber: string }>;
}) {
  const { certificateNumber } = use(params);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState("");

  useEffect(() => {
    setVerifyUrl(window.location.href);
    fetch(`/api/certificates?number=${certificateNumber}`)
      .then(async (response) =>
        response.ok ? (await response.json()).certificate : null,
      )
      .then(setCertificate)
      .catch((error) => console.error("Failed to fetch certificate:", error))
      .finally(() => setIsLoading(false));
  }, [certificateNumber]);

  const downloadPDF = async () => {
    if (!certificate) return;
    setIsDownloading(true);
    try {
      const response = await fetch(
        `/api/certificates/${certificate.certificateNumber}/pdf`,
      );
      if (
        !response.ok ||
        !response.headers.get("content-type")?.includes("application/pdf")
      )
        throw new Error("PDF failed");
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${certificate.certificateNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 100);
    } catch (error) {
      console.error("Failed to download PDF:", error);
      alert("Couldn't create the PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="size-10 animate-spin rounded-full border-2 border-forest border-t-transparent" />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="font-display text-[40px]">
          No certificate with that number
        </h1>
        <p className="mt-3 text-muted-foreground">
          Check the number and try again.
        </p>
        <Link href="/courses">
          <Button className="mt-6 rounded-full">Browse courses</Button>
        </Link>
      </div>
    );
  }

  const issued = new Date(certificate.issuedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <PageMotion
      watch={certificate.certificateNumber}
      className="mx-auto max-w-5xl px-5 py-12"
    >
      <div className="rounded-[28px] bg-[#efece2] p-3 sm:p-5">
        <article
          data-cert
          className="relative overflow-hidden rounded-[20px] border border-ink/15 bg-[#fffdf6] px-6 py-12 text-center sm:px-16 sm:py-16"
        >
          {/* guilloche-style frame */}
          <div
            data-cert-frame
            className="pointer-events-none absolute inset-3 rounded-[14px] border border-forest/25 sm:inset-5"
          />
          <div
            data-cert-seal
            className="absolute end-6 top-6 hidden size-[74px] place-items-center rounded-full border border-dashed border-forest/50 text-forest sm:end-10 sm:top-10 sm:grid"
            aria-hidden
          >
            <div className="grid size-[58px] place-items-center rounded-full bg-forest text-paper">
              <BadgeCheck className="size-7" />
            </div>
          </div>
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "repeating-radial-gradient(circle at 50% 120%, var(--forest) 0 1px, transparent 1px 12px)",
            }}
          />

          <div className="relative">
            <div
              data-cert-line
              className="flex items-center justify-center gap-2.5"
            >
              <LogoMark className="size-7" />
              <span className="font-display text-[22px]">LearnHub</span>
            </div>
            <p
              data-cert-line
              className="mt-10 text-[12px] font-semibold tracking-[0.3em] text-forest uppercase"
            >
              Certificate of completion
            </p>
            <p data-cert-line className="mt-8 text-[16px] text-ink/60">
              This certifies that
            </p>
            <h1
              data-cert-line
              className="mt-3 font-display text-[clamp(2.6rem,6vw,4.4rem)] leading-none"
            >
              <span className="mark">{certificate.user.name}</span>
            </h1>
            <p data-cert-line className="mt-6 text-[16px] text-ink/60">
              completed every lesson of
            </p>
            <h2
              data-cert-line
              className="mt-2 font-display text-[clamp(1.6rem,3.4vw,2.4rem)] leading-tight italic"
            >
              {certificate.course.title}
            </h2>

            <div className="mx-auto mt-14 grid max-w-xl grid-cols-2 gap-10 text-[14px]">
              <div>
                <span data-cert-rule className="mb-3 block h-px bg-ink/30" />
                <p className="font-semibold">
                  {certificate.course.instructor.name}
                </p>
                <p className="text-ink/55">Course curator</p>
              </div>
              <div>
                <span data-cert-rule className="mb-3 block h-px bg-ink/30" />
                <p className="font-semibold">{issued}</p>
                <p className="text-ink/55">Date issued</p>
              </div>
            </div>

            <p
              data-cert-line
              className="mt-12 font-mono text-[12px] text-ink/50"
            >
              {certificate.certificateNumber}
              {verifyUrl && (
                <span className="block break-all sm:inline sm:before:content-['_·_']">
                  {verifyUrl}
                </span>
              )}
            </p>
          </div>
        </article>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={`/courses/${certificate.course.id}`}>
          <Button variant="outline" className="rounded-full">
            View the course
          </Button>
        </Link>
        <Button
          className="rounded-full"
          onClick={downloadPDF}
          disabled={isDownloading}
        >
          <Download />
          {isDownloading ? "Preparing PDF…" : "Download PDF"}
        </Button>
      </div>
    </PageMotion>
  );
}
