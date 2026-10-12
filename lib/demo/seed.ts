import bcrypt from "bcryptjs";
import type { Prisma, PrismaClient } from "@prisma/client";
import { COURSES, INSTRUCTORS, type DemoQuestion } from "./catalog";
import { DEMO_PASSWORD } from "./accounts";

const STUDENTS = [
  "Ahmed Samir",
  "Mariam Khaled",
  "Youssef Adel",
  "Habiba Tarek",
  "Mostafa Ashraf",
  "Farida Hany",
  "Ziad Mohamed",
  "Laila Mahmoud",
  "Hassan Ibrahim",
  "Malak Sherif",
  "Adham Wael",
  "Jana Mostafa",
  "Seif Ali",
  "Rana Ehab",
  "Ali Hossam",
  "Nada Gamal",
  "Yassin Amr",
  "Hana Fathy",
  "Marwan Essam",
  "Dina Raafat",
  "Tamer Saad",
  "Reem Atef",
  "Khaled Fawzy",
];

const REVIEWS: Record<number, string[]> = {
  5: [
    "The order of the lectures is what made this work for me. Each one picks up where the last left off.",
    "The short quizzes after the long videos kept me honest. I rewatched two sections because of them.",
    "Exactly the curriculum I wish I had when I started.",
    "Clear path and great teachers. The certificate at the end was a good push to finish.",
  ],
  4: [
    "Great selection. Some lectures are very long, so I split them over a few days.",
    "Solid path. I'd like a few more quizzes in the later lessons.",
    "Seeing the same idea explained by two different teachers really helped.",
  ],
  3: [
    "Useful, but the capstone lecture is a big jump from the earlier ones.",
    "Good content. I wish there were small exercises between the videos.",
  ],
};

const COURSE_REVIEWS: Record<string, string> = {
  "web-from-scratch":
    "Built my first portfolio page by the end of the last lesson.",
  "react-practical":
    "The task tracker lesson was the moment components finally made sense.",
  "node-backend":
    "The Docker lesson at the end tied the whole backend together.",
  "python-from-zero":
    "Went from zero to writing small scripts for my job in about three weeks.",
  "data-analysis-python":
    "The pandas groupby examples were exactly what I needed for my thesis data.",
  "neural-networks-visually":
    "The 3Blue1Brown chapters are worth it on their own. Gradient descent finally clicked.",
  "databases-sql": "I use what I learned about joins at work every week now.",
  "algorithms-data-structures":
    "Hard, but the graph theory lectures are the clearest I have found.",
  "cs-foundations":
    "CS50 is long, but the intro lesson makes it much less intimidating.",
  "git-docker-shipping": "No more fear of merge conflicts.",
};

// Deterministic randomness so every boot produces the same campus.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z]+/g, ".")
    .replace(/^\.|\.$/g, "");

const answerOf = (q: DemoQuestion) => q.answer;
const optionsOf = (q: DemoQuestion) =>
  q.type === "TRUE_FALSE" ? ["True", "False"] : q.options;

/** Fills an empty database with the demo catalogue, accounts and activity. */
export async function seedDemo(db: PrismaClient) {
  if ((await db.user.count()) > 0) return;

  const random = rng(20260412);
  const pick = <T>(list: readonly T[]) =>
    list[Math.floor(random() * list.length)];
  const now = Date.now();
  const day = 864e5;
  const daysAgo = (d: number, jitterHours = 0) =>
    new Date(now - d * day - Math.floor(random() * jitterHours) * 36e5);
  const password = bcrypt.hashSync(DEMO_PASSWORD, 8);

  // ---------------------------------------------------------------- people
  const users: Prisma.UserCreateManyInput[] = [];
  users.push({
    id: "user-admin",
    email: "admin@learnhub.demo",
    name: "Mona Fathy",
    role: "ADMIN",
    password,
    emailVerified: daysAgo(200),
    createdAt: daysAgo(200),
    bio: "Runs the LearnHub catalogue and keeps the platform tidy.",
  });
  for (const [key, ins] of Object.entries(INSTRUCTORS)) {
    users.push({
      id: `user-${key}`,
      email: ins.email,
      name: ins.name,
      role: "INSTRUCTOR",
      password,
      bio: ins.bio,
      emailVerified: daysAgo(180),
      createdAt: daysAgo(180),
    });
  }
  users.push({
    id: "user-nour",
    email: "student@learnhub.demo",
    name: "Nour Hassan",
    role: "STUDENT",
    password,
    bio: "Computer science student in Cairo, learning web development and machine learning.",
    emailVerified: daysAgo(70),
    createdAt: daysAgo(70),
  });
  STUDENTS.forEach((name, i) => {
    users.push({
      id: `user-s${i + 1}`,
      email: `${slugify(name)}@learnhub.demo`,
      name,
      role: "STUDENT",
      password,
      emailVerified: daysAgo(30 + i * 3),
      createdAt: daysAgo(30 + i * 3),
    });
  });
  await db.user.createMany({ data: users });

  // ---------------------------------------------------------------- catalogue
  const lessonsByCourse = new Map<
    string,
    { id: string; seconds: number; quizId?: string }[]
  >();
  const quizzes = new Map<
    string,
    { passingScore: number; questions: { id: string; q: DemoQuestion }[] }
  >();

  for (const [ci, course] of COURSES.entries()) {
    const created = daysAgo(150 - ci * 9);
    await db.course.create({
      data: {
        id: course.slug,
        title: course.title,
        shortDescription: course.shortDescription,
        description: course.description,
        category: course.category,
        level: course.level,
        status: course.status ?? "PUBLISHED",
        price: 0,
        instructorId: `user-${course.instructor}`,
        createdAt: created,
        updatedAt: created,
      },
    });

    const lessons: { id: string; seconds: number; quizId?: string }[] = [];
    for (const [li, lesson] of course.lessons.entries()) {
      const lessonId = `${course.slug}-${li + 1}`;
      await db.lesson.create({
        data: {
          id: lessonId,
          courseId: course.slug,
          title: lesson.title,
          description: `${lesson.summary}\n\nLecture: “${lesson.videoTitle}” by ${lesson.channel}, on YouTube.`,
          videoUrl: `https://www.youtube.com/watch?v=${lesson.youtubeId}`,
          duration: lesson.seconds,
          order: li + 1,
          isFree: !!lesson.free,
          createdAt: created,
        },
      });

      let quizId: string | undefined;
      if (lesson.quiz) {
        quizId = `quiz-${lessonId}`;
        const passingScore = lesson.quiz.passingScore ?? 70;
        await db.quiz.create({
          data: {
            id: quizId,
            lessonId,
            title: lesson.quiz.title,
            description: `Check what you took away from “${lesson.title}”. You need ${passingScore}% to pass, and you can retake it.`,
            passingScore,
            timeLimit: lesson.quiz.questions.length * 2,
            createdAt: created,
            questions: {
              create: lesson.quiz.questions.map((q, qi) => ({
                id: `${quizId}-q${qi + 1}`,
                text: q.text,
                type: q.type,
                options: optionsOf(q),
                correctAnswer: answerOf(q),
                order: qi + 1,
                points: 1,
              })),
            },
          },
        });
        quizzes.set(quizId, {
          passingScore,
          questions: lesson.quiz.questions.map((q, qi) => ({
            id: `${quizId}-q${qi + 1}`,
            q,
          })),
        });
      }
      lessons.push({ id: lessonId, seconds: lesson.seconds, quizId });
    }
    lessonsByCourse.set(course.slug, lessons);
  }

  // ---------------------------------------------------------------- activity
  const enrollments: {
    id: string;
    userId: string;
    courseId: string;
    enrolledAt: Date;
    progress: number;
    completedAt: Date | null;
  }[] = [];
  const progress: {
    id: string;
    userId: string;
    lessonId: string;
    watchTime: number;
    completed: boolean;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }[] = [];
  const attempts: {
    id: string;
    quizId: string;
    userId: string;
    score: number;
    passed: boolean;
    answers: object;
    completedAt: Date;
    createdAt: Date;
  }[] = [];
  const reviews: {
    id: string;
    userId: string;
    courseId: string;
    rating: number;
    comment: string;
    createdAt: Date;
    updatedAt: Date;
  }[] = [];
  const certificates: {
    id: string;
    certificateNumber: string;
    userId: string;
    courseId: string;
    issuedAt: Date;
    createdAt: Date;
  }[] = [];
  let certCounter = 0;

  const attempt = (
    userId: string,
    quizId: string,
    when: Date,
    accuracy: number,
  ) => {
    const quiz = quizzes.get(quizId)!;
    const graded: Record<string, unknown> = {};
    let earned = 0;
    for (const { id, q } of quiz.questions) {
      const right = random() < accuracy;
      const wrongs = optionsOf(q).filter((o) =>
        Array.isArray(q.answer) ? !q.answer.includes(o) : o !== q.answer,
      );
      const userAnswer = right
        ? q.answer
        : q.type === "MULTIPLE_SELECT"
          ? [pick(wrongs)]
          : pick(wrongs);
      if (right) earned += 1;
      graded[id] = {
        userAnswer,
        correctAnswer: q.answer,
        isCorrect: right,
        points: right ? 1 : 0,
      };
    }
    const score = Math.round((earned / quiz.questions.length) * 10000) / 100;
    attempts.push({
      id: `attempt-${attempts.length + 1}`,
      quizId,
      userId,
      score,
      passed: score >= quiz.passingScore,
      answers: graded,
      completedAt: when,
      createdAt: when,
    });
    return score >= quiz.passingScore;
  };

  /** Enrols a student and works through `done` lessons, plus part of the next one. */
  const study = (
    userId: string,
    slug: string,
    enrolledDaysAgo: number,
    done: number,
    accuracy: number,
  ) => {
    const lessons = lessonsByCourse.get(slug)!;
    const enrolledAt = daysAgo(enrolledDaysAgo, 10);
    const span = Math.max(1, enrolledDaysAgo - 1);
    lessons.forEach((lesson, i) => {
      if (i < done) {
        const when = new Date(
          enrolledAt.getTime() + ((i + 1) / (done + 1)) * span * day,
        );
        progress.push({
          id: `p-${userId}-${lesson.id}`,
          userId,
          lessonId: lesson.id,
          watchTime: lesson.seconds,
          completed: true,
          completedAt: when,
          createdAt: when,
          updatedAt: when,
        });
        if (lesson.quizId) {
          // Some students needed a second try.
          if (!attempt(userId, lesson.quizId, when, accuracy))
            attempt(
              userId,
              lesson.quizId,
              new Date(when.getTime() + 36e5),
              Math.min(1, accuracy + 0.25),
            );
        }
      } else if (i === done && done > 0) {
        const when = daysAgo(1, 20);
        progress.push({
          id: `p-${userId}-${lesson.id}`,
          userId,
          lessonId: lesson.id,
          watchTime: Math.floor(lesson.seconds * (0.15 + random() * 0.5)),
          completed: false,
          completedAt: null,
          createdAt: when,
          updatedAt: when,
        });
      }
    });
    const pct = Math.round((done / lessons.length) * 100);
    const completedAt =
      done === lessons.length
        ? new Date(enrolledAt.getTime() + span * day)
        : null;
    enrollments.push({
      id: `e-${userId}-${slug}`,
      userId,
      courseId: slug,
      enrolledAt,
      progress: pct,
      completedAt,
    });
    if (completedAt) {
      certCounter += 1;
      certificates.push({
        id: `cert-${userId}-${slug}`,
        certificateNumber: `CERT-${completedAt.getFullYear()}-${(0x4c48a000 + certCounter * 7919).toString(16).toUpperCase()}`,
        userId,
        courseId: slug,
        issuedAt: completedAt,
        createdAt: completedAt,
      });
    }
    return pct;
  };

  const review = (
    userId: string,
    slug: string,
    rating: number,
    when: Date,
    comment?: string,
  ) => {
    reviews.push({
      id: `r-${userId}-${slug}`,
      userId,
      courseId: slug,
      rating,
      comment: comment ?? pick(REVIEWS[rating]),
      createdAt: when,
      updatedAt: when,
    });
  };

  // Nour, the demo student: one course finished, two in progress, one just started.
  study("user-nour", "web-from-scratch", 58, 5, 0.95);
  review(
    "user-nour",
    "web-from-scratch",
    5,
    daysAgo(12),
    COURSE_REVIEWS["web-from-scratch"],
  );
  study("user-nour", "python-from-zero", 30, 2, 0.85);
  study("user-nour", "neural-networks-visually", 16, 3, 0.9);
  study("user-nour", "databases-sql", 2, 0, 0.8);

  const published = COURSES.filter((c) => c.status !== "DRAFT");
  STUDENTS.forEach((_, si) => {
    const userId = `user-s${si + 1}`;
    const count = 2 + Math.floor(random() * 4);
    const chosen = [...published].sort(() => random() - 0.5).slice(0, count);
    for (const course of chosen) {
      const total = course.lessons.length;
      const roll = random();
      const done =
        roll < 0.3 ? total : roll < 0.85 ? Math.floor(random() * total) : 0;
      const accuracy = 0.6 + random() * 0.4;
      const pct = study(
        userId,
        course.slug,
        5 + Math.floor(random() * 80),
        done,
        accuracy,
      );
      if (pct >= 50 && random() < 0.65) {
        const r = random();
        const rating = r < 0.55 ? 5 : r < 0.88 ? 4 : 3;
        const specific =
          rating === 5 &&
          random() < 0.35 &&
          !reviews.some(
            (x) =>
              x.courseId === course.slug &&
              x.comment === COURSE_REVIEWS[course.slug],
          );
        review(
          userId,
          course.slug,
          rating,
          daysAgo(Math.floor(random() * 20), 12),
          specific ? COURSE_REVIEWS[course.slug] : undefined,
        );
      }
    }
  });

  await db.enrollment.createMany({ data: enrollments });
  await db.progress.createMany({ data: progress });
  await db.quizAttempt.createMany({ data: attempts });
  await db.review.createMany({ data: reviews });
  await db.certificate.createMany({ data: certificates });
}
