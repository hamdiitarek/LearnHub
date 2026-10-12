// Writes lib/demo/snapshot.tar.gz (+ snapshot.json): the demo database right after
// the seed, which the app loads instead of seeding on every cold start.
// Run after changing the schema, the catalogue or the seed: npm run demo:snapshot
import { writeFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { SCHEMA_SQL } from "../lib/demo/schema";
import { seedDemo } from "../lib/demo/seed";
import {
  SNAPSHOT_DATA,
  SNAPSHOT_META,
  demoFingerprint,
} from "../lib/demo/snapshot";

async function main() {
  const pglite = new PGlite();
  await pglite.exec(SCHEMA_SQL);
  const takenAt = new Date().toISOString();
  const db = new PrismaClient({ adapter: new PrismaPGlite(pglite) });
  await seedDemo(db);

  const dump = await pglite.dumpDataDir("gzip");
  writeFileSync(SNAPSHOT_DATA, Buffer.from(await dump.arrayBuffer()));
  writeFileSync(
    SNAPSHOT_META,
    `${JSON.stringify({ fingerprint: demoFingerprint(), takenAt }, null, 2)}\n`,
  );
  console.log(`Wrote ${SNAPSHOT_DATA} (${Math.round(dump.size / 1024)} KB)`);

  await db.$disconnect();
  await pglite.close();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
