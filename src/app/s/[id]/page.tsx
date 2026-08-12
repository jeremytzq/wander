import Link from "next/link";
import { MapPinOff } from "lucide-react";
import { getSharedItinerary } from "@/lib/share-store";
import { ShareView } from "./share-view";

export default async function SharePage({ params }: PageProps<"/s/[id]">) {
  const { id } = await params;
  const itinerary = await getSharedItinerary(id);

  if (!itinerary) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 p-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
            <MapPinOff className="h-7 w-7 text-neutral-400" />
          </div>
          <p className="text-base font-semibold text-neutral-800">
            This link doesn&apos;t exist or has expired.
          </p>
          <Link
            href="/"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Start a new trip
          </Link>
        </div>
      </div>
    );
  }

  return <ShareView itinerary={itinerary} />;
}

export async function generateMetadata({ params }: PageProps<"/s/[id]">) {
  const { id } = await params;
  const itinerary = await getSharedItinerary(id);
  return {
    title: itinerary
      ? `${itinerary.name} — Wander`
      : "Shared trip not found — Wander",
  };
}
