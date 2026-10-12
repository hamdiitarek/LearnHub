/** 3h 26m, 48m, or 45s for very short clips. */
export function formatDuration(seconds: number) {
  if (!seconds) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return m === 0 ? `${seconds}s` : `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export const levelLabel = (level: string) =>
  level.charAt(0) + level.slice(1).toLowerCase();

export const plural = (n: number, word: string) =>
  `${n} ${word}${n === 1 ? "" : "s"}`;
