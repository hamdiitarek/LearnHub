import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateCourseSchema } from "@/lib/validations";

// GET /api/courses/[courseId] - Get single course details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const session = await auth();

    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
          },
        },
        lessons: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            order: true,
            isFree: true,
            videoUrl: true,
            quiz: {
              select: {
                id: true,
                title: true,
                passingScore: true,
                _count: {
                  select: {
                    questions: true,
                    attempts: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if user can view this course
    const isOwner = session?.user?.id === course.instructorId;
    const isAdmin = session?.user?.role === "ADMIN";

    if (course.status !== "PUBLISHED" && !isOwner && !isAdmin) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check enrollment status
    let enrollment = null;
    if (session?.user) {
      enrollment = await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: course.id,
          },
        },
      });
    }

    // Calculate average rating
    const avgRating =
      course.reviews.length > 0
        ? course.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) /
          course.reviews.length
        : 0;

    // Calculate total duration
    const totalDuration = course.lessons.reduce((sum: number, l: { duration: number }) => sum + l.duration, 0);

    // Hide video URLs for non-free lessons if not enrolled
    const lessonsWithAccess = course.lessons.map((lesson: typeof course.lessons[number]) => {
      const canAccess = lesson.isFree || enrollment || isOwner || isAdmin;
      return {
        ...lesson,
        videoUrl: canAccess ? lesson.videoUrl : null,
      };
    });

    return NextResponse.json({
      ...course,
      lessons: lessonsWithAccess,
      avgRating: Math.round(avgRating * 10) / 10,
      totalDuration,
      isEnrolled: !!enrollment,
      isOwner,
      enrollment,
    });
  } catch (error) {
    console.error("Get course error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[courseId] - Update course
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check ownership
    const existingCourse = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (
      existingCourse.instructorId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = updateCourseSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.issues[0].message },
        { status: 400 }
      );
    }

    // Update course
    const course = await db.course.update({
      where: { id: courseId },
      data: validatedData.data,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({ message: "Course updated", course });
  } catch (error) {
    console.error("Update course error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId] - Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check ownership
    const existingCourse = await db.course.findUnique({
      where: { id: courseId },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (
      existingCourse.instructorId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete by archiving if there are enrollments
    if (existingCourse._count.enrollments > 0) {
      await db.course.update({
        where: { id: courseId },
        data: { status: "ARCHIVED" },
      });
      return NextResponse.json({ message: "Course archived" });
    }

    // Hard delete if no enrollments
    await db.course.delete({
      where: { id: courseId },
    });

    return NextResponse.json({ message: "Course deleted" });
  } catch (error) {
    console.error("Delete course error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
