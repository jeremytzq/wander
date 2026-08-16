import "server-only";
import { Redis } from "@upstash/redis";
import { Itinerary } from "@/types/itinerary";

const KEY_PREFIX = "wander:user:";

let client: Redis | null | undefined;

function getClient(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}

export function isAccountStoreConfigured(): boolean {
  return getClient() !== null;
}

function userKey(userId: string): string {
  return `${KEY_PREFIX}${userId}:itineraries`;
}

/** All of a signed-in user's itineraries, newest-edited first. */
export async function listUserItineraries(userId: string): Promise<Itinerary[]> {
  const redis = getClient();
  if (!redis) return [];
  const map = await redis.hgetall<Record<string, Itinerary>>(userKey(userId));
  if (!map) return [];
  return Object.values(map).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveUserItinerary(
  userId: string,
  itinerary: Itinerary
): Promise<void> {
  const redis = getClient();
  if (!redis) {
    throw new Error(
      "Account store is not configured (missing UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN)."
    );
  }
  await redis.hset(userKey(userId), { [itinerary.id]: itinerary });
}

export async function deleteUserItinerary(
  userId: string,
  itineraryId: string
): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  await redis.hdel(userKey(userId), itineraryId);
}
