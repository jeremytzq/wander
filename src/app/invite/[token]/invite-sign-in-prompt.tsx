"use client";

import { signIn } from "next-auth/react";
import { LogIn, Users } from "lucide-react";

export function InviteSignInPrompt({ callbackUrl }: { callbackUrl: string }) {
  return (
    <div className="flex h-dvh items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 p-8 text-center">
      <div className="flex max-w-sm flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <Users className="h-7 w-7 text-blue-500" />
        </div>
        <div>
          <p className="text-base font-semibold text-neutral-800">
            You&apos;ve been invited to a trip
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Sign in with Google to accept and start collaborating.
          </p>
        </div>
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <LogIn className="h-4 w-4" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
