"use client";

import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  Bed,
  ChevronDown,
  ChevronRight,
  GripVertical,
  MapPin,
  MapPinned,
  Route as RouteIcon,
  X,
} from "lucide-react";
import {
  ItineraryDay,
  PlaceStop,
  addDaysToDateString,
  formatDayDate,
} from "@/types/itinerary";
import { RouteLeg } from "@/components/map/day-route";
import { StopCard } from "@/components/stop-card";
import { TravelTimeBadge } from "@/components/travel-time-badge";
import { DayCountryPicker } from "@/components/day-country-picker";
import { AccommodationCard } from "@/components/accommodation-card";
import { useItinerary } from "@/store/itinerary-context";
import {
  colorForDay,
  dayAccentColor,
  hexToRgba,
  resolveDayCountry,
} from "@/lib/country-colors";
import { describeHoursForDay } from "@/lib/opening-hours";
import { dayTotal } from "@/lib/budget";
import { formatCurrency } from "@/lib/currency";
import {
  ReorderSuggestion,
  SpreadWarning,
  analyzeDayRoute,
} from "@/lib/route-suggestions";

interface DayColumnProps {
  day: ItineraryDay;
  dayIndex: number;
  startDate: string;
  isFocused: boolean;
  legs: RouteLeg[];
  canRemove: boolean;
  countryColors: Map<string, string>;
  existingCountries: string[];
  currency: string;
  /** Previous day's accommodation, if any — treated as this day's implicit
   * starting point (that's where you woke up). */
  startPoint?: PlaceStop;
}

export function DayColumn({
  day,
  dayIndex,
  startDate,
  isFocused,
  legs,
  canRemove,
  countryColors,
  existingCountries,
  currency,
  startPoint,
}: DayColumnProps) {
  const { dispatch, readOnly } = useItinerary();
  const { setNodeRef: setDroppableRef } = useDroppable({ id: `day:${day.id}` });
  const {
    setNodeRef: setSortableRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: day.id, data: { type: "day" }, disabled: readOnly });
  // Both refs point at the same node so the whole card — including a
  // collapsed one, which no longer renders the stops list at all — stays a
  // valid drop target for stops, not just the (possibly absent) inner list.
  function setColumnRef(node: HTMLElement | null) {
    setSortableRef(node);
    setDroppableRef(node);
  }
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(day.label);
  const [collapsed, setCollapsed] = useState(false);
  const dayDate = addDaysToDateString(startDate, dayIndex);
  const weekday = dayDate.getDay();
  const dateLabel = formatDayDate(dayDate);

  const dayColor = colorForDay(countryColors, day);
  const dayCountry = resolveDayCountry(day);
  const accent = dayAccentColor(dayIndex);
  const closedCount = day.stops.filter(
    (s) => describeHoursForDay(s.openingHours, weekday).status === "closed"
  ).length;
  const total = dayTotal(day);
  const routeSuggestions = useMemo(
    () => analyzeDayRoute(day, startPoint),
    [day, startPoint]
  );
  const reorderSuggestion = routeSuggestions.find(
    (s): s is ReorderSuggestion => s.type === "reorder"
  );
  const spreadWarning = routeSuggestions.find(
    (s): s is SpreadWarning => s.type === "spread"
  );
  // The map's route (and therefore `legs`) is computed starting from
  // startPoint when this day is focused, so leg 0 is startPoint→stops[0]
  // and every inter-stop leg shifts up by one.
  const legOffset = isFocused && startPoint ? 1 : 0;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    borderTopColor: accent,
    backgroundColor: isFocused ? hexToRgba(accent, 0.06) : "white",
    boxShadow: isFocused ? `0 4px 14px -6px ${hexToRgba(accent, 0.35)}` : undefined,
  };

  return (
    <section
      ref={setColumnRef}
      style={style}
      className={`flex min-h-0 w-[85vw] max-w-[320px] flex-shrink-0 snap-center flex-col rounded-2xl border border-t-[3px] border-neutral-200 p-3 transition-colors sm:w-72 ${
        isFocused ? "shadow-md" : "shadow-sm hover:border-neutral-300"
      } ${collapsed ? "self-start" : ""}`}
    >
      <header className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {!readOnly && (
            <button
              type="button"
              aria-label="Drag to reorder day"
              className="flex-shrink-0 cursor-grab touch-none rounded p-1 text-neutral-300 transition-colors hover:bg-neutral-100 hover:text-neutral-500 active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <span
            style={{ backgroundColor: accent }}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm"
          >
            {dayIndex + 1}
          </span>
          {editingLabel ? (
            <input
              autoFocus
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              onBlur={() => {
                setEditingLabel(false);
                dispatch({ type: "RENAME_DAY", dayId: day.id, label: labelDraft || day.label });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="w-28 rounded border border-blue-300 px-1.5 py-0.5 text-sm font-semibold outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => !readOnly && setEditingLabel(true)}
              className="flex min-w-0 flex-col items-start text-left"
            >
              <span className="truncate text-sm font-semibold text-neutral-800">
                {day.label}
              </span>
              <span className="text-[11px] font-medium leading-tight text-neutral-400">
                {dateLabel}
              </span>
            </button>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand day" : "Collapse day"}
            aria-expanded={!collapsed}
            className="rounded p-1 text-neutral-300 transition-colors hover:bg-neutral-100 hover:text-neutral-500"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_FOCUSED_DAY", dayId: day.id })}
            style={isFocused ? { backgroundColor: accent } : undefined}
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors ${
              isFocused
                ? "text-white shadow-sm"
                : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
            }`}
          >
            {isFocused ? (
              <MapPinned className="h-3.5 w-3.5" />
            ) : (
              <MapPin className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {isFocused ? "On map" : "Show"}
            </span>
          </button>
          {!readOnly && canRemove && (
            <button
              type="button"
              onClick={() => dispatch({ type: "REMOVE_DAY", dayId: day.id })}
              aria-label="Remove day"
              className="rounded p-1 text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      <div className="mb-2 flex items-center justify-between gap-2">
        <DayCountryPicker
          day={day}
          color={dayColor}
          countryName={dayCountry}
          existingCountries={existingCountries}
          readOnly={readOnly}
        />
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {total > 0 && (
            <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
              {formatCurrency(total, currency)}
            </span>
          )}
          {closedCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-600 ring-1 ring-red-200">
              <AlertTriangle className="h-3 w-3" />
              {closedCount} closed
            </span>
          )}
        </div>
      </div>

      {collapsed ? (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-400">
          <span>{day.stops.length} {day.stops.length === 1 ? "stop" : "stops"}</span>
          {day.accommodation && (
            <span className="flex min-w-0 items-center gap-1 text-indigo-500">
              <Bed className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{day.accommodation.name}</span>
            </span>
          )}
        </div>
      ) : (
        <>
          {reorderSuggestion && !readOnly && (
            <div className="mb-2 flex flex-shrink-0 items-start gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] text-blue-700 ring-1 ring-blue-100">
              <RouteIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span className="flex-1">
                Reordering could shorten this day&apos;s route by ~
                {reorderSuggestion.savedKm.toFixed(1)} km.
              </span>
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: "REORDER_STOPS",
                    dayId: day.id,
                    stopIds: reorderSuggestion.suggestedStopIds,
                  })
                }
                className="flex-shrink-0 rounded-md bg-blue-600 px-1.5 py-0.5 text-[11px] font-medium text-white transition-colors hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          )}
          {spreadWarning && (
            <p className="mb-2 flex flex-shrink-0 items-center gap-1 text-[11px] text-amber-600">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              Stops span ~{Math.round(spreadWarning.maxKm)} km — consider
              splitting across days.
            </p>
          )}

          {startPoint && (
            <div className="mb-2 flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-indigo-50/60 px-2.5 py-1.5 text-[11px] font-medium text-indigo-600 ring-1 ring-indigo-100">
              <Bed className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">Starting from {startPoint.name}</span>
            </div>
          )}

          <div className="flex min-h-[3rem] flex-1 flex-col gap-2 overflow-y-auto">
            {startPoint && day.stops.length > 0 && (
              <TravelTimeBadge leg={isFocused ? legs[0] : undefined} />
            )}
            <SortableContext items={day.stops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {day.stops.length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 p-4 text-center">
                  <MapPin className="h-5 w-5 text-neutral-300" />
                  <p className="text-xs text-neutral-400">
                    No stops yet.
                    <br />
                    Search above to add a place.
                  </p>
                </div>
              )}
              {day.stops.map((stop, index) => (
                <div key={stop.id}>
                  <StopCard
                    stop={stop}
                    dayId={day.id}
                    index={index}
                    isFocused={isFocused}
                    color={dayColor}
                    weekday={weekday}
                    currency={currency}
                    readOnly={readOnly}
                    onRemove={() =>
                      dispatch({ type: "REMOVE_STOP", dayId: day.id, stopId: stop.id })
                    }
                  />
                  {index < day.stops.length - 1 && (
                    <TravelTimeBadge
                      leg={isFocused ? legs[index + legOffset] : undefined}
                    />
                  )}
                </div>
              ))}
            </SortableContext>
          </div>

          <div className="mt-2 flex-shrink-0">
            <AccommodationCard
              day={day}
              weekday={weekday}
              currency={currency}
              readOnly={readOnly}
            />
          </div>
        </>
      )}
    </section>
  );
}
