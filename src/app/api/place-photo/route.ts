import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

// Only a Places API (New) photo resource path, e.g.
// "places/ChIJ.../photos/AUacm...". Guards against the `name` query param
// being used to make this route fetch anything other than a Google Places
// photo with our server-side key.
const PHOTO_NAME_PATTERN = /^places\/[^/]+\/photos\/[^/]+$/;

/**
 * Proxies a Places API (New) photo through our server so the unrestricted
 * GOOGLE_PLACES_SERVER_API_KEY never appears in a URL sent to the browser
 * (unlike the classic Places JS SDK's photo.getUrl(), which embeds the key
 * directly — fine for a referrer-restricted client key, not fine for an
 * unrestricted server key).
 */
export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, "place-photo", {
    anon: { tokens: 200, window: "5 m" },
  });
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const name = request.nextUrl.searchParams.get("name");
  const key = process.env.GOOGLE_PLACES_SERVER_API_KEY;

  if (!name || !key) {
    return NextResponse.json({ error: "Photo not available." }, { status: 404 });
  }
  if (!PHOTO_NAME_PATTERN.test(name)) {
    return NextResponse.json({ error: "Invalid photo reference." }, { status: 400 });
  }

  const googleUrl = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=800&key=${key}`;

  let res: Response;
  try {
    res = await fetch(googleUrl);
  } catch {
    return NextResponse.json({ error: "Failed to load photo." }, { status: 502 });
  }
  if (!res.ok || !res.body) {
    return NextResponse.json({ error: "Failed to load photo." }, { status: 502 });
  }

  return new NextResponse(res.body, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
