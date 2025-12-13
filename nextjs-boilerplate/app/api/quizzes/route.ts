import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createQuizSchema } from "@/lib/validations";

// POST /api/quizzes - Create a new quiz
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = createQuizSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.issues[0].message },
        { status: 400 }
      );
    }

    const { lessonId, ...quizData } = validatedData.data;

    // Get lesson with course
    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: {
          select: { instructorId: true },
        },
        quiz: true,
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Check ownership
    if (
      lesson.course.instructorId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if quiz already exists
    if (lesson.quiz) {
      return NextResponse.json(
        { error: "Lesson already has a quiz" },
        { status: 400 }
      );
    }

    // Create quiz
    const quiz = await db.quiz.create({
      data: {
        ...quizData,
        lessonId,
      },
    });

    return NextResponse.json(
      { message: "Quiz created successfully", quiz },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create quiz error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
