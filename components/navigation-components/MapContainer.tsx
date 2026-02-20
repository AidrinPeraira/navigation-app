"use client";

import { useMapbox } from "@/components/navigation-context/map-context";
import mapboxgl from "mapbox-gl";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function MapContainer() {
  const mapRef = useRef<HTMLDivElement>(null);
  const {
    setMap,
    map,
    selectedPlaces,
    setSelectedPlaces,
    route,
    setActiveRoute,
    stops,
    previewPlace,
  } = useMapbox();
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const stopMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const previewMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const { theme } = useTheme();

  // Create map
  useEffect(() => {
    if (!mapRef.current) return;

    const mapInstance = new mapboxgl.Map({
      container: mapRef.current,
      style: `mapbox://styles/mapbox/${theme ?? "dark"}-v11`,
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

    mapInstance.on("load", () => {
      geolocate.trigger();
    });

    setMap(mapInstance);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapInstance.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 14,
          essential: true,
        });
      },
      () => {
        console.warn("User denied geolocation");
      },
    );

    return () => mapInstance.remove();
  }, [setMap, theme]);

  // Click-to-select route on the map
  useEffect(() => {
    if (!map || route.length === 0) return;

    const handlers: {
      id: string;
      click: () => void;
      enter: () => void;
      leave: () => void;
    }[] = [];

    route.forEach((r, index) => {
      const id = `route-${index}`;
      if (!map.getLayer(id)) return;

      const onClick = () => setActiveRoute(r);
      const onEnter = () => {
        map.getCanvas().style.cursor = "pointer";
      };
      const onLeave = () => {
        map.getCanvas().style.cursor = "";
      };

      map.on("click", id, onClick);
      map.on("mouseenter", id, onEnter);
      map.on("mouseleave", id, onLeave);

      handlers.push({ id, click: onClick, enter: onEnter, leave: onLeave });
    });

    return () => {
      handlers.forEach(({ id, click, enter, leave }) => {
        map.off("click", id, click);
        map.off("mouseenter", id, enter);
        map.off("mouseleave", id, leave);
      });
    };
  }, [map, route, setActiveRoute]);

  // Render destination/selected place markers
  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    selectedPlaces.forEach((place, index) => {
      const marker = new mapboxgl.Marker({
        color: `${index == 0 ? "#ef4444" : "#3b82f6"}`,
      })
        .setLngLat([place.lng, place.lat])
        .addTo(map);

      marker.getElement().addEventListener("click", () => {
        setSelectedPlaces([place, ...selectedPlaces]);
      });

      markersRef.current.push(marker);
    });

    if (selectedPlaces.length === 1) {
      const selected = selectedPlaces[0];
      map.flyTo({
        center: [selected.lng, selected.lat],
        zoom: 14,
      });
    }

    if (selectedPlaces.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      selectedPlaces.forEach((place) => {
        bounds.extend([place.lng, place.lat]);
      });
      map.fitBounds(bounds, {
        padding: 80,
        duration: 800,
      });
    }
  }, [selectedPlaces, map]);

  // Render stop markers (amber)
  useEffect(() => {
    if (!map) return;

    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = [];

    stops.forEach((stop) => {
      const marker = new mapboxgl.Marker({ color: "#f59e0b" })
        .setLngLat([stop.lng, stop.lat])
        .addTo(map);

      stopMarkersRef.current.push(marker);
    });
  }, [stops, map]);

  // Render preview marker (green) and pan to it
  useEffect(() => {
    if (!map) return;

    // Remove previous preview marker
    if (previewMarkerRef.current) {
      previewMarkerRef.current.remove();
      previewMarkerRef.current = null;
    }

    if (previewPlace) {
      const marker = new mapboxgl.Marker({ color: "#22c55e" })
        .setLngLat([previewPlace.lng, previewPlace.lat])
        .addTo(map);

      previewMarkerRef.current = marker;

      map.flyTo({
        center: [previewPlace.lng, previewPlace.lat],
        zoom: 14,
        duration: 600,
      });
    }
  }, [previewPlace, map]);

  return <div ref={mapRef} className="absolute inset-0 w-full h-full" />;
}
