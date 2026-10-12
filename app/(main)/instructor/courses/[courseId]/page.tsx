"use client";

import { formatDuration } from "@/lib/format";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QuizForm } from "@/components/quiz/quiz-form";
import { QuestionForm } from "@/components/quiz/question-form";

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  isFree: boolean;
  quiz?: {
    id: string;
    title: string;
    _count?: {
      questions: number;
      attempts: number;
    };
  } | null;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  price: number;
  level: string;
  category: string;
  status: string;
  instructor: {
    id: string;
  };
  lessons: Lesson[];
}

export default function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "lessons" | "quizzes">(
    "details",
  );

  // Lesson form state
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    content: "",
    duration: 600,
    isFree: false,
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Quiz form state
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [selectedLessonForQuiz, setSelectedLessonForQuiz] = useState<
    string | null
  >(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCourse();
    }
  }, [status, resolvedParams.courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${resolvedParams.courseId}`);
      if (!response.ok) {
        router.push("/instructor");
        return;
      }
      const data = await response.json();

      // API returns course data directly, not nested under .course
      if (data.error) {
        router.push("/instructor");
        return;
      }

      // Check if user owns this course
      if (
        data.instructor?.id !== session?.user?.id &&
        session?.user?.role !== "ADMIN"
      ) {
        router.push("/instructor");
        return;
      }

      setCourse(data);
    } catch (error) {
      console.error("Failed to fetch course:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;

    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: course.title,
          description: course.description,
          category: course.category,
          level: course.level,
          price: course.price,
          thumbnail: course.thumbnail,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update course");
      }

      setSuccess("Course updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!course) return;

    setIsPublishing(true);
    try {
      const response = await fetch(`/api/courses/${course.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publish: course.status !== "PUBLISHED",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status");
      }

      const data = await response.json();
      setCourse(data.course);
      setSuccess(
        course.status === "PUBLISHED"
          ? "Course unpublished!"
          : "Course published successfully!",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;

    setError("");
    try {
      let videoUrl = lessonForm.videoUrl;

      // Upload video file if provided
      if (videoFile) {
        const uploadedUrl = await handleVideoUpload(videoFile);
        if (!uploadedUrl) {
          throw new Error("Failed to upload video");
        }
        videoUrl = uploadedUrl;
      }

      const url = editingLesson
        ? `/api/courses/${course.id}/lessons/${editingLesson.id}`
        : `/api/courses/${course.id}/lessons`;

      const response = await fetch(url, {
        method: editingLesson ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...lessonForm,
          videoUrl,
          order: editingLesson?.order || course.lessons.length + 1,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save lesson");
      }

      await fetchCourse();
      resetLessonForm();
      setSuccess(
        editingLesson ? "Lesson updated!" : "Lesson added successfully!",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!course || !confirm("Are you sure you want to delete this lesson?"))
      return;

    try {
      const response = await fetch(
        `/api/courses/${course.id}/lessons/${lessonId}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete lesson");
      }

      await fetchCourse();
      setSuccess("Lesson deleted!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const resetLessonForm = () => {
    setShowLessonForm(false);
    setEditingLesson(null);
    setLessonForm({
      title: "",
      description: "",
      videoUrl: "",
      content: "",
      duration: 600,
      isFree: false,
    });
    setVideoFile(null);
    setUploadProgress(0);
  };

  const handleVideoUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("video", file);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload video");
      }

      setUploadProgress(100);
      const data = await response.json();
      return data.videoUrl;
    } catch (error) {
      console.error("Video upload error:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const startEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      description: lesson.description || "",
      videoUrl: "",
      content: "",
      duration: lesson.duration,
      isFree: lesson.isFree,
    });
    setShowLessonForm(true);
  };

  const categories = [
    "Programming",
    "Web Development",
    "Mobile Development",
    "Data Science",
    "Machine Learning",
    "Design",
    "Business",
    "Marketing",
  ];

  const levels = [
    { value: "BEGINNER", label: "Beginner" },
    { value: "INTERMEDIATE", label: "Intermediate" },
    { value: "ADVANCED", label: "Advanced" },
  ];

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/4 rounded bg-gray-200" />
          <div className="h-96 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/instructor"
            className="mb-2 flex items-center gap-1 text-sm text-forest hover:underline"
          >
            <svg
              className="h-4 w-4"
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
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge
              className={
                course.status === "PUBLISHED"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }
            >
              {course.status}
            </Badge>
            <span className="text-gray-500">
              {course.lessons.length} lessons
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/courses/${course.id}`}>
            <Button variant="outline">Preview</Button>
          </Link>
          <Button
            onClick={handlePublish}
            disabled={isPublishing}
            variant={course.status === "PUBLISHED" ? "outline" : "default"}
          >
            {isPublishing
              ? "..."
              : course.status === "PUBLISHED"
                ? "Unpublish"
                : "Publish"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-500">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-500">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b">
        {["details", "lessons", "quizzes"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`px-1 pb-2 font-medium capitalize ${
              activeTab === tab
                ? "border-b-2 border-forest text-forest"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {activeTab === "details" && (
        <Card>
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
            <CardDescription>Update your course information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCourseUpdate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={course.title}
                  onChange={(e) =>
                    setCourse({ ...course, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={course.description}
                  onChange={(e) =>
                    setCourse({ ...course, description: e.target.value })
                  }
                  rows={4}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={course.category}
                    onChange={(e) =>
                      setCourse({ ...course, category: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <select
                    id="level"
                    value={course.level}
                    onChange={(e) =>
                      setCourse({ ...course, level: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {levels.map((lvl) => (
                      <option key={lvl.value} value={lvl.value}>
                        {lvl.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={course.price}
                  onChange={(e) =>
                    setCourse({
                      ...course,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  type="url"
                  value={course.thumbnail || ""}
                  onChange={(e) =>
                    setCourse({ ...course, thumbnail: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lessons Tab */}
      {activeTab === "lessons" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Course Lessons</h2>
            <Button onClick={() => setShowLessonForm(true)}>
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Lesson
            </Button>
          </div>

          {showLessonForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingLesson ? "Edit Lesson" : "Add New Lesson"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLessonSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="lessonTitle">Title *</Label>
                    <Input
                      id="lessonTitle"
                      value={lessonForm.title}
                      onChange={(e) =>
                        setLessonForm({ ...lessonForm, title: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lessonDescription">Description</Label>
                    <Textarea
                      id="lessonDescription"
                      value={lessonForm.description}
                      onChange={(e) =>
                        setLessonForm({
                          ...lessonForm,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="videoUrl">Video link</Label>
                    <Input
                      id="videoUrl"
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=…"
                      value={lessonForm.videoUrl}
                      onChange={(e) =>
                        setLessonForm({
                          ...lessonForm,
                          videoUrl: e.target.value,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste a YouTube link (it plays inside the lesson), or
                      upload a file below.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="videoFile">Or upload a video file</Label>
                    <div className="rounded-lg border-2 border-dashed p-4 text-center">
                      {videoFile ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2">
                            <svg
                              className="h-8 w-8 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="font-medium">
                              {videoFile.name}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setVideoFile(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label className="block cursor-pointer">
                          <input
                            type="file"
                            id="videoFile"
                            accept="video/mp4,video/webm,video/ogg,video/quicktime"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setVideoFile(file);
                            }}
                            className="hidden"
                          />
                          <div className="space-y-2">
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                              />
                            </svg>
                            <p className="text-gray-600">
                              Click to upload video
                            </p>
                            <p className="text-sm text-gray-400">
                              MP4, WebM, OGG, MOV up to 500MB
                            </p>
                          </div>
                        </label>
                      )}
                    </div>
                    {isUploading && (
                      <div className="space-y-1">
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-forest transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-center text-sm text-gray-500">
                          Uploading... {uploadProgress}%
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes) *</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        value={Math.max(
                          1,
                          Math.round(lessonForm.duration / 60),
                        )}
                        onChange={(e) =>
                          setLessonForm({
                            ...lessonForm,
                            // Stored in seconds; entered in minutes.
                            duration: (parseInt(e.target.value) || 10) * 60,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="mb-3 block">Preview</Label>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={lessonForm.isFree}
                          onChange={(e) =>
                            setLessonForm({
                              ...lessonForm,
                              isFree: e.target.checked,
                            })
                          }
                          className="h-4 w-4"
                        />
                        <span>Free preview</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetLessonForm}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingLesson ? "Update Lesson" : "Add Lesson"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {course.lessons.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="mb-4 text-gray-500">No lessons yet</p>
                <Button onClick={() => setShowLessonForm(true)}>
                  Add Your First Lesson
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {course.lessons
                .sort((a, b) => a.order - b.order)
                .map((lesson, index) => (
                  <Card key={lesson.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-semibold text-forest">
                            {index + 1}
                          </span>
                          <div>
                            <h4 className="font-medium">{lesson.title}</h4>
                            <p className="text-sm text-gray-500">
                              {formatDuration(lesson.duration)}
                              {lesson.isFree && " • Free preview"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditLesson(lesson)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteLesson(lesson.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Quizzes Tab */}
      {activeTab === "quizzes" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Lesson Quizzes</h2>
          </div>

          {course.lessons.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="mb-4 text-gray-500">
                  Add lessons first to create quizzes
                </p>
                <Button onClick={() => setActiveTab("lessons")}>
                  Go to Lessons
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {course.lessons
                .sort((a, b) => a.order - b.order)
                .map((lesson, index) => (
                  <Card key={lesson.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-semibold text-forest">
                            {index + 1}
                          </span>
                          <div>
                            <h4 className="font-medium">{lesson.title}</h4>
                            {lesson.quiz ? (
                              <p className="text-sm text-green-600">
                                Quiz: {lesson.quiz.title} •{" "}
                                {lesson.quiz._count?.questions || 0} questions
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500">No quiz</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {lesson.quiz ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedQuizId(lesson.quiz!.id);
                                  setShowQuestionForm(true);
                                }}
                              >
                                Add Question
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedLessonForQuiz(lesson.id);
                                setShowQuizForm(true);
                              }}
                            >
                              Create Quiz
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}

          {/* Quiz Form Modal */}
          {showQuizForm && selectedLessonForQuiz && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-lg">
                <QuizForm
                  lessonId={selectedLessonForQuiz}
                  onSuccess={() => {
                    setShowQuizForm(false);
                    setSelectedLessonForQuiz(null);
                    fetchCourse();
                    setSuccess("Quiz created successfully!");
                  }}
                  onCancel={() => {
                    setShowQuizForm(false);
                    setSelectedLessonForQuiz(null);
                  }}
                />
              </div>
            </div>
          )}

          {/* Question Form Modal */}
          {showQuestionForm && selectedQuizId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
              <div className="my-8 w-full max-w-2xl">
                <QuestionForm
                  quizId={selectedQuizId}
                  onSuccess={() => {
                    setShowQuestionForm(false);
                    fetchCourse();
                    setSuccess("Question added successfully!");
                  }}
                  onCancel={() => {
                    setShowQuestionForm(false);
                    setSelectedQuizId(null);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
