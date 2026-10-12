import { cn } from "@/lib/utils";
import { formatDuration, plural } from "@/lib/format";

// One cloth colour per subject, like a shelf of textbooks.
const PALETTE: Record<string, { bg: string; ink: string; rule: string }> = {
  "Web Development": { bg: "#0e5c4a", ink: "#f6f4ec", rule: "#e4f95b" },
  Programming: { bg: "#1f3b73", ink: "#f2f0e6", rule: "#e4f95b" },
  "Data Science": { bg: "#7a3a28", ink: "#f8eee4", rule: "#f2c14e" },
  "AI & Machine Learning": { bg: "#2a2034", ink: "#efe9f6", rule: "#e4f95b" },
  Data: { bg: "#8a5a14", ink: "#fbf3e2", rule: "#fff2b8" },
  "Computer Science": { bg: "#12201a", ink: "#f6f4ec", rule: "#e4f95b" },
  Tools: { bg: "#c2412d", ink: "#fff4ee", rule: "#ffe0a3" },
};
const FALLBACK = { bg: "#44524c", ink: "#f6f4ec", rule: "#e4f95b" };

export function coverColors(category?: string | null) {
  return (category && PALETTE[category]) || FALLBACK;
}

type CoverProps = {
  title: string;
  category?: string | null;
  thumbnail?: string | null;
  lessons?: number;
  seconds?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
};

/**
 * Course artwork. Uses the instructor's thumbnail when there is one,
 * otherwise draws a cloth-bound "textbook" cover in the subject's colour.
 */
export function CourseCover({
  title,
  category,
  thumbnail,
  lessons,
  seconds,
  size = "md",
  className,
}: CoverProps) {
  if (thumbnail) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={thumbnail}
        alt=""
        className={cn("aspect-[16/10] w-full object-cover", className)}
      />
    );
  }

  const c = coverColors(category);
  const titleSize =
    size === "lg"
      ? "text-[clamp(2rem,4vw,3.1rem)]"
      : size === "sm"
        ? "text-[1.15rem]"
        : "text-[1.7rem]";

  return (
    <div
      className={cn(
        "relative isolate flex aspect-[16/10] w-full flex-col overflow-hidden",
        size === "sm" ? "p-3.5" : "p-5",
        className,
      )}
      style={{ background: c.bg, color: c.ink }}
      aria-hidden
    >
      {/* cloth grain and a spine */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.12]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, currentColor 0 1px, transparent 1px 7px)",
        }}
      />
      <div
        className="absolute inset-y-0 start-0 -z-10 w-3"
        style={{ background: "rgb(0 0 0 / 0.18)" }}
      />

      <div className="flex items-center gap-2 ps-2 text-[10px] font-semibold tracking-[0.18em] uppercase opacity-80">
        <span
          className="h-[3px] w-5 rounded-full"
          style={{ background: c.rule }}
        />
        {category}
      </div>
      <p className={cn("mt-auto ps-2 font-display leading-[1.02]", titleSize)}>
        {title}
      </p>
      {(lessons !== undefined || seconds !== undefined) && size !== "sm" && (
        <p className="mt-3 ps-2 text-[12px] font-medium opacity-75">
          {lessons !== undefined && plural(lessons, "lesson")}
          {lessons !== undefined && seconds ? " · " : ""}
          {seconds ? formatDuration(seconds) : ""}
        </p>
      )}
    </div>
  );
}
