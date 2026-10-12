import { Logo } from "@/components/brand/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-paper lg:flex lg:flex-col">
        <div className="[&_span]:text-paper">
          <Logo />
        </div>
        <blockquote className="mt-auto max-w-md font-display text-[clamp(2rem,3vw,2.8rem)] leading-[1.08]">
          “A lecture is something you watch. A course is something you{" "}
          <span className="mark text-ink">finish</span>.”
        </blockquote>
        <p className="mt-6 max-w-sm text-[14px] text-paper/60">
          Free lectures from great teachers, in an order that builds, with
          quizzes and a certificate at the end.
        </p>
        <div
          className="pointer-events-none absolute -end-24 -top-24 size-96 rounded-full opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, #f6f4ec 0 1px, transparent 1px 14px)",
          }}
        />
      </aside>
      <main className="flex min-w-0 flex-col px-5 py-8 sm:px-10">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
