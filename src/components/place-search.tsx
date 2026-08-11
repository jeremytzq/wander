"use client";

import { useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
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
      <input
        type="text"
        disabled
        placeholder="Set a Google Maps API key to search places…"
        className="w-full rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm text-neutral-400"
      />
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
    <input
      ref={inputRef}
      type="text"
      placeholder="Search a place on Google Maps…"
      disabled={disabled}
      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-neutral-100"
    />
  );
}
