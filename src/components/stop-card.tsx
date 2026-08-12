"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MapPin, Star, X } from "lucide-react";
import { PlaceStop } from "@/types/itinerary";

interface StopCardProps {
  stop: PlaceStop;
  index: number;
  isFocused: boolean;
  onRemove: () => void;
  readOnly?: boolean;
}

export function StopCard({
  stop,
  index,
  isFocused,
  onRemove,
  readOnly,
}: StopCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stop.id, disabled: readOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex gap-2 rounded-xl border border-neutral-200 bg-white p-2 shadow-sm transition-shadow hover:shadow-md"
    >
      {!readOnly && (
        <button
          type="button"
          aria-label="Drag to reorder"
          className="flex flex-shrink-0 cursor-grab touch-none items-center rounded px-0.5 text-neutral-300 transition-colors hover:bg-neutral-100 hover:text-neutral-500 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      <div className="relative h-14 w-14 flex-shrink-0">
        {stop.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stop.photoUrl}
            alt=""
            className="h-14 w-14 rounded-lg object-cover ring-1 ring-inset ring-black/5"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-neutral-50 to-neutral-100 ring-1 ring-inset ring-black/5">
            <MapPin className="h-5 w-5 text-neutral-300" />
          </div>
        )}
        {/* Matches the number on this stop's pin on the map. */}
        <span
          className={`absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm ring-2 ring-white ${
            isFocused ? "bg-blue-600" : "bg-neutral-400"
          }`}
        >
          {index + 1}
        </span>
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <p className="truncate text-sm font-medium text-neutral-900">
          {stop.name}
        </p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-neutral-500">
          <MapPin className="h-3 w-3 flex-shrink-0 text-neutral-300" />
          <span className="truncate">{stop.address}</span>
        </p>
        {typeof stop.rating === "number" && (
          <p className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
            <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
            {stop.rating.toFixed(1)}
          </p>
        )}
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove stop"
          className="h-fit flex-shrink-0 rounded p-1 text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
