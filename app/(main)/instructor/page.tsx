"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, PenLine, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { coverColors } from "@/components/course/course-cover";
import { formatDuration, levelLabel, plural } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
  category: string | null;
  level: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  avgRating: number;
  totalDuration: number;
  _count: { lessons: number; enrollments: number; reviews: number };
}

const ease = [0.22, 1, 0.36, 1] as const;
const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};
const stagger = { show: { transition: { staggerChildren: 0.07 } } };

export default function InstructorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const role = session?.user?.role;

  useEffect(() => {
    if (status === "unauthenticated")
      router.push("/login?callbackUrl=/instructor");
    // Admins manage every course from the admin area; this page is an instructor's own shelf.
    else if (role === "ADMIN") router.replace("/admin?tab=courses");
    else if (status === "authenticated" && role !== "INSTRUCTOR")
      router.push("/dashboard");
  }, [status, role, router]);

  useEffect(() => {
    if (role !== "INSTRUCTOR") return;
    fetch("/api/courses?my=true&limit=100")
      .then((r) => r.json())
      .then((data) => setCourses(data.courses ?? []))
      .catch(() => setCourses([]));
  }, [role]);

  if (role !== "INSTRUCTOR" || !courses) {
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

  const learners = courses.reduce((s, c) => s + c._count.enrollments, 0);
  const reviews = courses.reduce((s, c) => s + c._count.reviews, 0);
  const rated = courses.filter((c) => c._count.reviews > 0);
  const rating = rated.length
    ? rated.reduce((s, c) => s + c.avgRating * c._count.reviews, 0) /
      Math.max(1, reviews)
    : 0;
  const live = courses.filter((c) => c.status === "PUBLISHED").length;
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.16em] text-forest uppercase">
            Teaching
          </p>
          <h1 className="mt-2 font-display text-[clamp(2.6rem,5vw,4rem)] leading-none">
            Your shelf, {firstName}.
          </h1>
          <p className="mt-3 text-[16px] text-muted-foreground">
            The courses you curate. Drafts stay private until you publish them.
          </p>
        </div>
        <Link href="/instructor/courses/new">
          <Button size="lg" className="rounded-full">
            <Plus /> New course
          </Button>
        </Link>
      </div>

      <motion.dl
        initial="hidden"
        animate="show"
        variants={stagger}
        className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4"
      >
        {[
          [
            courses.length,
            plural(courses.length, "course").split(" ")[1],
            `${live} live · ${courses.length - live} draft`,
          ],
          [learners, "learners", "across all your courses"],
          [
            courses.reduce((s, c) => s + c._count.lessons, 0),
            "lessons",
            formatDuration(courses.reduce((s, c) => s + c.totalDuration, 0)) +
              " of video",
          ],
          [
            rating ? rating.toFixed(1) : "–",
            "average rating",
            plural(reviews, "review"),
          ],
        ].map(([value, label, sub]) => (
          <motion.div
            key={label as string}
            variants={rise}
            className="bg-card p-5"
          >
            <dd className="font-display text-[44px] leading-none tabular-nums">
              {value}
            </dd>
            <dt className="mt-1 text-[14px] font-medium">{label}</dt>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">{sub}</p>
          </motion.div>
        ))}
      </motion.dl>

      {courses.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="font-display text-[30px]">Nothing on your shelf yet</p>
          <p className="mt-2 text-muted-foreground">
            Start a course, add lectures from YouTube, then publish it.
          </p>
          <Link href="/instructor/courses/new">
            <Button className="mt-6 rounded-full">
              Create your first course
            </Button>
          </Link>
        </div>
      ) : (
        <motion.ul
          initial="hidden"
          animate="show"
          variants={stagger}
          className="mt-10 grid gap-5 md:grid-cols-2"
        >
          {courses.map((c) => {
            const colors = coverColors(c.category);
            const isLive = c.status === "PUBLISHED";
            return (
              <motion.li
                key={c.id}
                variants={rise}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                className="flex overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div
                  className="relative flex w-28 shrink-0 flex-col justify-end p-3 sm:w-36"
                  style={{ background: colors.bg, color: colors.ink }}
                  aria-hidden
                >
                  <div
                    className="absolute inset-0 opacity-[0.12]"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(135deg, currentColor 0 1px, transparent 1px 7px)",
                    }}
                  />
                  <span
                    className="relative mb-2 h-[3px] w-6 rounded-full"
                    style={{ background: colors.rule }}
                  />
                  <span className="relative line-clamp-3 font-display text-[17px] leading-[1.05]">
                    {c.title}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[12.5px] text-muted-foreground">
                      {c.category ?? "Uncategorised"} · {levelLabel(c.level)}
                    </p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-semibold",
                        isLive
                          ? "bg-highlight text-ink"
                          : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {isLive ? "Live" : "Draft"}
                    </span>
                  </div>
                  <h2 className="mt-1 text-[17px] leading-snug font-semibold">
                    {c.title}
                  </h2>
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                    <span>{plural(c._count.lessons, "lesson")}</span>
                    <span>{plural(c._count.enrollments, "learner")}</span>
                    {c.avgRating > 0 && (
                      <span className="inline-flex items-center gap-1 text-ink">
                        <Star className="size-3.5 fill-[#e0a400] text-[#e0a400]" />
                        {c.avgRating.toFixed(1)}
                      </span>
                    )}
                  </p>
                  <div className="mt-auto flex gap-2 pt-5">
                    <Link href={`/instructor/courses/${c.id}`}>
                      <Button size="sm" className="rounded-full">
                        <PenLine /> Edit
                      </Button>
                    </Link>
                    <Link href={`/courses/${c.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                      >
                        View <ArrowUpRight className="rtl:-scale-x-100" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </div>
  );
}
