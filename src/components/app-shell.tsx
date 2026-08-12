"use client";

import { useState } from "react";
import { ItineraryProvider } from "@/store/itinerary-context";
import { GoogleMapsProvider } from "@/components/map/google-maps-provider";
import { SaveShareBar } from "@/components/save-share-bar";
import { ItineraryPanel } from "@/components/itinerary-panel";
import { MapView } from "@/components/map-view";
import { RouteLeg } from "@/components/map/day-route";
import { Itinerary } from "@/types/itinerary";

interface AppShellProps {
  initialItinerary?: Itinerary;
  initialReadOnly?: boolean;
}

export function AppShell({ initialItinerary, initialReadOnly }: AppShellProps) {
  const [legs, setLegs] = useState<RouteLeg[]>([]);

  return (
    <ItineraryProvider
      initialItinerary={initialItinerary}
      initialReadOnly={initialReadOnly}
    >
      <GoogleMapsProvider>
        <div className="flex h-dvh flex-col">
          <SaveShareBar />
          <section className="flex h-[380px] flex-shrink-0 flex-col border-b border-neutral-200 bg-white p-4">
            <ItineraryPanel legs={legs} />
          </section>
          <main className="min-h-0 flex-1">
            <MapView onLegsChange={setLegs} />
          </main>
        </div>
      </GoogleMapsProvider>
    </ItineraryProvider>
  );
}
