# Mapbox Navigation — How-To Guide

> A Next.js project demonstrating how to integrate Mapbox GL JS into a React app with geocoding, routing, multi-stop planning, and turn-by-turn navigation. Uses Next.js only to avoid a separate backend — all UI logic is fully client-side React.

> This is a work-in-progress demo. It is not production-ready.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Setup & Environment](#2-setup--environment)
3. [Architecture Overview](#3-architecture-overview)
4. [Step 1 — Map Context & State](#4-step-1--map-context--state)
5. [Step 2 — Rendering the Map](#5-step-2--rendering-the-map)
6. [Step 3 — User Location](#6-step-3--user-location)
7. [Step 4 — Geocoding (Place Search)](#7-step-4--geocoding-place-search)
8. [Step 5 — Drawing Routes](#8-step-5--drawing-routes)
9. [Step 6 — Multi-Stop Routing](#9-step-6--multi-stop-routing)
10. [Step 7 — Turn-by-Turn Navigation Mode](#10-step-7--turn-by-turn-navigation-mode)
11. [Step 8 — Markers](#11-step-8--markers)
12. [Component Reference](#12-component-reference)
13. [API Routes Reference](#13-api-routes-reference)
14. [Gotchas & Tips](#14-gotchas--tips)

---

## 1. Project Overview

This project is a reference implementation of a Mapbox-powered navigation UI. It covers:

- Rendering a Mapbox tile map inside a React component
- Live user location tracking via the browser Geolocation API
- Forward geocoding (place search) via the Mapbox Geocoding API
- Building and drawing driving routes with the Mapbox Directions API
- Multi-stop (waypoint) routing
- Turn-by-turn step display with maneuver icons
- Navigation mode — camera follows the user with pitch and bearing

The UI is designed around a `FloatingCard` that holds the map and all floating sidebars.

---

## 2. Setup & Environment

### Install dependencies

```bash
pnpm add mapbox-gl
pnpm add -D @types/mapbox-gl   # TypeScript types
```

### Environment variable

Create `.env.local`:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiL...your_token_here
```

> Use a **public** (`pk.`) token. Secret (`sk.`) tokens must never go in frontend code.

### Import Mapbox CSS

In `app/layout.tsx` (or your root layout), import the Mapbox stylesheet — without it the map controls render without any styling:

```ts
import "mapbox-gl/dist/mapbox-gl.css";
```

### Set the access token once

At the top of `MapContainer.tsx`, set the token globally:

```ts
import mapboxgl from "mapbox-gl";
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
```

You only need to do this once. After importing the module, all subsequent `mapboxgl` calls use this token automatically.

---

## 3. Architecture Overview

```
FloatingCard
├── MapProvider          ← React context: holds map instance + all shared state
│   ├── MapContainer     ← Creates the map, draws routes, handles markers
│   └── NavigationShell  ← Manages UI mode (idle / searching / routing / navigating)
│       ├── SearchBar        ← Debounced search input → updates URL query param
│       ├── PlaceSidebar     ← Shown when a place is selected
│       ├── RouteSidebar     ← Shown in routing mode (origin, stops, destination)
│       └── NavigationSidebar← Shown during navigation (ETA, turn-by-turn steps)
```

### Why URL query params for search?

`SearchBar` writes the query into the URL (`?q=...`). `NavigationShell` reads it via `useSearchParams()`. This keeps the search state in the URL so the browser back button works naturally and the page is shareable. It also avoids prop-drilling a search string through multiple components.

---

## 4. Step 1 — Map Context & State

**Files:** `map-context.tsx`, `map-provider.tsx`

All map state is managed through a single React context so every component can read and write to the same map instance and shared data without prop drilling.

### map-context.tsx

Defines the shape of the shared state and exports the `useMapbox()` hook:

```ts
export function useMapbox() {
  const context = useContext(MapContext);
  if (!context) throw new Error("useMapbox must be inside MapProvider");
  return context;
}
```

Key values exposed by the context:

| Value            | Type                   | Purpose                                           |
| ---------------- | ---------------------- | ------------------------------------------------- |
| `map`            | `mapboxgl.Map \| null` | The live Mapbox map instance                      |
| `currentCoords`  | `{ lng, lat } \| null` | User's live GPS position                          |
| `selectedPlaces` | `PlaceData[]`          | Geocoded places (destination = first item)        |
| `destination`    | `PlaceData \| null`    | Derived from `selectedPlaces[0]`                  |
| `stops`          | `PlaceData[]`          | Intermediate waypoints                            |
| `route`          | `RouteInfo[]`          | All route alternatives                            |
| `activeRoute`    | `RouteInfo \| null`    | Currently highlighted route                       |
| `originPlace`    | `PlaceData \| null`    | Manual origin (null = GPS)                        |
| `previewPlace`   | `PlaceData \| null`    | Temporary map pin shown while browsing results    |
| `isNavigating`   | `boolean`              | Whether navigation camera mode is active          |
| `buildRoute()`   | `async fn`             | Fetches route from API and draws it on the map    |
| `clearRoutes()`  | `fn`                   | Removes all route layers and sources from the map |

### map-provider.tsx

The provider component holds all the state. Important implementation details:

**Continuous GPS caching** — starts a `watchPosition` on mount and caches the result in a ref. This means when `buildRoute()` is called, the current location is available instantly without waiting for a geolocation request:

```ts
const watchId = navigator.geolocation.watchPosition(
  (pos) => {
    cachedPositionRef.current = pos.coords;
    setCurrentCoords({ lng: pos.coords.longitude, lat: pos.coords.latitude });
  },
  () => {
    /* silent — we have fallbacks */
  },
  { enableHighAccuracy: false, maximumAge: 30_000 },
);
```

**Multi-strategy location resolver** — `resolveCurrentLocation()` tries three strategies in order to get a GPS fix, enabling graceful degradation in slow/denied environments:

```
1. Use cachedPositionRef (instant — no API call needed)
2. getCurrentPosition with low accuracy and 5s timeout
3. getCurrentPosition with high accuracy and 15s timeout
4. Return null → show error banner, let user set origin manually
```

**Route drawing** — `drawRoute()` creates a GeoJSON `LineSource` and `LineLayer` on the Mapbox map for each route alternative. Active routes are painted blue (`#3b82f6`, width 5); inactive ones are grey (`#9ca3af`, width 3, opacity 0.6).

**Clearing routes** — `clearRoutes()` iterates `route-0`, `route-1`, ... until no more sources exist, removing both the layer and the source each time. Mapbox requires you to remove a layer before removing its source.

---

## 5. Step 2 — Rendering the Map

**File:** `MapContainer.tsx`

### Creating the map instance

```ts
const mapInstance = new mapboxgl.Map({
  container: mapRef.current, // the div that receives the canvas
  style: `mapbox://styles/mapbox/dark-v11`, // or "light-v11", "streets-v12", etc.
  center: [lng, lat], // initial center [longitude, latitude]
  zoom: 10,
  pitch: 0,
  bearing: 0,
});
```

The map is created in a `useEffect` with `mapRef.current` as the container. The instance is stored in the shared context via `setMap(mapInstance)`.

> **Important:** the container `<div>` must have explicit width and height (e.g. `w-full h-full` with a sized parent) otherwise Mapbox renders a 0×0 canvas.

### Changing the map style (theme)

Pass the style as part of the initial config. To react to theme changes at runtime, recreate the map instance when `theme` changes (the `useEffect` dependency array includes `theme`).

### Cleanup

Always call `mapInstance.remove()` in the cleanup function of the `useEffect` to destroy the WebGL context when the component unmounts:

```ts
return () => mapInstance.remove();
```

---

## 6. Step 3 — User Location

**Files:** `MapContainer.tsx`, `map-provider.tsx`

### GeolocateControl — the built-in user dot

Mapbox provides a `GeolocateControl` that renders a pulsing blue dot at the user's position and optionally shows their heading:

```ts
const geolocate = new mapboxgl.GeolocateControl({
  positionOptions: { enableHighAccuracy: true },
  trackUserLocation: true, // keeps updating as the user moves
  showUserHeading: true, // rotates the dot to show direction of travel
});

map.addControl(geolocate, "bottom-right"); // position inside the map
geolocate.trigger(); // auto-start on map load
```

Calling `geolocate.trigger()` inside the map's `"load"` event fires the control immediately, so the user doesn't have to click the button.

### Hiding the default geolocate button

Mapbox injects its own locate button into the DOM. To hide it (if you have a custom one, or simply don't want it):

```css
/* globals.css */
.mapboxgl-ctrl-geolocate {
  display: none !important;
}
```

### Capturing heading for navigation

The `geolocate` control emits a `"geolocate"` event with `coords.heading`. Store it in a ref (not state) to avoid re-renders:

```ts
geolocate.on("geolocate", (e) => {
  if (e.coords?.heading != null) {
    headingRef.current = e.coords.heading;
  }
});
```

### Custom GPS button

`GpsButton.tsx` demonstrates a manual alternative — call `navigator.geolocation.getCurrentPosition()` and use `map.flyTo()` to animate the camera to the result:

```ts
navigator.geolocation.getCurrentPosition((pos) => {
  map.flyTo({
    center: [pos.coords.longitude, pos.coords.latitude],
    zoom: 14,
    essential: true,
  });
});
```

---

## 7. Step 4 — Geocoding (Place Search)

**Files:** `SearchBar.tsx`, `NavigationShell.tsx`, `app/api/geocode/route.ts`

### How it works end-to-end

```
User types → SearchBar (debounce 400ms) → URL ?q=... → NavigationShell reads param
→ fetch /api/geocode?q=... → Next.js API route → Mapbox Geocoding API → results
→ NavigationShell updates places state → dropdown shown OR place auto-selected
```

### The API route

The Mapbox Geocoding endpoint format:

```
GET https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json
  ?country=IN           (restrict to a country — optional)
  &bbox=68,6,97,37     (bounding box [west,south,east,north] — optional)
  &autocomplete=true
  &limit=5
  &access_token=TOKEN
```

Each result feature is normalised to a `PlaceData` shape:

```ts
{
  id: string;
  text: string;          // short name, e.g. "Kochi"
  place_name: string;    // full address
  lng: number;           // center[0]
  lat: number;           // center[1]
  place_type: string[];  // e.g. ["place", "region"]
}
```

### Two submit modes

1. **Autocomplete** — debounced typing updates `?q=...` without `&submit=true`. NavigationShell shows a dropdown.
2. **Enter key** — adds `&submit=true`. NavigationShell auto-selects the first result and moves to `place-selected` mode.

### Why proxy through Next.js API?

Calling the Mapbox API directly from the browser exposes your token in network requests. Proxying via a Next.js route keeps the token server-side. Here it uses `NEXT_PUBLIC_` (so it's technically visible in the bundle) but the proxy pattern is still good practice, especially if you switch to a secret token later.

---

## 8. Step 5 — Drawing Routes

**Files:** `map-provider.tsx` (`buildRoute`, `drawRoute`), `app/api/route/route.ts`

### Fetching a route

The Mapbox Directions API endpoint:

```
GET https://api.mapbox.com/directions/v5/mapbox/driving/{coordinates}
  ?alternatives=true   (get up to 3 alternative routes)
  &geometries=geojson  (get GeoJSON LineString geometry back)
  &overview=full       (full resolution geometry, not simplified)
  &access_token=TOKEN
```

`coordinates` is a semicolon-separated list: `lng,lat;lng,lat` (start to end). For waypoints: `start;wp1;wp2;...;end`.

> **Note:** Mapbox disables route alternatives when waypoints (stops) are present. The API route handles this automatically.

### Drawing on the map

GeoJSON sources and layers are used to render route lines. Each alternative gets its own source/layer pair:

```ts
// Add a GeoJSON source
map.addSource("route-0", {
  type: "geojson",
  data: {
    type: "Feature",
    geometry: route.geometry, // GeoJSON LineString from Mapbox API
    properties: {},
  },
});

// Add a line layer on top of the source
map.addLayer({
  id: "route-0",
  type: "line",
  source: "route-0",
  paint: {
    "line-color": "#3b82f6",
    "line-width": 5,
    "line-opacity": 1,
  },
});
```

### Updating an existing layer (avoiding "source already exists" errors)

Before adding, check if the source exists and update it instead:

```ts
if (map.getSource("route-0")) {
  (map.getSource("route-0") as mapboxgl.GeoJSONSource).setData(feature);
} else {
  map.addSource("route-0", { type: "geojson", data: feature });
  map.addLayer({ id: "route-0", type: "line", source: "route-0", paint: {...} });
}
```

### Fitting the camera to a route

After drawing, animate the camera to show the full route:

```ts
const bounds = new mapboxgl.LngLatBounds();
geometry.coordinates.forEach(([lng, lat]) => bounds.extend([lng, lat]));
map.fitBounds(bounds, { padding: 80, duration: 800 });
```

### Clicking to select an alternative route

Attach a `"click"` listener to the layer ID:

```ts
map.on("click", "route-0", () => setActiveRoute(route));
map.on("mouseenter", "route-0", () => {
  map.getCanvas().style.cursor = "pointer";
});
map.on("mouseleave", "route-0", () => {
  map.getCanvas().style.cursor = "";
});
```

Always clean up event listeners in the `useEffect` return function.

---

## 9. Step 6 — Multi-Stop Routing

**Files:** `RouteSidebar.tsx`, `map-provider.tsx`

Stops (waypoints) are kept in a `stops: PlaceData[]` state in the context. When a stop is added or removed, `buildRoute()` is called immediately with the new stops array passed as an override argument.

### Why pass stops as an override argument?

React state updates are asynchronous. If you call `addStop(place)` and then immediately call `buildRoute()`, `stops` in the closure still has the old value. Passing the new array directly avoids the stale closure problem:

```ts
const newStops = [...stops, place];
addStop(place); // triggers a re-render, but stops is still old here
await buildRoute(newStops); // use the new array directly
```

### Carousel search UI

`RouteSidebar` has a search input that calls `/api/geocode` as you type and displays results as a navigable list (prev/next buttons). A preview pin (`previewPlace`) is placed on the map for the currently highlighted result. Selecting a result confirms the stop/origin/destination.

---

## 10. Step 7 — Turn-by-Turn Navigation Mode

**Files:** `NavigationSidebar.tsx`, `MapContainer.tsx`, `app/api/navigation/route.ts`

### Camera mode

When `isNavigating` becomes `true`, the camera tilts and follows the user:

```ts
// Initial fly-in
map.flyTo({
  center: [currentCoords.lng, currentCoords.lat],
  zoom: 17,
  pitch: 60, // tilt the camera towards the horizon
  bearing: headingRef.current, // rotate to direction of travel
  duration: 1200,
});

// Keep following on each GPS update
geolocate.on("geolocate", (e) => {
  map.easeTo({
    center: [longitude, latitude],
    bearing: heading ?? headingRef.current,
    pitch: 60,
    duration: 500,
    easing: (t) => t, // linear — smoother for navigation
  });
});
```

When navigation ends, reset pitch and bearing:

```ts
map.flyTo({ pitch: 0, bearing: 0, zoom: map.getZoom() - 3, duration: 800 });
```

### Navigation API vs Route API

There are two API routes:

|                  | `/api/route`              | `/api/navigation`               |
| ---------------- | ------------------------- | ------------------------------- |
| **Used for**     | Drawing the route preview | Turn-by-turn step list + ETA    |
| **Steps**        | No                        | Yes (`steps=true`)              |
| **Voice/banner** | No                        | Yes (though not used in UI yet) |
| **Alternatives** | Yes (up to 3)             | No (first/fastest only)         |

### Step data shape

Each step from the navigation API contains:

```ts
{
  distance: number;        // metres
  duration: number;        // seconds
  name: string;            // road name
  instruction: string;     // human-readable e.g. "Turn left onto Main St"
  type: string;            // "turn" | "depart" | "arrive" | "roundabout" | ...
  modifier?: string;       // "left" | "right" | "slight left" | "straight" | "uturn" | ...
  bearing_after?: number;  // heading after the maneuver
}
```

`ManeuverIcon` in `NavigationSidebar.tsx` maps `type + modifier` to a Lucide icon. `maneuverColor()` maps them to a highlight colour.

### Multi-leg routes (routes with stops)

When stops are present, the API returns multiple `legs` (one per segment). `NavigationSidebar` renders these as collapsible sections. Single-leg routes show steps directly.

### Heading arrow overlay

A custom SVG arrow in `MapContainer.tsx` is positioned at `bottom-left` (away from the Mapbox geolocate button at `bottom-right`). It rotates via inline `style={{ transform: \`rotate(\${headingRef.current}deg)\` }}`.

Because it reads from a `ref` (not state), it does **not** cause re-renders on every GPS update — the DOM is mutated directly via the style attribute. If you want it to update reactively you'd need to either use state or update the DOM element directly in the geolocate callback.

---

## 11. Step 8 — Markers

**File:** `MapContainer.tsx`

Mapbox GL JS markers are DOM elements anchored to a map coordinate. They are created imperatively and must be tracked in refs so they can be removed later.

```ts
// Create a marker
const marker = new mapboxgl.Marker({ color: "#ef4444" })
  .setLngLat([place.lng, place.lat])
  .addTo(map);

// Store it so we can remove it later
markersRef.current.push(marker);

// Remove all markers
markersRef.current.forEach((m) => m.remove());
markersRef.current = [];
```

### Marker types in this project

| Colour   | Purpose                                | Trigger                             |
| -------- | -------------------------------------- | ----------------------------------- |
| 🔴 Red   | Selected destination / confirmed place | Place selected from search          |
| 🟡 Amber | Waypoint stop                          | Stop added in RouteSidebar          |
| 🟢 Green | Preview pin                            | Browsing search results in carousel |

---

## 12. Component Reference

### `FloatingCard.tsx`

The outermost shell. Wraps everything in `MapProvider` and renders the `Card` container. On mobile it is truly full-screen (100dvh, no border-radius, no border). On desktop it is a padded, rounded, aspect-ratio card. Uses `<Suspense>` around `NavigationShell` because `useSearchParams()` requires it in Next.js.

### `MapContainer.tsx`

- Creates and owns the Mapbox map instance
- Adds the `GeolocateControl`
- Reacts to `selectedPlaces`, `stops`, `previewPlace` to add/remove markers
- Reacts to `route` to draw/update route lines
- Reacts to `isNavigating` to switch between navigation and overview camera modes
- Renders the heading arrow overlay during navigation

### `NavigationShell.tsx`

UI state machine with four modes:

| Mode             | What shows                    |
| ---------------- | ----------------------------- |
| `idle`           | Just the search bar           |
| `searching`      | Search bar + results dropdown |
| `place-selected` | `PlaceSidebar`                |
| `routing`        | `RouteSidebar`                |
| `navigating`     | `NavigationSidebar`           |

Transitions between modes on user actions (select place → routing → navigating → back).

### `SearchBar.tsx`

Controlled input with 400ms debounce. Writes query to URL params. Reads params back on mount to handle page reload. Wraps within `max-w-[250px] md:max-w-[380px]` for responsive sizing.

### `PlaceSidebar.tsx`

Shown when a place is selected from search. Two actions: **Show Directions** (builds route, enters routing mode) and **Start Navigation** (builds route, enters navigation mode directly). Collapses as a bottom sheet on mobile and a left slide-out on desktop.

### `RouteSidebar.tsx`

Full route planner: edit origin (or use GPS), add/remove stops, change destination. Shows route alternative list and ETA. Contains the carousel search UI (search → browse → select). Collapses the same way as `PlaceSidebar`.

### `NavigationSidebar.tsx`

Fetches turn-by-turn data from `/api/navigation` on mount. Displays ETA/distance/arrival-time summary bar and collapsible per-leg step lists with `ManeuverIcon`. Collapses the same way as `PlaceSidebar`.

### `GpsButton.tsx`

A simple floating button that calls `map.flyTo()` to the current position. Not shown by default (commented out) since `GeolocateControl` covers the same purpose.

---

## 13. API Routes Reference

All routes live under `app/api/` and are Next.js Route Handlers (`route.ts` files).

### `GET /api/geocode?q={query}`

Proxies to Mapbox Geocoding API v5. Returns:

```json
{
  "places": [
    {
      "id": "...",
      "text": "Kochi",
      "place_name": "Kochi, Kerala, India",
      "lng": 76.27,
      "lat": 9.93,
      "place_type": ["place"]
    }
  ]
}
```

### `GET /api/route?start={lng,lat}&end={lng,lat}&waypoints={lng,lat;lng,lat}`

Proxies to Mapbox Directions API. `waypoints` is optional and semicolon-separated. Returns sorted (fastest first) array:

```json
{
  "routes": [
    { "distance": 12345, "duration": 900, "geometry": { "type": "LineString", "coordinates": [[...]] } }
  ]
}
```

### `GET /api/navigation?start={lng,lat}&end={lng,lat}&waypoints={lng,lat;lng,lat}`

Same as `/api/route` but requests steps, voice, and banner instructions. Returns the first (fastest) route with full leg/step breakdown:

```json
{
  "distance": 12345,
  "duration": 900,
  "geometry": { ... },
  "legs": [
    {
      "summary": "NH 66",
      "distance": 12345,
      "duration": 900,
      "steps": [
        { "distance": 150, "duration": 30, "name": "NH 66", "instruction": "Head north on NH 66", "type": "depart", "modifier": "straight" }
      ]
    }
  ]
}
```

---

## 14. Gotchas & Tips

### ❗ "Map container already initialized"

If your `useEffect` runs twice (React StrictMode double-invoke), you'll get this error. Always check `if (!mapRef.current) return;` AND return a cleanup that calls `map.remove()`. With cleanup, the second invocation creates a fresh instance after the first is torn down.

### ❗ "Source already exists" / "Layer already exists"

Always check `map.getSource(id)` and `map.getLayer(id)` before adding. Update existing sources via `.setData()` rather than removing and re-adding.

### ❗ `useSearchParams()` requires a Suspense boundary (Next.js)

Any component (or its descendant) that calls `useSearchParams()` must be wrapped in `<Suspense>` at the usage site. Without it, Next.js will fail to statically prerender the page.

```tsx
<Suspense fallback={<SearchBarSkeleton />}>
  <NavigationShell />
</Suspense>
```

### ❗ Stale closures in async route building

When you update state and call a function that reads that same state synchronously after, the function sees the old value. Pass the new value as a function argument instead of relying on state.

### ❗ GPS timeout errors

`getCurrentPosition()` can time out on mobile or when called too often. Mitigate with three strategies:

1. Cache from an ongoing `watchPosition`
2. Short-timeout low-accuracy fallback
3. Long-timeout high-accuracy fallback

### ❗ Alternatives disabled with waypoints

The Mapbox Directions API does not return alternative routes when waypoints are present. Disable the `alternatives=true` parameter in that case.

### ❗ Pitch/bearing on `flyTo` vs `easeTo`

- Use `flyTo` for initial/dramatic transitions (zooms out and back in)
- Use `easeTo` for smooth continuous updates during navigation (linear, no zoom animation)

### 💡 `100dvh` instead of `100vh` on mobile

`100vh` on mobile includes the browser chrome (address bar). `100dvh` (dynamic viewport height) accounts for it and gives a true full-screen experience.

### 💡 Heading in a ref, not state

Update the heading via a ref to avoid thousands of re-renders from continuous GPS updates. The `style` attribute on the arrow element reads from the ref directly.
