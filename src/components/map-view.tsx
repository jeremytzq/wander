"use client";

import { useEffect, useState } from "react";
import { InfoWindow, Map, useMap } from "@vis.gl/react-google-maps";
import {
  AlertTriangle,
  Bed,
  Clock,
  DollarSign,
  MapPin,
  MapPinned,
  Star,
} from "lucide-react";
import { useItinerary } from "@/store/itinerary-context";
import { ClassicMarker } from "@/components/map/classic-marker";
import { DayRoute, RouteLeg } from "@/components/map/day-route";
import { hasGoogleMapsApiKey } from "@/components/map/google-maps-provider";
import {
  createAccommodationPinIcon,
  createNumberedPinIcon,
} from "@/components/map/pin-icon";
import { PlaceStop, addDaysToDateString } from "@/types/itinerary";
import { describeHoursForDay } from "@/lib/opening-hours";
import { DEFAULT_CURRENCY, formatCurrency } from "@/lib/currency";

const DEFAULT_CENTER = { lat: 20, lng: 0 };
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

interface MapViewProps {
  onLegsChange?: (legs: RouteLeg[]) => void;
}

export function MapView({ onLegsChange }: MapViewProps) {
  if (!hasGoogleMapsApiKey) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 p-8 text-center">
        <div className="flex max-w-sm flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
            <MapPinned className="h-6 w-6 text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-600">
            Set{" "}
            <code className="mx-1 rounded bg-neutral-200 px-1.5 py-0.5 text-xs">
              NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
            </code>{" "}
            in{" "}
            <code className="mx-1 rounded bg-neutral-200 px-1.5 py-0.5 text-xs">
              .env.local
            </code>{" "}
            to enable the map and place search.
          </p>
        </div>
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

interface SelectedPlace {
  stop: PlaceStop;
  dayIndex: number;
  isAccommodation: boolean;
}

function MapContent({ onLegsChange }: MapViewProps) {
  const map = useMap();
  const { itinerary, focusedDayId } = useItinerary();
  const [selected, setSelected] = useState<SelectedPlace | null>(null);
  const currency = itinerary.currency || DEFAULT_CURRENCY;

  const allStops = itinerary.days.flatMap((d) =>
    d.accommodation ? [...d.stops, d.accommodation] : d.stops
  );
  const focusedDayIndex = focusedDayId
    ? itinerary.days.findIndex((d) => d.id === focusedDayId)
    : 0;
  const focusedDay =
    itinerary.days[focusedDayIndex] ?? itinerary.days[0];
  // The previous night's accommodation, if any — used as the implicit start
  // point for this day's route (you're leaving from there, not nowhere).
  const startPoint =
    focusedDayIndex > 0 ? itinerary.days[focusedDayIndex - 1]?.accommodation : undefined;
  // Zoom to whatever day is focused; fall back to the whole trip if it has
  // no stops yet so the view doesn't collapse to the empty default.
  const focusedDayStops = focusedDay
    ? [
        ...(startPoint ? [startPoint] : []),
        ...focusedDay.stops,
        ...(focusedDay.accommodation ? [focusedDay.accommodation] : []),
      ]
    : [];
  const zoomTargetStops = focusedDayStops.length ? focusedDayStops : allStops;
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
            onClick={() =>
              setSelected({ stop, dayIndex, isAccommodation: false })
            }
          />
        ))
      )}
      {itinerary.days.map(
        (day, dayIndex) =>
          day.accommodation && (
            <ClassicMarker
              key={day.accommodation.id}
              position={{
                lat: day.accommodation.lat,
                lng: day.accommodation.lng,
              }}
              icon={createAccommodationPinIcon(day.id === focusedDayId)}
              title={`Day ${dayIndex + 1} stay: ${day.accommodation.name}`}
              onClick={() =>
                setSelected({
                  stop: day.accommodation!,
                  dayIndex,
                  isAccommodation: true,
                })
              }
            />
          )
      )}
      {focusedDay && (
        <DayRoute stops={focusedDayStops} onLegsChange={onLegsChange} />
      )}
      {selected && (
        <InfoWindow
          position={{ lat: selected.stop.lat, lng: selected.stop.lng }}
          onCloseClick={() => setSelected(null)}
          maxWidth={260}
        >
          <PlaceInfoContent
            selected={selected}
            startDate={itinerary.startDate}
            currency={currency}
          />
        </InfoWindow>
      )}
    </>
  );
}

interface PlaceInfoContentProps {
  selected: SelectedPlace;
  startDate: string;
  currency: string;
}

function PlaceInfoContent({ selected, startDate, currency }: PlaceInfoContentProps) {
  const { stop, dayIndex, isAccommodation } = selected;
  const [imgError, setImgError] = useState(false);
  const weekday = addDaysToDateString(startDate, dayIndex).getDay();
  const hours = describeHoursForDay(stop.openingHours, weekday);

  return (
    <div className="w-52 py-1 text-neutral-800">
      {stop.photoUrl && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={stop.photoUrl}
          alt=""
          onError={() => setImgError(true)}
          className="mb-2 h-24 w-full rounded-lg object-cover"
        />
      ) : null}
      <p className="text-sm font-semibold leading-snug">{stop.name}</p>
      <p className="mt-0.5 flex items-start gap-1 text-xs text-neutral-500">
        <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-neutral-300" />
        <span>{stop.address}</span>
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-0.5 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-600">
          {isAccommodation ? (
            <Bed className="h-2.5 w-2.5" />
          ) : (
            <MapPin className="h-2.5 w-2.5" />
          )}
          Day {dayIndex + 1}
        </span>
        {typeof stop.rating === "number" && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
            <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
            {stop.rating.toFixed(1)}
          </span>
        )}
        {stop.cost != null && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
            <DollarSign className="h-2.5 w-2.5" />
            {formatCurrency(stop.cost, currency)}
          </span>
        )}
        {hours.status === "closed" && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-600">
            <AlertTriangle className="h-2.5 w-2.5" />
            {hours.text}
          </span>
        )}
        {hours.status === "open" && (
          <span className="inline-flex items-center gap-0.5 text-[11px] text-neutral-400">
            <Clock className="h-2.5 w-2.5" />
            {hours.text}
          </span>
        )}
      </div>
      {stop.notes && (
        <p className="mt-1.5 text-xs leading-snug text-neutral-500">
          {stop.notes}
        </p>
      )}
    </div>
  );
}
