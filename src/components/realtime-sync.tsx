"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  LiveblocksProvider,
  RoomProvider,
  useBroadcastEvent,
  useEventListener,
} from "@liveblocks/react";
import { Action, useItinerary } from "@/store/itinerary-context";
import { roomIdForItinerary } from "@/lib/liveblocks-room";

// Actions that only make sense locally (switching/creating/focusing an
// itinerary in *this* browser) — replaying them on another peer would be
// wrong, not just redundant.
const LOCAL_ONLY_ACTIONS = new Set<Action["type"]>([
  "SET_ITINERARY",
  "TAKE_OWNERSHIP",
  "SET_FOCUSED_DAY",
]);

function RoomSync() {
  const { subscribeToActions, dispatch } = useItinerary();
  const broadcast = useBroadcastEvent();
  // Set while applying an action that came from a remote peer, so relaying
  // it back to the room (an echo) is skipped.
  const applyingRemoteRef = useRef(false);

  useEffect(
    () =>
      subscribeToActions((action) => {
        if (applyingRemoteRef.current) return;
        if (LOCAL_ONLY_ACTIONS.has(action.type)) return;
        broadcast(action as never);
      }),
    [subscribeToActions, broadcast]
  );

  useEventListener(({ event }) => {
    applyingRemoteRef.current = true;
    try {
      dispatch(event as Action);
    } finally {
      applyingRemoteRef.current = false;
    }
  });

  return null;
}

/**
 * Headless: while signed in, joins a Liveblocks room for the active
 * itinerary and keeps its reducer actions in sync with other collaborators
 * viewing/editing the same trip. No-ops for signed-out visitors. For trips
 * the signed-in user has no saved access to (or when realtime sync isn't
 * configured on this deployment), the auth endpoint fails closed and the
 * room simply never connects — same fail-open-elsewhere-in-the-app posture.
 */
export function RealtimeSync() {
  const { status } = useSession();
  const { itinerary } = useItinerary();

  if (status !== "authenticated") return null;

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomIdForItinerary(itinerary.id)}>
        <RoomSync />
      </RoomProvider>
    </LiveblocksProvider>
  );
}
