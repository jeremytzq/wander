import { Itinerary, ItineraryDay, PlaceStop } from "@/types/itinerary";

// A categorical palette with well-separated hues, used to color-code days by
// country across the day columns, stop badges, and legend.
export const PALETTE = [
  "#2563eb", // blue
  "#059669", // emerald
  "#d97706", // amber
  "#e11d48", // rose
  "#7c3aed", // violet
  "#0891b2", // cyan
  "#65a30d", // lime
  "#c026d3", // fuchsia
];

export const DEFAULT_COLOR = "#78716c"; // neutral, used when no country is known

export function flagEmoji(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Stops saved before country capture was added (or address_components came
// back without one) have no `country`. Fall back to a rough guess from the
// tail of the formatted address so older/legacy itineraries still get
// reasonable colors instead of defaulting to gray for everything.
function guessCountryFromAddress(address: string): string | undefined {
  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const last = parts[parts.length - 1];
  if (!last) return undefined;
  const withoutPostalCode = last.replace(/[\d\-]+\s*$/, "").trim();
  return withoutPostalCode || last;
}

export function resolveCountryName(stop: PlaceStop): string | undefined {
  return stop.country ?? guessCountryFromAddress(stop.address);
}

/** A day's country: whatever was manually set on the day card, else the
 * first of its stops with a resolvable country. */
export function resolveDayCountry(day: ItineraryDay): string | undefined {
  if (day.country) return day.country;
  for (const stop of day.stops) {
    const country = resolveCountryName(stop);
    if (country) return country;
  }
  return undefined;
}

/** Assigns each distinct country in the itinerary a stable palette color, in
 * the order days/stops first surface it. Manually-set day countries and
 * auto-detected ones share the same palette so they line up if they match. */
export function buildCountryColorMap(itinerary: Itinerary): Map<string, string> {
  const map = new Map<string, string>();
  const addCountry = (country: string | undefined) => {
    if (country && !map.has(country)) {
      map.set(country, PALETTE[map.size % PALETTE.length]);
    }
  };
  for (const day of itinerary.days) {
    addCountry(resolveDayCountry(day));
    for (const stop of day.stops) addCountry(resolveCountryName(stop));
  }
  return map;
}

/** A day's effective color: manually set color, else the palette color for
 * its (manual or detected) country, else a neutral default. Used for that
 * day's dot, and shared by every stop card in the day. */
export function colorForDay(
  colorMap: Map<string, string>,
  day: ItineraryDay
): string {
  if (day.color) return day.color;
  const country = resolveDayCountry(day);
  if (!country) return DEFAULT_COLOR;
  return colorMap.get(country) ?? DEFAULT_COLOR;
}

/** Distinct (country, color) pairs across the trip, in day order — used for
 * the legend. */
export function buildDayLegend(
  itinerary: Itinerary,
  colorMap: Map<string, string>
): [string, string][] {
  const seen = new Map<string, string>();
  for (const day of itinerary.days) {
    const country = resolveDayCountry(day);
    if (country && !seen.has(country)) {
      seen.set(country, colorForDay(colorMap, day));
    }
  }
  return Array.from(seen);
}
