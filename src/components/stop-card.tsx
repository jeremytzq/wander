"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PlaceStop } from "@/types/itinerary";

interface StopCardProps {
  stop: PlaceStop;
  index: number;
  onRemove: () => void;
  readOnly?: boolean;
}

export function StopCard({ stop, index, onRemove, readOnly }: StopCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stop.id, disabled: readOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex gap-3 rounded-lg border border-neutral-200 bg-white p-2 shadow-sm"
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="cursor-grab touch-none px-1 text-neutral-400 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>

      {stop.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={stop.photoUrl}
          alt=""
          className="h-14 w-14 flex-shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md bg-neutral-100 text-xs text-neutral-400">
          {index + 1}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900">
          {stop.name}
        </p>
        <p className="truncate text-xs text-neutral-500">{stop.address}</p>
        {typeof stop.rating === "number" && (
          <p className="text-xs text-amber-600">★ {stop.rating.toFixed(1)}</p>
        )}
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove stop"
          className="self-start text-neutral-400 hover:text-red-500"
        >
          ✕
        </button>
      )}
    </div>
  );
}
