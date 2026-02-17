"use client";

import { useMapbox } from "@/components/navigation-context/map-context";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function MapContainer() {
  /**
   * we create and return a div.
   * to that div we add a ref using useref
   * we give that ref to map box map instance
   */
  const mapRef = useRef<HTMLDivElement>(null);
  const { setMap, map, selectedPlaces } = useMapbox();
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Create map
  useEffect(() => {
    if (!mapRef.current) return;

    const mapInstance = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [76.27, 9.93],
      zoom: 10,
    });

    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
    });

    mapInstance.addControl(geolocate);

    setMap(mapInstance);
    return () => mapInstance.remove();
  }, [setMap]);

  // Render markers
  useEffect(() => {
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    selectedPlaces.forEach((place) => {
      const marker = new mapboxgl.Marker({ color: "#3b82f6" })
        .setLngLat([place.lng, place.lat]) // [lng, lat]
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Auto-zoom to first place
    if (selectedPlaces.length > 0) {
      const selected = selectedPlaces[0];

      map.flyTo({
        center: [selected.lng, selected.lat],
        zoom: 14,
      });
    }
  }, [selectedPlaces, map]);

  return <div ref={mapRef} className="absolute inset-0 w-full h-full" />;
}
