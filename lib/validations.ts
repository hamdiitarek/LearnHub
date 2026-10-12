import { z } from "zod";

// ==================== AUTH SCHEMAS ====================

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  role: z.enum(["STUDENT", "INSTRUCTOR"]).default("STUDENT"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  avatar: z.string().url("Invalid avatar URL").optional().nullable(),
});

// IDs are only checked for presence: routes look every ID up and return 404
// when it doesn't exist. (The demo data uses readable IDs, not CUIDs.)

// ==================== COURSE SCHEMAS ====================

export const createCourseSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z.string().optional(),
  shortDescription: z
    .string()
    .max(500, "Short description must be less than 500 characters")
    .optional(),
  thumbnail: z.string().url("Invalid thumbnail URL").optional().nullable(),
  category: z.string().optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
});

export const updateCourseSchema = createCourseSchema.partial();

export const publishCourseSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

// ==================== LESSON SCHEMAS ====================

export const createLessonSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z.string().optional(),
  videoUrl: z.string().min(1, "Video URL is required"),
  duration: z.number().int().min(0, "Duration must be positive").default(0),
  order: z.number().int().min(0, "Order must be positive"),
  isFree: z.boolean().default(false),
});

export const updateLessonSchema = createLessonSchema.partial().omit({ courseId: true });

export const reorderLessonsSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  lessons: z.array(
    z.object({
      id: z.string().min(1, "Lesson ID is required"),
      order: z.number().int().min(0),
    })
  ),
});

// ==================== ENROLLMENT SCHEMAS ====================

export const enrollmentSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
});

// ==================== PROGRESS SCHEMAS ====================

export const updateProgressSchema = z.object({
  lessonId: z.string().min(1, "Lesson ID is required"),
  watchTime: z.number().int().min(0, "Watch time must be positive").default(0),
  completed: z.boolean().optional().default(false),
});

// ==================== QUIZ SCHEMAS ====================

export const createQuizSchema = z.object({
  lessonId: z.string().min(1, "Lesson ID is required"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z.string().optional(),
  passingScore: z.number().int().min(0).max(100).default(70),
  timeLimit: z.number().int().min(1).optional().nullable(),
});

export const updateQuizSchema = createQuizSchema.partial().omit({ lessonId: true });

export const createQuestionSchema = z.object({
  quizId: z.string().min(1, "Quiz ID is required"),
  text: z.string().min(5, "Question text must be at least 5 characters"),
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "MULTIPLE_SELECT"]).default("MULTIPLE_CHOICE"),
  options: z.array(z.string()).min(2, "At least 2 options required"),
  correctAnswer: z.union([z.string(), z.array(z.string())]),
  order: z.number().int().min(0).optional(),
  points: z.number().int().min(1).default(1),
});

export const updateQuestionSchema = createQuestionSchema.partial().omit({ quizId: true });

export const submitQuizSchema = z.object({
  quizId: z.string().min(1, "Quiz ID is required"),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string()), z.boolean()])),
});

// ==================== REVIEW SCHEMAS ====================

export const createReviewSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: z.string().max(1000, "Comment must be less than 1000 characters").optional(),
});

export const updateReviewSchema = createReviewSchema.partial().omit({ courseId: true });

// ==================== TYPES ====================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type ReorderLessonsInput = z.infer<typeof reorderLessonsSchema>;
export type EnrollmentInput = z.infer<typeof enrollmentSchema>;
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
