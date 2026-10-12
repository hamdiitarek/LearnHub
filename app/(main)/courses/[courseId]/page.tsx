"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, CirclePlay, ListChecks, Lock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageMotion } from "@/components/motion/page-motion";
import { Progress } from "@/components/ui/progress";
import { ReviewForm } from "@/components/review/review-form";
import { CourseCover } from "@/components/course/course-cover";
import { formatDuration, levelLabel, plural } from "@/lib/format";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  order: number;
  isFree: boolean;
  videoUrl: string | null;
  quiz: { id: string; title: string; _count: { questions: number } } | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  user: { id?: string; name: string };
  createdAt: string;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  thumbnail: string | null;
  price: number;
  level: string;
  category: string | null;
  status: string;
  instructor: {
    id: string;
    name: string;
    avatar?: string | null;
    bio?: string | null;
  };
  lessons: Lesson[];
  _count: { enrollments: number; reviews: number };
  avgRating?: number;
  totalDuration?: number;
  isOwner?: boolean;
}

interface Enrollment {
  id: string;
  progress: number;
}

/** "Summary.\n\nLecture: “Title” by Channel, on YouTube." → parts */
function splitLesson(description: string | null) {
  const [summary, ...rest] = (description ?? "").split(/\n\n(?=Lecture: )/);
  return {
    summary: summary.trim(),
    credit: rest
      .join("")
      .replace(/^Lecture: /, "")
      .trim(),
  };
}

function Stars({ value, size = "size-4" }: { value: number; size?: string }) {
  return (
    <span
      className="flex items-center gap-0.5"
      aria-label={`${value.toFixed(1)} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${size} ${s <= Math.round(value) ? "fill-[#e0a400] text-[#e0a400]" : "text-ink/20"}`}
        />
      ))}
    </span>
  );
}

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const { data: session } = useSession();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const fetchCourse = useCallback(async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      const data = await response.json();
      if (!response.ok || data.error) {
        router.push("/courses");
        return;
      }
      setCourse(data);
      setEnrollment(data.enrollment);
    } catch (error) {
      console.error("Failed to fetch course:", error);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, router]);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch(`/api/reviews?courseId=${courseId}`);
      const data = await response.json();
      setReviews(data.reviews || []);
      if (data.stats)
        setStats({
          averageRating: data.stats.avgRating || 0,
          totalReviews: data.stats.totalReviews || 0,
        });
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourse();
    fetchReviews();
  }, [fetchCourse, fetchReviews]);

  // Re-fetch once the session resolves so enrolment and "your review" are right.
  useEffect(() => {
    if (session?.user) fetchCourse();
  }, [session?.user, fetchCourse]);

  const userReview =
    reviews.find((r) => r.user?.id && r.user.id === session?.user?.id) ?? null;

  const handleEnroll = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=/courses/${courseId}`);
      return;
    }
    setIsEnrolling(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        setEnrollment(data.enrollment);
        fetchCourse();
      }
    } catch (error) {
      console.error("Failed to enroll:", error);
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-2/3 rounded-xl bg-secondary" />
          <div className="h-5 w-1/3 rounded bg-secondary" />
          <div className="mt-8 h-72 rounded-2xl bg-secondary" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-20 text-center">
        <h1 className="font-display text-[40px]">Course not found</h1>
        <Link
          href="/courses"
          className="mt-6 inline-block text-forest underline"
        >
          Browse courses
        </Link>
      </div>
    );
  }

  const lessons = [...(course.lessons || [])].sort((a, b) => a.order - b.order);
  const totalDuration = lessons.reduce((acc, l) => acc + (l.duration || 0), 0);
  const quizCount = lessons.filter((l) => l.quiz).length;
  const freeCount = lessons.filter((l) => l.isFree).length;
  const canPreview = (l: Lesson) => Boolean(l.videoUrl);

  return (
    <PageMotion watch={`${course.id}-${lessons.length}`}>
      {/* ------------------------------------------------------------ header */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[1.35fr_1fr] lg:py-16">
          <div>
            <p className="text-[13px] font-semibold tracking-[0.12em] text-forest uppercase">
              {course.category} · {levelLabel(course.level)}
            </p>
            <h1 className="mt-4 font-display text-[clamp(2.6rem,5.4vw,4.4rem)] leading-[0.98]">
              {course.title}
            </h1>
            {course.shortDescription && (
              <p className="mt-5 max-w-2xl text-[18px] leading-relaxed text-ink/75">
                {course.shortDescription}
              </p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-muted-foreground">
              {stats.totalReviews > 0 && (
                <span className="flex items-center gap-2 text-ink">
                  <Stars value={stats.averageRating} />
                  <strong>{stats.averageRating.toFixed(1)}</strong>
                  <span className="text-muted-foreground">
                    ({plural(stats.totalReviews, "review")})
                  </span>
                </span>
              )}
              <span>{plural(course._count?.enrollments || 0, "learner")}</span>
              <span>Curated by {course.instructor?.name}</span>
            </div>
          </div>

          <aside className="lg:row-span-2">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_60px_-40px_rgb(18_32_26/0.5)] lg:sticky lg:top-24">
              <CourseCover
                title={course.title}
                category={course.category}
                thumbnail={course.thumbnail}
                lessons={lessons.length}
                seconds={totalDuration}
              />
              <div className="p-6">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-[36px] leading-none">
                    {course.price ? `$${course.price}` : "Free"}
                  </span>
                  {course.status !== "PUBLISHED" && (
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[12px] font-semibold">
                      {levelLabel(course.status)}
                    </span>
                  )}
                </div>
                {enrollment ? (
                  <div className="mt-5 space-y-4">
                    <div>
                      <div className="mb-2 flex justify-between text-[14px]">
                        <span>Your progress</span>
                        <span className="font-semibold">
                          {Math.round(enrollment.progress || 0)}%
                        </span>
                      </div>
                      <Progress value={enrollment.progress || 0} />
                    </div>
                    <Link href={`/courses/${course.id}/learn`}>
                      <Button className="w-full rounded-full" size="lg">
                        {enrollment.progress >= 100
                          ? "Review the course"
                          : enrollment.progress > 0
                            ? "Continue learning"
                            : "Start the first lesson"}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Button
                    className="mt-5 w-full rounded-full"
                    size="lg"
                    onClick={handleEnroll}
                    disabled={isEnrolling}
                  >
                    {isEnrolling
                      ? "Enrolling…"
                      : session
                        ? "Enrol for free"
                        : "Sign in to enrol"}
                  </Button>
                )}
                <ul className="mt-6 space-y-3 text-[14px]">
                  <li className="flex items-center gap-3">
                    <CirclePlay className="size-4 text-forest" />
                    {plural(lessons.length, "complete lecture")},{" "}
                    {formatDuration(totalDuration)}
                  </li>
                  {quizCount > 0 && (
                    <li className="flex items-center gap-3">
                      <ListChecks className="size-4 text-forest" />
                      {plural(quizCount, "quiz")}, retake as often as you like
                    </li>
                  )}
                  <li className="flex items-center gap-3">
                    <BadgeCheck className="size-4 text-forest" />
                    Certificate when you finish every lesson
                  </li>
                  {freeCount > 0 && !enrollment && (
                    <li className="flex items-center gap-3 text-muted-foreground">
                      <Lock className="size-4" />
                      {plural(freeCount, "lesson")} open to preview
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </aside>

          {/* ------------------------------------------------------------ body */}
          <div className="space-y-14">
            {course.description && (
              <div>
                <h2 className="font-display text-[30px]">About this course</h2>
                <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-ink/80">
                  {course.description}
                </p>
              </div>
            )}

            <div>
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-[30px]">The path</h2>
                <span className="text-[14px] text-muted-foreground">
                  {plural(lessons.length, "lesson")} ·{" "}
                  {formatDuration(totalDuration)}
                </span>
              </div>
              <div
                data-path
                className="relative mt-5 overflow-hidden rounded-2xl border border-border bg-card"
              >
                {/* fills down the list as you scroll (GSAP, components/motion/page-motion.tsx) */}
                <span
                  data-path-line
                  className="absolute inset-y-0 start-0 w-[3px] origin-top bg-forest"
                  aria-hidden
                />
                <ol className="divide-y divide-border">
                  {lessons.map((lesson, index) => {
                    const { summary, credit } = splitLesson(lesson.description);
                    const open = canPreview(lesson);
                    return (
                      <li key={lesson.id} className="flex gap-4 p-5">
                        <span
                          data-path-dot
                          className="w-7 shrink-0 font-display text-[22px] leading-6 text-ink/35"
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <h3 className="text-[16px] font-semibold">
                              {lesson.title}
                            </h3>
                            {lesson.quiz && (
                              <span className="rounded-full bg-highlight px-2 py-0.5 text-[11px] font-semibold">
                                Quiz
                              </span>
                            )}
                            {lesson.isFree && !enrollment && (
                              <span className="rounded-full border border-forest/30 px-2 py-0.5 text-[11px] font-semibold text-forest">
                                Free preview
                              </span>
                            )}
                          </div>
                          {summary && (
                            <p className="mt-1 text-[14px] text-muted-foreground">
                              {summary}
                            </p>
                          )}
                          {credit && (
                            <p className="mt-1.5 text-[12.5px] text-ink/55">
                              {credit}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1 text-[13px] text-muted-foreground">
                          <span>{formatDuration(lesson.duration)}</span>
                          {!open && (
                            <Lock
                              className="size-3.5"
                              aria-label="Enrol to watch"
                            />
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>

            {course.instructor && (
              <div className="flex gap-4 rounded-2xl border border-border bg-card p-6">
                <div className="grid size-12 shrink-0 place-items-center rounded-full bg-forest text-[18px] font-semibold text-paper">
                  {course.instructor.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[12px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    Curated by
                  </p>
                  <p className="mt-1 text-[17px] font-semibold">
                    {course.instructor.name}
                  </p>
                  {course.instructor.bio && (
                    <p className="mt-1.5 text-[14px] text-muted-foreground">
                      {course.instructor.bio}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-[30px]">What learners say</h2>
                {enrollment && !showReviewForm && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setShowReviewForm(true)}
                  >
                    {userReview ? "Edit your review" : "Write a review"}
                  </Button>
                )}
              </div>

              {showReviewForm && enrollment && (
                <div className="mt-5 rounded-2xl border border-border bg-card p-5">
                  <ReviewForm
                    courseId={course.id}
                    existingReview={
                      userReview
                        ? {
                            id: userReview.id,
                            rating: userReview.rating,
                            comment: userReview.comment,
                          }
                        : null
                    }
                    onSuccess={() => {
                      setShowReviewForm(false);
                      fetchReviews();
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReviewForm(false)}
                    className="mt-2"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {reviews.length === 0 ? (
                <p className="mt-5 rounded-2xl border border-dashed border-border py-10 text-center text-muted-foreground">
                  No reviews yet.
                </p>
              ) : (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {reviews.map((review) => (
                    <figure
                      key={review.id}
                      className="rounded-2xl border border-border bg-card p-5"
                    >
                      <Stars value={review.rating} size="size-3.5" />
                      {review.comment && (
                        <blockquote className="mt-3 text-[15px] leading-relaxed">
                          “{review.comment}”
                        </blockquote>
                      )}
                      <figcaption className="mt-4 flex items-center gap-2 text-[13px] text-muted-foreground">
                        <span className="grid size-7 place-items-center rounded-full bg-secondary text-[12px] font-semibold text-ink">
                          {review.user?.name?.charAt(0) || "?"}
                        </span>
                        {review.user?.name || "Anonymous"} ·{" "}
                        {new Date(review.createdAt).toLocaleDateString(
                          "en-GB",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageMotion>
  );
}
