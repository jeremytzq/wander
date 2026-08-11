"use client";

import { useState } from "react";
import { useItinerary } from "@/store/itinerary-context";
import { Itinerary, createEmptyItinerary } from "@/types/itinerary";
import {
  deleteItinerary,
  encodeItineraryForShare,
  listItineraries,
} from "@/lib/storage";

export function SaveShareBar() {
  const { itinerary, readOnly, dispatch } = useItinerary();
  const [showTrips, setShowTrips] = useState(false);
  const [trips, setTrips] = useState<Itinerary[]>([]);
  const [copied, setCopied] = useState(false);

  function refreshTrips() {
    setTrips(listItineraries());
  }

  function handleShare() {
    const encoded = encodeItineraryForShare(itinerary);
    const url = `${window.location.origin}${window.location.pathname}?share=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleNewTrip() {
    dispatch({ type: "SET_ITINERARY", itinerary: createEmptyItinerary() });
  }

  function handleSaveCopy() {
    dispatch({ type: "TAKE_OWNERSHIP" });
    window.history.replaceState(null, "", window.location.pathname);
  }

  function handleOpenTrip(t: Itinerary) {
    dispatch({ type: "SET_ITINERARY", itinerary: t });
    setShowTrips(false);
  }

  function handleDeleteTrip(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    deleteItinerary(id);
    refreshTrips();
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-white px-4 py-3">
      <input
        value={itinerary.name}
        disabled={readOnly}
        onChange={(e) =>
          dispatch({ type: "RENAME_ITINERARY", name: e.target.value })
        }
        className="min-w-0 flex-1 rounded border border-transparent px-2 py-1 text-lg font-semibold hover:border-neutral-200 focus:border-blue-400 focus:outline-none disabled:bg-transparent"
      />

      <label className="flex items-center gap-1.5 text-sm text-neutral-500">
        Starts
        <input
          type="date"
          value={itinerary.startDate}
          disabled={readOnly}
          onChange={(e) => {
            if (e.target.value) {
              dispatch({ type: "SET_START_DATE", startDate: e.target.value });
            }
          }}
          className="rounded border border-neutral-300 px-2 py-1 text-sm disabled:bg-neutral-100"
        />
      </label>

      {readOnly ? (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-sm text-amber-800">
          Viewing a shared itinerary
          <button
            onClick={handleSaveCopy}
            className="rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700"
          >
            Save a copy to edit
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <button
              onClick={() => {
                refreshTrips();
                setShowTrips((s) => !s);
              }}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
            >
              My trips
            </button>
            {showTrips && (
              <div className="absolute right-0 z-10 mt-1 w-64 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg">
                {trips.length === 0 && (
                  <p className="p-2 text-xs text-neutral-400">
                    No saved trips yet.
                  </p>
                )}
                {trips.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleOpenTrip(t)}
                    className="flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-neutral-100"
                  >
                    <span className="truncate">{t.name}</span>
                    <button
                      onClick={(e) => handleDeleteTrip(t.id, e)}
                      className="text-neutral-400 hover:text-red-500"
                      aria-label="Delete trip"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleNewTrip}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            New trip
          </button>
        </>
      )}

      <button
        onClick={handleShare}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        {copied ? "Link copied!" : "Copy share link"}
      </button>
    </div>
  );
}
