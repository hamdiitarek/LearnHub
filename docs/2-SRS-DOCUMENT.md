# Software Requirements Specification (SRS)
## LearnHub - E-Learning Platform

**Document Version:** 1.0  
**Date:** December 13, 2025  
**Project:** E-Learning Platform (Mini LMS)

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [Specific Requirements](#3-specific-requirements)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Use Cases](#6-use-cases)
7. [External Interface Requirements](#7-external-interface-requirements)
8. [System Features](#8-system-features)
9. [Data Requirements](#9-data-requirements)
10. [Appendices](#10-appendices)

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) document provides a comprehensive description of the LearnHub E-Learning Platform. It details the functional and non-functional requirements, use cases, and constraints for the system. This document serves as a contract between the development team and stakeholders.

### 1.2 Scope
LearnHub is a web-based Learning Management System (LMS) that facilitates online education by connecting instructors with students. The system enables:

- Course creation and management by instructors
- Course enrollment and learning by students
- Video-based content delivery
- Interactive quizzes and assessments
- Progress tracking and certification
- Administrative oversight and management

**Out of Scope:**
- Mobile native applications
- Live video streaming/webinars
- Payment processing (future enhancement)
- Third-party integrations

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|------------|
| LMS | Learning Management System |
| SRS | Software Requirements Specification |
| API | Application Programming Interface |
| CRUD | Create, Read, Update, Delete |
| UI | User Interface |
| UX | User Experience |
| JWT | JSON Web Token |
| ORM | Object-Relational Mapping |
| RBAC | Role-Based Access Control |

### 1.4 References
- IEEE Std 830-1998 - IEEE Recommended Practice for Software Requirements Specifications
- Next.js Documentation - https://nextjs.org/docs
- Prisma Documentation - https://www.prisma.io/docs
- NextAuth.js Documentation - https://next-auth.js.org

### 1.5 Overview
The remainder of this document is organized as follows:
- Section 2 provides an overall description of the product
- Section 3 details specific requirements
- Section 4 describes functional requirements
- Section 5 covers non-functional requirements
- Section 6 presents use cases
- Section 7 describes external interfaces
- Section 8 details system features
- Section 9 covers data requirements

---

## 2. Overall Description

### 2.1 Product Perspective
LearnHub is a standalone web application that serves as a complete e-learning solution. The system consists of:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Next.js Frontend (React 19)                 │   │
│  │  - Student Dashboard    - Instructor Dashboard          │   │
│  │  - Course Browser       - Admin Panel                   │   │
│  │  - Video Player         - Quiz Interface                │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION SERVER                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Next.js API Routes (Backend)                │   │
│  │  - Authentication API   - Course API                    │   │
│  │  - User API             - Quiz API                      │   │
│  │  - Progress API         - Admin API                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Prisma ORM                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                            │
│  ┌───────────────────┐    ┌────────────────────────────────┐   │
│  │    PostgreSQL     │    │      File Storage              │   │
│  │  - Users          │    │  - Video files                 │   │
│  │  - Courses        │    │  - Thumbnails                  │   │
│  │  - Lessons        │    │  - Attachments                 │   │
│  │  - Quizzes        │    │                                │   │
│  │  - Progress       │    │                                │   │
│  └───────────────────┘    └────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Product Functions
The major functions of LearnHub include:

1. **User Management**
   - User registration and authentication
   - Profile management
   - Role-based access control

2. **Course Management**
   - Course creation and editing
   - Lesson and video management
   - Course publishing and visibility

3. **Learning Management**
   - Course enrollment
   - Video playback with progress tracking
   - Quiz taking and scoring

4. **Progress Tracking**
   - Lesson completion tracking
   - Course progress calculation
   - Certificate generation

5. **Administration**
   - User management
   - Course moderation
   - System analytics

### 2.3 User Classes and Characteristics

#### 2.3.1 Students
- **Description:** Primary users who consume educational content
- **Characteristics:**
  - May have varying technical expertise
  - Access platform from various devices
  - Expect intuitive navigation and clear progress indicators
- **Frequency of Use:** Regular (daily to weekly)

#### 2.3.2 Instructors
- **Description:** Content creators who develop and manage courses
- **Characteristics:**
  - Subject matter experts
  - Require tools for content creation
  - Need analytics on course performance
- **Frequency of Use:** Regular (several times per week)

#### 2.3.3 Administrators
- **Description:** System managers responsible for platform oversight
- **Characteristics:**
  - Technical background
  - Responsible for user and content moderation
  - Access to all system features
- **Frequency of Use:** Daily

### 2.4 Operating Environment
- **Client-side:**
  - Modern web browsers (Chrome, Firefox, Safari, Edge)
  - Desktop and mobile devices
  - Minimum screen resolution: 320px width

- **Server-side:**
  - Node.js runtime environment
  - PostgreSQL database server
  - File storage system

### 2.5 Design and Implementation Constraints
1. Must be developed using Next.js framework
2. Database must use PostgreSQL with Prisma ORM
3. Must support Arabic and English languages (RTL/LTR)
4. Video files must be stored securely
5. Must comply with web accessibility standards (WCAG 2.1)

### 2.6 Assumptions and Dependencies
**Assumptions:**
- Users have stable internet connectivity
- Users have modern web browsers
- Video files are pre-recorded (no live streaming)

**Dependencies:**
- PostgreSQL database availability
- File storage system availability
- Third-party authentication providers (optional)

---

## 3. Specific Requirements

### 3.1 External Interfaces

#### 3.1.1 User Interfaces
The system shall provide the following interfaces:

| Interface | Description | Users |
|-----------|-------------|-------|
| Landing Page | Public page showcasing platform features | All visitors |
| Registration Page | User sign-up form | New users |
| Login Page | Authentication form | Registered users |
| Student Dashboard | Overview of enrolled courses and progress | Students |
| Course Browser | Searchable course catalog | All users |
| Course Detail Page | Detailed course information | All users |
| Course Player | Video player with lesson navigation | Enrolled students |
| Quiz Interface | Interactive quiz taking | Students |
| Instructor Dashboard | Course management and analytics | Instructors |
| Course Editor | Course creation and editing | Instructors |
| Admin Panel | User and content management | Administrators |

#### 3.1.2 Hardware Interfaces
No direct hardware interfaces are required. The system operates entirely through web browsers.

#### 3.1.3 Software Interfaces

| Software | Purpose | Interface Type |
|----------|---------|----------------|
| PostgreSQL | Data persistence | Prisma ORM |
| NextAuth.js | Authentication | Library integration |
| File System | Video storage | Node.js fs API |

#### 3.1.4 Communication Interfaces
- **HTTP/HTTPS:** All client-server communication
- **WebSocket:** Optional for real-time notifications (future)

---

## 4. Functional Requirements

### 4.1 User Authentication Module

#### FR-AUTH-001: User Registration
**Description:** The system shall allow new users to create accounts.
**Priority:** High
**Input:** Email, password, full name, role selection
**Process:** 
1. Validate input data
2. Check email uniqueness
3. Hash password
4. Create user record
5. Send verification email (optional)
**Output:** Success message or error details
**Preconditions:** None
**Postconditions:** New user account created

#### FR-AUTH-002: User Login
**Description:** The system shall authenticate users with email and password.
**Priority:** High
**Input:** Email, password
**Process:**
1. Validate credentials
2. Generate session token
3. Create user session
**Output:** Authentication token, user data, or error message
**Preconditions:** User account exists
**Postconditions:** User session established

#### FR-AUTH-003: User Logout
**Description:** The system shall allow users to terminate their sessions.
**Priority:** High
**Input:** Session token
**Process:** Invalidate session
**Output:** Confirmation of logout
**Preconditions:** User is logged in
**Postconditions:** Session terminated

#### FR-AUTH-004: Password Reset
**Description:** The system shall allow users to reset forgotten passwords.
**Priority:** Medium
**Input:** Email address
**Process:**
1. Verify email exists
2. Generate reset token
3. Send reset email
4. Accept new password
5. Update password
**Output:** Confirmation or error message
**Preconditions:** User account exists
**Postconditions:** Password updated

#### FR-AUTH-005: Role-Based Access Control
**Description:** The system shall restrict access based on user roles.
**Priority:** High
**Roles:**
- Student: Access to enrolled courses, own progress
- Instructor: Course management, student analytics
- Admin: Full system access
**Process:** Verify user role before granting access to protected resources
**Output:** Access granted or denied

### 4.2 Course Management Module

#### FR-COURSE-001: Create Course
**Description:** Instructors shall be able to create new courses.
**Priority:** High
**Input:** Title, description, category, thumbnail, price (optional)
**Process:**
1. Validate input data
2. Upload thumbnail
3. Create course record
4. Associate with instructor
**Output:** Created course with unique ID
**Preconditions:** User is authenticated instructor
**Postconditions:** New course in draft status

#### FR-COURSE-002: Edit Course
**Description:** Instructors shall be able to modify their courses.
**Priority:** High
**Input:** Course ID, updated fields
**Process:**
1. Verify ownership
2. Validate changes
3. Update course record
**Output:** Updated course data
**Preconditions:** Course exists, user owns course
**Postconditions:** Course updated

#### FR-COURSE-003: Delete Course
**Description:** Instructors shall be able to delete their courses.
**Priority:** Medium
**Input:** Course ID
**Process:**
1. Verify ownership
2. Check for enrolled students (warn)
3. Soft delete course
**Output:** Confirmation message
**Preconditions:** Course exists, user owns course
**Postconditions:** Course marked as deleted

#### FR-COURSE-004: Publish Course
**Description:** Instructors shall be able to publish courses for enrollment.
**Priority:** High
**Input:** Course ID
**Process:**
1. Verify minimum content requirements
2. Update course status to published
**Output:** Published course
**Preconditions:** Course has at least one lesson
**Postconditions:** Course visible in catalog

#### FR-COURSE-005: Browse Courses
**Description:** Users shall be able to browse available courses.
**Priority:** High
**Input:** Search query, filters (category, level, etc.)
**Process:**
1. Apply search criteria
2. Filter by status (published)
3. Sort results
4. Paginate
**Output:** List of matching courses
**Preconditions:** None
**Postconditions:** None

#### FR-COURSE-006: View Course Details
**Description:** Users shall view detailed course information.
**Priority:** High
**Input:** Course ID
**Process:** Retrieve course with lessons, instructor info, reviews
**Output:** Complete course details
**Preconditions:** Course exists and is published (or user is owner)
**Postconditions:** None

### 4.3 Lesson Management Module

#### FR-LESSON-001: Add Lesson
**Description:** Instructors shall add lessons to their courses.
**Priority:** High
**Input:** Course ID, title, description, video file, duration, order
**Process:**
1. Verify course ownership
2. Upload video file
3. Create lesson record
4. Update course duration
**Output:** Created lesson
**Preconditions:** Course exists, user owns course
**Postconditions:** Lesson added to course

#### FR-LESSON-002: Edit Lesson
**Description:** Instructors shall modify lesson content.
**Priority:** High
**Input:** Lesson ID, updated fields
**Process:**
1. Verify ownership through course
2. Update lesson record
3. Replace video if provided
**Output:** Updated lesson
**Preconditions:** Lesson exists, user owns course
**Postconditions:** Lesson updated

#### FR-LESSON-003: Delete Lesson
**Description:** Instructors shall remove lessons from courses.
**Priority:** Medium
**Input:** Lesson ID
**Process:**
1. Verify ownership
2. Delete video file
3. Delete lesson record
4. Update course duration
**Output:** Confirmation
**Preconditions:** Lesson exists, user owns course
**Postconditions:** Lesson removed

#### FR-LESSON-004: Reorder Lessons
**Description:** Instructors shall change lesson sequence.
**Priority:** Medium
**Input:** Course ID, new lesson order
**Process:** Update order field for affected lessons
**Output:** Updated lesson order
**Preconditions:** Course exists with multiple lessons
**Postconditions:** Lesson order updated

### 4.4 Enrollment Module

#### FR-ENROLL-001: Enroll in Course
**Description:** Students shall enroll in courses.
**Priority:** High
**Input:** Course ID
**Process:**
1. Verify course is published
2. Check if not already enrolled
3. Create enrollment record
4. Initialize progress tracking
**Output:** Enrollment confirmation
**Preconditions:** User is student, course is published
**Postconditions:** User enrolled, progress initialized

#### FR-ENROLL-002: View Enrolled Courses
**Description:** Students shall view their enrolled courses.
**Priority:** High
**Input:** User ID
**Process:** Retrieve courses with enrollment status and progress
**Output:** List of enrolled courses with progress
**Preconditions:** User is authenticated
**Postconditions:** None

#### FR-ENROLL-003: Unenroll from Course
**Description:** Students shall be able to leave courses.
**Priority:** Low
**Input:** Course ID
**Process:**
1. Verify enrollment exists
2. Remove enrollment record
3. Optionally preserve progress
**Output:** Confirmation
**Preconditions:** User is enrolled
**Postconditions:** Enrollment removed

### 4.5 Progress Tracking Module

#### FR-PROGRESS-001: Track Lesson Progress
**Description:** System shall track video watch progress.
**Priority:** High
**Input:** Lesson ID, watch time, completion status
**Process:**
1. Update watch time
2. Calculate percentage
3. Mark complete if threshold reached (90%)
**Output:** Updated progress
**Preconditions:** User is enrolled
**Postconditions:** Progress recorded

#### FR-PROGRESS-002: Mark Lesson Complete
**Description:** System shall mark lessons as completed.
**Priority:** High
**Input:** Lesson ID
**Process:**
1. Update lesson completion status
2. Recalculate course progress
**Output:** Updated completion status
**Preconditions:** Lesson watched to completion threshold
**Postconditions:** Lesson marked complete

#### FR-PROGRESS-003: Calculate Course Progress
**Description:** System shall calculate overall course completion.
**Priority:** High
**Input:** Course ID, User ID
**Process:** (Completed lessons / Total lessons) * 100
**Output:** Progress percentage
**Preconditions:** User enrolled in course
**Postconditions:** None

#### FR-PROGRESS-004: Generate Certificate
**Description:** System shall generate completion certificates.
**Priority:** Medium
**Input:** Course ID, User ID
**Process:**
1. Verify 100% completion
2. Generate certificate with details
3. Store certificate record
**Output:** Certificate (PDF or viewable)
**Preconditions:** Course 100% complete
**Postconditions:** Certificate generated

### 4.6 Quiz Module

#### FR-QUIZ-001: Create Quiz
**Description:** Instructors shall create quizzes for lessons.
**Priority:** High
**Input:** Lesson ID, title, questions with options and answers
**Process:**
1. Verify lesson ownership
2. Create quiz record
3. Create question records
**Output:** Created quiz
**Preconditions:** Lesson exists, user owns course
**Postconditions:** Quiz associated with lesson

#### FR-QUIZ-002: Edit Quiz
**Description:** Instructors shall modify quizzes.
**Priority:** Medium
**Input:** Quiz ID, updated questions/options
**Process:** Update quiz and question records
**Output:** Updated quiz
**Preconditions:** Quiz exists, user owns course
**Postconditions:** Quiz updated

#### FR-QUIZ-003: Take Quiz
**Description:** Students shall complete quizzes.
**Priority:** High
**Input:** Quiz ID, student answers
**Process:**
1. Verify enrollment
2. Record answers
3. Calculate score
4. Store attempt
**Output:** Quiz results with score
**Preconditions:** Student enrolled, lesson accessible
**Postconditions:** Quiz attempt recorded

#### FR-QUIZ-004: View Quiz Results
**Description:** Students shall view their quiz performance.
**Priority:** High
**Input:** Quiz attempt ID
**Process:** Retrieve attempt with answers and correct options
**Output:** Detailed results
**Preconditions:** Quiz completed
**Postconditions:** None

### 4.7 Review and Rating Module

#### FR-REVIEW-001: Submit Review
**Description:** Students shall review completed courses.
**Priority:** Medium
**Input:** Course ID, rating (1-5), comment
**Process:**
1. Verify enrollment and progress
2. Check for existing review
3. Create/update review
4. Update course average rating
**Output:** Created review
**Preconditions:** User enrolled with minimum progress
**Postconditions:** Review stored, rating updated

#### FR-REVIEW-002: View Reviews
**Description:** Users shall view course reviews.
**Priority:** Medium
**Input:** Course ID, pagination
**Process:** Retrieve reviews with pagination
**Output:** List of reviews
**Preconditions:** None
**Postconditions:** None

### 4.8 Administration Module

#### FR-ADMIN-001: Manage Users
**Description:** Admins shall manage user accounts.
**Priority:** High
**Input:** User ID, action (activate/deactivate/change role)
**Process:** Update user status/role
**Output:** Updated user
**Preconditions:** Admin role
**Postconditions:** User updated

#### FR-ADMIN-002: Moderate Courses
**Description:** Admins shall approve/reject courses.
**Priority:** Medium
**Input:** Course ID, action, reason
**Process:** Update course status
**Output:** Updated course status
**Preconditions:** Admin role
**Postconditions:** Course status changed

#### FR-ADMIN-003: View Analytics
**Description:** Admins shall access platform statistics.
**Priority:** Medium
**Input:** Date range, metrics selection
**Process:** Aggregate data from various tables
**Output:** Analytics dashboard data
**Preconditions:** Admin role
**Postconditions:** None

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements

#### NFR-PERF-001: Response Time
**Description:** The system shall respond to user actions within acceptable time limits.
**Requirement:**
- Page load: < 3 seconds
- API response: < 500ms
- Search results: < 2 seconds

#### NFR-PERF-002: Concurrent Users
**Description:** The system shall support multiple simultaneous users.
**Requirement:** Support 100+ concurrent users without degradation

#### NFR-PERF-003: Video Streaming
**Description:** Videos shall stream without excessive buffering.
**Requirement:** Buffer time < 3 seconds on standard broadband

### 5.2 Security Requirements

#### NFR-SEC-001: Authentication
**Description:** All authentication shall use secure methods.
**Requirement:**
- Passwords hashed with bcrypt (min 10 rounds)
- JWT tokens with expiration
- HTTPS only in production

#### NFR-SEC-002: Authorization
**Description:** Access control shall be enforced at all levels.
**Requirement:**
- Role-based access control on all endpoints
- Resource ownership verification
- API route protection

#### NFR-SEC-003: Data Protection
**Description:** Sensitive data shall be protected.
**Requirement:**
- No plain-text passwords
- Input validation and sanitization
- SQL injection prevention via ORM

#### NFR-SEC-004: Session Management
**Description:** User sessions shall be managed securely.
**Requirement:**
- Session timeout after 24 hours of inactivity
- Secure cookie flags (HttpOnly, Secure, SameSite)

### 5.3 Reliability Requirements

#### NFR-REL-001: Availability
**Description:** The system shall maintain high availability.
**Requirement:** 99% uptime during normal operation

#### NFR-REL-002: Data Integrity
**Description:** Data shall remain consistent and accurate.
**Requirement:**
- Database transactions for critical operations
- Referential integrity constraints
- Backup procedures

#### NFR-REL-003: Error Handling
**Description:** Errors shall be handled gracefully.
**Requirement:**
- User-friendly error messages
- Detailed logging for debugging
- No system crashes from user input

### 5.4 Usability Requirements

#### NFR-USE-001: Learnability
**Description:** New users shall learn the system quickly.
**Requirement:** Core tasks achievable without documentation

#### NFR-USE-002: Accessibility
**Description:** The system shall be accessible to users with disabilities.
**Requirement:**
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility

#### NFR-USE-003: Responsiveness
**Description:** Interface shall adapt to different screen sizes.
**Requirement:**
- Mobile-friendly design (320px minimum)
- Tablet and desktop optimized layouts

#### NFR-USE-004: Internationalization
**Description:** The system shall support multiple languages.
**Requirement:**
- Arabic and English support
- RTL layout support
- Locale-aware date/number formatting

### 5.5 Maintainability Requirements

#### NFR-MAIN-001: Code Quality
**Description:** Code shall follow best practices.
**Requirement:**
- TypeScript for type safety
- ESLint/Prettier for code style
- Component-based architecture

#### NFR-MAIN-002: Documentation
**Description:** Code shall be documented.
**Requirement:**
- API documentation
- Component documentation
- README files

#### NFR-MAIN-003: Modularity
**Description:** System shall be modular and extensible.
**Requirement:**
- Separation of concerns
- Reusable components
- Clear module boundaries

### 5.6 Scalability Requirements

#### NFR-SCALE-001: Horizontal Scaling
**Description:** System shall support future scaling.
**Requirement:**
- Stateless API design
- Database connection pooling
- File storage abstraction

---

## 6. Use Cases

### 6.1 Use Case: User Registration

| Field | Description |
|-------|-------------|
| **Use Case ID** | UC-001 |
| **Name** | User Registration |
| **Actors** | Visitor |
| **Description** | A new user creates an account on the platform |
| **Preconditions** | User is not logged in, email not registered |
| **Trigger** | User clicks "Sign Up" button |
| **Main Flow** | 1. User navigates to registration page<br>2. User enters name, email, password<br>3. User selects role (Student/Instructor)<br>4. User submits form<br>5. System validates input<br>6. System creates account<br>7. System logs user in<br>8. System redirects to dashboard |
| **Alternative Flows** | **5a.** Email already exists → Show error, suggest login<br>**5b.** Invalid input → Show validation errors |
| **Postconditions** | User account created, user logged in |
| **Business Rules** | Password minimum 8 characters, valid email format |

### 6.2 Use Case: User Login

| Field | Description |
|-------|-------------|
| **Use Case ID** | UC-002 |
| **Name** | User Login |
| **Actors** | Registered User |
| **Description** | User authenticates to access the platform |
| **Preconditions** | User has registered account |
| **Trigger** | User clicks "Login" button |
| **Main Flow** | 1. User enters email and password<br>2. User submits form<br>3. System validates credentials<br>4. System creates session<br>5. System redirects to dashboard |
| **Alternative Flows** | **3a.** Invalid credentials → Show error message<br>**3b.** Account disabled → Show appropriate message |
| **Postconditions** | User session established |

### 6.3 Use Case: Create Course

| Field | Description |
|-------|-------------|
| **Use Case ID** | UC-003 |
| **Name** | Create Course |
| **Actors** | Instructor |
| **Description** | Instructor creates a new course |
| **Preconditions** | User logged in as Instructor |
| **Trigger** | Instructor clicks "Create Course" |
| **Main Flow** | 1. Instructor navigates to course creation<br>2. Instructor enters course details (title, description, category)<br>3. Instructor uploads thumbnail<br>4. Instructor saves course<br>5. System creates course in draft status<br>6. System redirects to course editor |
| **Alternative Flows** | **4a.** Validation error → Show errors, retain input |
| **Postconditions** | New course created in draft status |

### 6.4 Use Case: Add Lesson

| Field | Description |
|-------|-------------|
| **Use Case ID** | UC-004 |
| **Name** | Add Lesson |
| **Actors** | Instructor |
| **Description** | Instructor adds a video lesson to course |
| **Preconditions** | Course exists, instructor owns course |
| **Trigger** | Instructor clicks "Add Lesson" |
| **Main Flow** | 1. Instructor enters lesson title and description<br>2. Instructor uploads video file<br>3. System processes video<br>4. Instructor saves lesson<br>5. System adds lesson to course |
| **Alternative Flows** | **2a.** Invalid file format → Show error<br>**2b.** File too large → Show size limit error |
| **Postconditions** | Lesson added to course |

### 6.5 Use Case: Enroll in Course

| Field | Description |
|-------|-------------|
| **Use Case ID** | UC-005 |
| **Name** | Enroll in Course |
| **Actors** | Student |
| **Description** | Student enrolls in a course to begin learning |
| **Preconditions** | User logged in as Student, course is published |
| **Trigger** | Student clicks "Enroll" on course page |
| **Main Flow** | 1. Student views course details<br>2. Student clicks "Enroll Now"<br>3. System creates enrollment<br>4. System initializes progress<br>5. System redirects to first lesson |
| **Alternative Flows** | **2a.** Already enrolled → Show "Continue Learning"<br>**3a.** Enrollment limit reached → Show error |
| **Postconditions** | Student enrolled, can access course content |

### 6.6 Use Case: Watch Lesson

| Field | Description |
|-------|-------------|
| **Use Case ID** | UC-006 |
| **Name** | Watch Lesson |
| **Actors** | Enrolled Student |
| **Description** | Student watches a video lesson |
| **Preconditions** | Student enrolled in course |
| **Trigger** | Student clicks on lesson |
| **Main Flow** | 1. Student navigates to lesson<br>2. System loads video player<br>3. Student watches video<br>4. System tracks progress periodically<br>5. Student completes video<br>6. System marks lesson complete |
| **Alternative Flows** | **3a.** Video fails to load → Show error, retry option<br>**5a.** Student exits early → Save progress |
| **Postconditions** | Progress updated, lesson potentially marked complete |

### 6.7 Use Case: Take Quiz

| Field | Description |
|-------|-------------|
| **Use Case ID** | UC-007 |
| **Name** | Take Quiz |
| **Actors** | Enrolled Student |
| **Description** | Student completes a quiz assessment |
| **Preconditions** | Student enrolled, quiz exists for lesson |
| **Trigger** | Student clicks "Take Quiz" |
| **Main Flow** | 1. System displays quiz questions<br>2. Student answers questions<br>3. Student submits quiz<br>4. System grades quiz<br>5. System displays results |
| **Alternative Flows** | **3a.** Time limit exceeded → Auto-submit |
| **Postconditions** | Quiz attempt recorded, score saved |

### 6.8 Use Case: View Progress

| Field | Description |
|-------|-------------|
| **Use Case ID** | UC-008 |
| **Name** | View Progress |
| **Actors** | Student |
| **Description** | Student views their learning progress |
| **Preconditions** | Student logged in |
| **Trigger** | Student navigates to dashboard |
| **Main Flow** | 1. Student opens dashboard<br>2. System retrieves enrolled courses<br>3. System calculates progress for each<br>4. System displays progress overview |
| **Postconditions** | None |

### 6.9 Use Case: Publish Course

| Field | Description |
|-------|-------------|
| **Use Case ID** | UC-009 |
| **Name** | Publish Course |
| **Actors** | Instructor |
| **Description** | Instructor publishes course for enrollment |
| **Preconditions** | Course has at least one lesson |
| **Trigger** | Instructor clicks "Publish" |
| **Main Flow** | 1. System validates course completeness<br>2. System changes status to published<br>3. Course appears in catalog |
| **Alternative Flows** | **1a.** No lessons → Show error message |
| **Postconditions** | Course visible in catalog |

### 6.10 Use Case: Manage Users (Admin)

| Field | Description |
|-------|-------------|
| **Use Case ID** | UC-010 |
| **Name** | Manage Users |
| **Actors** | Administrator |
| **Description** | Admin manages user accounts |
| **Preconditions** | User logged in as Admin |
| **Trigger** | Admin accesses user management |
| **Main Flow** | 1. Admin views user list<br>2. Admin selects user<br>3. Admin performs action (edit/disable/change role)<br>4. System updates user<br>5. System shows confirmation |
| **Postconditions** | User account updated |

---

## 7. External Interface Requirements

### 7.1 User Interface Requirements

#### UI-001: Navigation
- Global navigation bar visible on all pages
- Clear indication of current location (breadcrumbs)
- Consistent layout across all pages

#### UI-002: Forms
- Clear labels for all input fields
- Real-time validation feedback
- Accessible error messages

#### UI-003: Video Player
- Play/pause controls
- Progress bar with seeking
- Volume control
- Fullscreen option
- Playback speed control

#### UI-004: Responsive Design
- Mobile-first approach
- Breakpoints: 320px, 640px, 768px, 1024px, 1280px
- Touch-friendly interactions on mobile

### 7.2 API Interface Requirements

#### API-001: RESTful Design
- Resource-based URLs
- Standard HTTP methods (GET, POST, PUT, DELETE)
- JSON request/response bodies

#### API-002: Authentication
- Bearer token authentication
- Token refresh mechanism
- Secure token storage

#### API-003: Error Responses
Standard error response format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

### 7.3 Database Interface Requirements

#### DB-001: Connection
- Connection pooling for performance
- Automatic reconnection on failure
- Query timeout limits

#### DB-002: Transactions
- ACID compliance for critical operations
- Rollback on failure

---

## 8. System Features

### 8.1 Feature: Student Dashboard
**Priority:** High
**Description:** Central hub for students to view their enrolled courses and progress.

**Components:**
- Enrolled courses grid
- Progress indicators
- Continue learning suggestions
- Recent activity

### 8.2 Feature: Instructor Dashboard
**Priority:** High
**Description:** Management interface for instructors to create and monitor courses.

**Components:**
- Course management
- Student analytics
- Earnings overview (future)
- Quick actions

### 8.3 Feature: Course Player
**Priority:** High
**Description:** Immersive learning experience with video playback and navigation.

**Components:**
- Video player with controls
- Lesson sidebar
- Progress tracking
- Notes (future)

### 8.4 Feature: Quiz System
**Priority:** High
**Description:** Interactive assessments to test student knowledge.

**Components:**
- Multiple choice questions
- True/false questions
- Instant feedback
- Score tracking

---

## 9. Data Requirements

### 9.1 Data Dictionary

#### Users Table
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | UUID | Unique identifier | Primary Key |
| email | VARCHAR(255) | User email | Unique, Not Null |
| password | VARCHAR(255) | Hashed password | Not Null |
| name | VARCHAR(255) | Full name | Not Null |
| role | ENUM | User role | student/instructor/admin |
| avatar | VARCHAR(500) | Profile image URL | Nullable |
| createdAt | TIMESTAMP | Creation date | Not Null |
| updatedAt | TIMESTAMP | Last update | Not Null |

#### Courses Table
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | UUID | Unique identifier | Primary Key |
| title | VARCHAR(255) | Course title | Not Null |
| description | TEXT | Full description | Nullable |
| thumbnail | VARCHAR(500) | Image URL | Nullable |
| status | ENUM | Publication status | draft/published/archived |
| category | VARCHAR(100) | Course category | Nullable |
| level | ENUM | Difficulty level | beginner/intermediate/advanced |
| instructorId | UUID | Course creator | Foreign Key (Users) |
| createdAt | TIMESTAMP | Creation date | Not Null |
| updatedAt | TIMESTAMP | Last update | Not Null |

#### Lessons Table
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | UUID | Unique identifier | Primary Key |
| title | VARCHAR(255) | Lesson title | Not Null |
| description | TEXT | Lesson description | Nullable |
| videoUrl | VARCHAR(500) | Video file path | Not Null |
| duration | INTEGER | Duration in seconds | Not Null |
| order | INTEGER | Sequence number | Not Null |
| courseId | UUID | Parent course | Foreign Key (Courses) |
| createdAt | TIMESTAMP | Creation date | Not Null |

#### Enrollments Table
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | UUID | Unique identifier | Primary Key |
| userId | UUID | Enrolled student | Foreign Key (Users) |
| courseId | UUID | Enrolled course | Foreign Key (Courses) |
| enrolledAt | TIMESTAMP | Enrollment date | Not Null |
| completedAt | TIMESTAMP | Completion date | Nullable |

#### Progress Table
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| id | UUID | Unique identifier | Primary Key |
| userId | UUID | Student | Foreign Key (Users) |
| lessonId | UUID | Lesson | Foreign Key (Lessons) |
| watchTime | INTEGER | Seconds watched | Default 0 |
| completed | BOOLEAN | Completion status | Default false |
| completedAt | TIMESTAMP | Completion time | Nullable |

---

## 10. Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| Course | A complete learning package with multiple lessons |
| Lesson | A single video unit within a course |
| Enrollment | Student's registration in a course |
| Progress | Tracking of student's advancement through content |
| Quiz | Assessment tool to test understanding |

### Appendix B: Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | Dec 13, 2025 | Development Team | Initial SRS document |

---

**Document Status:** Final Draft  
**Approved By:** [Instructor Name]  
**Approval Date:** [TBD]
