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
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
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

  // Resolves whatever the pointer is currently over (a day itself, its empty-
  // area droppable, or one of its stops) down to a target day id.
  function resolveDayId(overId: string): string | null {
    if (itinerary.days.some((d) => d.id === overId)) return overId;
    if (overId.startsWith("day:")) return overId.slice(4);
    return findDayAndIndex(overId)?.day.id ?? null;
  }

  function resolveStopDestination(overId: string) {
    if (overId.startsWith("day:")) {
      const day = itinerary.days.find((d) => d.id === overId.slice(4));
      return day ? { dayId: day.id, index: day.stops.length } : null;
    }
    const day = itinerary.days.find((d) => d.id === overId);
    if (day) return { dayId: day.id, index: day.stops.length };
    const found = findDayAndIndex(overId);
    return found ? { dayId: found.day.id, index: found.index } : null;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || readOnly) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    if (active.data.current?.type === "day") {
      const destDayId = resolveDayId(overId);
      if (!destDayId || destDayId === activeId) return;
      const dayIds = itinerary.days.map((d) => d.id);
      const from = dayIds.indexOf(activeId);
      const to = dayIds.indexOf(destDayId);
      if (from === -1 || to === -1) return;
      dispatch({ type: "REORDER_DAYS", dayIds: arrayMove(dayIds, from, to) });
      return;
    }

    const source = findDayAndIndex(activeId);
    if (!source) return;
    const dest = resolveStopDestination(overId);
    if (!dest) return;

    if (source.day.id === dest.dayId) {
      if (source.index === dest.index) return;
      const stopIds = arrayMove(
        source.day.stops.map((s) => s.id),
        source.index,
        dest.index
      );
      dispatch({ type: "REORDER_STOPS", dayId: source.day.id, stopIds });
    } else {
      dispatch({
        type: "MOVE_STOP",
        fromDayId: source.day.id,
        toDayId: dest.dayId,
        stopId: activeId,
        toIndex: dest.index,
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
          <SortableContext
            items={itinerary.days.map((d) => d.id)}
            strategy={horizontalListSortingStrategy}
          >
            {itinerary.days.map((day, dayIndex) => (
              <DayColumn
                key={day.id}
                day={day}
                dayIndex={dayIndex}
                startDate={itinerary.startDate}
                isFocused={day.id === focusedDayId}
                legs={day.id === focusedDayId ? legs : []}
                canRemove={itinerary.days.length > 1}
              />
            ))}
          </SortableContext>
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
