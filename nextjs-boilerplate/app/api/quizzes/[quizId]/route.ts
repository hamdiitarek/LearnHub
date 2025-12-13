import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateQuizSchema } from "@/lib/validations";

// GET /api/quizzes/[quizId] - Get quiz details
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
                title: true,
                instructorId: true,
                status: true,
              },
            },
          },
        },
        questions: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const isOwner = session?.user?.id === quiz.lesson.course.instructorId;
    const isAdmin = session?.user?.role === "ADMIN";

    // Check if course is accessible
    if (quiz.lesson.course.status !== "PUBLISHED" && !isOwner && !isAdmin) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Check enrollment
    let enrollment = null;
    let bestAttempt = null;
    let attempts: unknown[] = [];

    if (session?.user) {
      [enrollment, bestAttempt, attempts] = await Promise.all([
        db.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: session.user.id,
              courseId: quiz.lesson.course.id,
            },
          },
        }),
        db.quizAttempt.findFirst({
          where: { quizId, userId: session.user.id },
          orderBy: { score: "desc" },
        }),
        db.quizAttempt.findMany({
          where: { quizId, userId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);
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

    return NextResponse.json({
      ...quiz,
      questions: questionsForUser,
      bestAttempt,
      attempts,
      isOwner,
    });
  } catch (error) {
    console.error("Get quiz error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/quizzes/[quizId] - Update quiz
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get quiz with course
    const existingQuiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: {
          include: {
            course: {
              select: { instructorId: true },
            },
          },
        },
      },
    });

    if (!existingQuiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Check ownership
    if (
      existingQuiz.lesson.course.instructorId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = updateQuizSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.issues[0].message },
        { status: 400 }
      );
    }

    // Update quiz
    const quiz = await db.quiz.update({
      where: { id: quizId },
      data: validatedData.data,
    });

    return NextResponse.json({ message: "Quiz updated", quiz });
  } catch (error) {
    console.error("Update quiz error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/quizzes/[quizId] - Delete quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get quiz with course
    const existingQuiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: {
          include: {
            course: {
              select: { instructorId: true },
            },
          },
        },
      },
    });

    if (!existingQuiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Check ownership
    if (
      existingQuiz.lesson.course.instructorId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete quiz (cascades to questions and attempts)
    await db.quiz.delete({
      where: { id: quizId },
    });

    return NextResponse.json({ message: "Quiz deleted" });
  } catch (error) {
    console.error("Delete quiz error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
