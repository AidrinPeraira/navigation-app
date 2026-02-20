"use client";

import React, { useState } from "react";
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

  async function buildRoute(): Promise<void> {
    if (!map || selectedPlaces.length === 0) return;

    const destination = selectedPlaces[0];

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const start = `${pos.coords.longitude},${pos.coords.latitude}`;
            const end = `${destination.lng},${destination.lat}`;

            const res = await fetch(`/api/route?start=${start}&end=${end}`);
            const data = await res.json();

            const best = data.routes?.[0];
            if (!best) {
              reject("No routes found");
              return;
            }

            setRoute(data.routes);
            setActiveRoute(best);

            drawRoute(best.geometry);
            fitMapToRoute(best.geometry);

            resolve();
          } catch (err) {
            reject(err);
          }
        },
        (err) => reject(err),
      );
    });
  }

  function drawRoute(geometry: GeoJSON.LineString) {
    if (!map) return;

    if (map.getSource("route")) {
      (map.getSource("route") as mapboxgl.GeoJSONSource).setData({
        type: "Feature",
        geometry,
        properties: {},
      });
      return;
    }

    map.addSource("route", {
      type: "geojson",
      data: {
        type: "Feature",
        geometry,
        properties: {},
      },
    });

    map.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      paint: {
        "line-color": "#3b82f6",
        "line-width": 5,
      },
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
        setActiveRoute,
        buildRoute,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}
