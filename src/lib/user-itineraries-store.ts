import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { Itinerary } from "@/types/itinerary";
import { getPrisma } from "@/lib/prisma";

export type CollaboratorRole = "editor" | "viewer";
export type AccessRole = "owner" | CollaboratorRole;

export interface OwnedOrSharedItinerary {
  itinerary: Itinerary;
  role: AccessRole;
}

export function isAccountStoreConfigured(): boolean {
  return getPrisma() !== null;
}

/** Every itinerary a user can see — owned outright, or shared with them via
 * a Collaborator row — newest-edited first, alongside their role on each. */
export async function listUserItineraries(
  userId: string
): Promise<OwnedOrSharedItinerary[]> {
  const prisma = getPrisma();
  if (!prisma) return [];
  const rows = await prisma.itinerary.findMany({
    where: {
      OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
    },
    orderBy: { updatedAt: "desc" },
    include: { collaborators: { where: { userId } } },
  });
  return rows.map((row) => ({
    itinerary: row.data as unknown as Itinerary,
    role: row.ownerId === userId ? "owner" : (row.collaborators[0]?.role as CollaboratorRole) ?? "viewer",
  }));
}

/** Saves an itinerary on behalf of `userId` — either as its owner (new
 * itinerary, or one they already own) or, if they're an "editor"
 * collaborator on an existing itinerary, without disturbing its ownerId.
 * Throws if the user has no write access. */
export async function saveUserItinerary(
  userId: string,
  itinerary: Itinerary
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("Account store is not configured (missing DATABASE_URL).");
  }

  const existing = await prisma.itinerary.findUnique({
    where: { id: itinerary.id },
    select: { ownerId: true },
  });

  if (existing && existing.ownerId !== userId) {
    const collaborator = await prisma.collaborator.findUnique({
      where: { itineraryId_userId: { itineraryId: itinerary.id, userId } },
    });
    if (!collaborator || collaborator.role !== "editor") {
      throw new Error("Not authorized to edit this itinerary.");
    }
  }

  const data = itinerary as unknown as Prisma.InputJsonValue;
  await prisma.itinerary.upsert({
    where: { id: itinerary.id },
    // Never touch ownerId here — an editor saving changes must not
    // reassign ownership to themselves.
    update: { data },
    create: { id: itinerary.id, ownerId: userId, data },
  });
}

/** Resolves what access (if any) `userId` has to `itineraryId` — "owner",
 * their collaborator role, or null if they have no access (or the itinerary
 * doesn't exist). Used to gate the realtime-sync auth endpoint. */
export async function getAccessRole(
  userId: string,
  itineraryId: string
): Promise<AccessRole | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  const itinerary = await prisma.itinerary.findUnique({
    where: { id: itineraryId },
    select: {
      ownerId: true,
      collaborators: { where: { userId } },
    },
  });
  if (!itinerary) return null;
  if (itinerary.ownerId === userId) return "owner";
  const collaborator = itinerary.collaborators[0];
  return collaborator ? (collaborator.role as CollaboratorRole) : null;
}

/** Owner-only: deletes the itinerary outright (and, via cascade, its
 * collaborators/invite links). No-ops if `userId` isn't the owner — same
 * safety property the old per-user Redis hash had structurally. */
export async function deleteUserItinerary(
  userId: string,
  itineraryId: string
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  await prisma.itinerary.deleteMany({
    where: { id: itineraryId, ownerId: userId },
  });
}
