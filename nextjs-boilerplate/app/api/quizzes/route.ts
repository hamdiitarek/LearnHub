import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createQuizSchema, createQuestionSchema } from "@/lib/validations";

// GET /api/quizzes/[quizId] - Get quiz with questions
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
    if (session?.user) {
      [enrollment, bestAttempt] = await Promise.all([
        db.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: session.user.id,
              courseId: quiz.lesson.course.id,
            },
          },
        }),
        db.quizAttempt.findFirst({
          where: {
            quizId,
            userId: session.user.id,
          },
          orderBy: { score: "desc" },
        }),
      ]);
    }

    // Only enrolled users, owners, or admins can access
    if (!enrollment && !isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You must be enrolled to take this quiz" },
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
    });
  } catch (error) {
    console.error("Get quiz error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

// POST /api/quizzes/[quizId]/questions - Add question to quiz
export async function addQuestion(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = createQuestionSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.issues[0].message },
        { status: 400 }
      );
    }

    const { quizId, ...questionData } = validatedData.data;

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

    // Create question
    const question = await db.question.create({
      data: {
        ...questionData,
        quizId,
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
