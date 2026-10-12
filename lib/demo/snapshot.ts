import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SCHEMA_SQL } from "./schema";
import { COURSES, INSTRUCTORS } from "./catalog";

/**
 * A pre-seeded copy of the demo database (scripts/demo-snapshot.ts), so a cold
 * server loads it in a fraction of the time it takes to create and seed one.
 * Regenerate it after changing the schema, the catalogue or the seed:
 *
 *   npm run demo:snapshot
 */
export const SNAPSHOT_DIR = join(process.cwd(), "lib", "demo");
export const SNAPSHOT_DATA = join(SNAPSHOT_DIR, "snapshot.tar.gz");
export const SNAPSHOT_META = join(SNAPSHOT_DIR, "snapshot.json");

/** Changes whenever the schema or the catalogue changes, so stale snapshots are ignored. */
export function demoFingerprint() {
  return createHash("sha256")
    .update(SCHEMA_SQL)
    .update(JSON.stringify(COURSES))
    .update(JSON.stringify(INSTRUCTORS))
    .digest("hex")
    .slice(0, 16);
}

/** The snapshot and when it was taken, or null when it's missing or out of date. */
export function readSnapshot(): { data: Blob; takenAt: number } | null {
  try {
    const meta = JSON.parse(readFileSync(SNAPSHOT_META, "utf8")) as {
      fingerprint: string;
      takenAt: string;
    };
    if (meta.fingerprint !== demoFingerprint()) {
      console.warn(
        "[demo] The snapshot is out of date, seeding from scratch. Run npm run demo:snapshot.",
      );
      return null;
    }
    return {
      data: new Blob([readFileSync(SNAPSHOT_DATA)]),
      takenAt: Date.parse(meta.takenAt),
    };
  } catch {
    return null;
  }
}

/**
 * The seed writes dates relative to when it ran ("enrolled 2 days ago").
 * Moves every timestamp forward by the snapshot's age so they stay relative to now.
 */
export function shiftDatesSql(takenAt: number) {
  const seconds = Math.max(0, Math.round((Date.now() - takenAt) / 1000));
  return `
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND data_type LIKE 'timestamp%'
  LOOP
    EXECUTE format('UPDATE %I SET %I = %I + interval ''${seconds} seconds''', r.table_name, r.column_name, r.column_name);
  END LOOP;
END $$;`;
}
