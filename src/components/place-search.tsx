"use client";

import { useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Search } from "lucide-react";
import { PlaceStop } from "@/types/itinerary";
import { hasGoogleMapsApiKey } from "@/components/map/google-maps-provider";

interface PlaceSearchProps {
  onPlaceSelected: (place: Omit<PlaceStop, "id">) => void;
  disabled?: boolean;
}

/** A Google Places Autocomplete-backed search box for adding real locations. */
export function PlaceSearch(props: PlaceSearchProps) {
  if (!hasGoogleMapsApiKey) {
    return (
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-300" />
        <input
          type="text"
          disabled
          placeholder="Set a Google Maps API key to search places…"
          className="w-full rounded-xl border border-neutral-200 bg-neutral-100 py-2.5 pl-9 pr-3 text-sm text-neutral-400"
        />
      </div>
    );
  }
  return <PlaceAutocompleteInput {...props} />;
}

function PlaceAutocompleteInput({ onPlaceSelected, disabled }: PlaceSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const placesLibrary = useMapsLibrary("places");
  const onPlaceSelectedRef = useRef(onPlaceSelected);

  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  useEffect(() => {
    if (!placesLibrary || !inputRef.current) return;

    const autocomplete = new placesLibrary.Autocomplete(inputRef.current, {
      fields: [
        "place_id",
        "name",
        "formatted_address",
        "geometry",
        "photos",
        "rating",
      ],
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location) return;
      onPlaceSelectedRef.current({
        placeId: place.place_id ?? "",
        name: place.name ?? place.formatted_address ?? "Unnamed place",
        address: place.formatted_address ?? "",
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 400 }),
        rating: place.rating,
      });
      if (inputRef.current) inputRef.current.value = "";
    });

    return () => {
      listener.remove();
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [placesLibrary]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search a place on Google Maps…"
        disabled={disabled}
        className="w-full rounded-xl border border-neutral-200 py-2.5 pl-9 pr-3 text-sm text-neutral-900 shadow-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-neutral-100"
      />
    </div>
  );
}
