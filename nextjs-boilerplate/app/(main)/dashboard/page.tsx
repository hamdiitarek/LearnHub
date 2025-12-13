"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Enrollment {
  id: string;
  progress: number;
  enrolledAt: string;
  course: {
    id: string;
    title: string;
    thumbnail: string | null;
    category: string;
    instructor: {
      name: string;
    };
    _count: {
      lessons: number;
    };
  };
}

interface Certificate {
  id: string;
  certificateNumber: string;
  issuedAt: string;
  course: {
    title: string;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [enrollmentsRes, certificatesRes] = await Promise.all([
        fetch("/api/enrollments"),
        fetch("/api/certificates"),
      ]);

      const enrollmentsData = await enrollmentsRes.json();
      const certificatesData = await certificatesRes.json();

      setEnrollments(enrollmentsData.enrollments || []);
      setCertificates(certificatesData.certificates || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetCertificate = async (courseId: string) => {
    try {
      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await response.json();
      
      if (response.ok || data.certificate) {
        // Redirect to certificate page
        router.push(`/certificates/${data.certificate.certificateNumber}`);
      } else {
        alert(data.error || "Failed to generate certificate. Make sure you have completed all lessons.");
      }
    } catch (error) {
      console.error("Failed to get certificate:", error);
      alert("Failed to generate certificate");
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const inProgressCourses = enrollments.filter(
    (e) => e.progress > 0 && e.progress < 100
  );
  const completedCourses = enrollments.filter((e) => e.progress === 100);
  const notStartedCourses = enrollments.filter((e) => e.progress === 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {session?.user?.name}!
        </h1>
        <p className="text-gray-600">Track your learning progress</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Enrolled Courses</CardDescription>
            <CardTitle className="text-3xl">{enrollments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl">{inProgressCourses.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">{completedCourses.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Certificates</CardDescription>
            <CardTitle className="text-3xl">{certificates.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Continue Learning */}
      {inProgressCourses.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Continue Learning</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inProgressCourses.map((enrollment) => (
              <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                  {enrollment.course.thumbnail ? (
                    <img
                      src={enrollment.course.thumbnail}
                      alt={enrollment.course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                      <span className="text-white text-4xl font-bold">
                        {enrollment.course.title.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <Badge variant="secondary" className="w-fit">
                    {enrollment.course.category}
                  </Badge>
                  <CardTitle className="text-lg line-clamp-2">
                    {enrollment.course.title}
                  </CardTitle>
                  <CardDescription>
                    by {enrollment.course.instructor.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium">
                        {Math.round(enrollment.progress)}%
                      </span>
                    </div>
                    <Progress value={enrollment.progress} />
                  </div>
                  <Link href={`/courses/${enrollment.course.id}/learn`}>
                    <Button className="w-full">Continue</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Not Started */}
      {notStartedCourses.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Start Learning</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notStartedCourses.map((enrollment) => (
              <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                  {enrollment.course.thumbnail ? (
                    <img
                      src={enrollment.course.thumbnail}
                      alt={enrollment.course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                      <span className="text-white text-4xl font-bold">
                        {enrollment.course.title.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <Badge variant="secondary" className="w-fit">
                    {enrollment.course.category}
                  </Badge>
                  <CardTitle className="text-lg line-clamp-2">
                    {enrollment.course.title}
                  </CardTitle>
                  <CardDescription>
                    by {enrollment.course.instructor.name} •{" "}
                    {enrollment.course._count.lessons} lessons
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/courses/${enrollment.course.id}/learn`}>
                    <Button className="w-full">Start Course</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {completedCourses.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Completed Courses</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedCourses.map((enrollment) => (
              <Card key={enrollment.id}>
                <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden relative">
                  {enrollment.course.thumbnail ? (
                    <img
                      src={enrollment.course.thumbnail}
                      alt={enrollment.course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-500 to-teal-600">
                      <span className="text-white text-4xl font-bold">
                        {enrollment.course.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-500">Completed</Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-2">
                    {enrollment.course.title}
                  </CardTitle>
                  <CardDescription>
                    Completed on{" "}
                    {new Date(enrollment.enrolledAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Link
                    href={`/courses/${enrollment.course.id}/learn`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full">
                      Review
                    </Button>
                  </Link>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => handleGetCertificate(enrollment.course.id)}
                  >
                    Get Certificate
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Certificates */}
      {certificates.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Your Certificates</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <Card key={cert.id}>
                <CardHeader>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                    <svg
                      className="w-6 h-6 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </div>
                  <CardTitle className="text-lg">{cert.course.title}</CardTitle>
                  <CardDescription>
                    Certificate #{cert.certificateNumber}
                    <br />
                    Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/certificates/${cert.certificateNumber}`}>
                    <Button variant="outline" className="w-full">
                      View & Download
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {enrollments.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
          <p className="text-gray-600 mb-4">
            Start your learning journey by enrolling in a course
          </p>
          <Link href="/courses">
            <Button>Browse Courses</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
