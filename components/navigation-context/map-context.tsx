import { PlaceData, RouteInfo } from "@/types/DataType";
import mapboxgl from "mapbox-gl";
import { createContext, useContext } from "react";

type MapContextType = {
  map: mapboxgl.Map | null;
  setMap: (map: mapboxgl.Map) => void;

  selectedPlaces: PlaceData[];
  setSelectedPlaces: (places: PlaceData[]) => void;

  route: RouteInfo[];
  setRoute: (route: RouteInfo[]) => void;

  activeRoute: RouteInfo | null;
  setActiveRoute: (route: RouteInfo | null) => void;

  buildRoute: () => Promise<void>;
};

export const MapContext = createContext<MapContextType | null>(null);

export function useMapbox() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMapBox context not inside MapProvider");
  }
  return context;
}
