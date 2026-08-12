"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { ItineraryDay } from "@/types/itinerary";
import { PALETTE } from "@/lib/country-colors";
import { useItinerary } from "@/store/itinerary-context";

interface DayCountryPickerProps {
  day: ItineraryDay;
  color: string;
  countryName?: string;
  existingCountries: string[];
  readOnly?: boolean;
}

/** Lets the user manually label a day's card with a country + color, so they
 * can group/distinguish days by leg of the trip regardless of what the
 * stops' addresses say. */
export function DayCountryPicker({
  day,
  color,
  countryName,
  existingCountries,
  readOnly,
}: DayCountryPickerProps) {
  const { dispatch } = useItinerary();
  const [open, setOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [colorDraft, setColorDraft] = useState(color);

  if (readOnly) {
    if (!countryName) return null;
    return (
      <span className="flex items-center gap-1">
        <span
          className="h-2 w-2 flex-shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        {countryName}
      </span>
    );
  }

  function openPicker() {
    setNameDraft(day.country ?? countryName ?? "");
    setColorDraft(day.color ?? color);
    setOpen(true);
  }

  function save() {
    const trimmed = nameDraft.trim();
    dispatch({
      type: "SET_DAY_COUNTRY",
      dayId: day.id,
      country: trimmed || null,
      color: trimmed ? colorDraft : null,
    });
    setOpen(false);
  }

  function clear() {
    dispatch({ type: "SET_DAY_COUNTRY", dayId: day.id, country: null, color: null });
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={openPicker}
        className="flex items-center gap-1 rounded-full px-1 py-0.5 text-[11px] font-medium text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
      >
        {countryName ? (
          <>
            <span
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            {countryName}
          </>
        ) : (
          "+ Country"
        )}
      </button>

      {open && (
        <>
          <button
            aria-label="Close"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 z-20 mt-1.5 w-56 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg">
            <label className="mb-1 block text-[11px] font-medium text-neutral-500">
              Country
            </label>
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="e.g. Japan"
              list="wander-day-country-suggestions"
              className="mb-2.5 w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
              }}
            />
            <datalist id="wander-day-country-suggestions">
              {existingCountries.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>

            <label className="mb-1 block text-[11px] font-medium text-neutral-500">
              Color
            </label>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {PALETTE.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setColorDraft(swatch)}
                  aria-label={`Use color ${swatch}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full ring-1 ring-inset ring-black/10"
                  style={{ backgroundColor: swatch }}
                >
                  {colorDraft === swatch && (
                    <Check className="h-3.5 w-3.5 text-white" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={clear}
                className="text-xs text-neutral-400 hover:text-red-500"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={save}
                className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
