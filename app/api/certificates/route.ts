import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// GET /api/certificates - Get user's certificates
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const certificateNumber = searchParams.get("number");

    // If certificate number provided, get specific certificate (public)
    if (certificateNumber) {
      const certificate = await db.certificate.findUnique({
        where: { certificateNumber },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              instructor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!certificate) {
        return NextResponse.json(
          { error: "Certificate not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ certificate });
    }

    // Get all user's certificates
    const certificates = await db.certificate.findMany({
      where: { userId: session.user.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            instructor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });

    return NextResponse.json({ certificates });
  } catch (error) {
    console.error("Get certificates error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/certificates - Generate certificate for completed course
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    // Check if already has certificate
    const existingCertificate = await db.certificate.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });

    if (existingCertificate) {
      return NextResponse.json(
        { error: "Certificate already issued", certificate: existingCertificate },
        { status: 400 }
      );
    }

    // Check enrollment and completion
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 400 }
      );
    }

    // Check if course is 100% complete
    const [totalLessons, completedLessons] = await Promise.all([
      db.lesson.count({ where: { courseId } }),
      db.progress.count({
        where: {
          userId: session.user.id,
          completed: true,
          lesson: { courseId },
        },
      }),
    ]);

    if (completedLessons < totalLessons) {
      return NextResponse.json(
        {
          error: "Course not completed",
          progress: {
            completed: completedLessons,
            total: totalLessons,
            percentage: Math.round((completedLessons / totalLessons) * 100),
          },
        },
        { status: 400 }
      );
    }

    // Generate certificate number
    const certificateNumber = `CERT-${new Date().getFullYear()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Create certificate
    const certificate = await db.certificate.create({
      data: {
        userId: session.user.id,
        courseId,
        certificateNumber,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            instructor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Update enrollment completion date
    await db.enrollment.update({
      where: { id: enrollment.id },
      data: { completedAt: new Date() },
    });

    return NextResponse.json(
      { message: "Certificate generated successfully", certificate },
      { status: 201 }
    );
  } catch (error) {
    console.error("Generate certificate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
