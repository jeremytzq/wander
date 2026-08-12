"use client";

import dynamic from "next/dynamic";
import { Itinerary } from "@/types/itinerary";

const AppShell = dynamic(
  () => import("@/components/app-shell").then((m) => m.AppShell),
  { ssr: false }
);

export function ShareView({ itinerary }: { itinerary: Itinerary }) {
  return <AppShell initialItinerary={itinerary} initialReadOnly />;
}
