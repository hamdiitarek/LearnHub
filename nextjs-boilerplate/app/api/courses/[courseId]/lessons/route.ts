import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createLessonSchema } from "@/lib/validations";

// GET /api/courses/[courseId]/lessons - Get all lessons for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const session = await auth();

    // Check if course exists
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const isOwner = session?.user?.id === course.instructorId;
    const isAdmin = session?.user?.role === "ADMIN";

    // Check if course is accessible
    if (course.status !== "PUBLISHED" && !isOwner && !isAdmin) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check enrollment
    let enrollment = null;
    if (session?.user) {
      enrollment = await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId,
          },
        },
      });
    }

    // Get lessons
    const lessons = await db.lesson.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
    });

    // Hide video URLs for non-free lessons if not enrolled
    const lessonsWithAccess = lessons.map((lesson: typeof lessons[number]) => {
      const canAccess = lesson.isFree || enrollment || isOwner || isAdmin;
      return {
        ...lesson,
        videoUrl: canAccess ? lesson.videoUrl : null,
        canAccess,
      };
    });

    return NextResponse.json({ lessons: lessonsWithAccess });
  } catch (error) {
    console.error("Get lessons error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/courses/[courseId]/lessons - Create a new lesson
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check course ownership
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (
      course.instructorId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = createLessonSchema.safeParse({
      ...body,
      courseId,
    });

    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.issues[0].message },
        { status: 400 }
      );
    }

    // Get the highest order number for existing lessons
    const maxOrderLesson = await db.lesson.findFirst({
      where: { courseId },
      orderBy: { order: "desc" },
    });

    const order = body.order ?? (maxOrderLesson?.order ?? 0) + 1;

    // Create lesson
    const lesson = await db.lesson.create({
      data: {
        ...validatedData.data,
        order,
      },
    });

    return NextResponse.json(
      { message: "Lesson created successfully", lesson },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create lesson error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
