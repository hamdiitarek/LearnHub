"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CourseCover } from "@/components/course/course-cover";
import { plural } from "@/lib/format";

interface Enrollment {
  id: string;
  progress: number;
  enrolledAt: string;
  course: {
    id: string;
    title: string;
    thumbnail: string | null;
    category: string | null;
    instructor: { name: string };
    _count: { lessons: number };
  };
}

interface Certificate {
  id: string;
  certificateNumber: string;
  issuedAt: string;
  course: { id: string; title: string };
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated")
      router.push("/login?callbackUrl=/dashboard");
  }, [status, router]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [enrollmentsRes, certificatesRes] = await Promise.all([
        fetch("/api/enrollments"),
        fetch("/api/certificates"),
      ]);
      const enrollmentsData = await enrollmentsRes.json();
      const certificatesData = await certificatesRes.json();
      setEnrollments(enrollmentsData.enrollments || []);
      setCertificates(certificatesData.certificates || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchData();
  }, [status, fetchData]);

  const handleGetCertificate = async (courseId: string) => {
    try {
      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await response.json();
      if (data.certificate)
        router.push(`/certificates/${data.certificate.certificateNumber}`);
      else alert(data.error || "Finish every lesson to get the certificate.");
    } catch (error) {
      console.error("Failed to get certificate:", error);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-12 w-1/3 rounded-xl bg-secondary" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-secondary" />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-secondary" />
        </div>
      </div>
    );
  }

  const inProgress = enrollments
    .filter((e) => e.progress > 0 && e.progress < 100)
    .sort((a, b) => b.progress - a.progress);
  const completed = enrollments.filter((e) => e.progress >= 100);
  const notStarted = enrollments.filter((e) => e.progress === 0);
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const certFor = (courseId: string) =>
    certificates.find((c) => c.course.id === courseId);

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="font-display text-[clamp(2.6rem,5vw,4rem)] leading-none">
        Hi, {firstName}.
      </h1>
      <p className="mt-3 text-[16px] text-muted-foreground">
        {enrollments.length === 0
          ? "Pick a course to get started."
          : inProgress.length > 0
            ? `You're in the middle of ${plural(inProgress.length, "course")}. Your place is saved in each one.`
            : "Everything you started is finished. Time for something new?"}
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
        {[
          [enrollments.length, "enrolled"],
          [inProgress.length, "in progress"],
          [completed.length, "completed"],
          [
            certificates.length,
            plural(certificates.length, "certificate").split(" ")[1],
          ],
        ].map(([value, label]) => (
          <div key={label as string} className="bg-card p-5">
            <dd className="font-display text-[40px] leading-none">{value}</dd>
            <dt className="mt-1 text-[14px] text-muted-foreground">{label}</dt>
          </div>
        ))}
      </dl>

      {enrollments.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="font-display text-[30px]">Your shelf is empty</p>
          <p className="mt-2 text-muted-foreground">
            Enrol in a free course and it will show up here.
          </p>
          <Link href="/courses">
            <Button className="mt-6 rounded-full">Browse courses</Button>
          </Link>
        </div>
      )}

      {inProgress.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-[32px]">Continue learning</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {inProgress.map((e) => (
              <Link
                key={e.id}
                href={`/courses/${e.course.id}/learn`}
                className="group grid grid-cols-[120px_1fr] overflow-hidden rounded-2xl border border-border bg-card transition hover:border-forest sm:grid-cols-[170px_1fr]"
              >
                <CourseCover
                  title={e.course.title}
                  category={e.course.category}
                  thumbnail={e.course.thumbnail}
                  size="sm"
                  className="h-full"
                />
                <div className="flex flex-col p-4 sm:p-5">
                  <h3 className="text-[16px] leading-snug font-semibold group-hover:text-forest">
                    {e.course.title}
                  </h3>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {e.course.instructor.name} ·{" "}
                    {plural(e.course._count.lessons, "lesson")}
                  </p>
                  <div className="mt-auto pt-4">
                    <div className="mb-1.5 flex justify-between text-[13px]">
                      <span className="text-muted-foreground">
                        {Math.round(e.progress)}% done
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-forest">
                        Continue{" "}
                        <ArrowRight className="size-3.5 rtl:rotate-180" />
                      </span>
                    </div>
                    <Progress value={e.progress} className="h-2" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {notStarted.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-[32px]">Not started yet</h2>
          <div className="mt-5 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {notStarted.map((e) => (
              <div
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-3 p-5"
              >
                <div>
                  <p className="font-semibold">{e.course.title}</p>
                  <p className="text-[13px] text-muted-foreground">
                    Enrolled {fmtDate(e.enrolledAt)}
                  </p>
                </div>
                <Link href={`/courses/${e.course.id}/learn`}>
                  <Button variant="outline" className="rounded-full">
                    Start the first lesson
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {(completed.length > 0 || certificates.length > 0) && (
        <section className="mt-14">
          <h2 className="font-display text-[32px]">Finished</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {completed.map((e) => {
              const cert = certFor(e.course.id);
              return (
                <div
                  key={e.id}
                  className="flex flex-col justify-between gap-5 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-3">
                    <BadgeCheck className="mt-0.5 size-6 shrink-0 text-forest" />
                    <div>
                      <p className="font-semibold">{e.course.title}</p>
                      <p className="text-[13px] text-muted-foreground">
                        {cert
                          ? `Certificate ${cert.certificateNumber} · ${fmtDate(cert.issuedAt)}`
                          : "Completed every lesson"}
                      </p>
                    </div>
                  </div>
                  {cert ? (
                    <Link href={`/certificates/${cert.certificateNumber}`}>
                      <Button className="rounded-full">View certificate</Button>
                    </Link>
                  ) : (
                    <Button
                      className="rounded-full"
                      onClick={() => handleGetCertificate(e.course.id)}
                    >
                      Get certificate
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
