import { Itinerary } from "@/types/itinerary";

/** Itineraries saved to the signed-in user's account (server-side, not this
 * browser's localStorage) — available from any browser/device. */
export async function fetchAccountItineraries(): Promise<Itinerary[]> {
  try {
    const res = await fetch("/api/itineraries");
    if (!res.ok) return [];
    const { itineraries } = (await res.json()) as { itineraries: Itinerary[] };
    return itineraries;
  } catch {
    return [];
  }
}

export async function saveAccountItinerary(itinerary: Itinerary): Promise<boolean> {
  try {
    const res = await fetch("/api/itineraries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itinerary),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteAccountItinerary(id: string): Promise<void> {
  try {
    await fetch(`/api/itineraries/${id}`, { method: "DELETE" });
  } catch {
    // Best-effort — the account list will just show it again next refresh.
  }
}
