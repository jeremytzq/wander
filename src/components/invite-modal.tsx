"use client";

import { useState } from "react";
import { Check, Link2, Loader2, Users, X } from "lucide-react";

interface InviteModalProps {
  itineraryId: string;
  onClose: () => void;
}

export function InviteModal({ itineraryId, onClose }: InviteModalProps) {
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    setWorking(true);
    setError(null);
    try {
      const res = await fetch(`/api/itineraries/${itineraryId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to create invite link.");
      }
      setLink(`${window.location.origin}/invite/${data.token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setWorking(false);
    }
  }

  async function handleCopy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        aria-label="Close"
        className="fixed inset-0 z-40 cursor-default bg-black/30"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <Users className="h-4 w-4" />
            </div>
            <h2 className="text-base font-semibold text-neutral-900">
              Invite to this trip
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-neutral-400 transition-colors hover:text-neutral-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!link ? (
          <>
            <label className="mb-1 block text-xs font-medium text-neutral-500">
              Permission
            </label>
            <div className="mb-3 inline-flex w-full items-center gap-0.5 rounded-full bg-neutral-100 p-0.5">
              <button
                type="button"
                onClick={() => setRole("editor")}
                className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  role === "editor"
                    ? "bg-white text-neutral-800 shadow-sm"
                    : "text-neutral-500"
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setRole("viewer")}
                className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  role === "viewer"
                    ? "bg-white text-neutral-800 shadow-sm"
                    : "text-neutral-500"
                }`}
              >
                Viewer
              </button>
            </div>
            <p className="mb-4 text-xs text-neutral-400">
              {role === "editor"
                ? "Anyone with this link can sign in and edit this trip."
                : "Anyone with this link can sign in and view this trip read-only."}
            </p>
            {error && (
              <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={handleCreate}
              disabled={working}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {working ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              {working ? "Creating link…" : "Create invite link"}
            </button>
          </>
        ) : (
          <>
            <label className="mb-1 block text-xs font-medium text-neutral-500">
              {role === "editor" ? "Editor" : "Viewer"} invite link
            </label>
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-xs text-neutral-600">
                {link}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy link"}
            </button>
          </>
        )}
      </div>
    </>
  );
}
