import { Car } from "lucide-react";
import { RouteLeg } from "@/components/map/day-route";

/**
 * Connects two consecutive stop cards. Renders the drive time/distance when
 * known (the focused day's computed route); otherwise just a plain
 * connector line so the list still reads as an ordered sequence.
 */
export function TravelTimeBadge({ leg }: { leg?: RouteLeg }) {
  return (
    <div className="flex items-center gap-2 py-1 pl-8">
      <div className="h-4 w-px flex-shrink-0 border-l-2 border-dashed border-neutral-200" />
      {leg?.durationText && (
        <div className="flex items-center gap-1 rounded-full bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-500 ring-1 ring-neutral-200">
          <Car className="h-3 w-3 text-neutral-400" />
          {leg.durationText} · {leg.distanceText}
        </div>
      )}
    </div>
  );
}
