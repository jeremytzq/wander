import "server-only";
import { OpeningHours, OpeningPeriod } from "@/types/itinerary";

export interface ResolvedPlace {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  photoUrl?: string;
  rating?: number;
  country?: string;
  countryCode?: string;
  openingHours?: OpeningHours;
}

interface GooglePlaceLite {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  photos?: { name: string }[];
  addressComponents?: { longText: string; shortText: string; types: string[] }[];
  regularOpeningHours?: {
    periods?: {
      open?: { day: number; hour: number; minute: number };
      close?: { day: number; hour: number; minute: number };
    }[];
  };
}

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.photos",
  "places.regularOpeningHours",
  "places.addressComponents",
].join(",");

export function isPlacesServerConfigured(): boolean {
  return !!process.env.GOOGLE_PLACES_SERVER_API_KEY;
}

/**
 * Resolves a free-text search query (as suggested by the AI planner) to a
 * real place via the Places API (New) Text Search endpoint, server-side —
 * grounds the LLM's suggestion in an actual place with a real position,
 * address, and (if available) opening hours, rather than trusting the model
 * to invent coordinates.
 */
export async function searchPlaceText(query: string): Promise<ResolvedPlace | null> {
  const key = process.env.GOOGLE_PLACES_SERVER_API_KEY;
  if (!key) return null;

  let res: Response;
  try {
    res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({ textQuery: query, pageSize: 1 }),
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const data = (await res.json()) as { places?: GooglePlaceLite[] };
  const place = data.places?.[0];
  if (!place || !place.location) return null;

  const countryComponent = (place.addressComponents ?? []).find((c) =>
    c.types?.includes("country")
  );

  return {
    placeId: place.id,
    name: place.displayName?.text ?? query,
    address: place.formattedAddress ?? "",
    lat: place.location.latitude,
    lng: place.location.longitude,
    photoUrl: place.photos?.[0]?.name
      ? `/api/place-photo?name=${encodeURIComponent(place.photos[0].name)}`
      : undefined,
    rating: place.rating,
    country: countryComponent?.longText,
    countryCode: countryComponent?.shortText,
    openingHours: mapOpeningHours(place.regularOpeningHours),
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function mapOpeningHours(
  raw: GooglePlaceLite["regularOpeningHours"]
): OpeningHours | undefined {
  if (!raw?.periods?.length) return undefined;

  if (raw.periods.length === 1) {
    const p = raw.periods[0];
    if (
      p.open &&
      p.open.day === 0 &&
      p.open.hour === 0 &&
      p.open.minute === 0 &&
      !p.close
    ) {
      return { periods: [], alwaysOpen: true };
    }
  }

  const periods: OpeningPeriod[] = raw.periods
    .filter((p) => !!p.open)
    .map((p) => ({
      openDay: p.open!.day,
      openTime: `${pad(p.open!.hour)}${pad(p.open!.minute)}`,
      closeDay: p.close?.day,
      closeTime: p.close ? `${pad(p.close.hour)}${pad(p.close.minute)}` : undefined,
    }));

  return periods.length > 0 ? { periods } : undefined;
}
