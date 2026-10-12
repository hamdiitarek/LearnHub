// Demo sign-ins, safe to import on the client (no seed or database code).
export const DEMO_PASSWORD = "learnhub-demo";

export const DEMO_ACCOUNTS = [
  {
    role: "student",
    label: "Student",
    name: "Nour Hassan",
    email: "student@learnhub.demo",
    blurb: "Halfway through three courses, one certificate earned",
  },
  {
    role: "instructor",
    label: "Instructor",
    name: "Omar Nabil",
    email: "omar@learnhub.demo",
    blurb: "Curates the web development path",
  },
  {
    role: "admin",
    label: "Admin",
    name: "Mona Fathy",
    email: "admin@learnhub.demo",
    blurb: "Manages users, courses and roles",
  },
] as const;
