import { RouteLeg } from "@/components/map/day-route";

export function TravelTimeBadge({ leg }: { leg: RouteLeg }) {
  if (!leg.durationText) return null;
  return (
    <div className="flex items-center gap-1 py-1 pl-9 text-xs text-neutral-500">
      <span aria-hidden>↓</span>
      <span>
        {leg.durationText} drive · {leg.distanceText}
      </span>
    </div>
  );
}
