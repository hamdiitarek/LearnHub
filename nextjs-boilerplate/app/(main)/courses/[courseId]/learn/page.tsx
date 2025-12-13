"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import { QuizResult } from "@/components/quiz/quiz-result";

interface Quiz {
  id: string;
  title: string;
  passingScore: number;
  _count?: {
    questions: number;
  };
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string | null;
  content: string | null;
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
  answers: Record<string, {
    userAnswer: string | string[];
    correctAnswer: string | string[];
    isCorrect: boolean;
    points: number;
  }>;
}

export default function LearnPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lesson");

  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [certificate, setCertificate] = useState<{ certificateNumber: string } | null>(null);
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);

  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResultData | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Array<{
    id: string;
    text: string;
    type: string;
    options: string[];
  }>>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/courses/${resolvedParams.courseId}/learn`);
    }
  }, [status, router, resolvedParams.courseId]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCourse();
      fetchProgress();
    }
  }, [status, resolvedParams.courseId]);

  useEffect(() => {
    if (course && course.lessons && course.lessons.length > 0) {
      const sortedLessons = [...course.lessons].sort((a, b) => a.order - b.order);
      const lesson = lessonId
        ? sortedLessons.find((l) => l.id === lessonId)
        : sortedLessons[0];
      setCurrentLesson(lesson || sortedLessons[0]);
    }
  }, [course, lessonId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${resolvedParams.courseId}`);
      if (!response.ok) {
        router.push("/courses");
        return;
      }
      const data = await response.json();
      
      // API returns course data directly, not nested under .course
      if (data.error) {
        router.push("/courses");
        return;
      }
      
      // Check if enrolled (enrollment is at the top level of response)
      if (!data.enrollment && !data.isOwner) {
        router.push(`/courses/${resolvedParams.courseId}`);
        return;
      }
      
      setCourse(data);
    } catch (error) {
      console.error("Failed to fetch course:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await fetch(
        `/api/progress?courseId=${resolvedParams.courseId}`
      );
      const data = await response.json();
      setProgress(data.progress || []);
    } catch (error) {
      console.error("Failed to fetch progress:", error);
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          watchTime: currentLesson?.duration ? currentLesson.duration * 60 : 0,
          completed: true,
        }),
      });
      
      if (!response.ok) {
        console.error("Failed to save progress:", await response.text());
        return;
      }
      
      // Update local progress
      setProgress((prev) => {
        const existing = prev.find((p) => p.lessonId === lessonId);
        if (existing) {
          return prev.map((p) =>
            p.lessonId === lessonId ? { ...p, completed: true } : p
          );
        }
        return [...prev, { lessonId, completed: true, watchTime: 0 }];
      });
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  };

  const navigateToLesson = (lesson: Lesson) => {
    router.push(`/courses/${resolvedParams.courseId}/learn?lesson=${lesson.id}`);
  };

  const navigateToNextLesson = () => {
    if (!course || !currentLesson) return;
    const currentIndex = course.lessons.findIndex(
      (l) => l.id === currentLesson.id
    );
    if (currentIndex < course.lessons.length - 1) {
      navigateToLesson(course.lessons[currentIndex + 1]);
    }
  };

  const navigateToPrevLesson = () => {
    if (!course || !currentLesson) return;
    const currentIndex = course.lessons.findIndex(
      (l) => l.id === currentLesson.id
    );
    if (currentIndex > 0) {
      navigateToLesson(course.lessons[currentIndex - 1]);
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress.some((p) => p.lessonId === lessonId && p.completed);
  };

  const completedLessons = progress.filter((p) => p.completed).length;
  const totalLessons = course?.lessons.length || 0;
  const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  const isComplete = overallProgress >= 100;

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
      if (response.ok || data.certificate) {
        // Redirect to certificate page
        router.push(`/certificates/${data.certificate.certificateNumber}`);
      } else {
        console.error("Certificate error:", data.error);
        alert(data.error || "Failed to generate certificate");
      }
    } catch (error) {
      console.error("Failed to generate certificate:", error);
      alert("Failed to generate certificate");
    } finally {
      setIsGeneratingCert(false);
    }
  };

  // Check for existing certificate when course is complete
  useEffect(() => {
    if (isComplete && course) {
      fetch(`/api/certificates?courseId=${course.id}`)
        .then(res => res.json())
        .then(data => {
          const existing = data.certificates?.find((c: { course: { id: string } }) => c.course.id === course.id);
          if (existing) setCertificate(existing);
        })
        .catch(console.error);
    }
  }, [isComplete, course]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!course || !currentLesson) {
    return null;
  }

  const currentIndex = course.lessons.findIndex((l) => l.id === currentLesson.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < course.lessons.length - 1;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Course Completion Banner */}
      {isComplete && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">
                🎉 Congratulations! You have completed this course!
              </span>
            </div>
            {certificate ? (
              <div className="flex items-center gap-2">
                <Link href={`/certificates/${certificate.certificateNumber}`}>
                  <Button size="sm" variant="secondary">
                    View Certificate
                  </Button>
                </Link>
              </div>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={generateCertificate}
                disabled={isGeneratingCert}
              >
                {isGeneratingCert ? "Generating..." : "Get Certificate"}
              </Button>
            )}
          </div>
        </div>
      )}
      
      <div className="flex-1 flex">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? "w-80" : "w-0"
        } bg-white transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-4 border-b">
          <Link
            href={`/courses/${course.id}`}
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to course
          </Link>
          <h2 className="font-bold mt-2 line-clamp-2">{course.title}</h2>
          <div className="mt-3">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Progress</span>
              <span>
                {completedLessons}/{totalLessons} lessons
              </span>
            </div>
            <Progress value={overallProgress} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {course.lessons
            .sort((a, b) => a.order - b.order)
            .map((lesson, index) => (
              <button
                key={lesson.id}
                onClick={() => navigateToLesson(lesson)}
                className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors ${
                  currentLesson.id === lesson.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isLessonCompleted(lesson.id)
                        ? "bg-green-500 text-white"
                        : currentLesson.id === lesson.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {isLessonCompleted(lesson.id) ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium text-sm line-clamp-2 ${
                        currentLesson.id === lesson.id
                          ? "text-blue-600"
                          : "text-gray-900"
                      }`}
                    >
                      {lesson.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {lesson.duration} min
                    </p>
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-700 rounded"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h3 className="font-medium">{currentLesson.title}</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateToPrevLesson}
              disabled={!hasPrev}
              className="text-white hover:bg-gray-700"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateToNextLesson}
              disabled={!hasNext}
              className="text-white hover:bg-gray-700"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        </div>

        {/* Video/Content Area */}
        <div className="flex-1 flex flex-col">
          {currentLesson.videoUrl ? (
            <div className="aspect-video bg-black">
              <video
                key={currentLesson.id}
                src={currentLesson.videoUrl}
                controls
                className="w-full h-full"
                autoPlay
              />
            </div>
          ) : (
            <div className="aspect-video bg-gray-800 flex items-center justify-center">
              <div className="text-center text-white">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-400">No video for this lesson</p>
              </div>
            </div>
          )}

          {/* Lesson Content */}
          <div className="bg-white flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl">
              <h2 className="text-2xl font-bold mb-4">{currentLesson.title}</h2>
              {currentLesson.description && (
                <p className="text-gray-600 mb-6">{currentLesson.description}</p>
              )}
              {currentLesson.content && (
                <div className="prose max-w-none">
                  <div
                    dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                  />
                </div>
              )}

              {/* Quiz Section */}
              {currentLesson.quiz && (
                <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-900">
                        📝 {currentLesson.quiz.title}
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        {currentLesson.quiz._count?.questions || 0} questions •
                        Pass: {currentLesson.quiz.passingScore}%
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setShowQuiz(true);
                        setQuizResult(null);
                      }}
                    >
                      Take Quiz
                    </Button>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={navigateToPrevLesson}
                  disabled={!hasPrev}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Previous Lesson
                </Button>

                {!isLessonCompleted(currentLesson.id) && (
                  <Button
                    onClick={() => markLessonComplete(currentLesson.id)}
                    variant="secondary"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Mark as Complete
                  </Button>
                )}

                <Button onClick={navigateToNextLesson} disabled={!hasNext}>
                  Next Lesson
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Quiz Modal */}
      {showQuiz && currentLesson?.quiz && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
          <div className="min-h-screen py-8 px-4">
            {quizResult ? (
              <QuizResult
                result={quizResult}
                questions={quizQuestions}
                passingScore={quizResult.passingScore || currentLesson.quiz.passingScore}
                onRetry={() => setQuizResult(null)}
                onClose={() => {
                  setShowQuiz(false);
                  setQuizResult(null);
                  if (quizResult.passed) {
                    markLessonComplete(currentLesson.id);
                  }
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
