"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useItinerary } from "@/store/itinerary-context";
import { saveAccountItinerary } from "@/lib/account-sync";

const DEBOUNCE_MS = 1500;

/**
 * Headless: while signed in, mirrors the active itinerary to the user's
 * account (in addition to the existing localStorage autosave) so it's
 * reachable from other browsers/devices. No-op while signed out or viewing
 * a read-only shared link. Also covers "just signed in" — the effect reruns
 * as soon as `status` flips to "authenticated", saving whatever's active.
 */
export function AccountSync() {
  const { status } = useSession();
  const { itinerary, readOnly } = useItinerary();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || readOnly) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      saveAccountItinerary(itinerary);
    }, DEBOUNCE_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [itinerary, status, readOnly]);

  return null;
}
