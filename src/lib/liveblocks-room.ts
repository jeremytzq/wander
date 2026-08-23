// No "server-only" import — used from both the server (auth route) and the
// browser (RealtimeSync), so both sides agree on the same room id.
export function roomIdForItinerary(itineraryId: string): string {
  return `itinerary:${itineraryId}`;
}
