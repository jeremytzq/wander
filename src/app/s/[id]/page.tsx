import Link from "next/link";
import { getSharedItinerary } from "@/lib/share-store";
import { ShareView } from "./share-view";

export default async function SharePage({ params }: PageProps<"/s/[id]">) {
  const { id } = await params;
  const itinerary = await getSharedItinerary(id);

  if (!itinerary) {
    return (
      <div className="flex h-dvh items-center justify-center p-8 text-center">
        <div>
          <p className="text-lg font-semibold text-neutral-800">
            This link doesn&apos;t exist or has expired.
          </p>
          <Link
            href="/"
            className="mt-2 inline-block text-sm text-blue-600 hover:underline"
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
