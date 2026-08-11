# Wander — Itinerary Builder

Plan a trip day by day using real Google Maps locations: search places with
Google Places Autocomplete, drag them into a day-by-day itinerary, see them
plotted on a live map with a driving route and travel times between stops,
and save or share the finished plan.

## Features

- **Search real places** — Google Places Autocomplete for search, backed by
  actual place data (address, rating, photo).
- **Day-by-day itinerary** — add days, drag stops to reorder within a day or
  move them between days (via [dnd-kit](https://dndkit.com)).
- **Live map** — every stop is plotted with [`@vis.gl/react-google-maps`](https://github.com/visgl/react-google-maps);
  the map auto-fits to your stops.
- **Routes & travel time** — the currently focused day's stops are connected
  with a driving route (Google Directions API), with drive time/distance
  shown between consecutive stops.
- **Save & share** — itineraries autosave to `localStorage`; "Copy share
  link" encodes the itinerary into a URL anyone can open (read-only, with a
  "Save a copy to edit" option).

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Get a Google Maps API key from the
   [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials)
   with these APIs enabled on the project:
   - Maps JavaScript API
   - Places API
   - Directions API

   Restrict the key to your domain(s) (and `localhost` for development).

3. Copy the env example and add your key:

   ```bash
   cp .env.local.example .env.local
   ```

   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key-here
   ```

   (`NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` is optional, only needed for custom
   cloud-based map styling.)

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Without an API key
   set, the map area shows a setup notice instead of failing silently.

## Project structure

```
src/
  app/page.tsx                 entry point (client-only shell, no SSR)
  components/app-shell.tsx     top-level layout: providers + sidebar + map
  components/save-share-bar.tsx itinerary name, save/switch trips, share link
  components/itinerary-panel.tsx drag-and-drop day columns + place search
  components/day-column.tsx    a single day's droppable/sortable stop list
  components/stop-card.tsx     one place stop (draggable)
  components/place-search.tsx  Places Autocomplete input
  components/map-view.tsx      Google Map + markers + focused-day route
  components/map/              low-level map building blocks (marker, route)
  store/itinerary-context.tsx  itinerary state (reducer) + autosave + load
  lib/storage.ts               localStorage persistence + share-link encoding
  types/itinerary.ts           Itinerary / ItineraryDay / PlaceStop types
```

## Notes / next steps

- Share links embed the itinerary as base64 JSON in the URL query string —
  simple and backend-free, but links get long for big itineraries. A real
  backend (e.g. a database + short IDs) would be the natural next step for
  multi-user sharing and collaboration.
- Travel time currently uses driving directions. Walking/transit mode
  toggles would be a straightforward addition (`travelMode` on the
  Directions request in `components/map/day-route.tsx`).
- The classic `google.maps.Marker` is used instead of `AdvancedMarker` so
  the app works with just an API key (no Map ID / cloud styling required).

## Learn More

This is a [Next.js](https://nextjs.org) app (App Router, TypeScript,
Tailwind CSS). See the [Next.js documentation](https://nextjs.org/docs) for
framework-level details.
