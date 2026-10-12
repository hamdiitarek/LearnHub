"use client";

import { useState, useEffect, use, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  ExternalLink,
  ListChecks,
  PanelRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import { QuizResult } from "@/components/quiz/quiz-result";
import { formatDuration } from "@/lib/format";
import { youtubeId } from "@/lib/youtube";
import { YouTubePlayer } from "@/components/course/youtube-player";
import { cn } from "@/lib/utils";

interface Quiz {
  id: string;
  title: string;
  passingScore?: number;
  _count?: { questions: number };
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  duration: number;
  order: number;
  quiz?: Quiz | null;
}

interface Course {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface LessonProgress {
  lessonId: string;
  completed: boolean;
  watchTime: number;
}

interface QuizResultData {
  score: number;
  passed: boolean;
  totalPoints: number;
  earnedPoints: number;
  passingScore?: number;
  answers: Record<
    string,
    {
      userAnswer: string | string[];
      correctAnswer: string | string[];
      isCorrect: boolean;
      points: number;
    }
  >;
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

export default function LearnPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonParam = searchParams.get("lesson");

  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showList, setShowList] = useState(true);
  const [certificate, setCertificate] = useState<{
    certificateNumber: string;
  } | null>(null);
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResultData | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<
    Array<{ id: string; text: string; type: string; options: string[] }>
  >([]);

  useEffect(() => {
    if (status === "unauthenticated")
      router.push(`/login?callbackUrl=/courses/${courseId}/learn`);
  }, [status, router, courseId]);

  const fetchCourse = useCallback(async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      const data = await response.json();
      if (!response.ok || data.error) {
        router.push("/courses");
        return;
      }
      if (!data.enrollment && !data.isOwner) {
        router.push(`/courses/${courseId}`);
        return;
      }
      setCourse(data);
    } catch (error) {
      console.error("Failed to fetch course:", error);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, router]);

  const fetchProgress = useCallback(async () => {
    try {
      const response = await fetch(`/api/progress?courseId=${courseId}`);
      const data = await response.json();
      setProgress(data.progress || []);
    } catch (error) {
      console.error("Failed to fetch progress:", error);
    }
  }, [courseId]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCourse();
      fetchProgress();
    }
  }, [status, fetchCourse, fetchProgress]);

  // Sorted copy; never sort state in place.
  const lessons = useMemo(
    () => [...(course?.lessons ?? [])].sort((a, b) => a.order - b.order),
    [course],
  );
  const isLessonCompleted = (id: string) =>
    progress.some((p) => p.lessonId === id && p.completed);

  // Without ?lesson=, open the first lesson that isn't finished yet.
  const currentLesson = useMemo(() => {
    if (lessons.length === 0) return null;
    if (lessonParam)
      return lessons.find((l) => l.id === lessonParam) ?? lessons[0];
    return (
      lessons.find(
        (l) => !progress.some((p) => p.lessonId === l.id && p.completed),
      ) ?? lessons[0]
    );
  }, [lessons, lessonParam, progress]);

  const completedLessons = lessons.filter((l) =>
    isLessonCompleted(l.id),
  ).length;
  const totalLessons = lessons.length;
  const overallProgress =
    totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  const isComplete = totalLessons > 0 && completedLessons >= totalLessons;

  const markLessonComplete = async (lessonId: string) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    setIsSaving(true);
    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          watchTime: lesson?.duration ?? 0,
          completed: true,
        }),
      });
      if (!response.ok) {
        console.error("Failed to save progress:", await response.text());
        return;
      }
      setProgress((prev) =>
        prev.some((p) => p.lessonId === lessonId)
          ? prev.map((p) =>
              p.lessonId === lessonId ? { ...p, completed: true } : p,
            )
          : [
              ...prev,
              { lessonId, completed: true, watchTime: lesson?.duration ?? 0 },
            ],
      );
    } catch (error) {
      console.error("Failed to update progress:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const goTo = (lesson: Lesson) => {
    router.push(`/courses/${courseId}/learn?lesson=${lesson.id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const generateCertificate = async () => {
    if (!course) return;
    setIsGeneratingCert(true);
    try {
      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      });
      const data = await response.json();
      if (data.certificate)
        router.push(`/certificates/${data.certificate.certificateNumber}`);
      else alert(data.error || "Failed to generate certificate");
    } catch (error) {
      console.error("Failed to generate certificate:", error);
    } finally {
      setIsGeneratingCert(false);
    }
  };

  useEffect(() => {
    if (!isComplete || !course) return;
    fetch(`/api/certificates?courseId=${course.id}`)
      .then((res) => res.json())
      .then((data) => {
        const existing = data.certificates?.find(
          (c: { course: { id: string } }) => c.course.id === course.id,
        );
        if (existing) setCertificate(existing);
      })
      .catch(console.error);
  }, [isComplete, course]);

  if (status === "loading" || isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="size-10 animate-spin rounded-full border-2 border-forest border-t-transparent" />
      </div>
    );
  }

  if (!course || !currentLesson) return null;

  const index = lessons.findIndex((l) => l.id === currentLesson.id);
  const prev = index > 0 ? lessons[index - 1] : null;
  const next = index < lessons.length - 1 ? lessons[index + 1] : null;
  const ytId = youtubeId(currentLesson.videoUrl);
  const { summary, credit } = splitLesson(currentLesson.description);
  const done = isLessonCompleted(currentLesson.id);

  return (
    <div className="bg-paper">
      {/* ------------------------------------------------------------ course bar */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
          <Link
            href={`/courses/${course.id}`}
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground hover:text-ink"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" /> Course overview
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold">
            {course.title}
          </h1>
          <div className="flex w-full items-center gap-3 sm:w-64">
            <Progress value={overallProgress} className="h-2" />
            <span className="shrink-0 text-[13px] text-muted-foreground tabular-nums">
              {completedLessons}/{totalLessons}
            </span>
          </div>
        </div>
      </div>

      {isComplete && (
        <div className="border-b border-forest/20 bg-highlight/60">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3">
            <p className="flex items-center gap-2 text-[15px] font-semibold">
              <BadgeCheck className="size-5 text-forest" /> You finished every
              lesson in this course.
            </p>
            {certificate ? (
              <Link href={`/certificates/${certificate.certificateNumber}`}>
                <Button size="sm" className="rounded-full">
                  View your certificate
                </Button>
              </Link>
            ) : (
              <Button
                size="sm"
                className="rounded-full"
                onClick={generateCertificate}
                disabled={isGeneratingCert}
              >
                {isGeneratingCert ? "Issuing…" : "Get your certificate"}
              </Button>
            )}
          </div>
        </div>
      )}

      <div
        className={cn(
          "mx-auto grid max-w-7xl gap-8 px-5 py-8",
          showList && "lg:grid-cols-[1fr_340px]",
        )}
      >
        {/* ------------------------------------------------------------ lesson */}
        <div className="min-w-0">
          <div className="overflow-hidden rounded-2xl bg-ink shadow-[0_30px_60px_-40px_rgb(18_32_26/0.6)]">
            <div className="aspect-video">
              {ytId ? (
                <YouTubePlayer
                  key={currentLesson.id}
                  id={ytId}
                  title={currentLesson.title}
                />
              ) : currentLesson.videoUrl ? (
                <video
                  key={currentLesson.id}
                  src={currentLesson.videoUrl}
                  controls
                  className="size-full"
                />
              ) : (
                <div className="grid size-full place-items-center text-paper/60">
                  No video for this lesson
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                Lesson {index + 1} of {totalLessons} ·{" "}
                {formatDuration(currentLesson.duration)}
              </p>
              <h2 className="mt-2 font-display text-[clamp(2rem,3.6vw,2.8rem)] leading-[1.02]">
                {currentLesson.title}
              </h2>
            </div>
            <Button
              variant={done ? "outline" : "default"}
              className="rounded-full"
              disabled={done || isSaving}
              onClick={() => markLessonComplete(currentLesson.id)}
            >
              <Check />
              {done ? "Completed" : isSaving ? "Saving…" : "Mark as complete"}
            </Button>
          </div>

          {summary && (
            <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-ink/80">
              {summary}
            </p>
          )}
          {(credit || ytId) && (
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-muted-foreground">
              {credit && <span>{credit}</span>}
              {ytId && (
                <a
                  href={`https://www.youtube.com/watch?v=${ytId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-forest hover:underline"
                >
                  Watch on YouTube <ExternalLink className="size-3.5" />
                </a>
              )}
            </p>
          )}

          {currentLesson.quiz && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#cfe03c] bg-highlight/40 p-5">
              <div className="flex items-start gap-3">
                <ListChecks className="mt-0.5 size-5 text-forest" />
                <div>
                  <p className="font-semibold">{currentLesson.quiz.title}</p>
                  <p className="text-[14px] text-ink/70">
                    {currentLesson.quiz._count?.questions ?? 0} questions
                    {currentLesson.quiz.passingScore
                      ? ` · pass with ${currentLesson.quiz.passingScore}%`
                      : ""}{" "}
                    · passing also completes the lesson
                  </p>
                </div>
              </div>
              <Button
                className="rounded-full"
                onClick={() => {
                  setShowQuiz(true);
                  setQuizResult(null);
                }}
              >
                Take the quiz
              </Button>
            </div>
          )}

          <div className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6">
            <Button
              variant="outline"
              className="rounded-full"
              disabled={!prev}
              onClick={() => prev && goTo(prev)}
            >
              <ArrowLeft className="rtl:rotate-180" /> Previous
            </Button>
            <Button
              variant="ghost"
              className="hidden rounded-full lg:inline-flex"
              onClick={() => setShowList((v) => !v)}
              aria-pressed={showList}
            >
              <PanelRight /> {showList ? "Hide lessons" : "Show lessons"}
            </Button>
            <Button
              className="rounded-full"
              disabled={!next}
              onClick={() => next && goTo(next)}
            >
              Next lesson <ArrowRight className="rtl:rotate-180" />
            </Button>
          </div>
        </div>

        {/* ------------------------------------------------------------ lesson list */}
        {showList && (
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <p className="border-b border-border px-5 py-3.5 text-[13px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                Course path
              </p>
              <ol className="max-h-[70vh] overflow-y-auto">
                {lessons.map((lesson, i) => {
                  const active = lesson.id === currentLesson.id;
                  const complete = isLessonCompleted(lesson.id);
                  return (
                    <li key={lesson.id}>
                      <button
                        onClick={() => goTo(lesson)}
                        className={cn(
                          "flex w-full items-start gap-3 border-b border-border/70 px-5 py-3.5 text-start transition last:border-0",
                          active ? "bg-accent" : "hover:bg-secondary/60",
                        )}
                        aria-current={active ? "step" : undefined}
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                            complete
                              ? "bg-forest text-paper"
                              : active
                                ? "bg-ink text-paper"
                                : "border border-ink/25 text-ink/70",
                          )}
                        >
                          {complete ? <Check className="size-3.5" /> : i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block text-[14px] leading-snug",
                              active ? "font-semibold" : "font-medium",
                            )}
                          >
                            {lesson.title}
                          </span>
                          <span className="mt-0.5 flex items-center gap-2 text-[12px] text-muted-foreground">
                            {formatDuration(lesson.duration)}
                            {lesson.quiz && (
                              <span className="rounded-full bg-highlight px-1.5 text-[10.5px] font-semibold text-ink">
                                Quiz
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          </aside>
        )}
      </div>

      {showQuiz && currentLesson.quiz && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/80 backdrop-blur-sm">
          <div className="min-h-screen px-4 py-8">
            {quizResult ? (
              <QuizResult
                result={quizResult}
                questions={quizQuestions}
                passingScore={
                  quizResult.passingScore ||
                  currentLesson.quiz.passingScore ||
                  70
                }
                onRetry={() => setQuizResult(null)}
                onClose={() => {
                  setShowQuiz(false);
                  setQuizResult(null);
                  if (quizResult.passed) markLessonComplete(currentLesson.id);
                }}
              />
            ) : (
              <QuizPlayer
                quizId={currentLesson.quiz.id}
                onComplete={(result, questions) => {
                  setQuizResult(result);
                  setQuizQuestions(questions);
                }}
                onCancel={() => setShowQuiz(false)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
