import { Itinerary, ItineraryDay } from "@/types/itinerary";

export function dayTotal(day: ItineraryDay): number {
  const stopsTotal = day.stops.reduce((sum, s) => sum + (s.cost ?? 0), 0);
  return stopsTotal + (day.accommodation?.cost ?? 0);
}

export function tripTotal(itinerary: Itinerary): number {
  return itinerary.days.reduce((sum, day) => sum + dayTotal(day), 0);
}
