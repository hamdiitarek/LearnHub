import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateProgressSchema } from "@/lib/validations";

// POST /api/progress - Update lesson progress
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = updateProgressSchema.safeParse(body);
    if (!validatedData.success) {
      console.error("Validation error:", validatedData.error.issues);
      return NextResponse.json(
        { error: validatedData.error.issues[0].message },
        { status: 400 }
      );
    }

    const { lessonId, watchTime = 0, completed = false } = validatedData.data;

    // Get lesson with course
    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          select: { id: true },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Check enrollment
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: lesson.course.id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    // Determine if lesson should be marked complete
    // Either explicitly marked complete or watched 90% of the duration
    const lessonDurationSeconds = lesson.duration; // Lesson.duration is stored in seconds
    const shouldComplete = completed || (watchTime >= lessonDurationSeconds * 0.9);

    // Upsert progress
    const progress = await db.progress.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId,
        },
      },
      create: {
        userId: session.user.id,
        lessonId,
        watchTime: watchTime || 0,
        completed: shouldComplete,
        completedAt: shouldComplete ? new Date() : null,
      },
      update: {
        watchTime: watchTime || undefined,
        completed: shouldComplete,
        completedAt: shouldComplete ? new Date() : undefined,
      },
    });

    // Update course progress percentage
    const courseProgress = await calculateCourseProgress(
      session.user.id,
      lesson.course.id
    );

    await db.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progress: courseProgress,
        completedAt: courseProgress >= 100 ? new Date() : null,
      },
    });

    return NextResponse.json({
      progress,
      courseProgress,
    });
  } catch (error) {
    console.error("Update progress error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/progress - Get user's progress for a course
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    // Get all lessons for the course
    const lessons = await db.lesson.findMany({
      where: { courseId },
      select: { id: true },
    });

    // Get progress for all lessons
    const progress = await db.progress.findMany({
      where: {
        userId: session.user.id,
        lessonId: {
          in: lessons.map((l: { id: string }) => l.id),
        },
      },
    });

    // Get enrollment
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });

    return NextResponse.json({
      progress,
      enrollment,
      totalLessons: lessons.length,
      completedLessons: progress.filter((p: { completed: boolean }) => p.completed).length,
    });
  } catch (error) {
    console.error("Get progress error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to calculate course progress
async function calculateCourseProgress(
  userId: string,
  courseId: string
): Promise<number> {
  const [totalLessons, completedLessons] = await Promise.all([
    db.lesson.count({ where: { courseId } }),
    db.progress.count({
      where: {
        userId,
        completed: true,
        lesson: { courseId },
      },
    }),
  ]);

  if (totalLessons === 0) return 0;
  return Math.round((completedLessons / totalLessons) * 100);
}
