"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  GripVertical,
  Star,
  X,
} from "lucide-react";
import { PlaceStop } from "@/types/itinerary";
import { describeHoursForDay } from "@/lib/opening-hours";
import { formatTime12 } from "@/lib/schedule";
import { formatCurrency } from "@/lib/currency";
import { useItinerary } from "@/store/itinerary-context";
import { PlaceDetailsModal } from "@/components/place-details-modal";

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
  const [showDetails, setShowDetails] = useState(false);
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

      <div className="flex-shrink-0 pt-0.5">
        {/* Matches the number and color of this stop's pin on the map. */}
        <span
          style={{ backgroundColor: color, opacity: isFocused ? 1 : 0.65 }}
          className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm"
        >
          {index + 1}
        </span>
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <button
          type="button"
          onClick={() => setShowDetails(true)}
          className="block w-full text-left"
        >
          <p className="break-words text-xs font-medium leading-snug text-neutral-900 underline decoration-neutral-200 decoration-dotted underline-offset-2 hover:text-blue-700 hover:decoration-blue-300">
            {stop.name}
          </p>
        </button>
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

      {showDetails && (
        <PlaceDetailsModal
          place={stop}
          weekday={weekday}
          currency={currency}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
}
