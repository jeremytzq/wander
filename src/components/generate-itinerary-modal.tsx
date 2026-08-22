"use client";

import { useState } from "react";
import { KeyRound, Loader2, Sparkles, X } from "lucide-react";
import { useItinerary } from "@/store/itinerary-context";
import { Itinerary } from "@/types/itinerary";

interface GenerateItineraryModalProps {
  onClose: () => void;
}

// Stored only in the browser; sent per-request, never persisted server-side.
const API_KEY_STORAGE_KEY = "wander:anthropicApiKey";

export function GenerateItineraryModal({ onClose }: GenerateItineraryModalProps) {
  const { dispatch } = useItinerary();
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(3);
  const [interests, setInterests] = useState("");
  const [startDate, setStartDate] = useState("");
  const [apiKey, setApiKey] = useState(() =>
    typeof window === "undefined"
      ? ""
      : localStorage.getItem(API_KEY_STORAGE_KEY) ?? ""
  );
  const [useOwnKey, setUseOwnKey] = useState(() => !!apiKey);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleApiKeyChange(value: string) {
    setApiKey(value);
    if (value.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, value.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  }

  function handleUseOwnKeyToggle(checked: boolean) {
    setUseOwnKey(checked);
    if (!checked) {
      setApiKey("");
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  }

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
          apiKey: useOwnKey && apiKey.trim() ? apiKey.trim() : undefined,
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
      <div className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
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

          <div className="rounded-lg border border-neutral-200 p-2.5">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-neutral-600">
              <input
                type="checkbox"
                checked={useOwnKey}
                onChange={(e) => handleUseOwnKeyToggle(e.target.checked)}
                disabled={working}
                className="h-3.5 w-3.5 rounded border-neutral-300 text-violet-600 focus:ring-violet-400"
              />
              <KeyRound className="h-3.5 w-3.5 text-neutral-400" />
              Use my own Anthropic API key
            </label>
            {useOwnKey && (
              <>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="sk-ant-…"
                  disabled={working}
                  autoComplete="off"
                  className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-violet-400 disabled:bg-neutral-50"
                />
                <p className="mt-1 text-[11px] leading-snug text-neutral-400">
                  Stored only in this browser and sent directly with each
                  generation request — usage is billed to your own Anthropic
                  account, not ours.
                </p>
              </>
            )}
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
