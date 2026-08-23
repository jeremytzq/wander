"use client";

import dynamic from "next/dynamic";
import { Itinerary } from "@/types/itinerary";

const AppShell = dynamic(
  () => import("@/components/app-shell").then((m) => m.AppShell),
  { ssr: false }
);

export function InviteAcceptedView({
  itinerary,
  readOnly,
}: {
  itinerary: Itinerary;
  readOnly: boolean;
}) {
  return <AppShell initialItinerary={itinerary} initialReadOnly={readOnly} />;
}
