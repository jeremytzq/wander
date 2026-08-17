import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { v4 as uuidv4 } from "uuid";
import { Itinerary, ItineraryDay, PlaceStop, toDateInputValue } from "@/types/itinerary";
import { isPlacesServerConfigured, searchPlaceText } from "./places-lookup";

const anthropic = new Anthropic();

/**
 * `hasUserApiKey` covers the case where the caller supplied their own
 * Anthropic API key at request time (see the `apiKey` field on
 * GenerateItineraryInput) — generation is then usable even on a deployment
 * with no server-side ANTHROPIC_API_KEY, as long as Places lookups are
 * still configured.
 */
export function isAiGenerationConfigured(hasUserApiKey = false): boolean {
  return (hasUserApiKey || !!process.env.ANTHROPIC_API_KEY) && isPlacesServerConfigured();
}

export interface GenerateItineraryInput {
  destination: string;
  days: number;
  interests?: string;
  startDate?: string;
  /** When set, this key is used instead of the server's ANTHROPIC_API_KEY —
   * the caller's own Claude usage is billed to them, not us. Never logged
   * or persisted. */
  apiKey?: string;
}

export interface GenerateItineraryResult {
  itinerary: Itinerary;
  skippedPlaces: string[];
}

const PLAN_SCHEMA = {
  type: "object",
  properties: {
    tripName: { type: "string" },
    days: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          country: { type: "string" },
          stops: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                searchQuery: { type: "string" },
                note: { type: "string" },
                suggestedTime: { type: "string" },
              },
              required: ["name", "searchQuery", "note"],
              additionalProperties: false,
            },
          },
          accommodationSearchQuery: { type: "string" },
        },
        required: ["label", "country", "stops"],
        additionalProperties: false,
      },
    },
  },
  required: ["tripName", "days"],
  additionalProperties: false,
} as const;

interface PlannedStop {
  name: string;
  searchQuery: string;
  note: string;
  suggestedTime?: string;
}

interface PlannedDay {
  label: string;
  country: string;
  stops: PlannedStop[];
  accommodationSearchQuery?: string;
}

interface PlannedTrip {
  tripName: string;
  days: PlannedDay[];
}

async function planWithClaude(input: GenerateItineraryInput): Promise<PlannedTrip> {
  const prompt = [
    `Plan a ${input.days}-day trip to ${input.destination}.`,
    input.interests ? `Traveler interests / constraints: ${input.interests}.` : "",
    `For each day, suggest 3-5 real, specific, well-known places to visit ` +
      `(attractions, restaurants, neighborhoods), grouped by geographic ` +
      `proximity so the day's route is efficient. For each stop, give a ` +
      `short Google Maps search query specific enough to find the exact ` +
      `real place (e.g. "Tsukiji Outer Market Tokyo", not just "market"), ` +
      `and a one-sentence note on why it's worth visiting. Suggest an ` +
      `approximate visit time ("HH:MM", 24-hour) for each stop reflecting ` +
      `sensible day pacing (morning/afternoon/evening). For each day, also ` +
      `suggest one accommodation search query for a real, well-reviewed ` +
      `place to stay in a sensible area for that day (it's fine to repeat ` +
      `the same one across consecutive days). Label each day with the ` +
      `full country name it's in.`,
  ]
    .filter(Boolean)
    .join("\n");

  const client = input.apiKey ? new Anthropic({ apiKey: input.apiKey }) : anthropic;
  const stream = client.messages.stream({
    model: "claude-opus-5",
    max_tokens: 16000,
    system:
      "You are a meticulous, knowledgeable trip-planning assistant. You " +
      "only suggest real, verifiable places — never invent names. " +
      "Prioritize well-known, highly-rated places suited to the " +
      "traveler's stated interests.",
    messages: [{ role: "user", content: prompt }],
    output_config: { format: { type: "json_schema", schema: PLAN_SCHEMA } },
  });
  const response = await stream.finalMessage();

  if (response.stop_reason === "refusal") {
    throw new Error("The AI declined to generate this itinerary.");
  }

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );
  if (!textBlock) {
    throw new Error("No itinerary plan was returned.");
  }
  return JSON.parse(textBlock.text) as PlannedTrip;
}

/**
 * Generates a draft itinerary from a destination/interests prompt: Claude
 * plans the day-by-day structure (what to see, in what order, roughly
 * when), then every suggested place is resolved to a real Google Places
 * result server-side — grounding the AI's suggestions in actual
 * coordinates/addresses/photos rather than trusting it to invent them.
 */
export async function generateItinerary(
  input: GenerateItineraryInput
): Promise<GenerateItineraryResult> {
  const plan = await planWithClaude(input);

  interface Lookup {
    dayIndex: number;
    stopIndex: number;
    kind: "stop" | "accommodation";
    query: string;
  }

  const lookups: Lookup[] = plan.days.flatMap((day, dayIndex) => [
    ...day.stops.map(
      (stop, stopIndex): Lookup => ({
        dayIndex,
        stopIndex,
        kind: "stop",
        query: `${stop.searchQuery}, ${input.destination}`,
      })
    ),
    ...(day.accommodationSearchQuery
      ? [
          {
            dayIndex,
            stopIndex: -1,
            kind: "accommodation" as const,
            query: `${day.accommodationSearchQuery}, ${input.destination}`,
          },
        ]
      : []),
  ]);

  const resolved = await Promise.all(
    lookups.map(async (l) => ({ ...l, place: await searchPlaceText(l.query) }))
  );

  const skippedPlaces: string[] = [];

  const days: ItineraryDay[] = plan.days.map((day, dayIndex) => {
    const stops: PlaceStop[] = resolved
      .filter((r) => r.dayIndex === dayIndex && r.kind === "stop")
      .flatMap((r) => {
        if (!r.place) {
          skippedPlaces.push(day.stops[r.stopIndex]?.name ?? "a stop");
          return [];
        }
        const planned = day.stops[r.stopIndex];
        const stop: PlaceStop = {
          id: uuidv4(),
          placeId: r.place.placeId,
          name: r.place.name,
          address: r.place.address,
          lat: r.place.lat,
          lng: r.place.lng,
          photoUrl: r.place.photoUrl,
          rating: r.place.rating,
          country: r.place.country,
          countryCode: r.place.countryCode,
          openingHours: r.place.openingHours,
          notes: planned?.note,
          startTime: planned?.suggestedTime,
        };
        return [stop];
      });

    const accommodationPlace = resolved.find(
      (r) => r.dayIndex === dayIndex && r.kind === "accommodation"
    )?.place;
    const accommodation: PlaceStop | undefined = accommodationPlace
      ? {
          id: uuidv4(),
          placeId: accommodationPlace.placeId,
          name: accommodationPlace.name,
          address: accommodationPlace.address,
          lat: accommodationPlace.lat,
          lng: accommodationPlace.lng,
          photoUrl: accommodationPlace.photoUrl,
          rating: accommodationPlace.rating,
        }
      : undefined;

    return {
      id: uuidv4(),
      label: day.label,
      country: day.country || undefined,
      stops,
      accommodation,
    };
  });

  const now = new Date().toISOString();
  const itinerary: Itinerary = {
    id: uuidv4(),
    name: plan.tripName || `Trip to ${input.destination}`,
    startDate: input.startDate ?? toDateInputValue(new Date()),
    days,
    createdAt: now,
    updatedAt: now,
  };

  return { itinerary, skippedPlaces };
}
