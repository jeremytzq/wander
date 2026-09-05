"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  Calendar,
  CalendarDays,
  Check,
  Compass,
  Eye,
  FolderOpen,
  LayoutGrid,
  LogIn,
  Link2,
  Loader2,
  MoreHorizontal,
  Plus,
  Sparkles,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useItinerary } from "@/store/itinerary-context";
import { createEmptyItinerary } from "@/types/itinerary";
import { CURRENCY_OPTIONS, DEFAULT_CURRENCY } from "@/lib/currency";
import { createShareLink, deleteItinerary, listItineraries } from "@/lib/storage";
import {
  OwnedOrSharedItinerary,
  deleteAccountItinerary,
  fetchAccountItineraries,
} from "@/lib/account-sync";
import { GenerateItineraryModal } from "@/components/generate-itinerary-modal";
import { InviteModal } from "@/components/invite-modal";
import type { ViewMode } from "@/components/app-shell";

interface SaveShareBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function SaveShareBar({ viewMode, onViewModeChange }: SaveShareBarProps) {
  const { itinerary, readOnly, dispatch } = useItinerary();
  const { data: session, status: sessionStatus } = useSession();
  const isSignedIn = sessionStatus === "authenticated";
  const [showGenerate, setShowGenerate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showTrips, setShowTrips] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [trips, setTrips] = useState<OwnedOrSharedItinerary[]>([]);
  const [shareState, setShareState] = useState<"idle" | "working" | "copied">(
    "idle"
  );

  async function refreshTrips() {
    if (isSignedIn) {
      setTrips(await fetchAccountItineraries());
    } else {
      setTrips(listItineraries().map((it) => ({ itinerary: it, role: "owner" as const })));
    }
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

  function handleOpenTrip(entry: OwnedOrSharedItinerary) {
    dispatch({
      type: "SET_ITINERARY",
      itinerary: entry.itinerary,
      readOnly: entry.role === "viewer",
    });
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

  // Date, currency, view toggle, and trip actions — kept out of the main
  // row so it can stay a single compact line on mobile. Rendered inline
  // (wrapped in its own flex-wrap box) at sm and up, and inside the
  // slide-down "more" panel below sm. Reused as-is in both places: it
  // closes over this component's state/handlers, so nothing needs to be
  // passed in or duplicated.
  const secondaryControls = (
    <>
      <label className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 py-1 pl-2 pr-1.5 text-sm text-neutral-600">
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

      <label className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 py-1 pl-2 pr-1 text-sm text-neutral-600">
        <Wallet className="h-3.5 w-3.5 text-neutral-400" />
        <select
          value={itinerary.currency || DEFAULT_CURRENCY}
          disabled={readOnly}
          onChange={(e) =>
            dispatch({ type: "SET_CURRENCY", currency: e.target.value })
          }
          className="bg-transparent text-sm text-neutral-700 outline-none disabled:text-neutral-400"
        >
          {CURRENCY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <div className="inline-flex flex-shrink-0 items-center gap-0.5 rounded-full bg-neutral-100 p-0.5">
        <button
          type="button"
          onClick={() => onViewModeChange("board")}
          aria-label="Board view"
          title="Board view"
          className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors ${
            viewMode === "board"
              ? "bg-white text-neutral-800 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          <span>Board</span>
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange("calendar")}
          aria-label="Calendar view"
          title="Calendar view"
          className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors ${
            viewMode === "calendar"
              ? "bg-white text-neutral-800 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Calendar</span>
        </button>
      </div>

      {readOnly ? (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 py-1 pl-2.5 pr-2 text-sm text-amber-800 ring-1 ring-amber-200">
          <Eye className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Viewing a shared itinerary</span>
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
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1 text-sm text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
            >
              <FolderOpen className="h-3.5 w-3.5 text-neutral-400" />
              <span>My trips</span>
            </button>
            {showTrips && (
              <>
                <button
                  aria-label="Close menu"
                  className="fixed inset-0 z-30 cursor-default"
                  onClick={() => setShowTrips(false)}
                />
                <div className="fixed inset-x-3 top-14 z-40 w-auto rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-1.5 sm:w-64">
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
                  {trips.map(({ itinerary: t, role }) => (
                    <div
                      key={t.id}
                      onClick={() => handleOpenTrip({ itinerary: t, role })}
                      className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-neutral-50"
                    >
                      <span className="min-w-0 flex-1 truncate text-neutral-700">
                        {t.name}
                      </span>
                      {role !== "owner" && (
                        <span className="flex-shrink-0 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium capitalize text-neutral-500">
                          {role}
                        </span>
                      )}
                      {role === "owner" && (
                        <button
                          onClick={(e) => handleDeleteTrip(t.id, e)}
                          className="flex-shrink-0 rounded p-0.5 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          aria-label="Delete trip"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleNewTrip}
            aria-label="New trip"
            title="New trip"
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1 text-sm text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
          >
            <Plus className="h-3.5 w-3.5 text-neutral-400" />
            <span>New trip</span>
          </button>

          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50/60 px-2.5 py-1 text-sm text-violet-700 transition-colors hover:border-violet-300 hover:bg-violet-50"
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            <span>Generate with AI</span>
          </button>

          {isSignedIn && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1 text-sm text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
            >
              <Users className="h-3.5 w-3.5 text-neutral-400" />
              <span>Invite</span>
            </button>
          )}
        </>
      )}
    </>
  );

  const accountControl = isSignedIn ? (
    <div className="relative">
      <button
        onClick={() => setShowAccount((s) => !s)}
        className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 px-2 py-1 text-sm text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
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
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setShowAccount(false)}
          />
          <div className="fixed inset-x-3 top-14 z-40 w-auto rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-1.5 sm:w-52">
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
      className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1 text-sm text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
    >
      <LogIn className="h-3.5 w-3.5 text-neutral-400" />
      Sign in
    </button>
  );

  const shareButton = (
    <button
      onClick={handleShare}
      disabled={shareState === "working"}
      className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
    >
      {shareState === "working" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : shareState === "copied" ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Link2 className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">
        {shareState === "working"
          ? "Creating link…"
          : shareState === "copied"
            ? "Link copied!"
            : "Copy share link"}
      </span>
    </button>
  );

  return (
    <div className="border-b border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 px-3 py-1.5">
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
            <Compass className="h-3.5 w-3.5" strokeWidth={2.25} />
          </div>
          <span className="hidden text-sm font-semibold tracking-tight text-neutral-800 sm:inline">
            Wander
          </span>
        </div>

        <div className="hidden h-5 w-px flex-shrink-0 bg-neutral-200 sm:block" />

        <input
          value={itinerary.name}
          disabled={readOnly}
          onChange={(e) =>
            dispatch({ type: "RENAME_ITINERARY", name: e.target.value })
          }
          placeholder="Untitled trip"
          className="min-w-0 flex-1 rounded-lg border border-transparent px-2 py-1 text-base font-semibold text-neutral-900 transition-colors hover:border-neutral-200 focus:border-blue-400 focus:bg-blue-50/40 focus:outline-none disabled:bg-transparent disabled:hover:border-transparent"
        />

        <button
          type="button"
          onClick={() => setShowMore((s) => !s)}
          aria-label="More options"
          aria-expanded={showMore}
          className={`flex flex-shrink-0 items-center justify-center rounded-lg border px-2 py-1.5 transition-colors sm:hidden ${
            showMore
              ? "border-blue-300 bg-blue-50 text-blue-600"
              : "border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:bg-neutral-50"
          }`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          {secondaryControls}
        </div>

        {accountControl}
        {shareButton}
      </div>

      {showMore && (
        <>
          <button
            aria-label="Close menu"
            className="fixed inset-0 z-30 cursor-default sm:hidden"
            onClick={() => setShowMore(false)}
          />
          <div className="fixed inset-x-3 top-14 z-40 flex max-h-[70vh] flex-col flex-wrap gap-2 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-3 shadow-lg sm:hidden">
            {secondaryControls}
          </div>
        </>
      )}

      {showGenerate && (
        <GenerateItineraryModal onClose={() => setShowGenerate(false)} />
      )}

      {showInvite && (
        <InviteModal
          itineraryId={itinerary.id}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
}
