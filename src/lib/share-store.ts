import "server-only";
import { cache } from "react";
import { Redis } from "@upstash/redis";
import { Itinerary } from "@/types/itinerary";

const SHARE_TTL_SECONDS = 60 * 60 * 24 * 365; // ~1 year
const KEY_PREFIX = "wander:share:";

let client: Redis | null | undefined;

function getClient(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}

export function isShareStoreConfigured(): boolean {
  return getClient() !== null;
}

export async function saveSharedItinerary(
  id: string,
  itinerary: Itinerary
): Promise<void> {
  const redis = getClient();
  if (!redis) {
    throw new Error(
      "Share store is not configured (missing UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN)."
    );
  }
  await redis.set(KEY_PREFIX + id, itinerary, { ex: SHARE_TTL_SECONDS });
}

// Wrapped in React's cache() so a page and its generateMetadata (which both
// need the same itinerary within one request) only hit Redis once.
export const getSharedItinerary = cache(
  async (id: string): Promise<Itinerary | null> => {
    const redis = getClient();
    if (!redis) return null;
    const value = await redis.get<Itinerary>(KEY_PREFIX + id);
    return value ?? null;
  }
);
