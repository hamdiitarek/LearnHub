"use client";

import { motion } from "motion/react";
import { Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuizResultProps {
  result: {
    score: number;
    passed: boolean;
    totalPoints: number;
    earnedPoints: number;
    answers: Record<
      string,
      {
        userAnswer: string | string[];
        correctAnswer: string | string[];
        isCorrect: boolean;
        points: number;
      }
    >;
  };
  questions?: Array<{
    id: string;
    text: string;
    type: string;
    options: string[];
  }>;
  passingScore: number;
  onRetry: () => void;
  onClose: () => void;
}

const ease = [0.22, 1, 0.36, 1] as const;
const RADIUS = 52;

const formatAnswer = (answer: string | string[]) =>
  Array.isArray(answer)
    ? answer.length
      ? answer.join(", ")
      : "No answer"
    : String(answer || "No answer");

export function QuizResult({
  result,
  questions,
  passingScore,
  onRetry,
  onClose,
}: QuizResultProps) {
  const graded = Object.entries(result.answers ?? {});
  const correct = graded.filter(([, a]) => a.isCorrect).length;
  const missed = graded.filter(([, a]) => !a.isCorrect);
  const score = Math.round(result.score);
  const questionText = (id: string) =>
    questions?.find((q) => q.id === id)?.text || "Question";
  const tone = result.passed ? "var(--forest)" : "var(--clay)";

  return (
    <div className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-[24px] border border-ink/10 bg-paper shadow-2xl">
      <div className="flex flex-col items-center px-6 pt-10 pb-8 text-center sm:px-8">
        {/* score ring */}
        <div className="relative size-[132px]">
          <svg
            viewBox="0 0 120 120"
            className="size-full -rotate-90"
            aria-hidden
          >
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke="var(--secondary)"
              strokeWidth="9"
            />
            {/* pass mark */}
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke="var(--ink)"
              strokeOpacity="0.35"
              strokeWidth="9"
              pathLength={100}
              strokeDasharray={`0.8 99.2`}
              strokeDashoffset={-passingScore}
            />
            <motion.circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke={tone}
              strokeWidth="9"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{
                pathLength: Math.max(0.001, Math.min(score, 100) / 100),
              }}
              transition={{ duration: 1.2, ease, delay: 0.15 }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <motion.span
              className="font-display text-[42px] leading-none"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.35 }}
            >
              {score}%
            </motion.span>
          </div>
          <motion.span
            className={cn(
              "absolute -end-1 bottom-1 grid size-9 place-items-center rounded-full text-paper",
              result.passed ? "bg-forest" : "bg-clay",
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 18,
              delay: 1.1,
            }}
          >
            {result.passed ? (
              <Check className="size-5" strokeWidth={3} />
            ) : (
              <X className="size-5" strokeWidth={3} />
            )}
          </motion.span>
        </div>

        <h2 className="mt-6 font-display text-[38px] leading-none">
          {result.passed ? (
            <>
              Passed. <span className="mark">Nicely done.</span>
            </>
          ) : (
            "Not quite yet."
          )}
        </h2>
        <p className="mt-3 max-w-md text-[15px] text-muted-foreground">
          {result.passed
            ? "That counts as finishing this lesson. Keep going while it's fresh."
            : `You need ${passingScore}% to pass. Have another look at the lecture, then try again. Retakes are unlimited.`}
        </p>

        <dl className="mt-7 grid w-full max-w-md grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border bg-border text-center">
          {[
            [`${correct}/${graded.length}`, "correct"],
            [`${result.earnedPoints}/${result.totalPoints}`, "points"],
            [`${passingScore}%`, "to pass"],
          ].map(([value, label]) => (
            <div key={label} className="bg-card px-3 py-3.5">
              <dd className="text-[19px] font-semibold tabular-nums">
                {value}
              </dd>
              <dt className="text-[12.5px] text-muted-foreground">{label}</dt>
            </div>
          ))}
        </dl>
      </div>

      {missed.length > 0 && (
        <div className="border-t border-border px-6 py-6 sm:px-8">
          <h3 className="text-[13px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            Worth another look ({missed.length})
          </h3>
          <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pe-1">
            {missed.map(([id, answer], i) => (
              <motion.li
                key={id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease, delay: 0.5 + i * 0.08 }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <p className="text-[15px] font-medium">{questionText(id)}</p>
                <div className="mt-2.5 grid gap-1.5 text-[14px] sm:grid-cols-2">
                  <p>
                    <span className="block text-[12px] text-muted-foreground">
                      You answered
                    </span>
                    <span className="text-clay line-through decoration-clay/40">
                      {formatAnswer(answer.userAnswer)}
                    </span>
                  </p>
                  <p>
                    <span className="block text-[12px] text-muted-foreground">
                      Correct answer
                    </span>
                    <span className="font-medium text-forest">
                      {formatAnswer(answer.correctAnswer)}
                    </span>
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-card px-6 py-4 sm:px-8">
        {!result.passed && (
          <Button variant="outline" className="rounded-full" onClick={onRetry}>
            <RotateCcw /> Try again
          </Button>
        )}
        <Button className="rounded-full px-5" onClick={onClose}>
          {result.passed ? "Continue" : "Back to the lesson"}
        </Button>
      </div>
    </div>
  );
}
