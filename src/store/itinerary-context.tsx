"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import {
  Itinerary,
  ItineraryDay,
  PlaceStop,
  createEmptyItinerary,
} from "@/types/itinerary";
import {
  decodeItineraryFromShare,
  getActiveItineraryId,
  getItinerary,
  saveItinerary,
} from "@/lib/storage";

type Action =
  | { type: "SET_ITINERARY"; itinerary: Itinerary; readOnly?: boolean }
  | { type: "TAKE_OWNERSHIP" }
  | { type: "RENAME_ITINERARY"; name: string }
  | { type: "ADD_DAY" }
  | { type: "REMOVE_DAY"; dayId: string }
  | { type: "RENAME_DAY"; dayId: string; label: string }
  | { type: "ADD_STOP"; dayId: string; place: Omit<PlaceStop, "id"> }
  | { type: "REMOVE_STOP"; dayId: string; stopId: string }
  | { type: "REORDER_STOPS"; dayId: string; stopIds: string[] }
  | {
      type: "MOVE_STOP";
      fromDayId: string;
      toDayId: string;
      stopId: string;
      toIndex: number;
    }
  | { type: "UPDATE_STOP_NOTES"; dayId: string; stopId: string; notes: string }
  | { type: "SET_FOCUSED_DAY"; dayId: string | null };

interface State {
  itinerary: Itinerary;
  readOnly: boolean;
  focusedDayId: string | null;
}

function touch(it: Itinerary): Itinerary {
  return { ...it, updatedAt: new Date().toISOString() };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_ITINERARY":
      return {
        itinerary: action.itinerary,
        readOnly: !!action.readOnly,
        focusedDayId: action.itinerary.days[0]?.id ?? null,
      };
    case "TAKE_OWNERSHIP":
      return {
        ...state,
        itinerary: touch({ ...state.itinerary, id: crypto.randomUUID() }),
        readOnly: false,
      };
    case "SET_FOCUSED_DAY":
      return { ...state, focusedDayId: action.dayId };
    case "RENAME_ITINERARY":
      return {
        ...state,
        itinerary: touch({ ...state.itinerary, name: action.name }),
      };
    case "ADD_DAY": {
      const day: ItineraryDay = {
        id: crypto.randomUUID(),
        label: `Day ${state.itinerary.days.length + 1}`,
        stops: [],
      };
      return {
        ...state,
        itinerary: touch({
          ...state.itinerary,
          days: [...state.itinerary.days, day],
        }),
        focusedDayId: day.id,
      };
    }
    case "REMOVE_DAY": {
      const days = state.itinerary.days.filter((d) => d.id !== action.dayId);
      const focusedDayId =
        state.focusedDayId === action.dayId
          ? days[0]?.id ?? null
          : state.focusedDayId;
      return {
        ...state,
        itinerary: touch({ ...state.itinerary, days }),
        focusedDayId,
      };
    }
    case "RENAME_DAY": {
      const days = state.itinerary.days.map((d) =>
        d.id === action.dayId ? { ...d, label: action.label } : d
      );
      return { ...state, itinerary: touch({ ...state.itinerary, days }) };
    }
    case "ADD_STOP": {
      const stop: PlaceStop = { id: crypto.randomUUID(), ...action.place };
      const days = state.itinerary.days.map((d) =>
        d.id === action.dayId ? { ...d, stops: [...d.stops, stop] } : d
      );
      return { ...state, itinerary: touch({ ...state.itinerary, days }) };
    }
    case "REMOVE_STOP": {
      const days = state.itinerary.days.map((d) =>
        d.id === action.dayId
          ? { ...d, stops: d.stops.filter((s) => s.id !== action.stopId) }
          : d
      );
      return { ...state, itinerary: touch({ ...state.itinerary, days }) };
    }
    case "REORDER_STOPS": {
      const days = state.itinerary.days.map((d) => {
        if (d.id !== action.dayId) return d;
        const byId = new Map(d.stops.map((s) => [s.id, s]));
        const stops = action.stopIds
          .map((id) => byId.get(id))
          .filter((s): s is PlaceStop => Boolean(s));
        return { ...d, stops };
      });
      return { ...state, itinerary: touch({ ...state.itinerary, days }) };
    }
    case "MOVE_STOP": {
      let moving: PlaceStop | undefined;
      const daysWithoutStop = state.itinerary.days.map((d) => {
        if (d.id !== action.fromDayId) return d;
        const stops = d.stops.filter((s) => {
          if (s.id === action.stopId) {
            moving = s;
            return false;
          }
          return true;
        });
        return { ...d, stops };
      });
      if (!moving) return state;
      const days = daysWithoutStop.map((d) => {
        if (d.id !== action.toDayId) return d;
        const stops = [...d.stops];
        const index = Math.min(Math.max(action.toIndex, 0), stops.length);
        stops.splice(index, 0, moving as PlaceStop);
        return { ...d, stops };
      });
      return { ...state, itinerary: touch({ ...state.itinerary, days }) };
    }
    case "UPDATE_STOP_NOTES": {
      const days = state.itinerary.days.map((d) =>
        d.id === action.dayId
          ? {
              ...d,
              stops: d.stops.map((s) =>
                s.id === action.stopId ? { ...s, notes: action.notes } : s
              ),
            }
          : d
      );
      return { ...state, itinerary: touch({ ...state.itinerary, days }) };
    }
    default:
      return state;
  }
}

interface ItineraryContextValue extends State {
  dispatch: React.Dispatch<Action>;
}

const ItineraryContext = createContext<ItineraryContextValue | null>(null);

function withFocus(itinerary: Itinerary, readOnly: boolean): State {
  return { itinerary, readOnly, focusedDayId: itinerary.days[0]?.id ?? null };
}

// Runs only in the browser: AppShell (and this provider) is loaded with
// `ssr: false`, so it's safe to read the URL/localStorage synchronously here
// as the reducer's initial state instead of loading it in an effect.
function initState(): State {
  const params = new URLSearchParams(window.location.search);
  const shared = params.get("share");
  if (shared) {
    const decoded = decodeItineraryFromShare(shared);
    if (decoded) return withFocus(decoded, true);
  }
  const activeId = getActiveItineraryId();
  const existing = activeId ? getItinerary(activeId) : null;
  if (existing) return withFocus(existing, false);
  return withFocus(createEmptyItinerary(), false);
}

export function ItineraryProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);

  // Autosave whenever the itinerary changes (skip while read-only / viewing a shared link).
  useEffect(() => {
    if (state.readOnly) return;
    saveItinerary(state.itinerary);
  }, [state.itinerary, state.readOnly]);

  const value = useMemo(() => ({ ...state, dispatch }), [state]);

  return (
    <ItineraryContext.Provider value={value}>
      {children}
    </ItineraryContext.Provider>
  );
}

export function useItinerary() {
  const ctx = useContext(ItineraryContext);
  if (!ctx) throw new Error("useItinerary must be used within ItineraryProvider");
  return ctx;
}
