import "server-only";
import { customAlphabet } from "nanoid";
import { getPrisma } from "@/lib/prisma";
import { Itinerary } from "@/types/itinerary";
import { CollaboratorRole, AccessRole } from "@/lib/user-itineraries-store";

// Same unambiguous alphabet as share-store.ts's short ids.
const nanoid = customAlphabet(
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz",
  12
);

export function isCollaborationConfigured(): boolean {
  return getPrisma() !== null;
}

/** Owner-only: creates a new invite link granting `role` on `itineraryId`.
 * Returns the link's token (the /invite/[token] path segment), or null if
 * `userId` isn't that itinerary's owner. */
export async function createInviteLink(
  itineraryId: string,
  ownerUserId: string,
  role: CollaboratorRole
): Promise<string | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  const itinerary = await prisma.itinerary.findUnique({
    where: { id: itineraryId },
    select: { ownerId: true },
  });
  if (!itinerary || itinerary.ownerId !== ownerUserId) return null;

  const id = nanoid();
  await prisma.inviteLink.create({ data: { id, itineraryId, role } });
  return id;
}

export interface AcceptedInvite {
  itinerary: Itinerary;
  role: AccessRole;
}

/** Resolves an invite token and grants `userId` access to that itinerary
 * (idempotent — safe to call every time the link is opened). If the user
 * already owns the itinerary, this is a no-op beyond returning it with
 * role "owner". Returns null if the token doesn't exist. */
export async function acceptInvite(
  token: string,
  userId: string
): Promise<AcceptedInvite | null> {
  const prisma = getPrisma();
  if (!prisma) return null;

  const invite = await prisma.inviteLink.findUnique({ where: { id: token } });
  if (!invite) return null;

  const itinerary = await prisma.itinerary.findUnique({
    where: { id: invite.itineraryId },
  });
  if (!itinerary) return null;

  if (itinerary.ownerId === userId) {
    return { itinerary: itinerary.data as unknown as Itinerary, role: "owner" };
  }

  const role = invite.role as CollaboratorRole;
  await prisma.collaborator.upsert({
    where: {
      itineraryId_userId: { itineraryId: invite.itineraryId, userId },
    },
    update: { role },
    create: { itineraryId: invite.itineraryId, userId, role },
  });

  return { itinerary: itinerary.data as unknown as Itinerary, role };
}
