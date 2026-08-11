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
  days: ItineraryDay[];
  createdAt: string;
  updatedAt: string;
}

export function createEmptyItinerary(name = "New Trip"): Itinerary {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
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
