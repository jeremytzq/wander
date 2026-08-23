import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { Itinerary } from "@/types/itinerary";
import { getPrisma } from "@/lib/prisma";

export function isAccountStoreConfigured(): boolean {
  return getPrisma() !== null;
}

/** All of a signed-in user's itineraries, newest-edited first. */
export async function listUserItineraries(userId: string): Promise<Itinerary[]> {
  const prisma = getPrisma();
  if (!prisma) return [];
  const rows = await prisma.itinerary.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((row) => row.data as unknown as Itinerary);
}

export async function saveUserItinerary(
  userId: string,
  itinerary: Itinerary
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("Account store is not configured (missing DATABASE_URL).");
  }
  const data = itinerary as unknown as Prisma.InputJsonValue;
  await prisma.itinerary.upsert({
    where: { id: itinerary.id },
    update: { data, ownerId: userId },
    create: { id: itinerary.id, ownerId: userId, data },
  });
}

export async function deleteUserItinerary(
  userId: string,
  itineraryId: string
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  // Compound where (id + ownerId) so this can never delete another user's
  // itinerary even if the id were guessed — same safety property the old
  // per-user Redis hash had structurally.
  await prisma.itinerary.deleteMany({
    where: { id: itineraryId, ownerId: userId },
  });
}
