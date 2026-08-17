"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  GripVertical,
  MapPin,
  Star,
  X,
} from "lucide-react";
import { PlaceStop } from "@/types/itinerary";
import { describeHoursForDay } from "@/lib/opening-hours";
import { formatTime12 } from "@/lib/schedule";
import { formatCurrency } from "@/lib/currency";
import { useItinerary } from "@/store/itinerary-context";

interface StopCardProps {
  stop: PlaceStop;
  dayId: string;
  index: number;
  isFocused: boolean;
  color: string;
  weekday: number;
  currency: string;
  onRemove: () => void;
  readOnly?: boolean;
}

export function StopCard({
  stop,
  dayId,
  index,
  isFocused,
  color,
  weekday,
  currency,
  onRemove,
  readOnly,
}: StopCardProps) {
  const { dispatch } = useItinerary();
  const hours = describeHoursForDay(stop.openingHours, weekday);
  const [imgError, setImgError] = useState(false);
  const [editingCost, setEditingCost] = useState(false);
  const [costDraft, setCostDraft] = useState(
    stop.cost != null ? String(stop.cost) : ""
  );

  function commitCost() {
    setEditingCost(false);
    const parsed = costDraft.trim() === "" ? null : Number(costDraft);
    const cost = parsed != null && Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
    if (cost !== (stop.cost ?? null)) {
      dispatch({ type: "SET_STOP_COST", dayId, stopId: stop.id, cost });
    }
    setCostDraft(cost != null ? String(cost) : "");
  }
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
        {stop.photoUrl && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stop.photoUrl}
            alt=""
            onError={() => setImgError(true)}
            className="h-14 w-14 rounded-lg object-cover ring-1 ring-inset ring-black/5"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-neutral-50 to-neutral-100 ring-1 ring-inset ring-black/5">
            <MapPin className="h-5 w-5 text-neutral-300" />
          </div>
        )}
        {/* Matches the number and color of this stop's pin on the map. */}
        <span
          style={{ backgroundColor: color, opacity: isFocused ? 1 : 0.65 }}
          className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm ring-2 ring-white"
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
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {editingCost ? (
            <input
              autoFocus
              type="number"
              min="0"
              step="0.01"
              value={costDraft}
              onChange={(e) => setCostDraft(e.target.value)}
              onBlur={commitCost}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              placeholder="0"
              className="w-16 rounded-full border border-emerald-300 px-2 py-0.5 text-[11px] outline-none"
            />
          ) : stop.cost != null ? (
            <button
              type="button"
              onClick={() => !readOnly && setEditingCost(true)}
              disabled={readOnly}
              className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:hover:bg-emerald-50"
            >
              {formatCurrency(stop.cost, currency)}
            </button>
          ) : (
            !readOnly && (
              <button
                type="button"
                onClick={() => setEditingCost(true)}
                className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
              >
                <DollarSign className="h-2.5 w-2.5" />
                Cost
              </button>
            )
          )}
          {stop.startTime && (
            <p className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700">
              <Clock className="h-2.5 w-2.5" />
              {formatTime12(stop.startTime)}
            </p>
          )}
          {typeof stop.rating === "number" && (
            <p className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
              <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
              {stop.rating.toFixed(1)}
            </p>
          )}
          {hours.status === "closed" && (
            <p className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-600">
              <AlertTriangle className="h-2.5 w-2.5" />
              {hours.text}
            </p>
          )}
          {hours.status === "open" && (
            <p className="inline-flex items-center gap-0.5 text-[11px] text-neutral-400">
              <Clock className="h-2.5 w-2.5" />
              {hours.text}
            </p>
          )}
        </div>
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
