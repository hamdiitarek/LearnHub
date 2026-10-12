import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CirclePlay,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { db } from "@/lib/db";
import { isDemo } from "@/lib/demo/mode";
import {
  CourseCard,
  type CourseSummary,
} from "@/components/course/course-card";
import { CourseCover } from "@/components/course/course-cover";
import { PageMotion } from "@/components/motion/page-motion";
import { formatDuration, plural } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getHomeData() {
  const [courses, lessonAgg, quizzes, learners, certificates, lectureCredits] =
    await Promise.all([
      db.course.findMany({
        where: { status: "PUBLISHED" },
        include: {
          instructor: { select: { name: true } },
          lessons: {
            select: {
              title: true,
              duration: true,
              order: true,
              quiz: { select: { id: true } },
            },
            orderBy: { order: "asc" },
          },
          reviews: { select: { rating: true } },
          _count: {
            select: { lessons: true, enrollments: true, reviews: true },
          },
        },
      }),
      db.lesson.aggregate({
        where: { course: { status: "PUBLISHED" } },
        _sum: { duration: true },
        _count: true,
      }),
      db.quiz.count({ where: { lesson: { course: { status: "PUBLISHED" } } } }),
      db.user.count({ where: { role: "STUDENT" } }),
      db.certificate.count(),
      db.lesson.findMany({
        where: { course: { status: "PUBLISHED" } },
        select: { description: true },
      }),
    ]);

  const summaries = courses
    .map((c) => ({
      ...c,
      avgRating: c.reviews.length
        ? c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length
        : 0,
      totalDuration: c.lessons.reduce((s, l) => s + l.duration, 0),
    }))
    .sort((a, b) => b._count.enrollments - a._count.enrollments);

  // Lesson descriptions end with "Lecture: “…” by <channel>, on YouTube."
  const channels = new Map<string, number>();
  for (const { description } of lectureCredits) {
    const m = description?.match(/by (.+?), on YouTube\.$/m);
    if (m) channels.set(m[1], (channels.get(m[1]) ?? 0) + 1);
  }

  return {
    // Only what the (client) card needs crosses to the browser.
    featured: summaries.slice(0, 6).map(
      (c): CourseSummary => ({
        id: c.id,
        title: c.title,
        shortDescription: c.shortDescription,
        description: c.description,
        thumbnail: c.thumbnail,
        category: c.category,
        level: c.level,
        price: c.price,
        avgRating: c.avgRating,
        totalDuration: c.totalDuration,
        instructor: c.instructor,
        _count: c._count,
      }),
    ),
    spotlight: summaries.find((c) => c.lessons.length >= 5) ?? summaries[0],
    stats: {
      courses: courses.length,
      lessons: lessonAgg._count,
      seconds: lessonAgg._sum.duration ?? 0,
      quizzes,
      learners,
      certificates,
    },
    channels: [...channels.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name),
  };
}

const STEPS = [
  {
    icon: CirclePlay,
    title: "Watch",
    body: "Each lesson is a complete lecture from a teacher who explains it well, in an order that builds.",
  },
  {
    icon: ListChecks,
    title: "Check",
    body: "Short quizzes after the key lessons show what stuck, and you can retake them as often as you like.",
  },
  {
    icon: Sparkles,
    title: "Keep going",
    body: "Your place is saved on every lesson, so a long course fits around lectures, work and life.",
  },
  {
    icon: BadgeCheck,
    title: "Finish",
    body: "Complete every lesson to earn a certificate with its own number that anyone can verify.",
  },
];

const DEMOS = [
  {
    role: "student",
    title: "Student",
    body: "Nour is halfway through three courses and finished one. See her dashboard, quizzes and certificate.",
  },
  {
    role: "instructor",
    title: "Instructor",
    body: "Omar curates the web development path. Edit courses, add lessons and quizzes, and see who enrolled.",
  },
  {
    role: "admin",
    title: "Admin",
    body: "Mona looks after the platform. See every user, course and enrolment, and change roles.",
  },
];

export default async function HomePage() {
  const { featured, spotlight, stats, channels } = await getHomeData();
  const nextLessons = spotlight?.lessons.slice(0, 4) ?? [];

  return (
    <PageMotion>
      {/* ------------------------------------------------------------ hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pt-14 pb-20 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
        <div>
          <p
            data-hero-fade
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[13px] font-medium text-muted-foreground"
          >
            <span className="size-1.5 rounded-full bg-forest" />
            {plural(stats.courses, "course")} ·{" "}
            {Math.round(stats.seconds / 3600)} hours of lectures · free
          </p>
          <h1
            data-hero-title
            className="mt-6 font-display text-[clamp(2.9rem,6.4vw,5.1rem)] leading-[0.98]"
          >
            The best free lectures, organised into{" "}
            <span className="mark">real courses.</span>
          </h1>
          <p
            data-hero-fade
            className="mt-6 max-w-xl text-[18px] leading-relaxed text-ink/75"
          >
            LearnHub turns hours of great teaching into step-by-step courses,
            with quizzes after the key lessons, progress that saves itself, and
            a certificate when you finish.
          </p>
          <div
            data-hero-fade
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3.5 text-[15px] font-semibold text-paper transition hover:bg-forest-deep"
            >
              Browse courses <ArrowRight className="size-4 rtl:rotate-180" />
            </Link>
            <Link
              href={isDemo ? "/login?demo=student" : "/register"}
              className="rounded-full border border-ink/20 px-6 py-3.5 text-[15px] font-semibold transition hover:border-ink/50"
            >
              {isDemo ? "Try the student demo" : "Create a free account"}
            </Link>
          </div>
          <p data-hero-fade className="mt-4 text-[13px] text-muted-foreground">
            {isDemo
              ? "The demo signs you in with one click. No account needed."
              : "Free to join. Your progress is saved on every lesson."}
          </p>
        </div>

        {spotlight && (
          <div className="relative mx-auto w-full max-w-[460px]">
            <div
              data-hero-book
              className="rotate-[-1.5deg] overflow-hidden rounded-[22px] border border-ink/10 shadow-[0_40px_80px_-40px_rgb(18_32_26/0.55)]"
            >
              <CourseCover
                title={spotlight.title}
                category={spotlight.category}
                lessons={spotlight._count.lessons}
                seconds={spotlight.totalDuration}
                size="lg"
              />
            </div>
            <div
              data-hero-card
              className="ruled relative ms-8 me-[-8px] -mt-10 rounded-[18px] border border-border bg-card p-5 shadow-[0_24px_50px_-30px_rgb(18_32_26/0.5)] sm:ms-14"
            >
              <p className="text-[12px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                Up next
              </p>
              <ol className="mt-3 space-y-2.5">
                {nextLessons.map((l, i) => (
                  <li
                    key={l.order}
                    className="flex items-center gap-3 text-[14px]"
                  >
                    <span
                      data-hero-check
                      className={
                        i < 2
                          ? "grid size-6 shrink-0 place-items-center rounded-full bg-forest text-[11px] font-bold text-paper"
                          : "grid size-6 shrink-0 place-items-center rounded-full border border-ink/25 text-[11px] font-semibold"
                      }
                    >
                      {i < 2 ? "✓" : i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{l.title}</span>
                    {l.quiz ? (
                      <span className="shrink-0 rounded-full bg-highlight px-2 py-0.5 text-[11px] font-semibold">
                        Quiz
                      </span>
                    ) : (
                      <span className="shrink-0 text-[12px] text-muted-foreground">
                        {formatDuration(l.duration)}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  data-hero-progress
                  className="h-full rounded-full bg-forest"
                  style={{
                    width: `${Math.round((2 / Math.max(1, spotlight.lessons.length)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------ stats */}
      <section className="border-y border-border bg-card">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-5 py-10 md:grid-cols-5">
          {[
            [stats.courses, "courses"],
            [stats.lessons, "lectures"],
            [Math.round(stats.seconds / 3600), "hours of teaching"],
            [stats.quizzes, "quizzes"],
            [stats.certificates, "certificates earned"],
          ].map(([value, label]) => (
            <div key={label as string}>
              <dd
                className="font-display text-[44px] leading-none tabular-nums"
                data-count={value}
              >
                {value}
              </dd>
              <dt className="mt-1 text-[14px] text-muted-foreground">
                {label}
              </dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ------------------------------------------------------------ how it works */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2
          data-split
          className="max-w-2xl font-display text-[clamp(2.2rem,4.5vw,3.4rem)] leading-[1.02]"
        >
          A lecture is not a course.{" "}
          <span className="text-forest italic">This is.</span>
        </h2>
        <div data-steps className="relative mt-12">
          <div
            data-steps-line
            className="absolute inset-x-0 -top-px z-10 h-[3px] rounded-full bg-highlight"
          />
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} data-step className="bg-card p-6">
                <div className="flex items-center justify-between">
                  <s.icon data-step-icon className="size-6 text-forest" />
                  <span className="font-display text-[22px] text-ink/30">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-[19px] font-semibold">{s.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ courses */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2
            data-split
            className="font-display text-[clamp(2.2rem,4.5vw,3.4rem)] leading-[1.02]"
          >
            Most popular paths
          </h2>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-forest hover:underline"
          >
            All {plural(stats.courses, "course")}{" "}
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((c) => (
            <div key={c.id} data-reveal>
              <CourseCard course={c} />
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ teachers */}
      {channels.length > 0 && (
        <section data-channels className="bg-ink text-paper">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <p className="text-[13px] font-semibold tracking-[0.14em] text-paper/60 uppercase">
              Lectures by
            </p>
            <p className="mt-4 font-display text-[clamp(1.8rem,3.6vw,2.8rem)] leading-[1.15]">
              {channels.map((name, i) => (
                <span key={name}>
                  <span
                    data-channel
                    className={i === 0 ? "text-highlight" : undefined}
                  >
                    {name}
                  </span>
                  {i < channels.length - 1 && (
                    <span className="text-paper/35"> · </span>
                  )}
                </span>
              ))}
            </p>
            <p className="mt-6 max-w-2xl text-[14px] text-paper/60">
              Every lesson embeds the original video from YouTube and credits
              its creator. LearnHub adds the structure: the order, the quizzes,
              the progress and the certificate.
            </p>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ demo (DEMO_MODE only) */}
      {isDemo && (
        <section className="mx-auto max-w-6xl px-5 py-20">
          <h2
            data-split
            className="max-w-2xl font-display text-[clamp(2.2rem,4.5vw,3.4rem)] leading-[1.02]"
          >
            Look around as <span className="mark">anyone.</span>
          </h2>
          <p className="mt-4 max-w-xl text-[16px] text-muted-foreground">
            This is a live demo with its own database. Sign in as any role with
            one click; changes stay until the server restarts.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {DEMOS.map((d) => (
              <Link
                key={d.role}
                href={`/login?demo=${d.role}`}
                data-reveal
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition hover:border-forest"
              >
                <span className="w-fit rounded-full bg-secondary px-3 py-1 text-[12px] font-semibold">
                  {d.title}
                </span>
                <p className="mt-4 flex-1 text-[15px] leading-relaxed text-ink/75">
                  {d.body}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-forest">
                  Sign in as {d.title.toLowerCase()}{" "}
                  <ArrowRight className="size-4 transition group-hover:translate-x-0.5 rtl:rotate-180" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </PageMotion>
  );
}
