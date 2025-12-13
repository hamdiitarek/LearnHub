"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ReviewForm } from "@/components/review/review-form";

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number;
  order: number;
  isFree: boolean;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  user: {
    name: string;
  };
  createdAt: string;
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
    name: string;
    avatar?: string | null;
    bio?: string | null;
  };
  lessons: Lesson[];
  _count: {
    enrollments: number;
    reviews: number;
  };
  avgRating?: number;
  totalDuration?: number;
  isEnrolled?: boolean;
  isOwner?: boolean;
}

interface Enrollment {
  id: string;
  progress: number;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

interface UserReview {
  id: string;
  rating: number;
  comment: string | null;
}

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [userReview, setUserReview] = useState<UserReview | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    fetchCourse();
    fetchReviews();
  }, [resolvedParams.courseId]);

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
      setCourse(data);
      setEnrollment(data.enrollment);
    } catch (error) {
      console.error("Failed to fetch course:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        `/api/reviews?courseId=${resolvedParams.courseId}`
      );
      const data = await response.json();
      setReviews(data.reviews || []);
      if (data.stats) {
        setReviewStats({
          averageRating: data.stats.avgRating || 0,
          totalReviews: data.stats.totalReviews || 0,
        });
      }
      
      // Check if current user has a review
      if (session?.user) {
        const userReviewData = data.reviews?.find(
          (r: Review & { user: { id?: string } }) => r.user?.id === session.user.id
        );
        if (userReviewData) {
          setUserReview({
            id: userReviewData.id,
            rating: userReviewData.rating,
            comment: userReviewData.comment,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  const handleEnroll = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=/courses/${resolvedParams.courseId}`);
      return;
    }

    setIsEnrolling(true);
    try {
      const response = await fetch(`/api/courses/${resolvedParams.courseId}/enroll`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setEnrollment(data.enrollment);
      }
    } catch (error) {
      console.error("Failed to enroll:", error);
    } finally {
      setIsEnrolling(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const totalDuration = course?.lessons?.reduce((acc, l) => acc + (l.duration || 0), 0) || 0;

  const getLevelColor = (level: string) => {
    switch (level) {
      case "BEGINNER":
        return "bg-green-100 text-green-800";
      case "INTERMEDIATE":
        return "bg-yellow-100 text-yellow-800";
      case "ADVANCED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="h-64 bg-gray-200 rounded mb-8" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Course not found</h1>
        <Link href="/courses">
          <Button>Browse Courses</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">{course.category}</Badge>
                <Badge className={getLevelColor(course.level)}>
                  {course.level.charAt(0) + course.level.slice(1).toLowerCase()}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {course.title}
              </h1>
              <p className="text-xl text-blue-100 mb-4">{course.description}</p>
              <div className="flex items-center gap-4 text-blue-100 flex-wrap">
                <span>by {course.instructor?.name || "Unknown"}</span>
                <span>•</span>
                <span>{course._count?.enrollments || 0} students</span>
                <span>•</span>
                <span>{course.lessons?.length || 0} lessons</span>
                <span>•</span>
                <span>{formatDuration(totalDuration)}</span>
              </div>
              {reviewStats && reviewStats.totalReviews > 0 && (
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(reviewStats.averageRating)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="font-semibold">
                    {reviewStats.averageRating.toFixed(1)}
                  </span>
                  <span className="text-blue-200">
                    ({reviewStats.totalReviews} reviews)
                  </span>
                </div>
              )}
            </div>
            <div className="lg:col-span-1">
              <Card className="bg-white text-gray-900">
                <CardHeader>
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full aspect-video object-cover rounded-lg mb-4"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-4 flex items-center justify-center">
                      <span className="text-white text-6xl font-bold">
                        {course.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  <CardTitle className="text-3xl">
                    {course.price == null || course.price === 0 ? "Free" : `$${course.price}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {enrollment ? (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Your Progress</span>
                          <span>{Math.round(enrollment.progress || 0)}%</span>
                        </div>
                        <Progress value={enrollment.progress || 0} />
                      </div>
                      <Link href={`/courses/${course.id}/learn`}>
                        <Button className="w-full" size="lg">
                          Continue Learning
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleEnroll}
                      disabled={isEnrolling}
                    >
                      {isEnrolling ? "Enrolling..." : "Enroll Now"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Course Content */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Course Content</CardTitle>
                <CardDescription>
                  {course.lessons?.length || 0} lessons •{" "}
                  {formatDuration(totalDuration)} total length
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(course.lessons || [])
                    .sort((a, b) => a.order - b.order)
                    .map((lesson, index) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                            {index + 1}
                          </span>
                          <div>
                            <h4 className="font-medium">{lesson.title}</h4>
                            {lesson.description && (
                              <p className="text-sm text-gray-500">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {lesson.isFree && (
                            <Badge variant="secondary">Free Preview</Badge>
                          )}
                          <span className="text-sm text-gray-500">
                            {formatDuration(lesson.duration)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Student Reviews</CardTitle>
                    {reviewStats && reviewStats.totalReviews > 0 && (
                      <CardDescription>
                        {reviewStats.averageRating.toFixed(1)} average rating •{" "}
                        {reviewStats.totalReviews} reviews
                      </CardDescription>
                    )}
                  </div>
                  {enrollment && !showReviewForm && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReviewForm(true)}
                    >
                      {userReview ? "Edit Review" : "Write Review"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Review Form */}
                {showReviewForm && enrollment && (
                  <div className="mb-6">
                    <ReviewForm
                      courseId={course.id}
                      existingReview={userReview}
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
                  <p className="text-gray-500 text-center py-8">
                    No reviews yet. Be the first to review!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="border-b pb-4 last:border-0"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold">
                                {review.user?.name?.charAt(0) || "?"}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{review.user?.name || "Anonymous"}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-gray-600">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>What you&apos;ll learn</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-500 mt-0.5"
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
                    <span>
                      Comprehensive understanding of {course.category}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-500 mt-0.5"
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
                    <span>Hands-on practical exercises</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-500 mt-0.5"
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
                    <span>Certificate of completion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-500 mt-0.5"
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
                    <span>Lifetime access</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
