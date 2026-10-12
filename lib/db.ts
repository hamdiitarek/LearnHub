import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { Pool } from "pg";
import { SCHEMA_SQL } from "@/lib/demo/schema";
import { seedDemo } from "@/lib/demo/seed";
import { isDemo } from "@/lib/demo/mode";

/**
 * In demo mode (see lib/demo/mode.ts) LearnHub is self-contained: Postgres runs
 * in-process (PGlite) and is seeded with the demo catalogue on first use.
 * Changes last until the server restarts.
 */
export { isDemo };

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  if (!isDemo) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL is required when DEMO_MODE=false. Set it, or set DEMO_MODE=true for the demo.",
      );
    }
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    return new PrismaClient({ adapter: new PrismaPg(pool) });
  }

  const pglite = new PGlite();
  const base = new PrismaClient({ adapter: new PrismaPGlite(pglite) });
  const ready = (async () => {
    await pglite.exec(SCHEMA_SQL);
    await seedDemo(base);
  })();

  // Every query waits for the schema and seed, so callers never see an empty database.
  return base.$extends({
    query: {
      async $allOperations({ args, query }) {
        await ready;
        return query(args);
      },
    },
  }) as unknown as PrismaClient;
}

export const db = globalForPrisma.prisma ?? createClient();

// The demo database must be one instance per process, so cache it in production too.
if (isDemo || process.env.NODE_ENV !== "production")
  globalForPrisma.prisma = db;
