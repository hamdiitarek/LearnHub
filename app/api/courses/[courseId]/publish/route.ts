import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/courses/[courseId]/publish - Publish a course
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

    // Get course with lesson count
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check ownership
    if (
      course.instructorId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if course has at least one lesson
    if (course._count.lessons === 0) {
      return NextResponse.json(
        { error: "Course must have at least one lesson to be published" },
        { status: 400 }
      );
    }

    // Publish course
    const updatedCourse = await db.course.update({
      where: { id: courseId },
      data: { status: "PUBLISHED" },
    });

    return NextResponse.json({
      message: "Course published successfully",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("Publish course error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[courseId]/publish - Unpublish a course (back to draft)
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

    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (
      course.instructorId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedCourse = await db.course.update({
      where: { id: courseId },
      data: { status: "DRAFT" },
    });

    return NextResponse.json({
      message: "Course moved back to draft",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("Unpublish course error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
