import { OpeningHours, OpeningPeriod } from "@/types/itinerary";

/** Converts a Google Places `opening_hours` result into our stored shape. */
export function parseOpeningHours(
  raw: google.maps.places.PlaceOpeningHours | undefined
): OpeningHours | undefined {
  const rawPeriods = raw?.periods;
  if (!rawPeriods || rawPeriods.length === 0) return undefined;

  // Google represents "open 24 hours" as a single period starting Sunday
  // midnight with no close time.
  const alwaysOpen =
    rawPeriods.length === 1 &&
    !rawPeriods[0].close &&
    rawPeriods[0].open.day === 0 &&
    rawPeriods[0].open.time === "0000";

  const periods: OpeningPeriod[] = rawPeriods
    .filter((p) => p.open)
    .map((p) => ({
      openDay: p.open.day,
      openTime: p.open.time,
      closeDay: p.close?.day,
      closeTime: p.close?.time,
    }));

  return { periods, alwaysOpen };
}

function formatTime(hhmm: string): string {
  const h = parseInt(hhmm.slice(0, 2), 10);
  const m = hhmm.slice(2, 4);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === "00" ? `${h12} ${period}` : `${h12}:${m} ${period}`;
}

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export interface DayHoursInfo {
  status: "open" | "closed" | "unknown";
  text: string;
}

function periodsTextForDay(hours: OpeningHours, weekday: number): string | null {
  const periodsForDay = hours.periods.filter((p) => p.openDay === weekday);
  if (periodsForDay.length === 0) return null;
  return periodsForDay
    .map((p) =>
      p.closeTime
        ? `${formatTime(p.openTime)} – ${formatTime(p.closeTime)}`
        : `From ${formatTime(p.openTime)}`
    )
    .join(", ");
}

/** Describes a place's hours for a specific weekday (0=Sunday..6=Saturday). */
export function describeHoursForDay(
  hours: OpeningHours | undefined,
  weekday: number
): DayHoursInfo {
  if (!hours) return { status: "unknown", text: "" };
  if (hours.alwaysOpen) return { status: "open", text: "Open 24 hours" };

  const text = periodsTextForDay(hours, weekday);
  if (text === null) {
    return { status: "closed", text: `Closed on ${WEEKDAY_NAMES[weekday]}s` };
  }
  return { status: "open", text };
}

/** Full Sunday–Saturday hours breakdown, for a detailed place view. */
export function describeWeeklyHours(
  hours: OpeningHours | undefined
): { day: string; text: string }[] | null {
  if (!hours) return null;
  if (hours.alwaysOpen) {
    return WEEKDAY_NAMES.map((day) => ({ day, text: "Open 24 hours" }));
  }
  return WEEKDAY_NAMES.map((day, i) => ({
    day,
    text: periodsTextForDay(hours, i) ?? "Closed",
  }));
}
