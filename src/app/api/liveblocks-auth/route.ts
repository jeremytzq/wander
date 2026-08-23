import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAccessRole } from "@/lib/user-itineraries-store";
import { getLiveblocksServer } from "@/lib/liveblocks";
import { roomIdForItinerary } from "@/lib/liveblocks-room";
import { checkRateLimit } from "@/lib/rate-limit";

// Liveblocks room ids are "itinerary:<id>" — recover the itinerary id from
// the room id the client requests access to.
function itineraryIdForRoom(roomId: string): string | null {
  return roomId.startsWith("itinerary:") ? roomId.slice("itinerary:".length) : null;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const liveblocks = getLiveblocksServer();
  if (!liveblocks) {
    return NextResponse.json(
      { error: "Realtime sync isn't configured on this deployment." },
      { status: 503 }
    );
  }

  const rateLimit = await checkRateLimit(request, "liveblocks-auth", {
    anon: { tokens: 5, window: "10 m" },
    user: { tokens: 60, window: "10 m" },
  });
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const roomId = (body as Record<string, unknown> | null)?.room;
  if (typeof roomId !== "string") {
    return NextResponse.json({ error: "Missing room." }, { status: 400 });
  }

  const itineraryId = itineraryIdForRoom(roomId);
  if (!itineraryId) {
    return NextResponse.json({ error: "Unrecognized room." }, { status: 400 });
  }

  const role = await getAccessRole(session.user.id, itineraryId);
  if (!role) {
    return NextResponse.json({ error: "No access to this trip." }, { status: 403 });
  }

  const lbSession = liveblocks.prepareSession(session.user.id, {
    userInfo: { name: session.user.name ?? "Anonymous", image: session.user.image ?? null },
  });
  lbSession.allow(roomIdForItinerary(itineraryId), role === "viewer" ? ["*:read"] : ["*:write"]);

  const { status, body: authBody } = await lbSession.authorize();
  return new NextResponse(authBody, { status, headers: { "Content-Type": "application/json" } });
}
