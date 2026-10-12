"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  text: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "MULTIPLE_SELECT";
  options: string[];
  points: number;
  order: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  passingScore: number;
  timeLimit: number | null;
  questions: Question[];
  bestAttempt?: {
    score: number;
    passed: boolean;
  } | null;
}

interface QuizResult {
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

interface QuizPlayerProps {
  quizId: string;
  onComplete: (result: QuizResult, questions: Question[]) => void;
  onCancel: () => void;
}

const HINT: Record<Question["type"], string> = {
  MULTIPLE_CHOICE: "Pick one",
  TRUE_FALSE: "True or false",
  MULTIPLE_SELECT: "Pick all that apply",
};

const ease = [0.22, 1, 0.36, 1] as const;

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

export function QuizPlayer({ quizId, onComplete, onCancel }: QuizPlayerProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/quizzes/${quizId}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Couldn't load the quiz");
        return data as Quiz;
      })
      .then((data) => {
        if (cancelled) return;
        data.questions.sort((a, b) => a.order - b.order);
        setQuiz(data);
        if (data.timeLimit) setTimeLeft(data.timeLimit * 60);
      })
      .catch(
        (err) =>
          !cancelled &&
          setError(
            err instanceof Error ? err.message : "Couldn't load the quiz",
          ),
      );
    return () => {
      cancelled = true;
    };
  }, [quizId]);

  const isAnswered = (id: string) => {
    const a = answers[id];
    return Array.isArray(a) ? a.length > 0 : Boolean(a);
  };

  const submit = async () => {
    if (!quiz || isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Couldn't submit the quiz");
      onComplete(
        {
          score: data.attempt.score,
          passed: data.attempt.passed,
          totalPoints: data.attempt.totalPoints,
          earnedPoints: data.attempt.earnedPoints,
          answers: data.attempt.gradedAnswers || {},
          passingScore: data.attempt.passingScore,
        },
        quiz.questions,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit the quiz");
      setIsSubmitting(false);
    }
  };

  // The timer submits whatever is answered when it runs out.
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  });
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      submitRef.current();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => (t ?? 1) - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft]);

  const shell =
    "relative mx-auto w-full max-w-2xl overflow-hidden rounded-[24px] border border-ink/10 bg-paper shadow-2xl";

  if (error && !quiz) {
    return (
      <div className={cn(shell, "p-10 text-center")}>
        <p className="font-display text-[30px]">That quiz didn&apos;t load</p>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button className="mt-6 rounded-full" onClick={onCancel}>
          Back to the lesson
        </Button>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className={cn(shell, "grid h-80 place-items-center")}>
        <div className="size-9 animate-spin rounded-full border-2 border-forest border-t-transparent" />
      </div>
    );
  }

  if (quiz.questions.length === 0) {
    return (
      <div className={cn(shell, "p-10 text-center")}>
        <p className="font-display text-[30px]">No questions yet</p>
        <Button className="mt-6 rounded-full" onClick={onCancel}>
          Back to the lesson
        </Button>
      </div>
    );
  }

  const total = quiz.questions.length;
  const question = quiz.questions[current];
  const answered = quiz.questions.filter((q) => isAnswered(q.id)).length;
  const multi = question.type === "MULTIPLE_SELECT";
  const isLast = current === total - 1;

  const choose = (option: string) => {
    if (multi) {
      const picked = (answers[question.id] as string[]) || [];
      setAnswers({
        ...answers,
        [question.id]: picked.includes(option)
          ? picked.filter((a) => a !== option)
          : [...picked, option],
      });
    } else {
      setAnswers({ ...answers, [question.id]: option });
    }
  };

  return (
    <div
      className={shell}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-title"
    >
      {/* header */}
      <div className="border-b border-border px-6 pt-6 pb-5 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold tracking-[0.14em] text-forest uppercase">
              Quiz · pass at {quiz.passingScore}%
            </p>
            <h2
              id="quiz-title"
              className="mt-1.5 font-display text-[32px] leading-none"
            >
              {quiz.title}
            </h2>
            {quiz.description && (
              <p className="mt-2 text-[14px] text-muted-foreground">
                {quiz.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {timeLeft !== null && (
              <span
                className={cn(
                  "rounded-full px-3 py-1 font-mono text-[14px] tabular-nums",
                  timeLeft < 60
                    ? "bg-clay/10 text-clay"
                    : "bg-secondary text-ink/70",
                )}
                aria-label="Time left"
              >
                {formatTime(timeLeft)}
              </span>
            )}
            <button
              onClick={onCancel}
              aria-label="Close the quiz"
              className="grid size-9 place-items-center rounded-full text-ink/60 transition hover:bg-secondary hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between text-[13px] text-muted-foreground">
          <span>
            Question {current + 1} of {total}
          </span>
          <span>{answered} answered</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-forest"
            initial={false}
            animate={{ width: `${((current + 1) / total) * 100}%` }}
            transition={{ duration: 0.5, ease }}
          />
        </div>
      </div>

      {/* question */}
      <div className="px-6 py-7 sm:px-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease }}
          >
            <h3 className="text-[20px] leading-snug font-semibold">
              {question.text}
            </h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {HINT[question.type]} · {question.points}{" "}
              {question.points === 1 ? "point" : "points"}
            </p>

            <div className="mt-5 space-y-2.5">
              {question.options.map((option, i) => {
                const selected = multi
                  ? ((answers[question.id] as string[]) || []).includes(option)
                  : answers[question.id] === option;
                return (
                  <motion.button
                    key={option}
                    type="button"
                    onClick={() => choose(option)}
                    whileTap={{ scale: 0.985 }}
                    aria-pressed={selected}
                    className={cn(
                      "flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-start text-[15px] transition-colors",
                      selected
                        ? "border-forest bg-accent"
                        : "border-border bg-card hover:border-ink/30",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center border text-[12px] font-semibold transition-colors",
                        multi ? "rounded-md" : "rounded-full",
                        selected
                          ? "border-forest bg-forest text-paper"
                          : "border-ink/25 text-ink/55",
                      )}
                    >
                      {selected ? (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 600,
                            damping: 26,
                          }}
                        >
                          <Check className="size-3.5" strokeWidth={3} />
                        </motion.span>
                      ) : (
                        String.fromCharCode(65 + i)
                      )}
                    </span>
                    <span className="min-w-0 flex-1">{option}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {error && (
          <p className="mt-5 rounded-xl bg-clay/10 p-3 text-[14px] text-clay">
            {error}
          </p>
        )}
      </div>

      {/* footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-card px-6 py-4 sm:px-8">
        <div className="flex flex-wrap gap-1.5" aria-label="Questions">
          {quiz.questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrent(i)}
              aria-label={`Question ${i + 1}${isAnswered(q.id) ? ", answered" : ""}`}
              aria-current={i === current}
              className={cn(
                "size-8 rounded-full text-[13px] font-semibold transition-colors",
                i === current
                  ? "bg-ink text-paper"
                  : isAnswered(q.id)
                    ? "bg-forest/15 text-forest"
                    : "bg-secondary text-ink/55 hover:text-ink",
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            aria-label="Previous question"
            disabled={current === 0}
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          >
            <ArrowLeft className="rtl:rotate-180" />
          </Button>
          {isLast || answered === total ? (
            <Button
              className="rounded-full px-5"
              onClick={submit}
              disabled={isSubmitting || answered === 0}
            >
              {isSubmitting
                ? "Checking…"
                : answered === total
                  ? "Submit answers"
                  : `Submit ${answered} of ${total}`}
            </Button>
          ) : (
            <Button
              className="rounded-full px-5"
              onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
            >
              Next <ArrowRight className="rtl:rotate-180" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
