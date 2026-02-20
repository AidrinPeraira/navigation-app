"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { MapContext } from "@/components/navigation-context/map-context";
import { PlaceData, RouteInfo } from "@/types/DataType";

type Props = {
  children: React.ReactNode;
};
export default function MapProvider({ children }: Props) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [selectedPlaces, setSelectedPlaces] = useState<PlaceData[]>([]);

  const [route, setRoute] = useState<RouteInfo[]>([]);
  const [activeRoute, setActiveRoute] = useState<RouteInfo | null>(null);
  const [stops, setStops] = useState<PlaceData[]>([]);
  const [previewPlace, setPreviewPlace] = useState<PlaceData | null>(null);
  const [originPlace, setOriginPlace] = useState<PlaceData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Continuously cache the user's position so it's available instantly
  const cachedPositionRef = useRef<GeolocationCoordinates | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        cachedPositionRef.current = pos.coords;
        // Clear any previous error since we now have a fix
        setLocationError(null);
      },
      () => {
        // Silently ignore watch errors — we have fallbacks
      },
      {
        enableHighAccuracy: false,
        maximumAge: 30_000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const destination = selectedPlaces.length > 0 ? selectedPlaces[0] : null;
  const origin = originPlace ? originPlace.text : "My Location";

  function setDestination(place: PlaceData) {
    setSelectedPlaces([place]);
  }

  function addStop(place: PlaceData) {
    setStops((prev) => [...prev, place]);
  }

  function removeStop(index: number) {
    setStops((prev) => prev.filter((_, i) => i !== index));
  }

  function clearRoutes() {
    setRoute([]);
    setActiveRoute(null);

    if (!map) return;
    let i = 0;
    while (map.getSource(`route-${i}`)) {
      if (map.getLayer(`route-${i}`)) map.removeLayer(`route-${i}`);
      map.removeSource(`route-${i}`);
      i++;
    }
  }

  async function buildRoute(
    stopsOverride?: PlaceData[],
    originOverride?: PlaceData | null,
  ): Promise<void> {
    if (!map || !destination) return;

    clearRoutes();

    const effectiveOrigin =
      originOverride !== undefined ? originOverride : originPlace;

    let start: string;
    if (effectiveOrigin) {
      start = `${effectiveOrigin.lng},${effectiveOrigin.lat}`;
    } else {
      const coords = await resolveCurrentLocation();
      if (!coords) {
        setLocationError(
          "Could not determine your location. Please set an origin manually.",
        );
        return;
      }
      setLocationError(null);
      start = `${coords.longitude},${coords.latitude}`;
    }

    const end = `${destination.lng},${destination.lat}`;

    // Use override if provided (avoids stale closure), otherwise use current state
    const currentStops = stopsOverride ?? stops;
    const waypointsParam =
      currentStops.length > 0
        ? `&waypoints=${currentStops.map((s) => `${s.lng},${s.lat}`).join(";")}`
        : "";

    const res = await fetch(
      `/api/route?start=${start}&end=${end}${waypointsParam}`,
    );
    const data = await res.json();

    const best = data.routes?.[0];
    if (!best) throw new Error("No routes found");

    setRoute(data.routes);
    setActiveRoute(best);

    drawRoute(data.routes, best);
    fitMapToRoute(best.geometry);
  }

  function drawRoute(routes: RouteInfo[], active: RouteInfo) {
    if (!map) return;

    routes.forEach((route, index) => {
      const id = `route-${index}`;
      const isActive = route === active;

      const feature: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        geometry: route.geometry,
        properties: {},
      };

      if (map.getSource(id)) {
        (map.getSource(id) as mapboxgl.GeoJSONSource).setData(feature);
      } else {
        map.addSource(id, {
          type: "geojson",
          data: feature,
        });

        map.addLayer({
          id,
          type: "line",
          source: id,
          paint: {
            "line-color": "#9ca3af",
            "line-width": 3,
            "line-opacity": 0.6,
          },
        });
      }

      // Always apply active/inactive styles
      map.setPaintProperty(id, "line-color", isActive ? "#3b82f6" : "#9ca3af");
      map.setPaintProperty(id, "line-width", isActive ? 5 : 3);
      map.setPaintProperty(id, "line-opacity", isActive ? 1 : 0.6);
    });
  }

  const selectRoute = useCallback(
    (selected: RouteInfo | null) => {
      setActiveRoute(selected);
      if (!map || !selected || route.length === 0) return;

      route.forEach((r, index) => {
        const id = `route-${index}`;
        if (!map.getLayer(id)) return;
        const isActive = r === selected;
        map.setPaintProperty(
          id,
          "line-color",
          isActive ? "#3b82f6" : "#9ca3af",
        );
        map.setPaintProperty(id, "line-width", isActive ? 5 : 3);
        map.setPaintProperty(id, "line-opacity", isActive ? 1 : 0.6);
      });
    },
    [map, route],
  );

  /**
   * Multi-strategy location resolver:
   * 1. Use cached position from watchPosition (instant)
   * 2. Try getCurrentPosition with low accuracy + short timeout
   * 3. Retry with high accuracy + longer timeout
   * Returns null if all strategies fail.
   */
  async function resolveCurrentLocation(): Promise<GeolocationCoordinates | null> {
    // Strategy 1: Use cached position (instant)
    if (cachedPositionRef.current) {
      return cachedPositionRef.current;
    }

    // Strategy 2: Low accuracy, fast timeout
    try {
      const pos = await singlePositionRequest(false, 5_000, 60_000);
      cachedPositionRef.current = pos.coords;
      return pos.coords;
    } catch {
      // Fall through to retry
    }

    // Strategy 3: High accuracy, longer timeout
    try {
      const pos = await singlePositionRequest(true, 15_000, 0);
      cachedPositionRef.current = pos.coords;
      return pos.coords;
    } catch (error) {
      console.error("All geolocation strategies failed", error);
      return null;
    }
  }

  function singlePositionRequest(
    highAccuracy: boolean,
    timeout: number,
    maximumAge: number,
  ): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: highAccuracy,
        timeout,
        maximumAge,
      });
    });
  }

  function fitMapToRoute(geometry: GeoJSON.LineString) {
    if (!map) return;

    const bounds = new mapboxgl.LngLatBounds();

    geometry.coordinates.forEach(([lng, lat]) => {
      bounds.extend([lng, lat]);
    });

    map.fitBounds(bounds, {
      padding: 80,
      duration: 800,
    });
  }

  return (
    <MapContext.Provider
      value={{
        map,
        setMap,
        selectedPlaces,
        setSelectedPlaces,
        route,
        setRoute,
        activeRoute,
        setActiveRoute: selectRoute,
        origin,
        originPlace,
        setOriginPlace,
        destination,
        setDestination,
        stops,
        addStop,
        removeStop,
        previewPlace,
        setPreviewPlace,
        locationError,
        setLocationError,
        buildRoute,
        clearRoutes,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}
