"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <section
      ref={setSortableRef}
      style={style}
      className={`flex min-h-0 w-72 flex-shrink-0 flex-col rounded-xl border p-3 ${
        isFocused ? "border-blue-400 bg-blue-50/40" : "border-neutral-200 bg-neutral-50"
      }`}
    >
      <header className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          {!readOnly && (
            <button
              type="button"
              aria-label="Drag to reorder day"
              className="cursor-grab touch-none px-0.5 text-neutral-400 active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              ⠿
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
              className="w-28 rounded border border-neutral-300 px-1 text-sm font-semibold"
            />
          ) : (
            <button
              type="button"
              onClick={() => !readOnly && setEditingLabel(true)}
              className="flex min-w-0 items-baseline gap-1.5 text-left"
            >
              <span className="truncate text-sm font-semibold text-neutral-800">
                {day.label}
              </span>
              <span className="flex-shrink-0 text-xs font-normal text-neutral-400">
                {dateLabel}
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_FOCUSED_DAY", dayId: day.id })}
            className={`rounded px-2 py-0.5 text-xs ${
              isFocused
                ? "bg-blue-600 text-white"
                : "bg-white text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {isFocused ? "On map" : "Show on map"}
          </button>
          {!readOnly && canRemove && (
            <button
              type="button"
              onClick={() => dispatch({ type: "REMOVE_DAY", dayId: day.id })}
              aria-label="Remove day"
              className="text-neutral-400 hover:text-red-500"
            >
              ✕
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
            <p className="rounded-lg border border-dashed border-neutral-300 p-3 text-center text-xs text-neutral-400">
              No stops yet. Search above to add a place.
            </p>
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
