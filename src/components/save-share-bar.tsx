"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  Calendar,
  Check,
  Compass,
  Eye,
  FolderOpen,
  LogIn,
  Link2,
  Loader2,
  Plus,
  UserRound,
  X,
} from "lucide-react";
import { useItinerary } from "@/store/itinerary-context";
import { Itinerary, createEmptyItinerary } from "@/types/itinerary";
import { createShareLink, deleteItinerary, listItineraries } from "@/lib/storage";
import {
  deleteAccountItinerary,
  fetchAccountItineraries,
} from "@/lib/account-sync";

export function SaveShareBar() {
  const { itinerary, readOnly, dispatch } = useItinerary();
  const { data: session, status: sessionStatus } = useSession();
  const isSignedIn = sessionStatus === "authenticated";
  const [showTrips, setShowTrips] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [trips, setTrips] = useState<Itinerary[]>([]);
  const [shareState, setShareState] = useState<"idle" | "working" | "copied">(
    "idle"
  );

  async function refreshTrips() {
    setTrips(isSignedIn ? await fetchAccountItineraries() : listItineraries());
  }

  async function handleShare() {
    setShareState("working");
    const url = await createShareLink(itinerary);
    await navigator.clipboard.writeText(url);
    setShareState("copied");
    setTimeout(() => setShareState("idle"), 2000);
  }

  function handleNewTrip() {
    dispatch({ type: "SET_ITINERARY", itinerary: createEmptyItinerary() });
  }

  function handleSaveCopy() {
    dispatch({ type: "TAKE_OWNERSHIP" });
    // Move off /s/[id] (a server-rendered, always-read-only route) back to
    // the root app route so the now-editable copy persists across reloads.
    window.history.replaceState(null, "", "/");
  }

  function handleOpenTrip(t: Itinerary) {
    dispatch({ type: "SET_ITINERARY", itinerary: t });
    setShowTrips(false);
  }

  async function handleDeleteTrip(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (isSignedIn) {
      await deleteAccountItinerary(id);
    } else {
      deleteItinerary(id);
    }
    refreshTrips();
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200 bg-white px-4 py-2.5 shadow-sm">
      <div className="flex flex-shrink-0 items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
          <Compass className="h-4 w-4" strokeWidth={2.25} />
        </div>
        <span className="hidden text-sm font-semibold tracking-tight text-neutral-800 sm:inline">
          Wander
        </span>
      </div>

      <div className="h-6 w-px flex-shrink-0 bg-neutral-200" />

      <input
        value={itinerary.name}
        disabled={readOnly}
        onChange={(e) =>
          dispatch({ type: "RENAME_ITINERARY", name: e.target.value })
        }
        placeholder="Untitled trip"
        className="min-w-0 flex-1 rounded-lg border border-transparent px-2 py-1.5 text-lg font-semibold text-neutral-900 transition-colors hover:border-neutral-200 focus:border-blue-400 focus:bg-blue-50/40 focus:outline-none disabled:bg-transparent disabled:hover:border-transparent"
      />

      <label className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 py-1.5 pl-2.5 pr-2 text-sm text-neutral-600">
        <Calendar className="h-3.5 w-3.5 text-neutral-400" />
        <input
          type="date"
          value={itinerary.startDate}
          disabled={readOnly}
          onChange={(e) => {
            if (e.target.value) {
              dispatch({ type: "SET_START_DATE", startDate: e.target.value });
            }
          }}
          className="bg-transparent text-sm text-neutral-700 outline-none disabled:text-neutral-400"
        />
      </label>

      {readOnly ? (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 py-1.5 pl-2.5 pr-2 text-sm text-amber-800 ring-1 ring-amber-200">
          <Eye className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="hidden sm:inline">Viewing a shared itinerary</span>
          <button
            onClick={handleSaveCopy}
            className="flex-shrink-0 rounded-md bg-amber-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-amber-700"
          >
            Save a copy to edit
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <button
              onClick={() => {
                refreshTrips();
                setShowTrips((s) => !s);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
            >
              <FolderOpen className="h-3.5 w-3.5 text-neutral-400" />
              My trips
            </button>
            {showTrips && (
              <>
                <button
                  aria-label="Close menu"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setShowTrips(false)}
                />
                <div className="absolute right-0 z-20 mt-1.5 w-64 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg">
                  {!isSignedIn && (
                    <p className="px-2.5 pb-1.5 pt-1 text-[11px] text-neutral-400">
                      Saved on this browser only.{" "}
                      <button
                        onClick={() => signIn("google")}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        Sign in
                      </button>{" "}
                      to sync across devices.
                    </p>
                  )}
                  {trips.length === 0 && (
                    <p className="p-3 text-center text-xs text-neutral-400">
                      No saved trips yet.
                    </p>
                  )}
                  {trips.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleOpenTrip(t)}
                      className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-neutral-50"
                    >
                      <span className="truncate text-neutral-700">
                        {t.name}
                      </span>
                      <button
                        onClick={(e) => handleDeleteTrip(t.id, e)}
                        className="flex-shrink-0 rounded p-0.5 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        aria-label="Delete trip"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleNewTrip}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
          >
            <Plus className="h-3.5 w-3.5 text-neutral-400" />
            New trip
          </button>
        </>
      )}

      {isSignedIn ? (
        <div className="relative">
          <button
            onClick={() => setShowAccount((s) => !s)}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 px-2 py-1.5 text-sm text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
          >
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt=""
                className="h-5 w-5 flex-shrink-0 rounded-full"
              />
            ) : (
              <UserRound className="h-3.5 w-3.5 flex-shrink-0 text-neutral-400" />
            )}
            <span className="hidden max-w-[100px] truncate sm:inline">
              {session?.user?.name ?? "Account"}
            </span>
          </button>
          {showAccount && (
            <>
              <button
                aria-label="Close menu"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setShowAccount(false)}
              />
              <div className="absolute right-0 z-20 mt-1.5 w-52 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg">
                {session?.user?.email && (
                  <p className="truncate px-2.5 py-1.5 text-xs text-neutral-400">
                    {session.user.email}
                  </p>
                )}
                <button
                  onClick={() => signOut()}
                  className="w-full rounded-lg px-2.5 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => signIn("google")}
          className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
        >
          <LogIn className="h-3.5 w-3.5 text-neutral-400" />
          Sign in
        </button>
      )}

      <button
        onClick={handleShare}
        disabled={shareState === "working"}
        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
      >
        {shareState === "working" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : shareState === "copied" ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Link2 className="h-3.5 w-3.5" />
        )}
        {shareState === "working"
          ? "Creating link…"
          : shareState === "copied"
            ? "Link copied!"
            : "Copy share link"}
      </button>
    </div>
  );
}
