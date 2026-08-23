import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Cached on globalThis (not just a module-level variable) so Next.js dev's
// hot-module-reloading doesn't accumulate a fresh client — and therefore a
// fresh Postgres connection pool — on every file save.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient | null;
};

function createClient(): PrismaClient | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

/** Null when DATABASE_URL isn't set — every caller in this app treats that
 * as "this feature isn't configured" and fails open, same as the Redis
 * clients elsewhere in lib/. */
export function getPrisma(): PrismaClient | null {
  if (globalForPrisma.prisma === undefined) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}
