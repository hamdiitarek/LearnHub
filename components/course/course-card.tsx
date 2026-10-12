"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Star } from "lucide-react";
import { CourseCover } from "./course-cover";
import { levelLabel, plural } from "@/lib/format";

export type CourseSummary = {
  id: string;
  title: string;
  shortDescription?: string | null;
  description?: string | null;
  thumbnail: string | null;
  category: string | null;
  level: string;
  price: number;
  avgRating?: number;
  totalDuration?: number;
  instructor: { name: string };
  _count: { lessons: number; enrollments: number; reviews?: number };
};

const MotionLink = motion.create(Link);
const spring = { type: "spring", stiffness: 320, damping: 26 } as const;

export function CourseCard({ course }: { course: CourseSummary }) {
  return (
    <MotionLink
      href={`/courses/${course.id}`}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap={{ scale: 0.985 }}
      variants={{
        rest: { y: 0, boxShadow: "0 0 0 0 rgb(18 32 26 / 0)" },
        hover: { y: -6, boxShadow: "0 26px 50px -30px rgb(18 32 26 / 0.55)" },
      }}
      transition={spring}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="relative overflow-hidden">
        <motion.div
          variants={{ rest: { scale: 1 }, hover: { scale: 1.05 } }}
          transition={{ ...spring, stiffness: 180 }}
        >
          <CourseCover
            title={course.title}
            category={course.category}
            thumbnail={course.thumbnail}
            lessons={course._count.lessons}
            seconds={course.totalDuration}
          />
        </motion.div>
        <motion.span
          variants={{
            rest: { opacity: 0, scale: 0.6 },
            hover: { opacity: 1, scale: 1 },
          }}
          transition={spring}
          className="absolute end-4 top-4 grid size-9 place-items-center rounded-full bg-paper text-ink"
          aria-hidden
        >
          <ArrowUpRight className="size-4 rtl:-scale-x-100" />
        </motion.span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3 text-[12px] font-medium text-muted-foreground">
          <span>{levelLabel(course.level)}</span>
          {course.avgRating ? (
            <span className="flex items-center gap-1 text-foreground">
              <Star className="size-3.5 fill-[#e0a400] text-[#e0a400]" />
              {course.avgRating.toFixed(1)}
              {course._count.reviews !== undefined && (
                <span className="text-muted-foreground">
                  ({course._count.reviews})
                </span>
              )}
            </span>
          ) : null}
        </div>
        <h3 className="mt-2 text-[17px] leading-snug font-semibold group-hover:text-forest">
          {course.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[14px] text-muted-foreground">
          {course.shortDescription || course.description}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-[13px]">
          <span className="text-muted-foreground">
            {course.instructor.name} ·{" "}
            {plural(course._count.enrollments, "learner")}
          </span>
          <span className="font-semibold text-forest">
            {course.price === 0 ? "Free" : `$${course.price}`}
          </span>
        </div>
      </div>
    </MotionLink>
  );
}
