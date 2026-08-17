import "server-only";
import { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { auth } from "@/auth";

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || "unknown";
}

type Duration = Parameters<typeof Ratelimit.slidingWindow>[1];
interface Tier {
  tokens: number;
  window: Duration;
}

export interface RateLimitOptions {
  /** Applied to unauthenticated requests, keyed by client IP. */
  anon: Tier;
  /** Higher limit for signed-in requests, keyed by user id. Omit to skip
   * the session lookup entirely and always apply `anon` (for routes that
   * don't distinguish signed-in users, e.g. the public photo proxy). */
  user?: Tier;
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

const limiters = new Map<string, Ratelimit>();

function getLimiter(cacheKey: string, redisClient: Redis, tier: Tier): Ratelimit {
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(tier.tokens, tier.window),
      prefix: `wander:ratelimit:${cacheKey}`,
      analytics: false,
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

/**
 * Sliding-window rate limit keyed by signed-in user id (the higher
 * `options.user` tier, if set) or client IP (`options.anon`). Fails open —
 * allows the request through — whenever Upstash isn't configured, so local
 * dev and deployments without Redis aren't blocked by this.
 */
export async function checkRateLimit(
  request: NextRequest,
  route: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const redisClient = getRedis();
  if (!redisClient) return { ok: true };

  let tierName: "anon" | "user" = "anon";
  let identifier = getClientIp(request);

  if (options.user) {
    try {
      const session = await auth();
      if (session?.user?.id) {
        tierName = "user";
        identifier = session.user.id;
      }
    } catch {
      // Session lookup failed for any reason — fall back to IP/anon.
    }
  }

  const tier = tierName === "user" ? options.user! : options.anon;
  const limiter = getLimiter(`${route}:${tierName}`, redisClient, tier);

  try {
    const result = await limiter.limit(identifier);
    if (result.success) return { ok: true };
    const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
    return { ok: false, retryAfterSeconds };
  } catch (err) {
    // Upstash unreachable/erroring — fail open rather than taking the route
    // down over a rate-limiter outage.
    console.error(`checkRateLimit(${route}) failed, allowing request:`, err);
    return { ok: true };
  }
}
