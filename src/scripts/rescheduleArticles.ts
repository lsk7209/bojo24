/**
 * Reschedule all art*-prefixed posts at 5-hour intervals in slug order.
 * Usage: SCHEDULE_BASE_TIME=2026-05-16T10:00:00Z tsx src/scripts/rescheduleArticles.ts
 */
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const INTERVAL_MS = 5 * 60 * 60 * 1000;

async function main() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || "",
    authToken: process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || "",
  });

  const baseMs = process.env.SCHEDULE_BASE_TIME
    ? new Date(process.env.SCHEDULE_BASE_TIME).getTime()
    : Date.now();

  const { rows } = await db.execute(
    "SELECT id, slug FROM posts WHERE slug LIKE 'art%' ORDER BY slug ASC"
  );

  console.log(`Found ${rows.length} art* posts. Rescheduling from ${new Date(baseMs).toISOString()}...`);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const publishedAt = new Date(baseMs + i * INTERVAL_MS).toISOString();
    await db.execute({
      sql: "UPDATE posts SET published_at = ? WHERE id = ?",
      args: [publishedAt, row[0] as string],
    });
    console.log(`[${i + 1}/${rows.length}] ${row[1]} → ${publishedAt}`);
  }

  console.log("Done.");
  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
