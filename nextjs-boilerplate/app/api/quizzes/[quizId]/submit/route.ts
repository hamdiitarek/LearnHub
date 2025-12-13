import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { submitQuizSchema } from "@/lib/validations";

// POST /api/quizzes/[quizId]/submit - Submit quiz attempt
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
    const validatedData = submitQuizSchema.safeParse({ ...body, quizId });
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.issues[0].message },
        { status: 400 }
      );
    }

    const { answers } = validatedData.data;

    // Get quiz with questions
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: {
          include: {
            course: {
              select: { id: true },
            },
          },
        },
        questions: true,
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Check enrollment
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: quiz.lesson.course.id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "You must be enrolled to take this quiz" },
        { status: 403 }
      );
    }

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedAnswers: Record<string, { 
      userAnswer: unknown; 
      correctAnswer: unknown; 
      isCorrect: boolean; 
      points: number 
    }> = {};

    for (const question of quiz.questions) {
      totalPoints += question.points;
      const userAnswer = answers[question.id];
      const correctAnswer = question.correctAnswer as string | string[];

      let isCorrect = false;

      if (question.type === "TRUE_FALSE") {
        isCorrect = String(userAnswer).toLowerCase() === String(correctAnswer).toLowerCase();
      } else if (question.type === "MULTIPLE_CHOICE") {
        isCorrect = userAnswer === correctAnswer;
      } else if (question.type === "MULTIPLE_SELECT") {
        // For multiple select, check if arrays match
        const userAnswerArray = Array.isArray(userAnswer) ? userAnswer.sort() : [];
        const correctAnswerArray = Array.isArray(correctAnswer) ? correctAnswer.sort() : [];
        isCorrect =
          userAnswerArray.length === correctAnswerArray.length &&
          userAnswerArray.every((val, idx) => val === correctAnswerArray[idx]);
      }

      if (isCorrect) {
        earnedPoints += question.points;
      }

      gradedAnswers[question.id] = {
        userAnswer,
        correctAnswer,
        isCorrect,
        points: isCorrect ? question.points : 0,
      };
    }

    const scorePercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = scorePercentage >= quiz.passingScore;

    // Create quiz attempt
    const attempt = await db.quizAttempt.create({
      data: {
        quizId,
        userId: session.user.id,
        score: Math.round(scorePercentage * 100) / 100,
        passed,
        answers: gradedAnswers,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: passed ? "Congratulations! You passed!" : "Quiz completed",
      attempt: {
        id: attempt.id,
        score: attempt.score,
        passed: attempt.passed,
        totalPoints,
        earnedPoints,
        passingScore: quiz.passingScore,
        gradedAnswers,
      },
    });
  } catch (error) {
    console.error("Submit quiz error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
