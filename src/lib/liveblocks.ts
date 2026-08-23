import "server-only";
import { Liveblocks } from "@liveblocks/node";

export { roomIdForItinerary } from "@/lib/liveblocks-room";

const globalForLiveblocks = globalThis as unknown as {
  liveblocks?: Liveblocks | null;
};

function createClient(): Liveblocks | null {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) return null;
  return new Liveblocks({ secret });
}

/** Null when LIVEBLOCKS_SECRET_KEY isn't set — realtime sync is an optional
 * feature that fails open, same pattern as getPrisma()/the Redis clients. */
export function getLiveblocksServer(): Liveblocks | null {
  if (globalForLiveblocks.liveblocks === undefined) {
    globalForLiveblocks.liveblocks = createClient();
  }
  return globalForLiveblocks.liveblocks;
}

export function isRealtimeSyncConfigured(): boolean {
  return getLiveblocksServer() !== null;
}
