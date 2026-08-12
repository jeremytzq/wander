import LZString from "lz-string";
import { Itinerary } from "@/types/itinerary";

const ITINERARIES_KEY = "wander:itineraries";
const ACTIVE_ID_KEY = "wander:activeItineraryId";

type ItineraryMap = Record<string, Itinerary>;

function readAll(): ItineraryMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ITINERARIES_KEY);
    return raw ? (JSON.parse(raw) as ItineraryMap) : {};
  } catch {
    return {};
  }
}

function writeAll(map: ItineraryMap) {
  window.localStorage.setItem(ITINERARIES_KEY, JSON.stringify(map));
}

export function listItineraries(): Itinerary[] {
  return Object.values(readAll()).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
}

export function saveItinerary(itinerary: Itinerary) {
  const map = readAll();
  map[itinerary.id] = itinerary;
  writeAll(map);
  window.localStorage.setItem(ACTIVE_ID_KEY, itinerary.id);
}

export function deleteItinerary(id: string) {
  const map = readAll();
  delete map[id];
  writeAll(map);
}

export function getActiveItineraryId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_ID_KEY);
}

export function setActiveItineraryId(id: string) {
  window.localStorage.setItem(ACTIVE_ID_KEY, id);
}

export function getItinerary(id: string): Itinerary | null {
  return readAll()[id] ?? null;
}

// Google Places photo URLs are ~1KB each (and embed the API key), so a trip
// with many photographed stops can blow the share link past any browser or
// server's URL length limit. Photos aren't essential to a shared itinerary
// (name/address/rating/pin still show), so they're dropped before encoding.
function stripPhotosForSharing(itinerary: Itinerary): Itinerary {
  return {
    ...itinerary,
    days: itinerary.days.map((day) => ({
      ...day,
      stops: day.stops.map((stop) => ({
        id: stop.id,
        placeId: stop.placeId,
        name: stop.name,
        address: stop.address,
        lat: stop.lat,
        lng: stop.lng,
        rating: stop.rating,
        notes: stop.notes,
      })),
    })),
  };
}

/** Encodes an itinerary into a URL-safe, compressed string for shareable links. */
export function encodeItineraryForShare(itinerary: Itinerary): string {
  const json = JSON.stringify(stripPhotosForSharing(itinerary));
  return LZString.compressToEncodedURIComponent(json);
}

export function decodeItineraryFromShare(encoded: string): Itinerary | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    return JSON.parse(json) as Itinerary;
  } catch {
    return null;
  }
}

/**
 * Creates a short /s/[id] link by storing the itinerary server-side. Falls
 * back to the old self-contained (longer) ?share= link if the server-side
 * store isn't reachable or isn't configured, so sharing never fully breaks.
 */
export async function createShareLink(itinerary: Itinerary): Promise<string> {
  const origin = window.location.origin;

  try {
    const response = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itinerary),
    });
    if (response.ok) {
      const { id } = (await response.json()) as { id: string };
      return `${origin}/s/${id}`;
    }
  } catch {
    // Network error, offline, etc. — fall through to the legacy link.
  }

  const encoded = encodeItineraryForShare(itinerary);
  return `${origin}/?share=${encoded}`;
}
