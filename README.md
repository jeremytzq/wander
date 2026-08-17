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
  link" creates a short `/s/[id]` link (itinerary stored server-side in
  Redis) anyone can open read-only, with a "Save a copy to edit" option. If
  Redis isn't configured, it falls back to a longer self-contained link
  instead of failing.
- **Account sync (optional)** — "Sign in" with Google to save itineraries to
  your account (Redis-backed) instead of just this browser's `localStorage`,
  so "My trips" is the same list on any browser/device you sign into.
- **Generate with AI (optional)** — describe a destination, trip length, and
  interests; Claude plans a day-by-day draft, and every suggested place is
  resolved to a real Google Places result (address, coordinates, photo,
  rating, opening hours) server-side before it's added to the trip.

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

4. (Optional, for short share links) Create a free Redis database at
   [console.upstash.com](https://console.upstash.com), then copy its REST
   URL and token into `.env.local`:

   ```
   UPSTASH_REDIS_REST_URL=your-db-rest-url
   UPSTASH_REDIS_REST_TOKEN=your-db-rest-token
   ```

   Without this, "Copy share link" still works — it just produces a longer
   link that encodes the itinerary directly in the URL instead of a short
   `/s/[id]` one.

5. (Optional, for "Sign in" / cross-device sync) Create a Google OAuth 2.0
   Client ID at
   [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
   (Create credentials → OAuth client ID → Web application), with these
   Authorized redirect URIs:

   ```
   http://localhost:3000/api/auth/callback/google
   https://your-deployed-domain/api/auth/callback/google
   ```

   Then add to `.env.local` (also requires the Upstash setup in step 4 —
   account sync reuses the same Redis database):

   ```
   AUTH_GOOGLE_ID=your-client-id
   AUTH_GOOGLE_SECRET=your-client-secret
   AUTH_SECRET=$(openssl rand -base64 33)
   ```

   Without this, the app works exactly as before — itineraries just stay in
   `localStorage`. The "Sign in" button is always shown; clicking it without
   these set will show Google's own "invalid client" error page rather than
   failing inside the app.

6. (Optional, for "Generate with AI") Get an
   [Anthropic API key](https://console.anthropic.com), and create a
   **second, separate** Google Maps API key with no HTTP-referrer
   restriction (server requests have no referrer) and its "API
   restrictions" limited to just "Places API (New)":

   ```
   ANTHROPIC_API_KEY=your-anthropic-key
   GOOGLE_PLACES_SERVER_API_KEY=your-second-unrestricted-key
   ```

   Without this, the app works exactly as before; "Generate with AI" shows
   a clear "isn't configured on this deployment" message instead of
   erroring. Photos it fetches are proxied through `/api/place-photo` so
   this key is never sent to the browser (unlike the referrer-restricted
   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, an unrestricted key would be usable by
   anyone who could read it out of a page).

7. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Without an API key
   set, the map area shows a setup notice instead of failing silently.

## Project structure

```
src/
  app/page.tsx                 entry point (client-only shell, no SSR)
  app/s/[id]/page.tsx          server-rendered read-only view for a short share link
  app/api/share/route.ts       POST: stores an itinerary, returns a short id
  components/app-shell.tsx     top-level layout: providers + sidebar + map
  components/save-share-bar.tsx itinerary name, save/switch trips, share link
  components/itinerary-panel.tsx drag-and-drop day columns + place search
  components/day-column.tsx    a single day's droppable/sortable stop list
  components/stop-card.tsx     one place stop (draggable)
  components/place-search.tsx  Places Autocomplete input
  components/map-view.tsx      Google Map + markers + focused-day route
  components/map/              low-level map building blocks (marker, route)
  store/itinerary-context.tsx  itinerary state (reducer) + autosave + load
  lib/storage.ts               localStorage persistence + client-side share encoding
  lib/share-store.ts           server-only Redis read/write for short share links
  auth.ts                      Auth.js config (Google sign-in, JWT sessions)
  app/api/itineraries/         GET/POST/DELETE: signed-in user's account itineraries
  lib/user-itineraries-store.ts server-only Redis read/write for account itineraries
  lib/account-sync.ts          client-side fetch wrappers for the itineraries API
  components/account-sync.tsx  headless: debounced save of the active itinerary to the account
  lib/ai/generate-itinerary.ts server-only: Claude plans the trip, then grounds it in real places
  lib/ai/places-lookup.ts      server-only Places API (New) Text Search + opening-hours mapping
  app/api/generate-itinerary/  POST: destination/days/interests -> a full generated Itinerary
  app/api/place-photo/         GET: proxies a Places photo so the server-side key stays server-side
  components/generate-itinerary-modal.tsx "Generate with AI" form + request/result handling
  types/itinerary.ts           Itinerary / ItineraryDay / PlaceStop types
```

## Notes / next steps

- Short links (`/s/[id]`) currently never expire until Redis's TTL (~1 year,
  see `SHARE_TTL_SECONDS` in `lib/share-store.ts`) and have no auth — anyone
  with the id can view the trip. Fine for casual sharing; add access control
  if that's ever a concern.
- Travel time currently uses driving directions. Walking/transit mode
  toggles would be a straightforward addition (`travelMode` on the
  Directions request in `components/map/day-route.tsx`).
- The classic `google.maps.Marker` is used instead of `AdvancedMarker` so
  the app works with just an API key (no Map ID / cloud styling required).

## Learn More

This is a [Next.js](https://nextjs.org) app (App Router, TypeScript,
Tailwind CSS). See the [Next.js documentation](https://nextjs.org/docs) for
framework-level details.
