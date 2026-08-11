"use client";

import { APIProvider } from "@vis.gl/react-google-maps";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export const hasGoogleMapsApiKey = Boolean(API_KEY);

/**
 * Wraps the app in the Maps API loader. Only the map/search widgets need an
 * API key, so when one isn't configured this still renders `children` as-is
 * (no APIProvider) rather than hiding the whole app — MapView and
 * PlaceSearch each show their own fallback instead of calling Maps hooks.
 */
export function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
  if (!API_KEY) return <>{children}</>;

  return (
    <APIProvider apiKey={API_KEY} libraries={["places", "routes"]}>
      {children}
    </APIProvider>
  );
}
