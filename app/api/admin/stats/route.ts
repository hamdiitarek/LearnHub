import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/admin/stats - Get platform statistics (Admin only)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get counts
    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      totalLessons,
      totalReviews,
      totalCertificates,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: "STUDENT" } }),
      db.user.count({ where: { role: "INSTRUCTOR" } }),
      db.course.count(),
      db.course.count({ where: { status: "PUBLISHED" } }),
      db.enrollment.count(),
      db.lesson.count(),
      db.review.count(),
      db.certificate.count(),
    ]);

    // Get recent activity
    const [recentUsers, recentCourses, recentEnrollments] = await Promise.all([
      db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.course.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          instructor: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.enrollment.findMany({
        select: {
          id: true,
          enrolledAt: true,
          user: {
            select: {
              name: true,
            },
          },
          course: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { enrolledAt: "desc" },
        take: 5,
      }),
    ]);

    // Get popular courses
    const popularCourses = await db.course.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        thumbnail: true,
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: {
        enrollments: {
          _count: "desc",
        },
      },
      take: 5,
    });

    // Get average rating
    const avgRating = await db.review.aggregate({
      _avg: { rating: true },
    });

    // Every course, drafts included, for the catalogue table
    const courses = await db.course.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        level: true,
        status: true,
        updatedAt: true,
        instructor: { select: { name: true } },
        reviews: { select: { rating: true } },
        _count: { select: { lessons: true, enrollments: true, certificates: true } },
      },
      orderBy: [{ status: "desc" }, { title: "asc" }],
    });

    // Enrolments per week for the last 12 weeks (oldest first)
    const WEEKS = 12;
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const since = new Date(now - WEEKS * weekMs);
    const recent = await db.enrollment.findMany({
      where: { enrolledAt: { gte: since } },
      select: { enrolledAt: true, completedAt: true },
    });
    const enrollmentsByWeek = Array.from({ length: WEEKS }, (_, i) => ({
      weekStart: new Date(since.getTime() + i * weekMs).toISOString(),
      enrollments: 0,
    }));
    for (const e of recent) {
      const i = Math.min(WEEKS - 1, Math.floor((e.enrolledAt.getTime() - since.getTime()) / weekMs));
      enrollmentsByWeek[i].enrollments++;
    }
    const completedEnrollments = await db.enrollment.count({ where: { completedAt: { not: null } } });

    return NextResponse.json({
      stats: {
        users: {
          total: totalUsers,
          students: totalStudents,
          instructors: totalInstructors,
          admins: totalUsers - totalStudents - totalInstructors,
        },
        courses: {
          total: totalCourses,
          published: publishedCourses,
          draft: totalCourses - publishedCourses,
        },
        enrollments: totalEnrollments,
        completedEnrollments,
        lessons: totalLessons,
        reviews: totalReviews,
        certificates: totalCertificates,
        avgRating: Math.round((avgRating._avg.rating || 0) * 10) / 10,
      },
      recentActivity: {
        users: recentUsers,
        courses: recentCourses,
        enrollments: recentEnrollments,
      },
      popularCourses,
      enrollmentsByWeek,
      courses: courses.map(({ reviews, ...c }) => ({
        ...c,
        avgRating: reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
      })),
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
