"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Check, PenLine, Search, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { coverColors } from "@/components/course/course-cover";
import { levelLabel, plural } from "@/lib/format";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------ API shapes

interface StatsResponse {
  stats: {
    users: {
      total: number;
      students: number;
      instructors: number;
      admins: number;
    };
    courses: { total: number; published: number; draft: number };
    enrollments: number;
    completedEnrollments: number;
    lessons: number;
    reviews: number;
    certificates: number;
    avgRating: number;
  };
  recentActivity: {
    users: {
      id: string;
      name: string;
      email: string;
      role: Role;
      createdAt: string;
    }[];
    enrollments: {
      id: string;
      enrolledAt: string;
      user: { name: string };
      course: { title: string };
    }[];
  };
  popularCourses: {
    id: string;
    title: string;
    _count: { enrollments: number };
  }[];
  enrollmentsByWeek: { weekStart: string; enrollments: number }[];
  courses: AdminCourse[];
}

interface AdminCourse {
  id: string;
  title: string;
  category: string | null;
  level: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  updatedAt: string;
  avgRating: number;
  instructor: { name: string };
  _count: { lessons: number; enrollments: number; certificates: number };
}

type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
  createdAt: string;
  _count: { enrollments: number; courses: number };
}

// ------------------------------------------------------------ helpers

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "courses", label: "Courses" },
  { id: "people", label: "People" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Student",
  INSTRUCTOR: "Instructor",
  ADMIN: "Admin",
};
const ROLE_STYLE: Record<Role, string> = {
  STUDENT: "bg-secondary text-ink/75",
  INSTRUCTOR: "bg-accent text-forest-deep",
  ADMIN: "bg-ink text-paper",
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const fmtShort = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

function timeAgo(d: string) {
  const mins = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return fmtShort(d);
}

const ease = [0.22, 1, 0.36, 1] as const;
const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

// ------------------------------------------------------------ page

export default function AdminPage() {
  return (
    <Suspense>
      <AdminView />
    </Suspense>
  );
}

function AdminView() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<StatsResponse | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>(() => {
    const requested = searchParams.get("tab");
    return TABS.some((t) => t.id === requested)
      ? (requested as Tab)
      : "overview";
  });
  const [toast, setToast] = useState("");

  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/admin");
    else if (status === "authenticated" && !isAdmin) router.push("/dashboard");
  }, [status, isAdmin, router]);

  const load = useCallback(async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users?limit=200"),
      ]);
      if (!statsRes.ok || !usersRes.ok) throw new Error("Request failed");
      setData(await statsRes.json());
      setUsers((await usersRes.json()).users ?? []);
      setError("");
    } catch {
      setError("Couldn't load the admin data. Refresh to try again.");
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && isAdmin) load();
  }, [status, isAdmin, load]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  const changeRole = async (user: User, role: Role) => {
    const previous = user.role;
    setUsers((list) =>
      list.map((u) => (u.id === user.id ? { ...u, role } : u)),
    );
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setToast(
        `${user.name} is now ${ROLE_LABEL[role] === "Admin" ? "an admin" : `a ${ROLE_LABEL[role].toLowerCase()}`}`,
      );
      load();
    } else {
      setUsers((list) =>
        list.map((u) => (u.id === user.id ? { ...u, role: previous } : u)),
      );
      setToast(
        (await res.json().catch(() => ({}))).error ??
          "Couldn't change the role",
      );
    }
  };

  const toggleCourse = async (course: AdminCourse) => {
    const publish = course.status !== "PUBLISHED";
    const res = await fetch(`/api/courses/${course.id}/publish`, {
      method: publish ? "POST" : "DELETE",
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setToast(body.error ?? "Couldn't update the course");
      return;
    }
    setData(
      (d) =>
        d && {
          ...d,
          courses: d.courses.map((c) =>
            c.id === course.id
              ? { ...c, status: publish ? "PUBLISHED" : "DRAFT" }
              : c,
          ),
        },
    );
    setToast(
      publish
        ? `“${course.title}” is live`
        : `“${course.title}” is back in drafts`,
    );
    load();
  };

  if (status === "loading" || (isAdmin && !data && !error)) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-12 w-1/3 rounded-xl bg-secondary" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-secondary" />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-secondary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-[12px] font-semibold tracking-[0.16em] text-forest uppercase">
        Admin
      </p>
      <h1 className="mt-2 font-display text-[clamp(2.6rem,5vw,4rem)] leading-none">
        The whole platform
      </h1>
      <p className="mt-3 text-[16px] text-muted-foreground">
        Courses, people and how learning is going, in one place. Signed in as{" "}
        {session?.user?.name}.
      </p>

      {/* tabs */}
      <div
        className="mt-8 inline-flex rounded-full border border-border bg-card p-1"
        role="tablist"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id);
              router.replace(
                t.id === "overview" ? "/admin" : `/admin?tab=${t.id}`,
                { scroll: false },
              );
            }}
            className={cn(
              "relative rounded-full px-4 py-2 text-[14px] font-medium transition-colors",
              tab === t.id ? "text-paper" : "text-ink/65 hover:text-ink",
            )}
          >
            {tab === t.id && (
              <motion.span
                layoutId="admin-tab"
                className="absolute inset-0 rounded-full bg-ink"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-8 rounded-xl bg-clay/10 p-4 text-[14px] text-clay">
          {error}
        </p>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease }}
          className="mt-8"
        >
          {data && tab === "overview" && <Overview data={data} />}
          {data && tab === "courses" && (
            <Courses courses={data.courses} onToggle={toggleCourse} />
          )}
          {tab === "people" && (
            <People users={users} me={session?.user?.id} onRole={changeRole} />
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed inset-x-0 bottom-6 z-50 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-2.5 rounded-full bg-ink px-5 py-3 text-[14px] text-paper shadow-xl"
            role="status"
          >
            <Check className="size-4 shrink-0 text-highlight" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ------------------------------------------------------------ overview

function Overview({ data }: { data: StatsResponse }) {
  const { stats, recentActivity, popularCourses, enrollmentsByWeek } = data;
  const completion = stats.enrollments
    ? Math.round((stats.completedEnrollments / stats.enrollments) * 100)
    : 0;
  const maxWeek = Math.max(1, ...enrollmentsByWeek.map((w) => w.enrollments));
  const lastFour = enrollmentsByWeek
    .slice(-4)
    .reduce((s, w) => s + w.enrollments, 0);
  const maxPopular = Math.max(
    1,
    ...popularCourses.map((c) => c._count.enrollments),
  );

  const feed = [
    ...recentActivity.enrollments.map((e) => ({
      id: `e-${e.id}`,
      at: e.enrolledAt,
      who: e.user.name,
      what: (
        <>
          enrolled in{" "}
          <span className="font-medium text-ink">{e.course.title}</span>
        </>
      ),
    })),
    ...recentActivity.users.map((u) => ({
      id: `u-${u.id}`,
      at: u.createdAt,
      who: u.name,
      what: <>joined as {ROLE_LABEL[u.role].toLowerCase()}</>,
    })),
  ]
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 8);

  const cells: [number | string, string, string?][] = [
    [
      stats.users.students,
      "learners",
      `${stats.users.instructors} instructors · ${stats.users.admins} admin`,
    ],
    [
      stats.courses.published,
      "published courses",
      stats.courses.draft
        ? `${stats.courses.draft} in drafts`
        : "none in drafts",
    ],
    [stats.enrollments, "enrolments", `${completion}% finished`],
    [
      stats.certificates,
      "certificates",
      `${stats.avgRating.toFixed(1)}★ from ${plural(stats.reviews, "review")}`,
    ],
  ];

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.dl
        variants={rise}
        className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4"
      >
        {cells.map(([value, label, sub]) => (
          <div key={label} className="bg-card p-5">
            <dd className="font-display text-[44px] leading-none tabular-nums">
              {value}
            </dd>
            <dt className="mt-1 text-[14px] font-medium">{label}</dt>
            {sub && (
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                {sub}
              </p>
            )}
          </div>
        ))}
      </motion.dl>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* weekly enrolments */}
        <motion.section
          variants={rise}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-[28px] leading-none">
                Enrolments
              </h2>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                Per week, last 12 weeks
              </p>
            </div>
            <p className="text-[13px] text-muted-foreground">
              <span className="font-semibold text-ink">{lastFour}</span> in the
              last 4 weeks
            </p>
          </div>
          <div className="mt-6 flex h-48 items-end gap-1.5 sm:gap-2.5">
            {enrollmentsByWeek.map((w, i) => {
              const latest = i === enrollmentsByWeek.length - 1;
              return (
                <div
                  key={w.weekStart}
                  className="group relative flex h-full flex-1 flex-col justify-end"
                >
                  <span
                    className={cn(
                      "pointer-events-none absolute -top-1 -translate-y-full rounded-md bg-ink px-2 py-1 text-[11.5px] whitespace-nowrap text-paper opacity-0 transition group-hover:opacity-100",
                      // Keep the labels of the edge bars inside the card.
                      i < 2
                        ? "start-0"
                        : i > enrollmentsByWeek.length - 3
                          ? "end-0"
                          : "left-1/2 -translate-x-1/2",
                    )}
                  >
                    {plural(w.enrollments, "enrolment")} · w/c{" "}
                    {fmtShort(w.weekStart)}
                  </span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{
                      height: `${Math.max(3, (w.enrollments / maxWeek) * 100)}%`,
                    }}
                    transition={{ duration: 0.9, ease, delay: 0.15 + i * 0.04 }}
                    className={cn(
                      "w-full rounded-t-md",
                      latest
                        ? "bg-forest"
                        : "bg-forest/25 group-hover:bg-forest/45",
                    )}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[11.5px] text-muted-foreground">
            <span>
              {enrollmentsByWeek[0] && fmtShort(enrollmentsByWeek[0].weekStart)}
            </span>
            <span>This week</span>
          </div>
        </motion.section>

        {/* popular */}
        <motion.section
          variants={rise}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <h2 className="font-display text-[28px] leading-none">
            Most enrolled
          </h2>
          <ol className="mt-5 space-y-4">
            {popularCourses.map((c, i) => (
              <li key={c.id}>
                <div className="flex items-baseline justify-between gap-3 text-[14px]">
                  <Link
                    href={`/courses/${c.id}`}
                    className="min-w-0 truncate font-medium hover:text-forest"
                  >
                    <span className="me-2 text-muted-foreground tabular-nums">
                      {i + 1}
                    </span>
                    {c.title}
                  </Link>
                  <span className="shrink-0 text-[13px] text-muted-foreground tabular-nums">
                    {c._count.enrollments}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(c._count.enrollments / maxPopular) * 100}%`,
                    }}
                    transition={{ duration: 1, ease, delay: 0.25 + i * 0.08 }}
                    className="h-full rounded-full bg-forest"
                  />
                </div>
              </li>
            ))}
          </ol>
        </motion.section>
      </div>

      {/* activity */}
      <motion.section
        variants={rise}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <h2 className="font-display text-[28px] leading-none">
          Latest activity
        </h2>
        <motion.ul variants={stagger} className="mt-4 divide-y divide-border">
          {feed.map((item) => (
            <motion.li
              key={item.id}
              variants={rise}
              className="flex items-center gap-3 py-3 text-[14px]"
            >
              <Avatar fallback={item.who} size="sm" />
              <p className="min-w-0 flex-1 text-muted-foreground">
                <span className="font-semibold text-ink">{item.who}</span>{" "}
                {item.what}
              </p>
              <span className="shrink-0 text-[12.5px] text-muted-foreground">
                {timeAgo(item.at)}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </motion.section>
    </motion.div>
  );
}

// ------------------------------------------------------------ courses

function Courses({
  courses,
  onToggle,
}: {
  courses: AdminCourse[];
  onToggle: (c: AdminCourse) => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="hidden grid-cols-[1fr_110px_90px_90px_150px] gap-4 border-b border-border px-5 py-3 text-[12px] font-semibold tracking-[0.08em] text-muted-foreground uppercase md:grid">
        <span>Course</span>
        <span className="text-end">Learners</span>
        <span className="text-end">Rating</span>
        <span className="text-end">Lessons</span>
        <span className="text-end">Status</span>
      </div>
      <motion.ul
        variants={stagger}
        initial="hidden"
        animate="show"
        className="divide-y divide-border"
      >
        {courses.map((c) => {
          const live = c.status === "PUBLISHED";
          return (
            <motion.li
              key={c.id}
              variants={rise}
              className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-5 py-4 md:grid-cols-[1fr_110px_90px_90px_150px]"
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <span
                  className="grid h-12 w-9 shrink-0 place-items-end rounded-[4px] p-1"
                  style={{ background: coverColors(c.category).bg }}
                  aria-hidden
                >
                  <span
                    className="h-[3px] w-4 rounded-full"
                    style={{ background: coverColors(c.category).rule }}
                  />
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/courses/${c.id}`}
                    className="block truncate font-semibold hover:text-forest"
                  >
                    {c.title}
                  </Link>
                  <p className="truncate text-[13px] text-muted-foreground">
                    {c.instructor.name} · {c.category ?? "Uncategorised"} ·{" "}
                    {levelLabel(c.level)}
                  </p>
                </div>
              </div>

              <span className="hidden text-end text-[14px] tabular-nums md:block">
                {c._count.enrollments}
              </span>
              <span className="hidden items-center justify-end gap-1 text-[14px] tabular-nums md:flex">
                {c.avgRating ? (
                  <>
                    <Star className="size-3.5 fill-[#e0a400] text-[#e0a400]" />
                    {c.avgRating.toFixed(1)}
                  </>
                ) : (
                  <span className="text-muted-foreground">–</span>
                )}
              </span>
              <span className="hidden text-end text-[14px] tabular-nums md:block">
                {c._count.lessons}
              </span>

              <div className="flex items-center justify-end gap-2">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={c.status}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[12px] font-semibold",
                      live
                        ? "bg-highlight text-ink"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {live ? "Live" : "Draft"}
                  </motion.span>
                </AnimatePresence>
                <Link
                  href={`/instructor/courses/${c.id}`}
                  aria-label={`Edit ${c.title}`}
                  className="grid size-8 place-items-center rounded-full border border-border transition hover:border-ink/40"
                >
                  <PenLine className="size-3.5" />
                </Link>
                <button
                  disabled={busy === c.id}
                  onClick={async () => {
                    setBusy(c.id);
                    await onToggle(c);
                    setBusy(null);
                  }}
                  className="rounded-full border border-border px-3 py-1 text-[12.5px] font-medium transition hover:border-ink/40 disabled:opacity-50"
                >
                  {live ? "Unpublish" : "Publish"}
                </button>
              </div>

              <p className="col-span-2 -mt-1 text-[12.5px] text-muted-foreground md:hidden">
                {plural(c._count.enrollments, "learner")} ·{" "}
                {plural(c._count.lessons, "lesson")}
                {c.avgRating ? ` · ${c.avgRating.toFixed(1)}★` : ""}
              </p>
            </motion.li>
          );
        })}
      </motion.ul>
    </div>
  );
}

// ------------------------------------------------------------ people

const ROLE_FILTERS: { id: Role | ""; label: string }[] = [
  { id: "", label: "Everyone" },
  { id: "STUDENT", label: "Students" },
  { id: "INSTRUCTOR", label: "Instructors" },
  { id: "ADMIN", label: "Admins" },
];

function People({
  users,
  me,
  onRole,
}: {
  users: User[];
  me?: string;
  onRole: (u: User, r: Role) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Role | "">("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) =>
        (!role || u.role === role) &&
        (!q ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)),
    );
  }, [users, query, role]);

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-80">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            aria-label="Search people"
            className="h-10 w-full rounded-full border border-input bg-card ps-10 pe-4 text-[14px] outline-none focus:border-forest"
          />
        </div>
        <div className="-mx-1 no-scrollbar flex gap-1 overflow-x-auto px-1">
          {ROLE_FILTERS.map((f) => {
            const count = f.id
              ? users.filter((u) => u.role === f.id).length
              : users.length;
            return (
              <button
                key={f.id || "all"}
                onClick={() => setRole(f.id)}
                className={cn(
                  "relative shrink-0 rounded-full px-3.5 py-1.5 text-[13.5px] font-medium transition-colors",
                  role === f.id ? "text-paper" : "text-ink/70 hover:text-ink",
                )}
              >
                {role === f.id && (
                  <motion.span
                    layoutId="people-filter"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">
                  {f.label} <span className="opacity-60">{count}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="hidden grid-cols-[1fr_120px_110px_140px] gap-4 border-b border-border px-5 py-3 text-[12px] font-semibold tracking-[0.08em] text-muted-foreground uppercase md:grid">
          <span>Person</span>
          <span className="text-end">Learning</span>
          <span className="text-end">Joined</span>
          <span className="text-end">Role</span>
        </div>
        <ul className="divide-y divide-border">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((u) => (
              <motion.li
                key={u.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, ease }}
                className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3.5 md:grid-cols-[1fr_120px_110px_140px]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar src={u.avatar} fallback={u.name} size="md" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {u.name}
                      {u.id === me && (
                        <span className="ms-2 text-[12px] font-normal text-muted-foreground">
                          (you)
                        </span>
                      )}
                    </p>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {u.email}
                    </p>
                  </div>
                </div>
                <span className="hidden text-end text-[13.5px] text-muted-foreground md:block">
                  {u.role === "STUDENT" || u._count.courses === 0
                    ? plural(u._count.enrollments, "course")
                    : `teaches ${u._count.courses}`}
                </span>
                <span className="hidden text-end text-[13.5px] text-muted-foreground md:block">
                  {fmtDate(u.createdAt)}
                </span>
                <div className="flex justify-end">
                  <label className="relative">
                    <span className="sr-only">Role for {u.name}</span>
                    <select
                      value={u.role}
                      disabled={u.id === me}
                      onChange={(e) => onRole(u, e.target.value as Role)}
                      className={cn(
                        "cursor-pointer appearance-none rounded-full py-1.5 ps-3 pe-7 text-[12.5px] font-semibold outline-none disabled:cursor-not-allowed",
                        ROLE_STYLE[u.role],
                      )}
                    >
                      {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-[9px] opacity-60">
                      ▼
                    </span>
                  </label>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {visible.length === 0 && (
          <p className="px-5 py-12 text-center text-muted-foreground">
            Nobody matches that search.
          </p>
        )}
      </div>
      <p className="mt-3 text-[13px] text-muted-foreground">
        Showing {visible.length} of{" "}
        {plural(users.length, "person").replace("persons", "people")}.
        <Link
          href="/instructor"
          className="ms-2 inline-flex items-center gap-0.5 font-medium text-forest hover:underline"
        >
          Course editor <ArrowUpRight className="size-3.5" />
        </Link>
      </p>
    </div>
  );
}
