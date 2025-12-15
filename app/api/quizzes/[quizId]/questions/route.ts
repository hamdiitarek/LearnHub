import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createQuestionSchema } from "@/lib/validations";

// POST /api/quizzes/[quizId]/questions - Add question to quiz
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = createQuestionSchema.safeParse({ ...body, quizId });
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.issues[0].message },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { quizId: _, ...questionData } = validatedData.data;

    // Get quiz with course
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: {
          include: {
            course: {
              select: { instructorId: true },
            },
          },
        },
        questions: {
          orderBy: { order: "desc" },
          take: 1,
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Check ownership
    if (
      quiz.lesson.course.instructorId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Auto-assign order if not provided
    const order = questionData.order ?? (quiz.questions[0]?.order ?? 0) + 1;

    // Create question
    const question = await db.question.create({
      data: {
        ...questionData,
        quizId,
        order,
      },
    });

    return NextResponse.json(
      { message: "Question added successfully", question },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add question error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/quizzes/[quizId]/questions - Get all questions for a quiz
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const session = await auth();

    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: {
          include: {
            course: {
              select: {
                id: true,
                instructorId: true,
                status: true,
              },
            },
          },
        },
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const isOwner = session?.user?.id === quiz.lesson.course.instructorId;
    const isAdmin = session?.user?.role === "ADMIN";

    // Check enrollment
    let enrollment = null;
    if (session?.user) {
      enrollment = await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId: quiz.lesson.course.id,
          },
        },
      });
    }

    // Only enrolled users, owners, or admins can access
    if (!enrollment && !isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You must be enrolled to access this quiz" },
        { status: 403 }
      );
    }

    // Hide correct answers for non-owners
    const questionsForUser = quiz.questions.map((q: typeof quiz.questions[number]) => ({
      ...q,
      correctAnswer: isOwner || isAdmin ? q.correctAnswer : undefined,
    }));

    return NextResponse.json({ questions: questionsForUser });
  } catch (error) {
    console.error("Get questions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
