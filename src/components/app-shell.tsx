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
        <div className="flex h-dvh flex-col bg-neutral-50">
          <SaveShareBar />
          <section className="flex h-[400px] flex-shrink-0 flex-col border-b border-neutral-200 bg-white/70 p-4 shadow-sm backdrop-blur-sm">
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
