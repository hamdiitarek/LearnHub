import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const REPO = "https://github.com/hamdiitarek/LearnHub";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-[#efece2]">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
            Free lectures, organised into courses with quizzes, progress
            tracking and certificates. Lectures are embedded from YouTube and
            belong to their creators.
          </p>
        </div>
        <div>
          <h3 className="text-[13px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            Learn
          </h3>
          <ul className="mt-4 space-y-2.5 text-[14px]">
            <li>
              <Link href="/courses" className="hover:text-forest">
                All courses
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-forest">
                My learning
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-forest">
                Create an account
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-[13px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            Project
          </h3>
          <ul className="mt-4 space-y-2.5 text-[14px]">
            <li>
              <Link href="/instructor" className="hover:text-forest">
                Teach on LearnHub
              </Link>
            </li>
            <li>
              <a
                href={REPO}
                target="_blank"
                rel="noreferrer"
                className="hover:text-forest"
              >
                Source on GitHub
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-5 py-5 text-[13px] text-muted-foreground">
          © {new Date().getFullYear()} LearnHub. Built with Next.js, Prisma and
          PostgreSQL.
        </p>
      </div>
    </footer>
  );
}
