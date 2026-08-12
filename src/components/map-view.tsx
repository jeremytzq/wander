"use client";

import { useEffect } from "react";
import { Map, useMap } from "@vis.gl/react-google-maps";
import { useItinerary } from "@/store/itinerary-context";
import { ClassicMarker } from "@/components/map/classic-marker";
import { DayRoute, RouteLeg } from "@/components/map/day-route";
import { hasGoogleMapsApiKey } from "@/components/map/google-maps-provider";
import { createNumberedPinIcon } from "@/components/map/pin-icon";

const DEFAULT_CENTER = { lat: 20, lng: 0 };
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

interface MapViewProps {
  onLegsChange?: (legs: RouteLeg[]) => void;
}

export function MapView({ onLegsChange }: MapViewProps) {
  if (!hasGoogleMapsApiKey) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-neutral-100 p-8 text-center text-sm text-neutral-600">
        Set{" "}
        <code className="mx-1 rounded bg-neutral-200 px-1">
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        </code>{" "}
        in <code className="mx-1 rounded bg-neutral-200 px-1">.env.local</code>{" "}
        to enable the map and place search.
      </div>
    );
  }

  return (
    <Map
      mapId={MAP_ID}
      defaultCenter={DEFAULT_CENTER}
      defaultZoom={2}
      gestureHandling="greedy"
      className="h-full w-full"
    >
      <MapContent onLegsChange={onLegsChange} />
    </Map>
  );
}

function MapContent({ onLegsChange }: MapViewProps) {
  const map = useMap();
  const { itinerary, focusedDayId } = useItinerary();

  const allStops = itinerary.days.flatMap((d) => d.stops);
  const focusedDay =
    itinerary.days.find((d) => d.id === focusedDayId) ?? itinerary.days[0];
  // Zoom to whatever day is focused; fall back to the whole trip if it has
  // no stops yet so the view doesn't collapse to the empty default.
  const zoomTargetStops = focusedDay?.stops.length ? focusedDay.stops : allStops;
  const zoomTargetIds = zoomTargetStops.map((s) => s.id).join(",");

  useEffect(() => {
    if (!map || zoomTargetStops.length === 0) return;
    if (zoomTargetStops.length === 1) {
      map.setCenter({ lat: zoomTargetStops[0].lat, lng: zoomTargetStops[0].lng });
      map.setZoom(15);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    zoomTargetStops.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
    map.fitBounds(bounds, 64);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, focusedDayId, zoomTargetIds]);

  return (
    <>
      {itinerary.days.map((day, dayIndex) =>
        day.stops.map((stop, stopIndex) => (
          <ClassicMarker
            key={stop.id}
            position={{ lat: stop.lat, lng: stop.lng }}
            icon={createNumberedPinIcon(stopIndex + 1, day.id === focusedDayId)}
            title={`Day ${dayIndex + 1}: ${stop.name}`}
          />
        ))
      )}
      {focusedDay && (
        <DayRoute stops={focusedDay.stops} onLegsChange={onLegsChange} />
      )}
    </>
  );
}
