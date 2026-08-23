// Prisma v7 doesn't auto-load .env files, and this project's convention
// (matching Next.js) is `.env.local`, not the default `.env` — so this has
// to be loaded explicitly, before `defineConfig` resolves DATABASE_URL.
import { config } from "dotenv";
config({ path: ".env.local" });

import { defineConfig } from "prisma/config";

// Note: this file only configures the Prisma CLI (generate/migrate/studio).
// The app's own runtime connection (src/lib/prisma.ts, via the pg driver
// adapter) is configured separately and always uses DATABASE_URL — the two
// aren't linked, which is what lets us give the CLI a different URL below.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prefer DIRECT_URL for the CLI when set: providers like Neon/Vercel
    // Postgres give you a pgbouncer-pooled DATABASE_URL for the app plus a
    // separate non-pooled URL, and schema migrations need the non-pooled
    // one to run reliably. Falls back to DATABASE_URL if DIRECT_URL isn't
    // set (e.g. a plain Postgres instance with only one connection string).
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
