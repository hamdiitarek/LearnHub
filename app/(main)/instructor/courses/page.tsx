import { redirect } from "next/navigation";

// The instructor dashboard already lists every course you curate.
export default function InstructorCoursesPage() {
  redirect("/instructor");
}
