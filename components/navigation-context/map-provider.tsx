"use client";

import React, { useState } from "react";
import mapboxgl from "mapbox-gl";
import { MapContext } from "@/components/navigation-context/map-context";
import { PlaceData } from "@/types/DataType";

type Props = {
  children: React.ReactNode;
};
export default function MapProvider({ children }: Props) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [selectedPlaces, setSelectedPlaces] = useState<PlaceData[]>([]);

  return (
    <MapContext.Provider
      value={{ map, setMap, selectedPlaces, setSelectedPlaces }}
    >
      {children}
    </MapContext.Provider>
  );
}
