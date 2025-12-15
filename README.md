# LearnHub - E-Learning Platform (Mini LMS)

A comprehensive e-learning platform similar to Udemy that allows instructors to upload courses and students to enroll, watch videos, take quizzes, and track progress.

## 🚀 Features

### For Students
- Browse and search courses by category, level, and keywords
- Enroll in courses (free or paid)
- Watch video lessons with progress tracking
- Take quizzes and earn certificates
- Track learning progress across all enrolled courses
- Leave reviews and ratings

### For Instructors
- Create and manage courses
- Add video lessons with ordering
- Create quizzes with multiple question types
- View enrollment statistics and revenue
- Manage course publishing status

### For Administrators
- View platform-wide statistics
- Manage users and roles
- Moderate content

## 🛠️ Tech Stack

- **Framework:** Next.js 16 with React 19 (App Router)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js (Auth.js) with JWT strategy
- **Styling:** Tailwind CSS with Shadcn/UI components
- **Validation:** Zod with React Hook Form
- **State Management:** TanStack Query (React Query)

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or pnpm

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nextjs-boilerplate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your values:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/learnhub"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   ```

4. **Generate Prisma client and push schema**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the app**
   Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
nextjs-boilerplate/
├── app/
│   ├── (auth)/                 # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── (main)/                 # Main pages with navbar/footer
│   │   ├── courses/            # Course browsing and details
│   │   ├── dashboard/          # Student dashboard
│   │   ├── instructor/         # Instructor dashboard
│   │   └── admin/              # Admin dashboard
│   └── api/                    # API routes
│       ├── auth/               # Authentication APIs
│       ├── courses/            # Course CRUD APIs
│       ├── enrollments/        # Enrollment APIs
│       ├── progress/           # Progress tracking APIs
│       ├── quizzes/            # Quiz APIs
│       ├── reviews/            # Review APIs
│       └── admin/              # Admin APIs
├── components/
│   ├── layout/                 # Navbar, Footer
│   └── ui/                     # Shadcn UI components
├── lib/
│   ├── auth.ts                 # NextAuth configuration
│   ├── db.ts                   # Prisma client
│   ├── utils.ts                # Utility functions
│   └── validations.ts          # Zod schemas
├── prisma/
│   └── schema.prisma           # Database schema
├── providers/                  # React context providers
└── docs/                       # Project documentation
    ├── 1-PROJECT-PROPOSAL.md
    ├── 2-SRS-DOCUMENT.md
    └── 4-DATABASE-DESIGN.md
```

## 🗄️ Database Schema

The application uses the following main models:
- **User** - Students, Instructors, and Admins
- **Course** - Course information with status management
- **Lesson** - Video lessons with ordering
- **Enrollment** - Student-course relationships
- **Progress** - Lesson completion tracking
- **Quiz** - Quizzes attached to lessons
- **Question** - Quiz questions with multiple types
- **QuizAttempt** - Quiz submission records
- **Review** - Course ratings and comments
- **Certificate** - Completion certificates

## 🔐 User Roles

| Role | Capabilities |
|------|-------------|
| STUDENT | Browse courses, enroll, watch lessons, take quizzes |
| INSTRUCTOR | All student capabilities + create/manage courses |
| ADMIN | All capabilities + manage users and platform |

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth handlers

### Courses
- `GET /api/courses` - List courses with filters
- `POST /api/courses` - Create course (Instructor)
- `GET /api/courses/[id]` - Get course details
- `PATCH /api/courses/[id]` - Update course
- `DELETE /api/courses/[id]` - Delete course
- `POST /api/courses/[id]/publish` - Publish course
- `POST /api/courses/[id]/enroll` - Enroll in course

### Lessons
- `GET /api/courses/[id]/lessons` - Get course lessons
- `POST /api/courses/[id]/lessons` - Create lesson

### Progress
- `GET /api/progress` - Get user progress
- `POST /api/progress` - Update progress

### Quizzes
- `GET /api/quizzes` - Get quiz by lesson
- `POST /api/quizzes` - Create quiz
- `POST /api/quizzes/[id]/submit` - Submit quiz

## 📖 Documentation

Additional documentation can be found in the `/docs` folder:
- **Project Proposal** - Initial project ideas and selection
- **SRS Document** - Software Requirements Specification
- **Database Design** - ERD, schema definitions, and queries

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import the project to Vercel
3. Add environment variables
4. Deploy

### Docker
```bash
docker-compose up -d
```

## 📝 License

This project is for educational purposes.
