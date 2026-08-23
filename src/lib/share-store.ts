import "server-only";
import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { Itinerary } from "@/types/itinerary";
import { getPrisma } from "@/lib/prisma";

export function isShareStoreConfigured(): boolean {
  return getPrisma() !== null;
}

export async function saveSharedItinerary(
  id: string,
  itinerary: Itinerary
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("Share store is not configured (missing DATABASE_URL).");
  }
  const data = itinerary as unknown as Prisma.InputJsonValue;
  await prisma.shareLink.upsert({
    where: { id },
    update: { data },
    create: { id, data },
  });
}

// Wrapped in React's cache() so a page and its generateMetadata (which both
// need the same itinerary within one request) only hit the DB once.
export const getSharedItinerary = cache(
  async (id: string): Promise<Itinerary | null> => {
    const prisma = getPrisma();
    if (!prisma) return null;
    const row = await prisma.shareLink.findUnique({ where: { id } });
    return row ? (row.data as unknown as Itinerary) : null;
  }
);
