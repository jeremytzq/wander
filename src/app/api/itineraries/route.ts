import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Itinerary } from "@/types/itinerary";
import {
  isAccountStoreConfigured,
  listUserItineraries,
  saveUserItinerary,
} from "@/lib/user-itineraries-store";
import { checkRateLimit } from "@/lib/rate-limit";

const ITINERARIES_LIMITS = {
  anon: { tokens: 10, window: "1 h" as const },
  user: { tokens: 60, window: "1 h" as const },
};

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

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!isAccountStoreConfigured()) {
    return NextResponse.json(
      { error: "Account sync isn't configured on this deployment." },
      { status: 503 }
    );
  }

  const rateLimit = await checkRateLimit(request, "itineraries", ITINERARIES_LIMITS);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const itineraries = await listUserItineraries(session.user.id);
    return NextResponse.json({ itineraries });
  } catch {
    return NextResponse.json(
      { error: "Failed to load your itineraries." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!isAccountStoreConfigured()) {
    return NextResponse.json(
      { error: "Account sync isn't configured on this deployment." },
      { status: 503 }
    );
  }

  const rateLimit = await checkRateLimit(request, "itineraries", ITINERARIES_LIMITS);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const raw = await request.text();
  if (raw.length > MAX_PAYLOAD_BYTES) {
    return NextResponse.json(
      { error: "Itinerary is too large to save." },
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

  try {
    await saveUserItinerary(session.user.id, itinerary);
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Not authorized")) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to save the itinerary." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
