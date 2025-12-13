# Database Design Document
## LearnHub - E-Learning Platform

**Document Version:** 1.0  
**Date:** December 13, 2025  
**Project:** E-Learning Platform (Mini LMS)

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Entity-Relationship Diagram (ERD)](#2-entity-relationship-diagram-erd)
3. [Relational Schema](#3-relational-schema)
4. [Table Definitions](#4-table-definitions)
5. [Relationships](#5-relationships)
6. [Indexes](#6-indexes)
7. [Sample Queries](#7-sample-queries)

---

## 1. Introduction

### 1.1 Purpose
This document describes the database design for the LearnHub E-Learning Platform. It includes the Entity-Relationship Diagram (ERD), relational schema, table definitions, and sample SQL queries.

### 1.2 Database Management System
- **DBMS:** PostgreSQL 15+
- **ORM:** Prisma 5.x
- **Connection:** Connection pooling via Prisma

### 1.3 Design Principles
- Normalization to 3NF (Third Normal Form)
- Referential integrity through foreign keys
- Soft deletes where appropriate
- Timestamps for auditing
- UUID primary keys for security

---

## 2. Entity-Relationship Diagram (ERD)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      USER       │       │     COURSE      │       │     LESSON      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ PK id           │       │ PK id           │       │ PK id           │
│    email        │       │    title        │       │    title        │
│    password     │       │    description  │       │    description  │
│    name         │       │    thumbnail    │       │    videoUrl     │
│    role         │◄──────│ FK instructorId │       │    duration     │
│    avatar       │   1:N │    category     │◄──────│ FK courseId     │
│    bio          │       │    level        │   1:N │    order        │
│    createdAt    │       │    status       │       │    isFree       │
│    updatedAt    │       │    createdAt    │       │    createdAt    │
└────────┬────────┘       │    updatedAt    │       └────────┬────────┘
         │                └────────┬────────┘                │
         │                         │                         │
         │    ┌────────────────────┼─────────────────┐      │
         │    │                    │                 │      │
         ▼    ▼                    ▼                 ▼      ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   ENROLLMENT    │       │     REVIEW      │       │    PROGRESS     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ PK id           │       │ PK id           │       │ PK id           │
│ FK userId       │       │ FK userId       │       │ FK userId       │
│ FK courseId     │       │ FK courseId     │       │ FK lessonId     │
│    enrolledAt   │       │    rating       │       │    watchTime    │
│    completedAt  │       │    comment      │       │    completed    │
│    progress     │       │    createdAt    │       │    completedAt  │
└─────────────────┘       │    updatedAt    │       │    createdAt    │
                          └─────────────────┘       │    updatedAt    │
                                                    └─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      QUIZ       │       │    QUESTION     │       │  QUIZ_ATTEMPT   │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ PK id           │       │ PK id           │       │ PK id           │
│ FK lessonId     │◄──────│ FK quizId       │       │ FK quizId       │
│    title        │   1:N │    text         │       │ FK userId       │
│    description  │       │    type         │       │    score        │
│    passingScore │       │    options      │       │    answers      │
│    createdAt    │       │    correctAns   │       │    completedAt  │
└─────────────────┘       │    order        │       │    createdAt    │
                          │    points       │       └─────────────────┘
                          └─────────────────┘

┌─────────────────┐
│   CERTIFICATE   │
├─────────────────┤
│ PK id           │
│ FK userId       │
│ FK courseId     │
│    certificateNo│
│    issuedAt     │
│    createdAt    │
└─────────────────┘
```

---

## 3. Relational Schema

### 3.1 Schema Notation
```
TableName (
    PK: PrimaryKey,
    FK: ForeignKey -> ReferencedTable,
    attribute1: DataType [constraints],
    attribute2: DataType [constraints],
    ...
)
```

### 3.2 Complete Relational Schema

```
User (
    PK: id: UUID,
    email: VARCHAR(255) [UNIQUE, NOT NULL],
    password: VARCHAR(255) [NOT NULL],
    name: VARCHAR(255) [NOT NULL],
    role: ENUM('STUDENT', 'INSTRUCTOR', 'ADMIN') [NOT NULL, DEFAULT 'STUDENT'],
    avatar: VARCHAR(500) [NULL],
    bio: TEXT [NULL],
    createdAt: TIMESTAMP [NOT NULL, DEFAULT NOW()],
    updatedAt: TIMESTAMP [NOT NULL]
)

Course (
    PK: id: UUID,
    FK: instructorId: UUID -> User(id) [NOT NULL],
    title: VARCHAR(255) [NOT NULL],
    description: TEXT [NULL],
    shortDescription: VARCHAR(500) [NULL],
    thumbnail: VARCHAR(500) [NULL],
    category: VARCHAR(100) [NULL],
    level: ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') [DEFAULT 'BEGINNER'],
    status: ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') [DEFAULT 'DRAFT'],
    createdAt: TIMESTAMP [NOT NULL, DEFAULT NOW()],
    updatedAt: TIMESTAMP [NOT NULL]
)

Lesson (
    PK: id: UUID,
    FK: courseId: UUID -> Course(id) [NOT NULL, ON DELETE CASCADE],
    title: VARCHAR(255) [NOT NULL],
    description: TEXT [NULL],
    videoUrl: VARCHAR(500) [NOT NULL],
    duration: INTEGER [NOT NULL, DEFAULT 0],
    order: INTEGER [NOT NULL],
    isFree: BOOLEAN [DEFAULT FALSE],
    createdAt: TIMESTAMP [NOT NULL, DEFAULT NOW()],
    updatedAt: TIMESTAMP [NOT NULL]
)

Enrollment (
    PK: id: UUID,
    FK: userId: UUID -> User(id) [NOT NULL, ON DELETE CASCADE],
    FK: courseId: UUID -> Course(id) [NOT NULL, ON DELETE CASCADE],
    enrolledAt: TIMESTAMP [NOT NULL, DEFAULT NOW()],
    completedAt: TIMESTAMP [NULL],
    progress: DECIMAL(5,2) [DEFAULT 0],
    UNIQUE(userId, courseId)
)

Progress (
    PK: id: UUID,
    FK: userId: UUID -> User(id) [NOT NULL, ON DELETE CASCADE],
    FK: lessonId: UUID -> Lesson(id) [NOT NULL, ON DELETE CASCADE],
    watchTime: INTEGER [DEFAULT 0],
    completed: BOOLEAN [DEFAULT FALSE],
    completedAt: TIMESTAMP [NULL],
    createdAt: TIMESTAMP [NOT NULL, DEFAULT NOW()],
    updatedAt: TIMESTAMP [NOT NULL],
    UNIQUE(userId, lessonId)
)

Quiz (
    PK: id: UUID,
    FK: lessonId: UUID -> Lesson(id) [NOT NULL, ON DELETE CASCADE],
    title: VARCHAR(255) [NOT NULL],
    description: TEXT [NULL],
    passingScore: INTEGER [DEFAULT 70],
    timeLimit: INTEGER [NULL],
    createdAt: TIMESTAMP [NOT NULL, DEFAULT NOW()],
    updatedAt: TIMESTAMP [NOT NULL]
)

Question (
    PK: id: UUID,
    FK: quizId: UUID -> Quiz(id) [NOT NULL, ON DELETE CASCADE],
    text: TEXT [NOT NULL],
    type: ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE', 'MULTIPLE_SELECT') [DEFAULT 'MULTIPLE_CHOICE'],
    options: JSON [NOT NULL],
    correctAnswer: JSON [NOT NULL],
    order: INTEGER [NOT NULL],
    points: INTEGER [DEFAULT 1],
    createdAt: TIMESTAMP [NOT NULL, DEFAULT NOW()]
)

QuizAttempt (
    PK: id: UUID,
    FK: quizId: UUID -> Quiz(id) [NOT NULL, ON DELETE CASCADE],
    FK: userId: UUID -> User(id) [NOT NULL, ON DELETE CASCADE],
    score: DECIMAL(5,2) [NOT NULL],
    passed: BOOLEAN [NOT NULL],
    answers: JSON [NOT NULL],
    completedAt: TIMESTAMP [NOT NULL],
    createdAt: TIMESTAMP [NOT NULL, DEFAULT NOW()]
)

Review (
    PK: id: UUID,
    FK: userId: UUID -> User(id) [NOT NULL, ON DELETE CASCADE],
    FK: courseId: UUID -> Course(id) [NOT NULL, ON DELETE CASCADE],
    rating: INTEGER [NOT NULL, CHECK (rating >= 1 AND rating <= 5)],
    comment: TEXT [NULL],
    createdAt: TIMESTAMP [NOT NULL, DEFAULT NOW()],
    updatedAt: TIMESTAMP [NOT NULL],
    UNIQUE(userId, courseId)
)

Certificate (
    PK: id: UUID,
    FK: userId: UUID -> User(id) [NOT NULL, ON DELETE CASCADE],
    FK: courseId: UUID -> Course(id) [NOT NULL, ON DELETE CASCADE],
    certificateNumber: VARCHAR(100) [UNIQUE, NOT NULL],
    issuedAt: TIMESTAMP [NOT NULL, DEFAULT NOW()],
    createdAt: TIMESTAMP [NOT NULL, DEFAULT NOW()],
    UNIQUE(userId, courseId)
)
```

---

## 4. Table Definitions

### 4.1 User Table
Stores all user accounts including students, instructors, and administrators.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| password | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| name | VARCHAR(255) | NOT NULL | Full name |
| role | ENUM | NOT NULL | STUDENT, INSTRUCTOR, ADMIN |
| avatar | VARCHAR(500) | NULL | Profile image URL |
| bio | TEXT | NULL | User biography |
| createdAt | TIMESTAMP | NOT NULL | Account creation time |
| updatedAt | TIMESTAMP | NOT NULL | Last modification time |

### 4.2 Course Table
Stores course information created by instructors.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| instructorId | UUID | FK, NOT NULL | Reference to instructor |
| title | VARCHAR(255) | NOT NULL | Course title |
| description | TEXT | NULL | Full description (Markdown) |
| shortDescription | VARCHAR(500) | NULL | Brief description |
| thumbnail | VARCHAR(500) | NULL | Cover image URL |
| category | VARCHAR(100) | NULL | Course category |
| level | ENUM | DEFAULT BEGINNER | Difficulty level |
| status | ENUM | DEFAULT DRAFT | Publication status |
| createdAt | TIMESTAMP | NOT NULL | Creation time |
| updatedAt | TIMESTAMP | NOT NULL | Last modification |

### 4.3 Lesson Table
Stores individual lessons within courses.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| courseId | UUID | FK, NOT NULL | Parent course reference |
| title | VARCHAR(255) | NOT NULL | Lesson title |
| description | TEXT | NULL | Lesson description |
| videoUrl | VARCHAR(500) | NOT NULL | Video file path/URL |
| duration | INTEGER | NOT NULL | Duration in seconds |
| order | INTEGER | NOT NULL | Sequence in course |
| isFree | BOOLEAN | DEFAULT FALSE | Preview availability |
| createdAt | TIMESTAMP | NOT NULL | Creation time |
| updatedAt | TIMESTAMP | NOT NULL | Last modification |

### 4.4 Enrollment Table
Tracks student enrollments in courses.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| userId | UUID | FK, NOT NULL | Student reference |
| courseId | UUID | FK, NOT NULL | Course reference |
| enrolledAt | TIMESTAMP | NOT NULL | Enrollment time |
| completedAt | TIMESTAMP | NULL | Completion time |
| progress | DECIMAL(5,2) | DEFAULT 0 | Progress percentage |

### 4.5 Progress Table
Tracks lesson-level progress for each student.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| userId | UUID | FK, NOT NULL | Student reference |
| lessonId | UUID | FK, NOT NULL | Lesson reference |
| watchTime | INTEGER | DEFAULT 0 | Seconds watched |
| completed | BOOLEAN | DEFAULT FALSE | Completion status |
| completedAt | TIMESTAMP | NULL | Completion time |
| createdAt | TIMESTAMP | NOT NULL | Record creation |
| updatedAt | TIMESTAMP | NOT NULL | Last update |

### 4.6 Quiz Table
Stores quiz metadata for lessons.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| lessonId | UUID | FK, NOT NULL | Associated lesson |
| title | VARCHAR(255) | NOT NULL | Quiz title |
| description | TEXT | NULL | Quiz description |
| passingScore | INTEGER | DEFAULT 70 | Minimum passing % |
| timeLimit | INTEGER | NULL | Time limit in minutes |
| createdAt | TIMESTAMP | NOT NULL | Creation time |
| updatedAt | TIMESTAMP | NOT NULL | Last modification |

### 4.7 Question Table
Stores individual quiz questions.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| quizId | UUID | FK, NOT NULL | Parent quiz reference |
| text | TEXT | NOT NULL | Question text |
| type | ENUM | DEFAULT MULTIPLE_CHOICE | Question type |
| options | JSON | NOT NULL | Answer options array |
| correctAnswer | JSON | NOT NULL | Correct answer(s) |
| order | INTEGER | NOT NULL | Display order |
| points | INTEGER | DEFAULT 1 | Point value |
| createdAt | TIMESTAMP | NOT NULL | Creation time |

### 4.8 QuizAttempt Table
Records student quiz attempts and scores.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| quizId | UUID | FK, NOT NULL | Quiz reference |
| userId | UUID | FK, NOT NULL | Student reference |
| score | DECIMAL(5,2) | NOT NULL | Score percentage |
| passed | BOOLEAN | NOT NULL | Pass/fail status |
| answers | JSON | NOT NULL | Student's answers |
| completedAt | TIMESTAMP | NOT NULL | Submission time |
| createdAt | TIMESTAMP | NOT NULL | Attempt start time |

### 4.9 Review Table
Stores course reviews and ratings.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| userId | UUID | FK, NOT NULL | Reviewer reference |
| courseId | UUID | FK, NOT NULL | Course reference |
| rating | INTEGER | CHECK 1-5 | Star rating |
| comment | TEXT | NULL | Review text |
| createdAt | TIMESTAMP | NOT NULL | Creation time |
| updatedAt | TIMESTAMP | NOT NULL | Last modification |

### 4.10 Certificate Table
Stores completion certificates.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| userId | UUID | FK, NOT NULL | Student reference |
| courseId | UUID | FK, NOT NULL | Course reference |
| certificateNumber | VARCHAR(100) | UNIQUE | Certificate ID |
| issuedAt | TIMESTAMP | NOT NULL | Issue date |
| createdAt | TIMESTAMP | NOT NULL | Record creation |

---

## 5. Relationships

### 5.1 Relationship Summary

| Relationship | Type | Description |
|--------------|------|-------------|
| User → Course | 1:N | One instructor creates many courses |
| Course → Lesson | 1:N | One course has many lessons |
| User ↔ Course (Enrollment) | M:N | Students enroll in courses |
| User ↔ Lesson (Progress) | M:N | Students track progress per lesson |
| Lesson → Quiz | 1:1 | One lesson can have one quiz |
| Quiz → Question | 1:N | One quiz has many questions |
| User ↔ Quiz (Attempt) | M:N | Students attempt quizzes |
| User ↔ Course (Review) | M:N | Students review courses |
| User ↔ Course (Certificate) | M:N | Students earn certificates |

### 5.2 Cardinality Details

```
User (1) ────────────────── (N) Course
     │                           │
     │ enrolls (M:N)             │ contains
     │                           │
     ▼                           ▼
Enrollment                   Lesson (N)
     │                           │
     │                           │ has (1:1)
     │                           │
     │                           ▼
Progress (M:N)               Quiz (1)
     ▲                           │
     │                           │ contains
     │                           │
User ◄───────────────────────────┘
                                 │
                                 ▼
                            Question (N)
```

---

## 6. Indexes

### 6.1 Primary Indexes
All tables have primary key indexes on their `id` columns.

### 6.2 Foreign Key Indexes
```sql
-- Course
CREATE INDEX idx_course_instructor ON Course(instructorId);

-- Lesson
CREATE INDEX idx_lesson_course ON Lesson(courseId);
CREATE INDEX idx_lesson_order ON Lesson(courseId, order);

-- Enrollment
CREATE INDEX idx_enrollment_user ON Enrollment(userId);
CREATE INDEX idx_enrollment_course ON Enrollment(courseId);

-- Progress
CREATE INDEX idx_progress_user ON Progress(userId);
CREATE INDEX idx_progress_lesson ON Progress(lessonId);

-- Quiz
CREATE INDEX idx_quiz_lesson ON Quiz(lessonId);

-- Question
CREATE INDEX idx_question_quiz ON Question(quizId);

-- QuizAttempt
CREATE INDEX idx_attempt_quiz ON QuizAttempt(quizId);
CREATE INDEX idx_attempt_user ON QuizAttempt(userId);

-- Review
CREATE INDEX idx_review_course ON Review(courseId);

-- Certificate
CREATE INDEX idx_certificate_user ON Certificate(userId);
```

### 6.3 Search Indexes
```sql
-- Full-text search on courses
CREATE INDEX idx_course_title_search ON Course USING gin(to_tsvector('english', title));
CREATE INDEX idx_course_description_search ON Course USING gin(to_tsvector('english', description));

-- Category filtering
CREATE INDEX idx_course_category ON Course(category);
CREATE INDEX idx_course_status ON Course(status);
CREATE INDEX idx_course_level ON Course(level);
```

---

## 7. Sample Queries

### 7.1 User Queries

```sql
-- Create new user
INSERT INTO "User" (id, email, password, name, role)
VALUES (gen_random_uuid(), 'student@example.com', '$2b$10$hash', 'John Doe', 'STUDENT');

-- Get user by email
SELECT * FROM "User" WHERE email = 'student@example.com';

-- Update user profile
UPDATE "User" 
SET name = 'John Smith', bio = 'Software Developer', updatedAt = NOW()
WHERE id = 'user-uuid';
```

### 7.2 Course Queries

```sql
-- Create course
INSERT INTO "Course" (id, instructorId, title, description, category, level, status)
VALUES (gen_random_uuid(), 'instructor-uuid', 'Web Development', 'Learn web dev', 'Technology', 'BEGINNER', 'DRAFT');

-- Get published courses with instructor
SELECT c.*, u.name as instructorName, u.avatar as instructorAvatar
FROM "Course" c
JOIN "User" u ON c.instructorId = u.id
WHERE c.status = 'PUBLISHED'
ORDER BY c.createdAt DESC;

-- Get course with lesson count
SELECT c.*, COUNT(l.id) as lessonCount, SUM(l.duration) as totalDuration
FROM "Course" c
LEFT JOIN "Lesson" l ON l.courseId = c.id
WHERE c.id = 'course-uuid'
GROUP BY c.id;

-- Search courses
SELECT * FROM "Course"
WHERE status = 'PUBLISHED'
  AND (title ILIKE '%search%' OR description ILIKE '%search%')
ORDER BY createdAt DESC;
```

### 7.3 Enrollment Queries

```sql
-- Enroll student
INSERT INTO "Enrollment" (id, userId, courseId)
VALUES (gen_random_uuid(), 'user-uuid', 'course-uuid');

-- Get enrolled courses for user with progress
SELECT c.*, e.enrolledAt, e.progress, e.completedAt
FROM "Enrollment" e
JOIN "Course" c ON e.courseId = c.id
WHERE e.userId = 'user-uuid'
ORDER BY e.enrolledAt DESC;

-- Check if user is enrolled
SELECT EXISTS(
  SELECT 1 FROM "Enrollment" 
  WHERE userId = 'user-uuid' AND courseId = 'course-uuid'
) as isEnrolled;

-- Get course enrollment count
SELECT COUNT(*) as studentCount
FROM "Enrollment"
WHERE courseId = 'course-uuid';
```

### 7.4 Progress Queries

```sql
-- Update lesson progress
INSERT INTO "Progress" (id, userId, lessonId, watchTime, completed)
VALUES (gen_random_uuid(), 'user-uuid', 'lesson-uuid', 120, false)
ON CONFLICT (userId, lessonId)
DO UPDATE SET watchTime = 120, updatedAt = NOW();

-- Mark lesson complete
UPDATE "Progress"
SET completed = true, completedAt = NOW(), updatedAt = NOW()
WHERE userId = 'user-uuid' AND lessonId = 'lesson-uuid';

-- Calculate course progress
SELECT 
  (COUNT(CASE WHEN p.completed THEN 1 END)::float / COUNT(l.id) * 100) as progress
FROM "Lesson" l
LEFT JOIN "Progress" p ON l.id = p.lessonId AND p.userId = 'user-uuid'
WHERE l.courseId = 'course-uuid';

-- Get lessons with progress for user
SELECT l.*, p.watchTime, p.completed, p.completedAt
FROM "Lesson" l
LEFT JOIN "Progress" p ON l.id = p.lessonId AND p.userId = 'user-uuid'
WHERE l.courseId = 'course-uuid'
ORDER BY l.order;
```

### 7.5 Quiz Queries

```sql
-- Create quiz with questions
INSERT INTO "Quiz" (id, lessonId, title, passingScore)
VALUES (gen_random_uuid(), 'lesson-uuid', 'Lesson 1 Quiz', 70);

INSERT INTO "Question" (id, quizId, text, type, options, correctAnswer, "order", points)
VALUES 
  (gen_random_uuid(), 'quiz-uuid', 'What is HTML?', 'MULTIPLE_CHOICE', 
   '["Markup Language", "Programming Language", "Database", "Server"]', 
   '["Markup Language"]', 1, 1);

-- Submit quiz attempt
INSERT INTO "QuizAttempt" (id, quizId, userId, score, passed, answers, completedAt)
VALUES (gen_random_uuid(), 'quiz-uuid', 'user-uuid', 85.0, true, 
        '{"q1": "Markup Language", "q2": true}', NOW());

-- Get best quiz score for user
SELECT MAX(score) as bestScore
FROM "QuizAttempt"
WHERE quizId = 'quiz-uuid' AND userId = 'user-uuid';
```

### 7.6 Review Queries

```sql
-- Submit review
INSERT INTO "Review" (id, userId, courseId, rating, comment)
VALUES (gen_random_uuid(), 'user-uuid', 'course-uuid', 5, 'Great course!')
ON CONFLICT (userId, courseId)
DO UPDATE SET rating = 5, comment = 'Great course!', updatedAt = NOW();

-- Get course average rating
SELECT AVG(rating) as avgRating, COUNT(*) as reviewCount
FROM "Review"
WHERE courseId = 'course-uuid';

-- Get reviews for course
SELECT r.*, u.name as userName, u.avatar as userAvatar
FROM "Review" r
JOIN "User" u ON r.userId = u.id
WHERE r.courseId = 'course-uuid'
ORDER BY r.createdAt DESC;
```

### 7.7 Certificate Queries

```sql
-- Issue certificate
INSERT INTO "Certificate" (id, userId, courseId, certificateNumber, issuedAt)
VALUES (gen_random_uuid(), 'user-uuid', 'course-uuid', 'CERT-2024-001', NOW());

-- Get user certificates
SELECT cert.*, c.title as courseTitle, c.thumbnail
FROM "Certificate" cert
JOIN "Course" c ON cert.courseId = c.id
WHERE cert.userId = 'user-uuid'
ORDER BY cert.issuedAt DESC;

-- Verify certificate
SELECT cert.*, u.name as studentName, c.title as courseTitle
FROM "Certificate" cert
JOIN "User" u ON cert.userId = u.id
JOIN "Course" c ON cert.courseId = c.id
WHERE cert.certificateNumber = 'CERT-2024-001';
```

### 7.8 Analytics Queries

```sql
-- Instructor dashboard stats
SELECT 
  COUNT(DISTINCT c.id) as totalCourses,
  COUNT(DISTINCT e.id) as totalEnrollments,
  AVG(r.rating) as avgRating
FROM "Course" c
LEFT JOIN "Enrollment" e ON c.id = e.courseId
LEFT JOIN "Review" r ON c.id = r.courseId
WHERE c.instructorId = 'instructor-uuid';

-- Platform statistics (Admin)
SELECT
  (SELECT COUNT(*) FROM "User" WHERE role = 'STUDENT') as totalStudents,
  (SELECT COUNT(*) FROM "User" WHERE role = 'INSTRUCTOR') as totalInstructors,
  (SELECT COUNT(*) FROM "Course" WHERE status = 'PUBLISHED') as publishedCourses,
  (SELECT COUNT(*) FROM "Enrollment") as totalEnrollments;

-- Popular courses
SELECT c.*, COUNT(e.id) as enrollmentCount, AVG(r.rating) as avgRating
FROM "Course" c
LEFT JOIN "Enrollment" e ON c.id = e.courseId
LEFT JOIN "Review" r ON c.id = r.courseId
WHERE c.status = 'PUBLISHED'
GROUP BY c.id
ORDER BY enrollmentCount DESC
LIMIT 10;
```

---

## 8. Data Integrity Rules

### 8.1 Business Rules

1. **User Uniqueness:** Email must be unique across all users
2. **Enrollment Uniqueness:** A user can only enroll once per course
3. **Progress Uniqueness:** One progress record per user per lesson
4. **Review Uniqueness:** One review per user per course
5. **Certificate Uniqueness:** One certificate per user per course

### 8.2 Cascading Rules

| Parent | Child | On Delete |
|--------|-------|-----------|
| User | Course | RESTRICT (instructors can't be deleted with courses) |
| User | Enrollment | CASCADE |
| User | Progress | CASCADE |
| User | QuizAttempt | CASCADE |
| User | Review | CASCADE |
| User | Certificate | CASCADE |
| Course | Lesson | CASCADE |
| Course | Enrollment | CASCADE |
| Course | Review | CASCADE |
| Course | Certificate | CASCADE |
| Lesson | Progress | CASCADE |
| Lesson | Quiz | CASCADE |
| Quiz | Question | CASCADE |
| Quiz | QuizAttempt | CASCADE |

---

**Document Status:** Complete  
**Last Updated:** December 13, 2025
