"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface QuizResultProps {
  result: {
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

export function QuizResult({ result, questions, passingScore, onRetry, onClose }: QuizResultProps) {
  const answersArray = result.answers ? Object.entries(result.answers) : [];
  const correctCount = answersArray.filter(([, a]) => a.isCorrect).length;
  const wrongAnswers = answersArray.filter(([, a]) => !a.isCorrect);

  const getQuestionText = (questionId: string) => {
    return questions?.find(q => q.id === questionId)?.text || "Question";
  };

  const formatAnswer = (answer: string | string[]) => {
    if (Array.isArray(answer)) {
      return answer.join(", ");
    }
    return String(answer);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div
          className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
            result.passed ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {result.passed ? (
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>
        <CardTitle className={result.passed ? "text-green-600" : "text-red-600"}>
          {result.passed ? "Congratulations! You Passed!" : "Quiz Not Passed"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Score Summary */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">
              {Math.round(result.score)}%
            </p>
            <p className="text-sm text-gray-500">Your Score</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-gray-600">{passingScore}%</p>
            <p className="text-sm text-gray-500">Passing Score</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">
              {correctCount}/{answersArray.length}
            </p>
            <p className="text-sm text-gray-500">Correct</p>
          </div>
        </div>

        {/* Points breakdown */}
        <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
          <span className="text-gray-600">Points Earned</span>
          <span className="font-bold">
            {result.earnedPoints} / {result.totalPoints}
          </span>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Score Progress</span>
            <span className={result.passed ? "text-green-600" : "text-red-600"}>
              {Math.round(result.score)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                result.passed ? "bg-green-500" : "bg-red-500"
              }`}
              style={{ width: `${Math.min(result.score, 100)}%` }}
            />
          </div>
          <div
            className="relative h-0"
            style={{ left: `${passingScore}%` }}
          >
            <div className="absolute -top-3 w-0.5 h-3 bg-gray-400" />
          </div>
        </div>

        {/* Message */}
        <p className="text-center text-gray-600">
          {result.passed
            ? "Great job! You've successfully completed this quiz."
            : `You need at least ${passingScore}% to pass. Keep learning and try again!`}
        </p>

        {/* Wrong Answers Review */}
        {wrongAnswers.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Incorrect Answers ({wrongAnswers.length})
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {wrongAnswers.map(([questionId, answer]) => (
                <div key={questionId} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-medium text-gray-900 mb-2">
                    {getQuestionText(questionId)}
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 font-medium">Your answer:</span>
                      <span className="text-red-700">{formatAnswer(answer.userAnswer)}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-medium">Correct answer:</span>
                      <span className="text-green-700">{formatAnswer(answer.correctAnswer)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4 pt-4">
          {!result.passed && (
            <Button variant="outline" onClick={onRetry}>
              Try Again
            </Button>
          )}
          <Button onClick={onClose}>
            {result.passed ? "Continue" : "Go Back"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
