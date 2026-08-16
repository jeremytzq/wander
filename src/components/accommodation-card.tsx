"use client";

import { useState } from "react";
import { Bed, Star, X } from "lucide-react";
import { ItineraryDay, PlaceStop } from "@/types/itinerary";
import { PlaceSearch } from "@/components/place-search";
import { useItinerary } from "@/store/itinerary-context";

interface AccommodationCardProps {
  day: ItineraryDay;
  readOnly?: boolean;
}

/** Pinned at the bottom of a day card: where you're staying that night,
 * kept separate from the day's regular stops. */
export function AccommodationCard({ day, readOnly }: AccommodationCardProps) {
  const { dispatch } = useItinerary();
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  function handleSelect(place: Omit<PlaceStop, "id">) {
    dispatch({
      type: "SET_DAY_ACCOMMODATION",
      dayId: day.id,
      accommodation: place,
    });
    setOpen(false);
  }

  function handleRemove() {
    dispatch({
      type: "SET_DAY_ACCOMMODATION",
      dayId: day.id,
      accommodation: null,
    });
  }

  const stay = day.accommodation;

  if (stay) {
    return (
      <div className="flex gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 p-2">
        {stay.photoUrl && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stay.photoUrl}
            alt=""
            onError={() => setImgError(true)}
            className="h-12 w-12 flex-shrink-0 rounded-lg object-cover ring-1 ring-inset ring-black/5"
          />
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 ring-1 ring-inset ring-black/5">
            <Bed className="h-5 w-5 text-indigo-400" />
          </div>
        )}

        <div className="min-w-0 flex-1 py-0.5">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-500">
            <Bed className="h-2.5 w-2.5" />
            Staying here
          </p>
          <p className="truncate text-sm font-medium text-neutral-900">
            {stay.name}
          </p>
          <p className="truncate text-xs text-neutral-500">{stay.address}</p>
          {typeof stay.rating === "number" && (
            <p className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-medium text-amber-700">
              <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
              {stay.rating.toFixed(1)}
            </p>
          )}
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove accommodation"
            className="h-fit flex-shrink-0 rounded p-1 text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  if (readOnly) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-neutral-200 py-2 text-xs font-medium text-neutral-400 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600"
      >
        <Bed className="h-3.5 w-3.5" />
        Add accommodation
      </button>

      {open && (
        <>
          <button
            aria-label="Close"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full left-0 z-20 mb-1.5 w-64 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg">
            <label className="mb-1 block text-[11px] font-medium text-neutral-500">
              Where are you staying?
            </label>
            <PlaceSearch onPlaceSelected={handleSelect} />
          </div>
        </>
      )}
    </div>
  );
}
