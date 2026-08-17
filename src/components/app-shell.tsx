"use client";

import { useState } from "react";
import { CalendarDays, LayoutGrid } from "lucide-react";
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

type ViewMode = "board" | "calendar";

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
          <SaveShareBar />
          <section className="flex min-h-0 flex-[2] flex-col border-b border-neutral-200 bg-white/70 p-4 shadow-sm backdrop-blur-sm">
            <div className="mb-2 flex flex-shrink-0 justify-end">
              <div className="inline-flex items-center gap-0.5 rounded-full bg-neutral-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("board")}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    viewMode === "board"
                      ? "bg-white text-neutral-800 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Board
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("calendar")}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    viewMode === "calendar"
                      ? "bg-white text-neutral-800 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  Calendar
                </button>
              </div>
            </div>
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
