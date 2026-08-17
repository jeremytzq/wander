"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Bed,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
  Star,
  X,
} from "lucide-react";
import { PlaceStop } from "@/types/itinerary";
import { WEEKDAY_NAMES, describeHoursForDay, describeWeeklyHours } from "@/lib/opening-hours";
import { formatCurrency } from "@/lib/currency";
import { formatTime12 } from "@/lib/schedule";

interface PlaceDetailsModalProps {
  place: PlaceStop;
  weekday: number;
  currency: string;
  isAccommodation?: boolean;
  onClose: () => void;
}

export function PlaceDetailsModal({
  place,
  weekday,
  currency,
  isAccommodation,
  onClose,
}: PlaceDetailsModalProps) {
  const [imgError, setImgError] = useState(false);
  const todayHours = describeHoursForDay(place.openingHours, weekday);
  const weeklyHours = describeWeeklyHours(place.openingHours);
  const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(place.placeId)}`;

  return (
    <>
      <button
        aria-label="Close"
        className="fixed inset-0 z-40 cursor-default bg-black/30"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-xl">
        <div className="relative">
          {place.photoUrl && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={place.photoUrl}
              alt=""
              onError={() => setImgError(true)}
              className="h-40 w-full rounded-t-2xl object-cover"
            />
          ) : (
            <div className="flex h-24 w-full items-center justify-center rounded-t-2xl bg-gradient-to-br from-neutral-50 to-neutral-100">
              {isAccommodation ? (
                <Bed className="h-6 w-6 text-neutral-300" />
              ) : (
                <MapPin className="h-6 w-6 text-neutral-300" />
              )}
            </div>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-500 shadow-sm transition-colors hover:bg-white hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          {isAccommodation && (
            <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-500">
              <Bed className="h-2.5 w-2.5" />
              Staying here
            </p>
          )}
          <h2 className="text-base font-semibold leading-snug text-neutral-900">
            {place.name}
          </h2>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-neutral-500">
            <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-neutral-300" />
            <span>{place.address}</span>
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {typeof place.rating === "number" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                {place.rating.toFixed(1)}
              </span>
            )}
            {place.cost != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <DollarSign className="h-3 w-3" />
                {formatCurrency(place.cost, currency)}
              </span>
            )}
            {place.startTime && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                <Clock className="h-3 w-3" />
                {formatTime12(place.startTime)}
                {place.durationMinutes ? ` · ${place.durationMinutes}m` : ""}
              </span>
            )}
          </div>

          {place.notes && (
            <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-sm leading-snug text-neutral-600">
              {place.notes}
            </p>
          )}

          {weeklyHours && (
            <div className="mt-3">
              <p className="mb-1 flex items-center gap-1 text-xs font-medium text-neutral-500">
                <Clock className="h-3 w-3" />
                Hours
              </p>
              <div className="space-y-0.5 rounded-lg border border-neutral-100 px-3 py-2">
                {weeklyHours.map((row, i) => (
                  <div
                    key={row.day}
                    className={`flex items-center justify-between text-xs ${
                      i === weekday
                        ? "font-semibold text-neutral-800"
                        : "text-neutral-500"
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {row.text === "Closed" && (
                        <AlertTriangle className="h-2.5 w-2.5 text-red-400" />
                      )}
                      {WEEKDAY_NAMES[i]}
                    </span>
                    <span>{row.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!weeklyHours && todayHours.status !== "unknown" && (
            <p className="mt-3 flex items-center gap-1 text-xs text-neutral-500">
              <Clock className="h-3 w-3" />
              {todayHours.text}
            </p>
          )}

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-neutral-200 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in Google Maps
          </a>
        </div>
      </div>
    </>
  );
}
