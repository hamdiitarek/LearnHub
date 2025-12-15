"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  answers: Record<string, {
    userAnswer: string | string[];
    correctAnswer: string | string[];
    isCorrect: boolean;
    points: number;
  }>;
}

interface QuizPlayerProps {
  quizId: string;
  onComplete: (result: QuizResult, questions: Question[]) => void;
  onCancel: () => void;
}

export function QuizPlayer({ quizId, onComplete, onCancel }: QuizPlayerProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (quiz?.timeLimit && timeLeft === null) {
      setTimeLeft(quiz.timeLimit * 60); // Convert minutes to seconds
    }
  }, [quiz, timeLeft]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load quiz");
      }

      // Sort questions by order
      data.questions.sort((a: Question, b: Question) => a.order - b.order);
      setQuiz(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleMultiSelectChange = (questionId: string, option: string) => {
    const current = (answers[questionId] as string[]) || [];
    if (current.includes(option)) {
      handleAnswerChange(
        questionId,
        current.filter((a) => a !== option)
      );
    } else {
      handleAnswerChange(questionId, [...current, option]);
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit quiz");
      }

      // Transform API response to match QuizResult interface
      const result: QuizResult = {
        score: data.attempt.score,
        passed: data.attempt.passed,
        totalPoints: data.attempt.totalPoints,
        earnedPoints: data.attempt.earnedPoints,
        answers: data.attempt.gradedAnswers || {},
        passingScore: data.attempt.passingScore,
      };

      onComplete(result, quiz.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz");
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={onCancel}>Go Back</Button>
        </CardContent>
      </Card>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500 mb-4">No questions in this quiz</p>
          <Button onClick={onCancel}>Go Back</Button>
        </CardContent>
      </Card>
    );
  }

  const question = quiz.questions[currentQuestion];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] && (Array.isArray(answers[k]) ? (answers[k] as string[]).length > 0 : true)
  ).length;

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{quiz.title}</CardTitle>
            {quiz.description && (
              <CardDescription>{quiz.description}</CardDescription>
            )}
          </div>
          {timeLeft !== null && (
            <div
              className={`text-lg font-mono px-3 py-1 rounded ${
                timeLeft < 60
                  ? "bg-red-100 text-red-600"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>
            Question {currentQuestion + 1} of {totalQuestions}
          </span>
          <span>
            {answeredCount} of {totalQuestions} answered
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-1">{question.text}</h3>
          <p className="text-sm text-gray-500">{question.points} point(s)</p>
        </div>

        <div className="space-y-2">
          {question.options.map((option, index) => {
            const isSelected =
              question.type === "MULTIPLE_SELECT"
                ? ((answers[question.id] as string[]) || []).includes(option)
                : answers[question.id] === option;

            return (
              <button
                key={index}
                type="button"
                onClick={() =>
                  question.type === "MULTIPLE_SELECT"
                    ? handleMultiSelectChange(question.id, option)
                    : handleAnswerChange(question.id, option)
                }
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  isSelected
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-${
                      question.type === "MULTIPLE_SELECT" ? "sm" : "full"
                    } border-2 flex items-center justify-center ${
                      isSelected
                        ? "border-blue-600 bg-blue-600"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Question Navigation */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {quiz.questions.map((q, index) => {
            const isAnswered =
              answers[q.id] &&
              (Array.isArray(answers[q.id])
                ? (answers[q.id] as string[]).length > 0
                : true);
            const isCurrent = index === currentQuestion;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(index)}
                className={`w-8 h-8 rounded text-sm font-medium ${
                  isCurrent
                    ? "bg-blue-600 text-white"
                    : isAnswered
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setCurrentQuestion((prev) =>
                  Math.min(totalQuestions - 1, prev + 1)
                )
              }
              disabled={currentQuestion === totalQuestions - 1}
            >
              Next
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || answeredCount === 0}
            >
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
