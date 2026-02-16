"use client";

import mapboxgl from "mapbox-gl";
import { Button } from "@/components/ui/button";
import { Crosshair } from "lucide-react";
import { useMapbox } from "@/components/navigation-context/map-context";

export default function GpsButton() {
  const { map } = useMapbox();
  function centerToLocation() {
    if (!map) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        map.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          essential: true,
        });
      },
      () => {
        alert("Location access denied");
      },
    );
  }

  return (
    <Button
      size="icon"
      variant="secondary"
      onClick={centerToLocation}
      className="bg-background/80 backdrop-blur-md border border-white/10 fixed bottom-4 right-4 z-50 rounded-full shadow-md"
    >
      <Crosshair className="h-4 w-4" />
    </Button>
  );
}
