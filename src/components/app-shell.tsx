"use client";

import { useState } from "react";
import { ItineraryProvider } from "@/store/itinerary-context";
import { GoogleMapsProvider } from "@/components/map/google-maps-provider";
import { AccountSync } from "@/components/account-sync";
import { SaveShareBar } from "@/components/save-share-bar";
import { ItineraryPanel } from "@/components/itinerary-panel";
import { CalendarView } from "@/components/calendar-view";
import { MapView } from "@/components/map-view";
import { RouteLeg } from "@/components/map/day-route";
import { Itinerary } from "@/types/itinerary";

interface AppShellProps {
  initialItinerary?: Itinerary;
  initialReadOnly?: boolean;
}

export type ViewMode = "board" | "calendar";

export function AppShell({ initialItinerary, initialReadOnly }: AppShellProps) {
  const [legs, setLegs] = useState<RouteLeg[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("board");

  return (
    <ItineraryProvider
      initialItinerary={initialItinerary}
      initialReadOnly={initialReadOnly}
    >
      <GoogleMapsProvider>
        <AccountSync />
        <div className="flex h-dvh flex-col bg-neutral-50">
          <SaveShareBar viewMode={viewMode} onViewModeChange={setViewMode} />
          <section className="flex min-h-0 flex-[2] flex-col border-b border-neutral-200 bg-white/70 p-3 shadow-sm backdrop-blur-sm">
            {viewMode === "board" ? (
              <ItineraryPanel legs={legs} />
            ) : (
              <CalendarView onSelectDay={() => setViewMode("board")} />
            )}
          </section>
          <main className="min-h-0 flex-1">
            <MapView onLegsChange={setLegs} />
          </main>
        </div>
      </GoogleMapsProvider>
    </ItineraryProvider>
  );
}
