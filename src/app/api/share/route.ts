import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { Itinerary } from "@/types/itinerary";
import { isShareStoreConfigured, saveSharedItinerary } from "@/lib/share-store";
import { checkRateLimit } from "@/lib/rate-limit";

// Unambiguous alphabet (no 0/O/1/I/l) since these ids may end up read aloud
// or typed by hand.
const nanoid = customAlphabet(
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz",
  9
);

const MAX_PAYLOAD_BYTES = 300_000; // generous headroom over any real itinerary

function isValidItinerary(value: unknown): value is Itinerary {
  if (!value || typeof value !== "object") return false;
  const it = value as Record<string, unknown>;
  return (
    typeof it.id === "string" &&
    typeof it.name === "string" &&
    typeof it.startDate === "string" &&
    Array.isArray(it.days)
  );
}

export async function POST(request: NextRequest) {
  if (!isShareStoreConfigured()) {
    return NextResponse.json(
      { error: "Short links aren't configured on this deployment." },
      { status: 503 }
    );
  }

  const rateLimit = await checkRateLimit(request, "share", {
    anon: { tokens: 10, window: "10 m" },
    user: { tokens: 30, window: "10 m" },
  });
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const raw = await request.text();
  if (raw.length > MAX_PAYLOAD_BYTES) {
    return NextResponse.json(
      { error: "Itinerary is too large to share." },
      { status: 413 }
    );
  }

  let itinerary: unknown;
  try {
    itinerary = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isValidItinerary(itinerary)) {
    return NextResponse.json(
      { error: "Payload doesn't look like an itinerary." },
      { status: 400 }
    );
  }

  const id = nanoid();
  try {
    await saveSharedItinerary(id, itinerary);
  } catch {
    return NextResponse.json(
      { error: "Failed to save the shared itinerary." },
      { status: 500 }
    );
  }

  return NextResponse.json({ id });
}
