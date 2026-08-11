"use client";

import { useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useItinerary } from "@/store/itinerary-context";
import { DayColumn } from "@/components/day-column";
import { PlaceSearch } from "@/components/place-search";
import { RouteLeg } from "@/components/map/day-route";
import { PlaceStop } from "@/types/itinerary";

interface ItineraryPanelProps {
  legs: RouteLeg[];
}

export function ItineraryPanel({ legs }: ItineraryPanelProps) {
  const { itinerary, focusedDayId, readOnly, dispatch } = useItinerary();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const focusedDay =
    itinerary.days.find((d) => d.id === focusedDayId) ?? itinerary.days[0];

  const handleAddPlace = useCallback(
    (place: Omit<PlaceStop, "id">) => {
      const targetDayId = focusedDay?.id ?? itinerary.days[0]?.id;
      if (!targetDayId) return;
      dispatch({ type: "ADD_STOP", dayId: targetDayId, place });
    },
    [focusedDay, itinerary.days, dispatch]
  );

  function findDayAndIndex(stopId: string) {
    for (const day of itinerary.days) {
      const index = day.stops.findIndex((s) => s.id === stopId);
      if (index !== -1) return { day, index };
    }
    return null;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || readOnly) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const source = findDayAndIndex(activeId);
    if (!source) return;

    let destDayId: string;
    let destIndex: number;

    if (overId.startsWith("day:")) {
      destDayId = overId.slice(4);
      const destDay = itinerary.days.find((d) => d.id === destDayId);
      destIndex = destDay ? destDay.stops.length : 0;
    } else {
      const dest = findDayAndIndex(overId);
      if (!dest) return;
      destDayId = dest.day.id;
      destIndex = dest.index;
    }

    if (source.day.id === destDayId) {
      if (source.index === destIndex) return;
      const stopIds = arrayMove(
        source.day.stops.map((s) => s.id),
        source.index,
        destIndex
      );
      dispatch({ type: "REORDER_STOPS", dayId: source.day.id, stopIds });
    } else {
      dispatch({
        type: "MOVE_STOP",
        fromDayId: source.day.id,
        toDayId: destDayId,
        stopId: activeId,
        toIndex: destIndex,
      });
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div>
        <p className="mb-1 text-xs font-medium text-neutral-500">
          Adding to {focusedDay?.label ?? "…"}
        </p>
        <PlaceSearch
          onPlaceSelected={handleAddPlace}
          disabled={readOnly || !focusedDay}
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-2">
          {itinerary.days.map((day) => (
            <DayColumn
              key={day.id}
              day={day}
              isFocused={day.id === focusedDayId}
              legs={day.id === focusedDayId ? legs : []}
              canRemove={itinerary.days.length > 1}
            />
          ))}
          {!readOnly && (
            <button
              type="button"
              onClick={() => dispatch({ type: "ADD_DAY" })}
              className="flex w-24 flex-shrink-0 items-center justify-center rounded-xl border border-dashed border-neutral-300 text-sm text-neutral-500 hover:border-blue-400 hover:text-blue-600"
            >
              + Add day
            </button>
          )}
        </div>
      </DndContext>
    </div>
  );
}
