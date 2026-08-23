// Prisma v7 doesn't auto-load .env files, and this project's convention
// (matching Next.js) is `.env.local`, not the default `.env` — so this has
// to be loaded explicitly, before `defineConfig` resolves DATABASE_URL.
import { config } from "dotenv";
config({ path: ".env.local" });

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
    // Optional: a non-pooled connection Prisma Migrate should use instead
    // of DATABASE_URL (needed with providers like Neon/Vercel Postgres,
    // where DATABASE_URL is a pgbouncer-pooled connection that schema
    // migrations can't run over reliably). Safe to leave unset — falls
    // back to DATABASE_URL.
    directUrl: process.env.DIRECT_URL,
  },
});
