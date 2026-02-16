"use client";

import { useMapbox } from "@/components/navigation-context/map-context";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function MapContainer() {
  const mapRef = useRef<HTMLDivElement>(null);
  const { setMap } = useMapbox();

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [76.27, 9.93], // Kerala
      zoom: 10,
      testMode: true, // move this to env
      //pitch for tilt
    });

    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
    });

    map.addControl(geolocate);

    // Optional: automatically trigger once map loads
    map.on("load", () => {
      geolocate.trigger();
    });

    setMap(map);

    return () => map.remove();
  }, [setMap]);

  return <div ref={mapRef} className="absolute inset-0 w-full h-full" />;
}
