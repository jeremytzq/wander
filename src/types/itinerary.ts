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
}

export interface ItineraryDay {
  id: string;
  label: string;
  date?: string;
  stops: PlaceStop[];
}

export interface Itinerary {
  id: string;
  name: string;
  /** ISO date (YYYY-MM-DD) for Day 1; later days are this plus their offset. */
  startDate: string;
  days: ItineraryDay[];
  createdAt: string;
  updatedAt: string;
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
