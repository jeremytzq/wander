import { Itinerary, PlaceStop } from "@/types/itinerary";

// A categorical palette with well-separated hues, used to color-code stops
// by country across the map and the day columns.
const PALETTE = [
  "#2563eb", // blue
  "#059669", // emerald
  "#d97706", // amber
  "#e11d48", // rose
  "#7c3aed", // violet
  "#0891b2", // cyan
  "#65a30d", // lime
  "#c026d3", // fuchsia
];

const DEFAULT_COLOR = "#78716c"; // neutral, used when no country is known

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

/** Assigns each distinct country in the itinerary a stable color, in the
 * order countries first appear across days/stops. */
export function buildCountryColorMap(itinerary: Itinerary): Map<string, string> {
  const map = new Map<string, string>();
  for (const day of itinerary.days) {
    for (const stop of day.stops) {
      const country = resolveCountryName(stop);
      if (country && !map.has(country)) {
        map.set(country, PALETTE[map.size % PALETTE.length]);
      }
    }
  }
  return map;
}

export function colorForStop(
  colorMap: Map<string, string>,
  stop: PlaceStop
): string {
  const country = resolveCountryName(stop);
  if (!country) return DEFAULT_COLOR;
  return colorMap.get(country) ?? DEFAULT_COLOR;
}
