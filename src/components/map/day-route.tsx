"use client";

import { useEffect, useRef } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { PlaceStop } from "@/types/itinerary";

export interface RouteLeg {
  durationText: string;
  distanceText: string;
}

interface DayRouteProps {
  stops: PlaceStop[];
  onLegsChange?: (legs: RouteLeg[]) => void;
}

/** Draws a driving route through a day's stops in order, and reports leg durations. */
export function DayRoute({ stops, onLegsChange }: DayRouteProps) {
  const map = useMap();
  const routesLibrary = useMapsLibrary("routes");
  const directionsServiceRef = useRef<google.maps.DirectionsService>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer>(null);

  useEffect(() => {
    if (!routesLibrary || !map) return;
    const renderer = new routesLibrary.DirectionsRenderer({
      map,
      suppressMarkers: true,
      preserveViewport: true,
      polylineOptions: { strokeColor: "#2563eb", strokeWeight: 4 },
    });
    directionsServiceRef.current = new routesLibrary.DirectionsService();
    directionsRendererRef.current = renderer;
    return () => renderer.setMap(null);
  }, [routesLibrary, map]);

  useEffect(() => {
    const directionsService = directionsServiceRef.current;
    const directionsRenderer = directionsRendererRef.current;
    if (!directionsService || !directionsRenderer) return;

    if (stops.length < 2) {
      directionsRenderer.set("directions", null);
      onLegsChange?.([]);
      return;
    }

    const [origin, ...rest] = stops;
    const destination = rest[rest.length - 1];
    const waypoints = rest.slice(0, -1).map((s) => ({
      location: { lat: s.lat, lng: s.lng },
      stopover: true,
    }));

    let cancelled = false;
    directionsService
      .route({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
      })
      .then((result) => {
        if (cancelled) return;
        directionsRenderer.setDirections(result);
        const legs =
          result.routes[0]?.legs.map((leg) => ({
            durationText: leg.duration?.text ?? "",
            distanceText: leg.distance?.text ?? "",
          })) ?? [];
        onLegsChange?.(legs);
      })
      .catch(() => {
        if (!cancelled) onLegsChange?.([]);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routesLibrary, map, JSON.stringify(stops.map((s) => s.id))]);

  return null;
}
