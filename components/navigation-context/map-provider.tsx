"use client";

import React, { useCallback, useState } from "react";
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

  async function buildRoute(): Promise<void> {
    if (!map || selectedPlaces.length === 0) return;

    const destination = selectedPlaces[0];

    const position = await getCurrentPosition();

    const start = `${position.coords.longitude},${position.coords.latitude}`;
    const end = `${destination.lng},${destination.lat}`;

    const res = await fetch(`/api/route?start=${start}&end=${end}`);
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

      // Re-style all route layers based on which is now active
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

  function getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 60_000,
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
        buildRoute,
        clearRoutes,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}
