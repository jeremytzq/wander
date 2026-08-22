"use client";

import { useState } from "react";
import { List, Map as MapIcon } from "lucide-react";
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
type MobilePane = "itinerary" | "map";

export function AppShell({ initialItinerary, initialReadOnly }: AppShellProps) {
  const [legs, setLegs] = useState<RouteLeg[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [mobilePane, setMobilePane] = useState<MobilePane>("itinerary");

  return (
    <ItineraryProvider
      initialItinerary={initialItinerary}
      initialReadOnly={initialReadOnly}
    >
      <GoogleMapsProvider>
        <AccountSync />
        <div className="flex h-dvh flex-col bg-neutral-50">
          <SaveShareBar viewMode={viewMode} onViewModeChange={setViewMode} />

          {/* Below sm, the itinerary and map are full-height panes you flip
              between — a fixed vertical split leaves too little room for
              either on a phone. From sm up both are always shown, so this
              toggle is hidden entirely. */}
          <div className="flex flex-shrink-0 justify-center border-b border-neutral-200 bg-white py-1.5 sm:hidden">
            <div className="inline-flex items-center gap-0.5 rounded-full bg-neutral-100 p-0.5">
              <button
                type="button"
                onClick={() => setMobilePane("itinerary")}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  mobilePane === "itinerary"
                    ? "bg-white text-neutral-800 shadow-sm"
                    : "text-neutral-500"
                }`}
              >
                <List className="h-3.5 w-3.5" />
                Itinerary
              </button>
              <button
                type="button"
                onClick={() => setMobilePane("map")}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  mobilePane === "map"
                    ? "bg-white text-neutral-800 shadow-sm"
                    : "text-neutral-500"
                }`}
              >
                <MapIcon className="h-3.5 w-3.5" />
                Map
              </button>
            </div>
          </div>

          <section
            className={`${mobilePane === "map" ? "hidden" : "flex"} min-h-0 flex-[2] flex-col border-b border-neutral-200 bg-white/70 p-3 shadow-sm backdrop-blur-sm sm:flex`}
          >
            {viewMode === "board" ? (
              <ItineraryPanel legs={legs} />
            ) : (
              <CalendarView onSelectDay={() => setViewMode("board")} />
            )}
          </section>
          <main
            className={`${mobilePane === "itinerary" ? "hidden" : "block"} min-h-0 flex-1 sm:block`}
          >
            <MapView onLegsChange={setLegs} />
          </main>
        </div>
      </GoogleMapsProvider>
    </ItineraryProvider>
  );
}
