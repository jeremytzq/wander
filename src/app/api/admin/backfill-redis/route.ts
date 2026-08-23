import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { Itinerary } from "@/types/itinerary";

// ONE-TIME MIGRATION TOOL — delete this file once you've run it.
//
// Copies every itinerary out of the old Upstash Redis stores (share links
// and signed-in users' account itineraries) into the new Postgres tables.
// Safe to re-run (everything is an upsert), so if it fails partway through
// just call it again.
//
// Run it against your deployed app (this needs real network access to both
// Redis and Postgres — a local sandbox with restricted egress can't reach
// either):
//
//   curl -X POST https://<your-domain>/api/admin/backfill-redis \
//     -H "x-migration-secret: $MIGRATION_SECRET"
//
// Gated behind a dedicated MIGRATION_SECRET env var (set it in Vercel ->
// Settings -> Environment Variables, checking Production) purely so this
// can't be triggered by anyone who stumbles on the URL.

const SHARE_KEY_PREFIX = "wander:share:";
const USER_KEY_PREFIX = "wander:user:";
const USER_KEY_SUFFIX = ":itineraries";

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}

/** Every key matching `pattern`, following SCAN's cursor until it wraps to "0". */
async function scanAllKeys(redis: Redis, pattern: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = "0";
  do {
    const [nextCursor, batch] = await redis.scan(cursor, {
      match: pattern,
      count: 200,
    });
    keys.push(...batch);
    cursor = nextCursor;
  } while (cursor !== "0");
  return keys;
}

export async function POST(request: NextRequest) {
  const providedSecret = request.headers.get("x-migration-secret");
  const expectedSecret = process.env.MIGRATION_SECRET;
  if (!expectedSecret || providedSecret !== expectedSecret) {
    // Doesn't leak the secret's value — just whether the env var reached
    // this deployment at all, since that's the failure mode that's easy to
    // mistake for "wrong secret" when it's actually "not set here yet".
    return NextResponse.json(
      { error: "Not authorized.", secretConfiguredOnServer: !!expectedSecret },
      { status: 401 }
    );
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json(
      { error: "Redis isn't configured (missing UPSTASH_REDIS_REST_URL/TOKEN)." },
      { status: 503 }
    );
  }
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      { error: "Postgres isn't configured (missing DATABASE_URL)." },
      { status: 503 }
    );
  }

  const errors: string[] = [];
  let shareLinksMigrated = 0;
  let userItinerariesMigrated = 0;
  let shareKeys: string[] = [];

  try {
    // 1. Share links: wander:share:{id} -> a single Itinerary blob.
    shareKeys = await scanAllKeys(redis, `${SHARE_KEY_PREFIX}*`);
  } catch (err) {
    return NextResponse.json(
      {
        error: `Couldn't reach Redis to list share links: ${
          err instanceof Error ? err.message : String(err)
        }`,
        shareLinksMigrated,
        userItinerariesMigrated,
      },
      { status: 502 }
    );
  }
  for (const key of shareKeys) {
    const id = key.slice(SHARE_KEY_PREFIX.length);
    try {
      const itinerary = await redis.get<Itinerary>(key);
      if (!itinerary) continue;
      const data = itinerary as unknown as Prisma.InputJsonValue;
      await prisma.shareLink.upsert({
        where: { id },
        update: { data },
        create: { id, data },
      });
      shareLinksMigrated++;
    } catch (err) {
      errors.push(`share ${id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2. Account itineraries: wander:user:{userId}:itineraries -> a hash of
  // { [itineraryId]: Itinerary }.
  let userKeys: string[] = [];
  try {
    userKeys = await scanAllKeys(redis, `${USER_KEY_PREFIX}*${USER_KEY_SUFFIX}`);
  } catch (err) {
    return NextResponse.json(
      {
        error: `Couldn't reach Redis to list account itineraries: ${
          err instanceof Error ? err.message : String(err)
        }`,
        shareLinksFound: shareKeys.length,
        shareLinksMigrated,
        userItinerariesMigrated,
        errors,
      },
      { status: 502 }
    );
  }
  for (const key of userKeys) {
    const userId = key.slice(USER_KEY_PREFIX.length, -USER_KEY_SUFFIX.length);
    try {
      const map = await redis.hgetall<Record<string, Itinerary>>(key);
      if (!map) continue;
      for (const itinerary of Object.values(map)) {
        try {
          const data = itinerary as unknown as Prisma.InputJsonValue;
          await prisma.itinerary.upsert({
            where: { id: itinerary.id },
            update: { data, ownerId: userId },
            create: { id: itinerary.id, ownerId: userId, data },
          });
          userItinerariesMigrated++;
        } catch (err) {
          errors.push(
            `itinerary ${itinerary.id} (user ${userId}): ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }
      }
    } catch (err) {
      errors.push(`user key ${key}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({
    shareLinksFound: shareKeys.length,
    shareLinksMigrated,
    userItinerariesMigrated,
    errors,
  });
}
