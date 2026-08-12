"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MapPin, MapPinned, X } from "lucide-react";
import {
  ItineraryDay,
  addDaysToDateString,
  formatDayDate,
} from "@/types/itinerary";
import { RouteLeg } from "@/components/map/day-route";
import { StopCard } from "@/components/stop-card";
import { TravelTimeBadge } from "@/components/travel-time-badge";
import { useItinerary } from "@/store/itinerary-context";

interface DayColumnProps {
  day: ItineraryDay;
  dayIndex: number;
  startDate: string;
  isFocused: boolean;
  legs: RouteLeg[];
  canRemove: boolean;
}

export function DayColumn({
  day,
  dayIndex,
  startDate,
  isFocused,
  legs,
  canRemove,
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
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(day.label);
  const dateLabel = formatDayDate(addDaysToDateString(startDate, dayIndex));

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <section
      ref={setSortableRef}
      style={style}
      className={`flex min-h-0 w-72 flex-shrink-0 flex-col rounded-2xl border p-3 transition-colors ${
        isFocused
          ? "border-blue-300 bg-blue-50/50 shadow-md shadow-blue-100"
          : "border-neutral-200 bg-white shadow-sm hover:border-neutral-300"
      }`}
    >
      <header className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-0.5">
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
              <span className="flex-shrink-0 text-[11px] font-medium leading-tight text-neutral-400">
                {dateLabel}
              </span>
            </button>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_FOCUSED_DAY", dayId: day.id })}
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors ${
              isFocused
                ? "bg-blue-600 text-white shadow-sm"
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

      <div
        ref={setDroppableRef}
        className="flex min-h-[3rem] flex-1 flex-col gap-2 overflow-y-auto"
      >
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
                index={index}
                readOnly={readOnly}
                onRemove={() =>
                  dispatch({ type: "REMOVE_STOP", dayId: day.id, stopId: stop.id })
                }
              />
              {isFocused && legs[index] && <TravelTimeBadge leg={legs[index]} />}
            </div>
          ))}
        </SortableContext>
      </div>
    </section>
  );
}
