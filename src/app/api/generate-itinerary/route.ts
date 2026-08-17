import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { generateItinerary, isAiGenerationConfigured } from "@/lib/ai/generate-itinerary";
import { checkRateLimit } from "@/lib/rate-limit";

// Generation involves a Claude call plus several parallel Places API
// lookups; give it more room than the platform's default function timeout.
export const maxDuration = 60;

const MAX_DAYS = 14;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { destination, days, interests, startDate, apiKey } = (body ?? {}) as Record<
    string,
    unknown
  >;
  const userApiKey =
    typeof apiKey === "string" && apiKey.trim() ? apiKey.trim() : undefined;

  if (!isAiGenerationConfigured(!!userApiKey)) {
    return NextResponse.json(
      { error: "AI itinerary generation isn't configured on this deployment." },
      { status: 503 }
    );
  }

  const rateLimit = await checkRateLimit(request, "generate-itinerary", {
    anon: { tokens: 5, window: "1 h" },
    user: { tokens: 20, window: "1 h" },
  });
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  if (typeof destination !== "string" || !destination.trim()) {
    return NextResponse.json({ error: "Destination is required." }, { status: 400 });
  }

  const dayCount = Number(days);
  if (!Number.isInteger(dayCount) || dayCount < 1 || dayCount > MAX_DAYS) {
    return NextResponse.json(
      { error: `Days must be a whole number between 1 and ${MAX_DAYS}.` },
      { status: 400 }
    );
  }

  try {
    const result = await generateItinerary({
      destination: destination.trim(),
      days: dayCount,
      interests: typeof interests === "string" ? interests.trim() || undefined : undefined,
      startDate: typeof startDate === "string" && startDate ? startDate : undefined,
      apiKey: userApiKey,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "That Anthropic API key was rejected. Please check it and try again." },
        { status: 401 }
      );
    }
    console.error("generateItinerary failed:", err);
    return NextResponse.json(
      { error: "Failed to generate an itinerary. Please try again." },
      { status: 500 }
    );
  }
}
