import { ItineraryDay, PlaceStop } from "@/types/itinerary";

interface LatLng {
  lat: number;
  lng: number;
}

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function totalDistanceKm(stops: PlaceStop[]): number {
  let total = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    total += haversineKm(stops[i], stops[i + 1]);
  }
  return total;
}

/** Greedy nearest-neighbor ordering, keeping the first stop fixed (it's
 * usually a deliberate starting point, e.g. the day's hotel) and reordering
 * the rest by closest-next. Straight-line distance, not driving distance. */
function nearestNeighborOrder(stops: PlaceStop[]): PlaceStop[] {
  if (stops.length <= 2) return stops;
  const remaining = stops.slice(1);
  const ordered = [stops[0]];
  let current = stops[0];
  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(current, remaining[i]);
      if (d < bestDist) {
        bestDist = d;
        bestIndex = i;
      }
    }
    current = remaining[bestIndex];
    ordered.push(current);
    remaining.splice(bestIndex, 1);
  }
  return ordered;
}

export interface ReorderSuggestion {
  type: "reorder";
  suggestedStopIds: string[];
  currentKm: number;
  suggestedKm: number;
  savedKm: number;
}

export interface SpreadWarning {
  type: "spread";
  maxKm: number;
}

export type RouteSuggestion = ReorderSuggestion | SpreadWarning;

const MIN_SAVINGS_KM = 2;
const MIN_SAVINGS_RATIO = 0.15;
const SPREAD_THRESHOLD_KM = 60;

/** Geometric (straight-line) route analysis for one day: whether a
 * different visiting order would meaningfully shorten the route, and
 * whether the stops are spread across a suspiciously large area. */
export function analyzeDayRoute(day: ItineraryDay): RouteSuggestion[] {
  const stops = day.stops;
  const suggestions: RouteSuggestion[] = [];

  if (stops.length >= 3) {
    const currentKm = totalDistanceKm(stops);
    const suggested = nearestNeighborOrder(stops);
    const suggestedKm = totalDistanceKm(suggested);
    const savedKm = currentKm - suggestedKm;
    if (
      currentKm > 0 &&
      savedKm >= MIN_SAVINGS_KM &&
      savedKm / currentKm >= MIN_SAVINGS_RATIO
    ) {
      suggestions.push({
        type: "reorder",
        suggestedStopIds: suggested.map((s) => s.id),
        currentKm,
        suggestedKm,
        savedKm,
      });
    }
  }

  if (stops.length >= 2) {
    let maxKm = 0;
    for (let i = 0; i < stops.length; i++) {
      for (let j = i + 1; j < stops.length; j++) {
        maxKm = Math.max(maxKm, haversineKm(stops[i], stops[j]));
      }
    }
    if (maxKm >= SPREAD_THRESHOLD_KM) {
      suggestions.push({ type: "spread", maxKm });
    }
  }

  return suggestions;
}
