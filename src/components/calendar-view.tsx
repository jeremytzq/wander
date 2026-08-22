"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bed,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
} from "lucide-react";
import { useItinerary } from "@/store/itinerary-context";
import {
  ItineraryDay,
  PlaceStop,
  addDaysToDateString,
  toDateInputValue,
} from "@/types/itinerary";
import { buildCountryColorMap, colorForDay } from "@/lib/country-colors";
import { describeHoursForDay } from "@/lib/opening-hours";
import {
  DEFAULT_DURATION_MINUTES,
  DURATION_OPTIONS,
  ScheduledEvent,
  formatDuration,
  formatTime12,
  layoutScheduledEvents,
} from "@/lib/schedule";

interface CalendarViewProps {
  /** Called after a trip day is picked, so the parent can switch back to the board view. */
  onSelectDay?: () => void;
}

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = 24;
const ROW_HEIGHT = 48; // px per hour
const GUTTER_WIDTH = 44; // px
const MIN_DAY_COL_WIDTH = 76; // px — keeps columns legible on narrow screens

function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

interface EditingTarget {
  dayId: string;
  stop: PlaceStop;
}

/** Week-grid schedule view: each date in the visible week shows its trip
 * day's stops laid out by time of day (unscheduled stops sit in a shelf
 * above the grid). Clicking a stop lets you set/clear its start time and
 * duration; clicking a day's header focuses it and returns to the board. */
export function CalendarView({ onSelectDay }: CalendarViewProps) {
  const { itinerary, focusedDayId, readOnly, dispatch } = useItinerary();

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
  const [weekStart, setWeekStart] = useState(() => startOfWeek(firstTripDate));
  const [editing, setEditing] = useState<EditingTarget | null>(null);

  const weekDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStart]
  );

  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    const startLabel = start.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    const endLabel =
      start.getMonth() === end.getMonth()
        ? end.toLocaleDateString(undefined, { day: "numeric" })
        : end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${startLabel} – ${endLabel}, ${end.getFullYear()}`;
  }, [weekDates]);

  const todayKey = toDateInputValue(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 7 * ROW_HEIGHT });
  }, []);

  function handleSelectDay(dayId: string) {
    dispatch({ type: "SET_FOCUSED_DAY", dayId });
    onSelectDay?.();
  }

  function saveTime(startTime: string, durationMinutes: number) {
    if (!editing) return;
    dispatch({
      type: "SET_STOP_TIME",
      dayId: editing.dayId,
      stopId: editing.stop.id,
      time: { startTime, durationMinutes },
    });
    setEditing(null);
  }

  function clearTime() {
    if (!editing) return;
    dispatch({
      type: "SET_STOP_TIME",
      dayId: editing.dayId,
      stopId: editing.stop.id,
      time: null,
    });
    setEditing(null);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 flex flex-shrink-0 items-center justify-between">
        <button
          type="button"
          onClick={() => setWeekStart((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7))}
          aria-label="Previous week"
          className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-neutral-800">{weekLabel}</p>
        <button
          type="button"
          onClick={() => setWeekStart((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7))}
          aria-label="Next week"
          className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto">
      <div
        className="flex h-full min-h-0 flex-col"
        style={{ minWidth: GUTTER_WIDTH + 7 * MIN_DAY_COL_WIDTH }}
      >
      <div className="flex flex-shrink-0" style={{ paddingLeft: GUTTER_WIDTH }}>
        {weekDates.map((date) => {
          const key = toDateInputValue(date);
          const match = tripDayByDate.get(key);
          const isToday = key === todayKey;
          return (
            <button
              key={key}
              type="button"
              disabled={!match}
              onClick={() => match && handleSelectDay(match.day.id)}
              className={`min-w-0 flex-1 rounded-t-lg px-1 py-1 text-center transition-colors ${
                match ? "cursor-pointer hover:bg-blue-50/60" : "cursor-default"
              } ${match?.day.id === focusedDayId ? "bg-blue-50" : ""}`}
            >
              <p className="text-[10px] font-medium text-neutral-400">
                {WEEKDAY_HEADERS[date.getDay()]}
              </p>
              <p
                className={`text-xs font-semibold ${
                  isToday
                    ? "text-blue-600"
                    : match
                      ? "text-neutral-800"
                      : "text-neutral-300"
                }`}
              >
                {date.getDate()}
              </p>
              {match && (
                <p className="truncate text-[10px] text-neutral-400">
                  {match.day.label}
                </p>
              )}
              {match?.day.accommodation && (
                <p className="flex items-center justify-center gap-0.5 truncate text-[9px] text-indigo-500">
                  <Bed className="h-2.5 w-2.5 flex-shrink-0" />
                  <span className="truncate">
                    {match.day.accommodation.name}
                  </span>
                </p>
              )}
            </button>
          );
        })}
      </div>

      <div
        className="flex flex-shrink-0 gap-0 border-b border-neutral-100"
        style={{ paddingLeft: GUTTER_WIDTH, maxHeight: 64 }}
      >
        {weekDates.map((date) => {
          const key = toDateInputValue(date);
          const match = tripDayByDate.get(key);
          const unscheduled = match
            ? match.day.stops.filter((s) => !s.startTime)
            : [];
          return (
            <div
              key={key}
              className="flex min-w-0 flex-1 flex-wrap items-start gap-0.5 overflow-y-auto px-0.5 py-1"
            >
              {unscheduled.map((stop) => (
                <button
                  key={stop.id}
                  type="button"
                  disabled={readOnly}
                  onClick={() =>
                    match && setEditing({ dayId: match.day.id, stop })
                  }
                  title={stop.name}
                  className="max-w-full truncate rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 transition-colors hover:bg-blue-100 hover:text-blue-700 disabled:hover:bg-neutral-100 disabled:hover:text-neutral-600"
                >
                  {stop.name}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex" style={{ height: HOURS * ROW_HEIGHT }}>
          <div className="flex-shrink-0" style={{ width: GUTTER_WIDTH }}>
            {Array.from({ length: HOURS }, (_, h) => (
              <div key={h} style={{ height: ROW_HEIGHT }} className="relative">
                <span className="absolute -top-2 right-1.5 text-[9px] text-neutral-300">
                  {formatHourLabel(h)}
                </span>
              </div>
            ))}
          </div>
          {weekDates.map((date) => {
            const key = toDateInputValue(date);
            const match = tripDayByDate.get(key);
            const weekday = date.getDay();
            const events = match
              ? layoutScheduledEvents(match.day.stops)
              : [];
            return (
              <div
                key={key}
                className="relative min-w-0 flex-1 border-l border-neutral-100"
                style={{
                  backgroundImage: `repeating-linear-gradient(to bottom, #f2f2f1 0, #f2f2f1 1px, transparent 1px, transparent ${ROW_HEIGHT}px)`,
                }}
              >
                {match &&
                  events.map((ev) => (
                    <EventBlock
                      key={ev.stop.id}
                      event={ev}
                      color={colorForDay(countryColors, match.day)}
                      closed={
                        describeHoursForDay(ev.stop.openingHours, weekday)
                          .status === "closed"
                      }
                      readOnly={readOnly}
                      onClick={() =>
                        setEditing({ dayId: match.day.id, stop: ev.stop })
                      }
                    />
                  ))}
              </div>
            );
          })}
        </div>
      </div>
      </div>
      </div>

      {editing && (
        <TimeEditModal
          stop={editing.stop}
          onClose={() => setEditing(null)}
          onSave={saveTime}
          onClear={clearTime}
        />
      )}
    </div>
  );
}

interface EventBlockProps {
  event: ScheduledEvent;
  color: string;
  closed: boolean;
  readOnly: boolean;
  onClick: () => void;
}

function EventBlock({ event, color, closed, readOnly, onClick }: EventBlockProps) {
  const top = (event.startMinutes / 60) * ROW_HEIGHT;
  const height = Math.max(
    ((event.endMinutes - event.startMinutes) / 60) * ROW_HEIGHT,
    18
  );
  const leftPct = (event.column / event.columns) * 100;
  const widthPct = 100 / event.columns;

  return (
    <button
      type="button"
      disabled={readOnly}
      onClick={onClick}
      style={{
        top,
        height,
        left: `${leftPct}%`,
        width: `calc(${widthPct}% - 2px)`,
        borderLeftColor: color,
        backgroundColor: `${color}14`,
      }}
      className="absolute overflow-hidden rounded-md border-l-2 bg-white px-1 py-0.5 text-left shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
    >
      <p className="truncate text-[9px] font-semibold" style={{ color }}>
        {formatTime12(event.stop.startTime!)}
      </p>
      <p className="truncate text-[10px] text-neutral-700">
        {event.stop.name}
      </p>
      {closed && (
        <AlertTriangle className="absolute right-1 top-1 h-2.5 w-2.5 flex-shrink-0 text-red-500" />
      )}
    </button>
  );
}

interface TimeEditModalProps {
  stop: PlaceStop;
  onClose: () => void;
  onSave: (startTime: string, durationMinutes: number) => void;
  onClear: () => void;
}

function TimeEditModal({ stop, onClose, onSave, onClear }: TimeEditModalProps) {
  const [time, setTime] = useState(stop.startTime ?? "09:00");
  const [duration, setDuration] = useState(
    stop.durationMinutes ?? DEFAULT_DURATION_MINUTES
  );

  return (
    <>
      <button
        aria-label="Close"
        className="fixed inset-0 z-30 cursor-default bg-black/10"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-40 w-72 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-neutral-200 bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-start gap-1.5 text-sm font-semibold text-neutral-800">
            <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
            <span className="break-words">{stop.name}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex-shrink-0 text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mb-1 block text-[11px] font-medium text-neutral-500">
          Start time
        </label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="mb-3 w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-sm outline-none focus:border-blue-300"
        />

        <label className="mb-1 block text-[11px] font-medium text-neutral-500">
          Duration
        </label>
        <select
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="mb-4 w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-300"
        >
          {DURATION_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {formatDuration(m)}
            </option>
          ))}
        </select>

        <div className="flex items-center justify-between gap-2">
          {stop.startTime ? (
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-medium text-red-500 hover:text-red-600"
            >
              Clear time
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => onSave(time, duration)}
            className="ml-auto rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}
