"use client";

import { useState } from "react";
import { ItineraryProvider } from "@/store/itinerary-context";
import { GoogleMapsProvider } from "@/components/map/google-maps-provider";
import { SaveShareBar } from "@/components/save-share-bar";
import { ItineraryPanel } from "@/components/itinerary-panel";
import { MapView } from "@/components/map-view";
import { RouteLeg } from "@/components/map/day-route";

export function AppShell() {
  const [legs, setLegs] = useState<RouteLeg[]>([]);

  return (
    <ItineraryProvider>
      <GoogleMapsProvider>
        <div className="flex h-dvh flex-col">
          <SaveShareBar />
          <div className="flex min-h-0 flex-1">
            <aside className="flex min-h-0 w-[420px] flex-shrink-0 flex-col border-r border-neutral-200 bg-white p-4">
              <ItineraryPanel legs={legs} />
            </aside>
            <main className="min-w-0 flex-1">
              <MapView onLegsChange={setLegs} />
            </main>
          </div>
        </div>
      </GoogleMapsProvider>
    </ItineraryProvider>
  );
}
