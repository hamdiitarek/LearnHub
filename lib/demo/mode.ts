/**
 * Demo or live, set with DEMO_MODE in .env (server-side only):
 *
 *   DEMO_MODE=true   built-in demo database with seeded courses and one-click
 *                    demo accounts. DATABASE_URL is ignored.
 *   DEMO_MODE=false  live: your PostgreSQL at DATABASE_URL, no demo data and
 *                    no demo sign-in.
 *
 * Left unset, LearnHub runs the demo only when there is no DATABASE_URL.
 */
const flag = process.env.DEMO_MODE?.trim().toLowerCase();

export const isDemo = flag
  ? flag === "true" || flag === "1"
  : !process.env.DATABASE_URL;
