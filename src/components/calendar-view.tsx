"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Bed, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useItinerary } from "@/store/itinerary-context";
import { ItineraryDay, addDaysToDateString, toDateInputValue } from "@/types/itinerary";
import { buildCountryColorMap, colorForDay } from "@/lib/country-colors";
import { describeHoursForDay } from "@/lib/opening-hours";

interface CalendarViewProps {
  /** Called after a trip day is picked, so the parent can switch back to the board view. */
  onSelectDay?: () => void;
}

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// 6 rows always fits: at most 6 leading blank cells + 31 days in a month = 37.
const TOTAL_CELLS = 42;

/** Month-grid view of the trip: each date with a planned day shows its stop
 * count, accommodation, country color and any opening-hours conflicts.
 * Clicking a day focuses it (same as "Show" in the board view). */
export function CalendarView({ onSelectDay }: CalendarViewProps) {
  const { itinerary, focusedDayId, dispatch } = useItinerary();

  const tripDayByDate = useMemo(() => {
    const map = new Map<string, { day: ItineraryDay; dayIndex: number }>();
    itinerary.days.forEach((day, dayIndex) => {
      const date = addDaysToDateString(itinerary.startDate, dayIndex);
      map.set(toDateInputValue(date), { day, dayIndex });
    });
    return map;
  }, [itinerary.days, itinerary.startDate]);

  const countryColors = useMemo(
    () => buildCountryColorMap(itinerary),
    [itinerary]
  );

  const firstTripDate = addDaysToDateString(itinerary.startDate, 0);
  const [cursor, setCursor] = useState(
    () => new Date(firstTripDate.getFullYear(), firstTripDate.getMonth(), 1)
  );

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const startOffset = new Date(year, month, 1).getDay();

  const cells = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < TOTAL_CELLS; i++) {
      arr.push(new Date(year, month, i - startOffset + 1));
    }
    return arr;
  }, [year, month, startOffset]);

  const todayKey = toDateInputValue(new Date());

  function handleSelect(dayId: string) {
    dispatch({ type: "SET_FOCUSED_DAY", dayId });
    onSelectDay?.();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 flex flex-shrink-0 items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          aria-label="Previous month"
          className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-neutral-800">{monthLabel}</p>
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          aria-label="Next month"
          className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid flex-shrink-0 grid-cols-7 pb-1 text-center text-[11px] font-medium text-neutral-400">
        {WEEKDAY_HEADERS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-1">
        {cells.map((date) => {
          const key = toDateInputValue(date);
          const match = tripDayByDate.get(key);
          const inMonth = date.getMonth() === month;
          const isToday = key === todayKey;

          if (!match) {
            return (
              <div
                key={key}
                className={`rounded-lg p-1.5 text-[11px] ${
                  inMonth ? "text-neutral-300" : "text-neutral-200"
                } ${isToday ? "bg-neutral-50 ring-1 ring-neutral-200" : ""}`}
              >
                {date.getDate()}
              </div>
            );
          }

          const { day } = match;
          const weekday = date.getDay();
          const color = colorForDay(countryColors, day);
          const closedCount = day.stops.filter(
            (s) => describeHoursForDay(s.openingHours, weekday).status === "closed"
          ).length;
          const isFocused = day.id === focusedDayId;

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(day.id)}
              style={{ borderLeftColor: color, borderLeftWidth: 3 }}
              className={`flex min-w-0 flex-col items-start gap-0.5 overflow-hidden rounded-lg border border-l-[3px] p-1.5 text-left text-[11px] transition-colors ${
                isFocused
                  ? "border-blue-300 bg-blue-50 shadow-sm"
                  : "border-neutral-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
              }`}
            >
              <span className="flex w-full flex-shrink-0 items-center justify-between gap-1">
                <span className="font-semibold text-neutral-700">
                  {date.getDate()}
                </span>
                {closedCount > 0 && (
                  <AlertTriangle className="h-3 w-3 flex-shrink-0 text-red-500" />
                )}
              </span>
              <span className="w-full flex-shrink-0 truncate text-[10px] font-medium text-neutral-500">
                {day.label}
                {day.stops.length > 0 && (
                  <>
                    {" · "}
                    <span className="inline-flex items-center gap-0.5 text-neutral-400">
                      <MapPin className="inline h-2.5 w-2.5" />
                      {day.stops.length}
                    </span>
                  </>
                )}
              </span>
              {day.accommodation && (
                <span className="flex w-full min-w-0 flex-shrink-0 items-center gap-0.5 text-[10px] text-indigo-500">
                  <Bed className="h-2.5 w-2.5 flex-shrink-0" />
                  <span className="truncate">{day.accommodation.name}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
