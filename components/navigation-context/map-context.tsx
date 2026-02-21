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

  origin: string;
  originPlace: PlaceData | null;
  setOriginPlace: (place: PlaceData | null) => void;

  /** Live GPS coordinates from watchPosition; null before first fix */
  currentCoords: { lng: number; lat: number } | null;

  destination: PlaceData | null;
  setDestination: (place: PlaceData) => void;

  stops: PlaceData[];
  addStop: (place: PlaceData) => void;
  removeStop: (index: number) => void;

  previewPlace: PlaceData | null;
  setPreviewPlace: (place: PlaceData | null) => void;

  locationError: string | null;
  setLocationError: (error: string | null) => void;

  /** True while NavigationSidebar is the active mode */
  isNavigating: boolean;
  setIsNavigating: (v: boolean) => void;

  buildRoute: (
    stopsOverride?: PlaceData[],
    originOverride?: PlaceData | null,
  ) => Promise<void>;
  clearRoutes: () => void;
};

export const MapContext = createContext<MapContextType | null>(null);

export function useMapbox() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMapBox context not inside MapProvider");
  }
  return context;
}
