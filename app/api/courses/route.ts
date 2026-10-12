import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCourseSchema } from "@/lib/validations";

// GET /api/courses - Get all published courses (public) or instructor's courses
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const category = searchParams.get("category");
    const level = searchParams.get("level");
    const search = searchParams.get("search");
    const instructorId = searchParams.get("instructorId");
    const myCoursesOnly = searchParams.get("my") === "true";

    const skip = (page - 1) * limit;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    // If user wants their own courses (instructor dashboard)
    if (myCoursesOnly && session?.user) {
      where.instructorId = session.user.id;
    } else if (instructorId) {
      // Filter by specific instructor
      where.instructorId = instructorId;
      where.status = "PUBLISHED";
    } else {
      // Public listing - only published courses
      where.status = "PUBLISHED";
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Level filter
    if (level && ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(level)) {
      where.level = level;
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get courses with counts
    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        include: {
          instructor: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              lessons: true,
              enrollments: true,
              reviews: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
          lessons: {
            select: {
              duration: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.course.count({ where }),
    ]);

    // Calculate average rating for each course
    const coursesWithRating = courses.map((course: typeof courses[number]) => {
      const avgRating =
        course.reviews.length > 0
          ? course.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) /
            course.reviews.length
          : 0;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { reviews, lessons, ...courseData } = course;
      return {
        ...courseData,
        avgRating: Math.round(avgRating * 10) / 10,
        totalDuration: lessons.reduce((sum: number, l: { duration: number }) => sum + l.duration, 0),
      };
    });

    return NextResponse.json({
      courses: coursesWithRating,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get courses error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course (Instructor only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is instructor or admin
    if (!["INSTRUCTOR", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Only instructors can create courses" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = createCourseSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.issues[0].message },
        { status: 400 }
      );
    }

    // Create course
    const course = await db.course.create({
      data: {
        ...validatedData.data,
        instructorId: session.user.id,
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Course created successfully", course },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create course error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
