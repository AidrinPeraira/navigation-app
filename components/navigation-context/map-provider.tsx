"use client";

import React, { useState } from "react";
import mapboxgl from "mapbox-gl";
import { MapContext } from "@/components/navigation-context/map-context";

type Props = {
  children: React.ReactNode;
};
export default function MapProvider({ children }: Props) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);

  return (
    <MapContext.Provider value={{ map, setMap }}>
      {children}
    </MapContext.Provider>
  );
}
