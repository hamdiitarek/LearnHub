import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/enrollments - Get user's enrolled courses
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const status = searchParams.get("status"); // 'in-progress' | 'completed' | 'all'

    const skip = (page - 1) * limit;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      userId: session.user.id,
    };

    if (status === "completed") {
      where.completedAt = { not: null };
    } else if (status === "in-progress") {
      where.completedAt = null;
    }

    const [enrollments, total] = await Promise.all([
      db.enrollment.findMany({
        where,
        include: {
          course: {
            include: {
              instructor: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
              _count: {
                select: {
                  lessons: true,
                },
              },
            },
          },
        },
        orderBy: { enrolledAt: "desc" },
        skip,
        take: limit,
      }),
      db.enrollment.count({ where }),
    ]);

    // Get progress details for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment: typeof enrollments[number]) => {
        const [completedLessons, totalLessons] = await Promise.all([
          db.progress.count({
            where: {
              userId: session.user.id,
              completed: true,
              lesson: { courseId: enrollment.courseId },
            },
          }),
          db.lesson.count({
            where: { courseId: enrollment.courseId },
          }),
        ]);

        return {
          ...enrollment,
          completedLessons,
          totalLessons,
        };
      })
    );

    return NextResponse.json({
      enrollments: enrollmentsWithProgress,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get enrollments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
