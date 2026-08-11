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

/** Encodes an itinerary into a URL-safe base64 string for shareable links. */
export function encodeItineraryForShare(itinerary: Itinerary): string {
  const json = JSON.stringify(itinerary);
  const base64 = btoa(unescape(encodeURIComponent(json)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeItineraryFromShare(encoded: string): Itinerary | null {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const json = decodeURIComponent(escape(atob(padded)));
    return JSON.parse(json) as Itinerary;
  } catch {
    return null;
  }
}
