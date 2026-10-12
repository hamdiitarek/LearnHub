"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  CourseCard,
  type CourseSummary,
} from "@/components/course/course-card";
import { levelLabel, plural } from "@/lib/format";
import { cn } from "@/lib/utils";

const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  // Loading = the filters on screen haven't come back from the API yet.
  const requestKey = `${query}|${category}|${level}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const isLoading = loadedKey !== requestKey;

  // Debounce typing so every keystroke doesn't hit the API.
  useEffect(() => {
    const id = setTimeout(() => setQuery(search.trim()), 250);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: "48" });
    if (query) params.append("search", query);
    if (category) params.append("category", category);
    if (level) params.append("level", level);
    fetch(`/api/courses?${params}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const list: CourseSummary[] = data.courses || [];
        setCourses(list);
        // Remember categories from the unfiltered list so the chips don't disappear while filtering.
        if (!query && !category && !level) {
          setAllCategories(
            [
              ...new Set(
                list.map((c) => c.category).filter(Boolean) as string[],
              ),
            ].sort(),
          );
        }
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          console.error("Failed to fetch courses:", e);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadedKey(requestKey);
      });
    return () => controller.abort();
  }, [query, category, level, requestKey]);

  const filtered = useMemo(
    () => Boolean(query || category || level),
    [query, category, level],
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="font-display text-[clamp(2.6rem,5vw,4rem)] leading-none">
        Courses
      </h1>
      <p className="mt-3 max-w-xl text-[16px] text-muted-foreground">
        Every course is a path of complete lectures in a deliberate order, with
        quizzes along the way.
      </p>

      <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 md:flex-row md:items-center">
        <div className="relative md:w-80">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search courses"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-full ps-9"
            aria-label="Search courses"
          />
        </div>
        <div className="-mx-1 no-scrollbar flex gap-1.5 overflow-x-auto px-1 md:flex-1">
          {["", ...allCategories].map((cat) => (
            <button
              key={cat || "all"}
              onClick={() => setCategory(cat)}
              className={cn(
                "relative shrink-0 rounded-full px-3.5 py-1.5 text-[13.5px] font-medium transition-colors",
                category === cat
                  ? "text-paper"
                  : "bg-secondary text-ink/75 hover:text-ink",
              )}
            >
              {category === cat && (
                <motion.span
                  layoutId="category-pill"
                  className="absolute inset-0 rounded-full bg-ink"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative">{cat || "All subjects"}</span>
            </button>
          ))}
        </div>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          aria-label="Level"
          className="h-10 rounded-full border border-input bg-background px-4 text-[14px]"
        >
          <option value="">Any level</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {levelLabel(l)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 flex items-center justify-between text-[14px] text-muted-foreground">
        <span>{isLoading ? "Loading…" : plural(courses.length, "course")}</span>
        {filtered && (
          <button
            onClick={() => {
              setSearch("");
              setCategory("");
              setLevel("");
            }}
            className="inline-flex items-center gap-1 font-medium text-forest hover:underline"
          >
            <X className="size-3.5" /> Clear filters
          </button>
        )}
      </div>

      {isLoading && courses.length === 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-[360px] animate-pulse rounded-2xl bg-secondary"
            />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="font-display text-[28px]">Nothing on that shelf yet</p>
          <p className="mt-2 text-muted-foreground">
            Try another subject or a shorter search.
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "mt-6 grid gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-3",
            isLoading && "opacity-60",
          )}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {courses.map((course, i) => (
              <motion.div
                key={course.id}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                    delay: Math.min(i, 8) * 0.04,
                  },
                }}
                exit={{
                  opacity: 0,
                  scale: 0.96,
                  transition: { duration: 0.2 },
                }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
              >
                <CourseCard course={course} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
