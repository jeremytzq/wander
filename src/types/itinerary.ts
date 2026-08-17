/** A single open/close span, e.g. Mon 9:00 AM – 5:00 PM. `openDay`/`closeDay`
 * are 0=Sunday..6=Saturday, matching Google's convention; `closeDay` differs
 * from `openDay` for spans that run past midnight. Times are "HHMM". */
export interface OpeningPeriod {
  openDay: number;
  openTime: string;
  closeDay?: number;
  closeTime?: string;
}

export interface OpeningHours {
  periods: OpeningPeriod[];
  /** True for places Google reports as open 24/7. */
  alwaysOpen?: boolean;
}

export interface PlaceStop {
  id: string;
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  photoUrl?: string;
  rating?: number;
  notes?: string;
  /** Full country name, e.g. "Japan" — used to color-code stops by country. */
  country?: string;
  /** ISO 3166-1 alpha-2 code, e.g. "JP" — used to render a flag emoji. */
  countryCode?: string;
  openingHours?: OpeningHours;
  /** "HH:MM" 24-hour, e.g. "09:30". Unset means the stop isn't scheduled to a time. */
  startTime?: string;
  /** Length of the visit in minutes; only meaningful alongside `startTime`. */
  durationMinutes?: number;
  /** Cost for this stop (entry fee, meal, etc.) in the trip's `currency`. */
  cost?: number;
}

export interface ItineraryDay {
  id: string;
  label: string;
  date?: string;
  stops: PlaceStop[];
  /** Manually set to label/color this day's card; overrides auto-detection
   * from its stops' addresses. */
  country?: string;
  /** Manually set hex color; overrides the palette color for `country`. */
  color?: string;
  /** Where you're staying that night, shown pinned at the bottom of the card. */
  accommodation?: PlaceStop;
}

export interface Itinerary {
  id: string;
  name: string;
  /** ISO date (YYYY-MM-DD) for Day 1; later days are this plus their offset. */
  startDate: string;
  days: ItineraryDay[];
  createdAt: string;
  updatedAt: string;
  /** ISO 4217 currency code for stop/accommodation costs; defaults to "USD". */
  currency?: string;
}

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Adds `offset` days to a YYYY-MM-DD date string, in local time. */
export function addDaysToDateString(startDate: string, offset: number): Date {
  const [year, month, day] = startDate.split("-").map(Number);
  return new Date(year, month - 1, day + offset);
}

export function formatDayDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function createEmptyItinerary(name = "New Trip"): Itinerary {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    startDate: toDateInputValue(new Date()),
    days: [
      {
        id: crypto.randomUUID(),
        label: "Day 1",
        stops: [],
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}
