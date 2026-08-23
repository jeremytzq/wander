import Link from "next/link";
import { MapPinOff } from "lucide-react";
import { auth } from "@/auth";
import { acceptInvite } from "@/lib/collaborators-store";
import { InviteSignInPrompt } from "./invite-sign-in-prompt";
import { InviteAcceptedView } from "./invite-accepted-view";

export default async function InvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return <InviteSignInPrompt callbackUrl={`/invite/${token}`} />;
  }

  const accepted = await acceptInvite(token, session.user.id);

  if (!accepted) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
            <MapPinOff className="h-7 w-7 text-neutral-400" />
          </div>
          <p className="text-base font-semibold text-neutral-800">
            This invite link doesn&apos;t exist or has expired.
          </p>
          <Link
            href="/"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Go to Wander
          </Link>
        </div>
      </div>
    );
  }

  return (
    <InviteAcceptedView
      itinerary={accepted.itinerary}
      readOnly={accepted.role === "viewer"}
    />
  );
}

export function generateMetadata() {
  return { title: "Trip invite — Wander" };
}
