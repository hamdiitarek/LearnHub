import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateLessonSchema } from "@/lib/validations";

// GET /api/courses/[courseId]/lessons/[lessonId] - Get single lesson
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const { courseId, lessonId } = await params;
    const session = await auth();

    const lesson = await db.lesson.findUnique({
      where: { id: lessonId, courseId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
            status: true,
          },
        },
        quiz: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            timeLimit: true,
            _count: {
              select: { questions: true },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const isOwner = session?.user?.id === lesson.course.instructorId;
    const isAdmin = session?.user?.role === "ADMIN";

    // Check if course is accessible
    if (lesson.course.status !== "PUBLISHED" && !isOwner && !isAdmin) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Check enrollment
    let enrollment = null;
    let progress = null;
    if (session?.user) {
      [enrollment, progress] = await Promise.all([
        db.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: session.user.id,
              courseId,
            },
          },
        }),
        db.progress.findUnique({
          where: {
            userId_lessonId: {
              userId: session.user.id,
              lessonId,
            },
          },
        }),
      ]);
    }

    const canAccess = lesson.isFree || enrollment || isOwner || isAdmin;

    return NextResponse.json({
      ...lesson,
      videoUrl: canAccess ? lesson.videoUrl : null,
      canAccess,
      progress,
    });
  } catch (error) {
    console.error("Get lesson error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/courses/[courseId]/lessons/[lessonId] - Update lesson
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const { courseId, lessonId } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get lesson with course
    const existingLesson = await db.lesson.findUnique({
      where: { id: lessonId, courseId },
      include: {
        course: {
          select: { instructorId: true },
        },
      },
    });

    if (!existingLesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Check ownership
    if (
      existingLesson.course.instructorId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = updateLessonSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.issues[0].message },
        { status: 400 }
      );
    }

    // Update lesson
    const lesson = await db.lesson.update({
      where: { id: lessonId },
      data: validatedData.data,
    });

    return NextResponse.json({ message: "Lesson updated", lesson });
  } catch (error) {
    console.error("Update lesson error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId]/lessons/[lessonId] - Delete lesson
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const { courseId, lessonId } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get lesson with course
    const existingLesson = await db.lesson.findUnique({
      where: { id: lessonId, courseId },
      include: {
        course: {
          select: { instructorId: true },
        },
      },
    });

    if (!existingLesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Check ownership
    if (
      existingLesson.course.instructorId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete lesson (cascades to progress and quiz)
    await db.lesson.delete({
      where: { id: lessonId },
    });

    // Reorder remaining lessons
    await db.$executeRaw`
      UPDATE "Lesson" 
      SET "order" = "order" - 1 
      WHERE "courseId" = ${courseId} AND "order" > ${existingLesson.order}
    `;

    return NextResponse.json({ message: "Lesson deleted" });
  } catch (error) {
    console.error("Delete lesson error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
