"use client";

import { useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { useItinerary } from "@/store/itinerary-context";
import { Itinerary } from "@/types/itinerary";

interface GenerateItineraryModalProps {
  onClose: () => void;
}

export function GenerateItineraryModal({ onClose }: GenerateItineraryModalProps) {
  const { dispatch } = useItinerary();
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(3);
  const [interests, setInterests] = useState("");
  const [startDate, setStartDate] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!destination.trim() || working) return;
    setWorking(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          days,
          interests: interests || undefined,
          startDate: startDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate itinerary.");
      }
      dispatch({ type: "SET_ITINERARY", itinerary: data.itinerary as Itinerary });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setWorking(false);
    }
  }

  return (
    <>
      <button
        aria-label="Close"
        className="fixed inset-0 z-40 cursor-default bg-black/30"
        onClick={() => !working && onClose()}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-base font-semibold text-neutral-900">
              Generate with AI
            </h2>
          </div>
          {!working && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-neutral-400 transition-colors hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">
              Destination
            </label>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Tokyo, Japan"
              disabled={working}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-violet-400 disabled:bg-neutral-50"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-neutral-500">
                Days
              </label>
              <input
                type="number"
                min={1}
                max={14}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                disabled={working}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-violet-400 disabled:bg-neutral-50"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-neutral-500">
                Start date (optional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={working}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-violet-400 disabled:bg-neutral-50"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">
              Interests / style (optional)
            </label>
            <textarea
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g. food-focused, mid-budget, love art museums, traveling with kids"
              disabled={working}
              rows={2}
              className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-violet-400 disabled:bg-neutral-50"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={working || !destination.trim()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-60"
        >
          {working ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating… (can take up to a minute)
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate itinerary
            </>
          )}
        </button>
      </div>
    </>
  );
}
