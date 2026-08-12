import { PlaceStop } from "@/types/itinerary";

export const DEFAULT_DURATION_MINUTES = 60;
export const DURATION_OPTIONS = [30, 45, 60, 90, 120, 180, 240];

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatTime12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export interface ScheduledEvent {
  stop: PlaceStop;
  startMinutes: number;
  endMinutes: number;
  /** 0-based horizontal slot among overlapping events. */
  column: number;
  /** Total overlapping slots in this event's cluster. */
  columns: number;
}

/**
 * Lays out a day's timed stops (those with `startTime` set) into a time
 * grid: sorts by start time and, when events overlap, splits them into
 * side-by-side columns instead of stacking on top of each other.
 */
export function layoutScheduledEvents(stops: PlaceStop[]): ScheduledEvent[] {
  const timed = stops
    .filter((s) => !!s.startTime)
    .map((s) => {
      const startMinutes = timeToMinutes(s.startTime!);
      const endMinutes =
        startMinutes + (s.durationMinutes ?? DEFAULT_DURATION_MINUTES);
      return { stop: s, startMinutes, endMinutes };
    })
    .sort((a, b) => a.startMinutes - b.startMinutes);

  const events: ScheduledEvent[] = [];
  let cluster: typeof timed = [];
  let clusterEnd = -Infinity;

  function flushCluster() {
    if (cluster.length === 0) return;
    const columnEnds: number[] = [];
    for (const ev of cluster) {
      let column = columnEnds.findIndex((end) => end <= ev.startMinutes);
      if (column === -1) {
        column = columnEnds.length;
        columnEnds.push(ev.endMinutes);
      } else {
        columnEnds[column] = ev.endMinutes;
      }
      events.push({ ...ev, column, columns: -1 });
    }
    const columns = columnEnds.length;
    for (let i = events.length - cluster.length; i < events.length; i++) {
      events[i].columns = columns;
    }
    cluster = [];
  }

  for (const ev of timed) {
    if (cluster.length > 0 && ev.startMinutes >= clusterEnd) {
      flushCluster();
      clusterEnd = -Infinity;
    }
    cluster.push(ev);
    clusterEnd = Math.max(clusterEnd, ev.endMinutes);
  }
  flushCluster();

  return events;
}
